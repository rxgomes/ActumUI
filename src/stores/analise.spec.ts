import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type Analise,
  analisarTarefa,
  type ItemDaAnalise,
  listarAnalises,
  marcarItemDaAnalise,
  obterSituacaoClaude,
} from '@/api/analises'
import { ErroDaApi } from '@/api/erros'

import { useAnaliseStore } from './analise'

vi.mock('@/api/analises', async (original) => ({
  ...(await original<typeof import('@/api/analises')>()),
  obterSituacaoClaude: vi.fn(),
  listarAnalises: vi.fn(),
  analisarTarefa: vi.fn(),
  marcarItemDaAnalise: vi.fn(),
}))

const situacao = vi.mocked(obterSituacaoClaude)
const listar = vi.mocked(listarAnalises)
const analisar = vi.mocked(analisarTarefa)
const marcar = vi.mocked(marcarItemDaAnalise)

function item(identifier: string, concluido = false): ItemDaAnalise {
  return { identifier, tipo: 'checklist', ordem: 1, texto: identifier, grupo: 'Front', vago: null, concluido, concluidoEm: null }
}

function analise(versao: number, atual: boolean, itens: ItemDaAnalise[] = [item(`i${versao}`)]): Analise {
  return {
    identifier: `a${versao}`, versao, atual, objetivo: `Objetivo ${versao}`, checklist: [{ nome: 'Front', itens }],
    testes: [], duvidas: [], modelo: 'claude-opus-5-5', tokensEntrada: 100, tokensSaida: 50, analisadaEm: '2026-11-03T17:44:00',
  }
}

describe('useAnaliseStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    situacao.mockReset()
    listar.mockReset()
    analisar.mockReset()
    marcar.mockReset()
    situacao.mockResolvedValue({ configurado: true, modelo: 'claude-opus-5-5' })
  })

  it('carrega a situação e as versões, exibindo a atual', async () => {
    listar.mockResolvedValue([analise(2, true), analise(1, false)])
    const store = useAnaliseStore()

    await store.carregar('t1')

    expect(store.situacao?.configurado).toBe(true)
    expect(store.exibida?.versao).toBe(2)
    expect(store.exibindoAnterior).toBe(false)
  })

  it('guarda o erro ao carregar', async () => {
    listar.mockRejectedValue(new ErroDaApi('problema', 'Tarefa não encontrada.', 404))
    const store = useAnaliseStore()

    await store.carregar('t1')

    expect(store.erroAoCarregar?.message).toBe('Tarefa não encontrada.')
    expect(store.carregando).toBe(false)
  })

  it('analisa e exibe a nova versão no topo', async () => {
    listar.mockResolvedValue([analise(1, true)])
    analisar.mockResolvedValue(analise(2, true))
    const store = useAnaliseStore()
    await store.carregar('t1')
    store.exibir(1)

    const concluida = await store.analisar()

    expect(concluida).toBe(true)
    expect(store.versoes.map((versao) => [versao.versao, versao.atual])).toEqual([[2, true], [1, false]])
    expect(store.exibida?.versao).toBe(2)
    expect(store.analisando).toBe(false)
  })

  it('mantém as versões e guarda o erro quando a análise falha', async () => {
    listar.mockResolvedValue([analise(1, true)])
    analisar.mockRejectedValue(new ErroDaApi('problema', 'A conta da Anthropic está sem créditos.', 400))
    const store = useAnaliseStore()
    await store.carregar('t1')

    const concluida = await store.analisar()

    expect(concluida).toBe(false)
    expect(store.erroDaAnalise?.message).toBe('A conta da Anthropic está sem créditos.')
    expect(store.versoes.map((versao) => versao.versao)).toEqual([1])

    store.dispensarErro()
    expect(store.erroDaAnalise).toBeNull()
  })

  it('marca o item da versão atual com a resposta da API', async () => {
    listar.mockResolvedValue([analise(1, true, [item('x')])])
    marcar.mockResolvedValue({ ...item('x', true), concluidoEm: '2026-11-03T18:00:00' })
    const store = useAnaliseStore()
    await store.carregar('t1')

    await store.marcar(item('x'), true)

    expect(marcar).toHaveBeenCalledWith('t1', 'x', true)
    expect(store.atual?.checklist[0]!.itens[0]!.concluido).toBe(true)
    expect(store.marcando.size).toBe(0)
  })

  it('mantém o item como estava e repassa o erro quando a marcação falha', async () => {
    listar.mockResolvedValue([analise(1, true, [item('x')])])
    marcar.mockRejectedValue(new ErroDaApi('rede', 'Não foi possível conectar à Actum API.'))
    const store = useAnaliseStore()
    await store.carregar('t1')

    await expect(store.marcar(item('x'), true)).rejects.toBeInstanceOf(ErroDaApi)

    expect(store.atual?.checklist[0]!.itens[0]!.concluido).toBe(false)
    expect(store.marcando.size).toBe(0)
  })

  it('não marca itens exibindo uma versão anterior', async () => {
    listar.mockResolvedValue([analise(2, true), analise(1, false)])
    const store = useAnaliseStore()
    await store.carregar('t1')
    store.exibir(1)

    await store.marcar(item('i1'), true)

    expect(store.exibindoAnterior).toBe(true)
    expect(marcar).not.toHaveBeenCalled()
  })

  it('limpa o estado ao trocar de tarefa', async () => {
    listar.mockResolvedValueOnce([analise(1, true)]).mockResolvedValueOnce([])
    const store = useAnaliseStore()
    await store.carregar('t1')

    await store.carregar('t2')

    expect(store.versoes).toEqual([])
    expect(store.atual).toBeNull()
  })
})
