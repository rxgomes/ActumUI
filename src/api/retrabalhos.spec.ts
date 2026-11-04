import { beforeEach, describe, expect, it, vi } from 'vitest'

import { alterarAnotacao, criarAnotacao, excluirAnotacao, listarAnotacoes } from './anotacoes'
import { cliente } from './cliente'
import { obterIndicadores, reprocessarHistorico } from './retrabalhos'

vi.mock('./cliente', () => ({ cliente: { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() } }))

const get = vi.mocked(cliente.GET)
const post = vi.mocked(cliente.POST)
const put = vi.mocked(cliente.PUT)
const del = vi.mocked(cliente.DELETE)

function resposta(status: number, corpo: { data?: unknown; error?: unknown }) {
  return { ...corpo, response: new Response(null, { status }) } as never
}

const indicador = (nome: string, taxa: number | string | null) => ({
  identifier: nome === 'Total' ? null : `id-${nome}`, nome, cor: nome === 'Total' ? null : '#388E3C',
  retrabalhos: '4', tarefasComRetrabalho: 4, tarefasConcluidas: '4', taxa,
})

describe('obterIndicadores', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('envia o período e a empresa e normaliza os números', async () => {
    get.mockResolvedValue(resposta(200, {
      data: {
        de: '2026-06-01', ate: '2026-11-30',
        empresas: [indicador('Aureum-ERP', '100'), indicador('aremas.com.br', null)],
        total: indicador('Total', 100),
        evolucao: [{ mes: '2026-11', porEmpresa: [{ identifier: 'id-Aureum-ERP', quantidade: '4' }] }],
        ranking: [{ identifier: 't1', titulo: 'IPI', empresa: { identifier: 'e', nome: 'Aureum-ERP', cor: '#388E3C' }, status: 'em_andamento', retrabalhos: '1', ultimaReaberturaEm: '2026-11-02T17:04:48' }],
        ultimoReprocessamentoEm: null,
      },
    }))

    const indicadores = await obterIndicadores({ de: '2026-06-01', ate: '2026-11-30', empresa: 'id-Aureum-ERP' })

    expect(get).toHaveBeenCalledWith('/retrabalhos/indicadores', { params: { query: { De: '2026-06-01', Ate: '2026-11-30', Empresa: 'id-Aureum-ERP' } } })
    expect(indicadores.empresas.map((e) => [e.retrabalhos, e.tarefasConcluidas, e.taxa])).toEqual([[4, 4, 100], [4, 4, null]])
    expect(indicadores.evolucao[0]!.porEmpresa[0]!.quantidade).toBe(4)
    expect(indicadores.ranking[0]!.retrabalhos).toBe(1)
  })

  it('omite a empresa quando é todas', async () => {
    get.mockResolvedValue(resposta(200, { data: { de: 'a', ate: 'b', empresas: [], total: indicador('Total', null), evolucao: [], ranking: [], ultimoReprocessamentoEm: null } }))

    await obterIndicadores({ de: '2026-06-01', ate: '2026-11-30', empresa: null })

    expect(get).toHaveBeenCalledWith('/retrabalhos/indicadores', { params: { query: { De: '2026-06-01', Ate: '2026-11-30' } } })
  })
})

describe('reprocessarHistorico', () => {
  it('normaliza o resumo', async () => {
    post.mockResolvedValue(resposta(200, { data: { tarefasLidas: '18', retrabalhosAntes: 0, retrabalhosDepois: '4', falhas: [] } }))

    expect(await reprocessarHistorico()).toEqual({ tarefasLidas: 18, retrabalhosAntes: 0, retrabalhosDepois: 4, falhas: [] })
  })
})

describe('anotações', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    del.mockReset()
  })

  it('usa as rotas da tarefa', async () => {
    const anotacao = { identifier: 'a1', texto: 'ok', criadaEm: '2026-11-03T21:00:00', alteradaEm: null }
    get.mockResolvedValue(resposta(200, { data: [anotacao] }))
    post.mockResolvedValue(resposta(201, { data: anotacao }))
    put.mockResolvedValue(resposta(200, { data: anotacao }))
    del.mockResolvedValue(resposta(204, {}))

    await listarAnotacoes('t1')
    await criarAnotacao('t1', 'ok')
    await alterarAnotacao('t1', 'a1', 'novo')
    await excluirAnotacao('t1', 'a1')

    expect(get).toHaveBeenCalledWith('/tarefas/{identifier}/anotacoes', { params: { path: { identifier: 't1' } } })
    expect(post).toHaveBeenCalledWith('/tarefas/{identifier}/anotacoes', { params: { path: { identifier: 't1' } }, body: { texto: 'ok' } })
    expect(put).toHaveBeenCalledWith('/tarefas/{identifier}/anotacoes/{anotacaoIdentifier}', { params: { path: { identifier: 't1', anotacaoIdentifier: 'a1' } }, body: { texto: 'novo' } })
    expect(del).toHaveBeenCalledWith('/tarefas/{identifier}/anotacoes/{anotacaoIdentifier}', { params: { path: { identifier: 't1', anotacaoIdentifier: 'a1' } } })
  })
})
