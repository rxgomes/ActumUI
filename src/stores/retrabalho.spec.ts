import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { alterarAnotacao, criarAnotacao, excluirAnotacao, listarAnotacoes } from '@/api/anotacoes'
import { ErroDaApi } from '@/api/erros'
import { type Indicadores, obterIndicadores, reprocessarHistorico } from '@/api/retrabalhos'

import { useAnotacoesStore } from './anotacoes'
import { erroDoPeriodo, periodoDoAtalho, useRetrabalhoStore } from './retrabalho'

vi.mock('@/api/retrabalhos', () => ({ obterIndicadores: vi.fn(), reprocessarHistorico: vi.fn() }))
vi.mock('@/api/anotacoes', () => ({ listarAnotacoes: vi.fn(), criarAnotacao: vi.fn(), alterarAnotacao: vi.fn(), excluirAnotacao: vi.fn() }))

const obter = vi.mocked(obterIndicadores)
const reprocessar = vi.mocked(reprocessarHistorico)

const hoje = new Date(2026, 10, 3)

function indicadores(de: string): Indicadores {
  const total = { identifier: null, nome: 'Total', cor: null, retrabalhos: 0, tarefasComRetrabalho: 0, tarefasConcluidas: 0, taxa: null }
  return { de, ate: '2026-11-03', empresas: [], total, evolucao: [], ranking: [], ultimoReprocessamentoEm: null }
}

describe('períodos', () => {
  it('calcula os atalhos na data local', () => {
    expect(periodoDoAtalho('ultimos3', hoje)).toEqual({ de: '2026-09-01', ate: '2026-11-03' })
    expect(periodoDoAtalho('ultimos6', hoje)).toEqual({ de: '2026-06-01', ate: '2026-11-03' })
    expect(periodoDoAtalho('ultimos12', hoje)).toEqual({ de: '2025-12-01', ate: '2026-11-03' })
    expect(periodoDoAtalho('esteAno', hoje)).toEqual({ de: '2026-01-01', ate: '2026-11-03' })
  })

  it('valida o período personalizado com as regras da API', () => {
    expect(erroDoPeriodo('2026-01-01', '2026-11-03')).toBeNull()
    expect(erroDoPeriodo('2026-11-04', '2026-11-03')).toBe('O início do período deve ser anterior ou igual ao fim.')
    expect(erroDoPeriodo('2024-01-01', '2026-01-01')).toBeNull()
    expect(erroDoPeriodo('2024-01-01', '2026-01-02')).toBe('O período deve ter no máximo 24 meses.')
    expect(erroDoPeriodo('', '2026-01-02')).toBe('Informe o início e o fim do período.')
  })
})

describe('useRetrabalhoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    obter.mockReset()
    reprocessar.mockReset()
  })

  it('aplica o atalho e carrega os indicadores', async () => {
    obter.mockResolvedValue(indicadores('2026-09-01'))
    const store = useRetrabalhoStore()

    await store.aplicar({ atalho: 'ultimos3', de: '', ate: '', empresa: 'e1' }, hoje)

    expect(obter).toHaveBeenCalledWith({ atalho: 'ultimos3', de: '2026-09-01', ate: '2026-11-03', empresa: 'e1' })
    expect(store.indicadores?.de).toBe('2026-09-01')
    expect(store.carregando).toBe(false)
  })

  it('não chama a API com período personalizado inválido', async () => {
    const store = useRetrabalhoStore()

    await store.aplicar({ atalho: 'personalizado', de: '2026-11-04', ate: '2026-11-03', empresa: null }, hoje)

    expect(obter).not.toHaveBeenCalled()
  })

  it('guarda o erro e mantém os indicadores exibidos', async () => {
    obter.mockResolvedValueOnce(indicadores('2026-06-01')).mockRejectedValueOnce(new ErroDaApi('rede', 'Não foi possível conectar à Actum API.'))
    const store = useRetrabalhoStore()
    await store.carregar()

    await store.carregar()

    expect(store.erro?.message).toBe('Não foi possível conectar à Actum API.')
    expect(store.indicadores?.de).toBe('2026-06-01')
  })

  it('reprocessa, guarda o resumo e recarrega', async () => {
    reprocessar.mockResolvedValue({ tarefasLidas: 18, retrabalhosAntes: 0, retrabalhosDepois: 4, falhas: [] })
    obter.mockResolvedValue(indicadores('2026-06-01'))
    const store = useRetrabalhoStore()

    const resumo = await store.reprocessar()

    expect(resumo.retrabalhosDepois).toBe(4)
    expect(store.ultimoResumo?.tarefasLidas).toBe(18)
    expect(obter).toHaveBeenCalledTimes(1)
    expect(store.reprocessando).toBe(false)
  })

  it('repassa o conflito do reprocessamento', async () => {
    reprocessar.mockRejectedValue(new ErroDaApi('problema', 'Uma sincronização ou reprocessamento já está em andamento.', 409))
    const store = useRetrabalhoStore()

    await expect(store.reprocessar()).rejects.toMatchObject({ status: 409 })
    expect(store.reprocessando).toBe(false)
  })
})

describe('useAnotacoesStore', () => {
  const anotacao = (id: string, texto: string) => ({ identifier: id, texto, criadaEm: '2026-11-03T21:00:00', alteradaEm: null })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listarAnotacoes).mockReset().mockResolvedValue([anotacao('a1', 'primeira')])
    vi.mocked(criarAnotacao).mockReset()
    vi.mocked(alterarAnotacao).mockReset()
    vi.mocked(excluirAnotacao).mockReset()
  })

  it('carrega, cria no fim, altera e exclui', async () => {
    vi.mocked(criarAnotacao).mockResolvedValue(anotacao('a2', 'segunda'))
    vi.mocked(alterarAnotacao).mockResolvedValue({ ...anotacao('a1', 'editada'), alteradaEm: '2026-11-03T22:00:00' })
    vi.mocked(excluirAnotacao).mockResolvedValue()
    const store = useAnotacoesStore()

    await store.carregar('t1')
    await store.criar('segunda')
    await store.alterar('a1', 'editada')
    await store.excluir('a2')

    expect(store.anotacoes.map((item) => [item.identifier, item.texto])).toEqual([['a1', 'editada']])
    expect(vi.mocked(criarAnotacao)).toHaveBeenCalledWith('t1', 'segunda')
    expect(store.salvando).toBeNull()
  })

  it('repassa o erro e mantém a lista', async () => {
    vi.mocked(criarAnotacao).mockRejectedValue(new ErroDaApi('problema', 'Dados inválidos.', 400, { texto: ['Escreva a anotação.'] }))
    const store = useAnotacoesStore()
    await store.carregar('t1')

    await expect(store.criar('  ')).rejects.toMatchObject({ errosPorCampo: { texto: ['Escreva a anotação.'] } })
    expect(store.anotacoes).toHaveLength(1)
    expect(store.salvando).toBeNull()
  })

  it('limpa a lista ao trocar de tarefa e guarda o erro ao carregar', async () => {
    const store = useAnotacoesStore()
    await store.carregar('t1')
    vi.mocked(listarAnotacoes).mockRejectedValue(new ErroDaApi('rede', 'Não foi possível conectar à Actum API.'))

    await store.carregar('t2')

    expect(store.anotacoes).toEqual([])
    expect(store.erro?.message).toBe('Não foi possível conectar à Actum API.')
  })
})
