import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cliente } from './cliente'
import { ErroDaApi } from './erros'
import { obterUltimaSincronizacao, sincronizar } from './sincronizacoes'

vi.mock('./cliente', () => ({ cliente: { GET: vi.fn(), POST: vi.fn() } }))

const get = vi.mocked(cliente.GET)
const post = vi.mocked(cliente.POST)

const sincronizacaoDaApi = {
  identifier: '01a1a20a-9f3e-7eb1-83de-259c205cd9a1',
  iniciadaEm: '2026-11-03T14:30:15.123',
  finalizadaEm: '2026-11-03T14:30:20.000',
  sucesso: true,
  tarefasNovas: '3',
  tarefasAtualizadas: 1,
  tarefasArquivadas: '0',
  reaberturas: 1,
  erro: null,
}

function resposta(status: number, corpo: { data?: unknown; error?: unknown }) {
  return { ...corpo, response: new Response(null, { status }) } as never
}

describe('sincronizações', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('sincroniza e normaliza os totais', async () => {
    post.mockResolvedValue(resposta(200, { data: sincronizacaoDaApi }))

    const resumo = await sincronizar()

    expect(post).toHaveBeenCalledWith('/sincronizacoes')
    expect([resumo.tarefasNovas, resumo.tarefasAtualizadas, resumo.tarefasArquivadas, resumo.reaberturas]).toEqual([3, 1, 0, 1])
  })

  it('lança ErroDaApi com a mensagem da API em 409', async () => {
    post.mockResolvedValue(resposta(409, { error: { title: 'Conflito.', status: 409, detail: 'Já existe uma sincronização em andamento.' } }))

    await expect(sincronizar()).rejects.toMatchObject({ status: 409, message: 'Já existe uma sincronização em andamento.' })
  })

  it('devolve a última sincronização', async () => {
    get.mockResolvedValue(resposta(200, { data: sincronizacaoDaApi }))

    const ultima = await obterUltimaSincronizacao()

    expect(ultima?.tarefasNovas).toBe(3)
    expect(ultima?.iniciadaEm).toBe('2026-11-03T14:30:15.123')
  })

  it('devolve null quando nunca houve sincronização (404)', async () => {
    get.mockResolvedValue(resposta(404, { error: { title: 'Recurso não encontrado.', status: 404 } }))

    expect(await obterUltimaSincronizacao()).toBeNull()
  })

  it('relança outros erros da última sincronização', async () => {
    get.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(obterUltimaSincronizacao()).rejects.toBeInstanceOf(ErroDaApi)
  })
})
