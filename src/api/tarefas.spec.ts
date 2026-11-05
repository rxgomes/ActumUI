import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cliente } from './cliente'
import { ehStatusDoPainel, obterPainel } from './tarefas'

vi.mock('./cliente', () => ({ cliente: { GET: vi.fn() } }))

const get = vi.mocked(cliente.GET)

function respostaOk(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) } as never
}

const cartaoDaApi = {
  identifier: '01a1a20e-df7e-77f4-ba89-3c8bfcebacf8',
  titulo: 'Devolução de IPI',
  empresa: { identifier: '01a1a20e-d679-7b89-ac2e-28febaada1c8', nome: 'Aureum-ERP', cor: '#388E3C' },
  projetos: 'ERP2',
  status: 'retrabalho',
  prazoInterno: '2026-11-04',
  prazoAsana: '2026-11-10',
  prazoInternoPendente: false,
  prioridade: '2',
  quantidadeRetrabalhos: '2',
  comentariosNaoLidos: 3,
  bloqueada: false,
}

describe('obterPainel', () => {
  beforeEach(() => {
    get.mockReset()
    get.mockResolvedValue(respostaOk({ hoje: '2026-11-04', grupos: [{ grupo: 'retrabalho', tarefas: [cartaoDaApi] }] }))
  })

  it('normaliza os campos inteiros para number', async () => {
    const painel = await obterPainel()

    const cartao = painel.grupos[0].tarefas[0]
    expect(cartao.prioridade).toBe(2)
    expect(cartao.quantidadeRetrabalhos).toBe(2)
    expect(cartao.comentariosNaoLidos).toBe(3)
    expect(cartao.titulo).toBe('Devolução de IPI')
    expect(painel.hoje).toBe('2026-11-04')
  })

  it('mantém prioridade nula', async () => {
    get.mockResolvedValue(respostaOk({ hoje: '2026-11-04', grupos: [{ grupo: 'hoje', tarefas: [{ ...cartaoDaApi, prioridade: null }] }] }))

    const painel = await obterPainel()

    expect(painel.grupos[0].tarefas[0].prioridade).toBeNull()
  })

  it('envia os filtros informados, com a busca sem espaços nas pontas', async () => {
    await obterPainel({ empresa: 'abc', status: 'bloqueada', busca: '  devolucao ' })

    expect(get).toHaveBeenCalledWith('/tarefas/painel', { params: { query: { empresa: 'abc', status: 'bloqueada', busca: 'devolucao' } } })
  })

  it('reconhece só os status que podem estar no painel', () => {
    expect(['entrada', 'concluida', 'arquivada', 'xyz'].filter(ehStatusDoPainel)).toEqual(['entrada', 'concluida'])
  })

  it('omite os filtros vazios', async () => {
    await obterPainel({ empresa: '', busca: '   ' })

    expect(get).toHaveBeenCalledWith('/tarefas/painel', { params: { query: {} } })
  })
})
