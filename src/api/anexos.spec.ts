import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type Anexo, ehExterno, enderecoDeDownload, listarAnexos } from './anexos'
import { cliente } from './cliente'

vi.mock('./cliente', () => ({ cliente: { GET: vi.fn() } }))

const get = vi.mocked(cliente.GET)

function resposta(status: number, corpo: { data?: unknown; error?: unknown }) {
  return { ...corpo, response: new Response(null, { status }) } as never
}

describe('listarAnexos', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('converte o tamanho em número e preserva o nulo dos arquivos externos', async () => {
    get.mockResolvedValue(resposta(200, {
      data: [
        { gid: 'a1', nome: 'print.png', criadoEm: '2026-11-03T10:00:00', tamanho: '512', hospedagem: 'asana' },
        { gid: 'a2', nome: 'planilha', criadoEm: '2026-11-03T11:00:00', tamanho: null, hospedagem: 'gdrive' },
      ],
    }))

    const anexos = await listarAnexos('t1')

    expect(anexos.map((anexo) => anexo.tamanho)).toEqual([512, null])
    expect(get).toHaveBeenCalledWith('/tarefas/{identifier}/anexos', { params: { path: { identifier: 't1' } } })
  })

  it('lança o erro da API com a mensagem do Problem Details', async () => {
    get.mockResolvedValue(resposta(400, { error: { detail: 'A tarefa não existe mais no Asana.' } }))

    await expect(listarAnexos('t1')).rejects.toThrow('A tarefa não existe mais no Asana.')
  })
})

describe('enderecoDeDownload', () => {
  it('aponta para o download da API com os identificadores escapados', () => {
    const endereco = enderecoDeDownload('t 1', 'a/1')

    expect(endereco.endsWith('/tarefas/t%201/anexos/a%2F1/download')).toBe(true)
  })
})

describe('ehExterno', () => {
  const anexo = (hospedagem: string): Anexo => ({ gid: 'a', nome: 'x', criadoEm: '2026-11-03T10:00:00', tamanho: null, hospedagem })

  it('só arquivos fora do Asana são externos', () => {
    expect([ehExterno(anexo('asana')), ehExterno(anexo('gdrive')), ehExterno(anexo(''))]).toEqual([false, true, false])
  })
})
