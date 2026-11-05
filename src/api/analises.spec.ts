import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type Analise,
  analisarTarefa,
  comItemAtualizado,
  type ItemDaAnalise,
  listarAnalises,
  marcarItemDaAnalise,
  paraAnalise,
  progressoDoChecklist,
  textoDasDuvidas,
} from './analises'
import { cliente } from './cliente'
import { ErroDaApi } from './erros'

vi.mock('./cliente', () => ({ cliente: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() } }))

const get = vi.mocked(cliente.GET)
const post = vi.mocked(cliente.POST)
const patch = vi.mocked(cliente.PATCH)

function resposta(status: number, corpo: { data?: unknown; error?: unknown }) {
  return { ...corpo, response: new Response(null, { status }) } as never
}

function itemDaApi(identifier: string, tipo: 'checklist' | 'teste' | 'duvida' | 'regra', ordem: number | string, concluido = false) {
  return {
    identifier,
    tipo,
    ordem,
    texto: `texto ${identifier}`,
    grupo: tipo === 'checklist' ? 'Front' : null,
    vago: null,
    concluido,
    concluidoEm: concluido ? '2026-11-03T17:50:00' : null,
    origem: tipo === 'regra' ? 'comentário de Maria em 04/11/2026 14:30' : null,
  }
}

const analiseDaApi = {
  identifier: 'a2',
  versao: '2',
  atual: true,
  objetivo: 'Abater o IPI.',
  checklist: [
    { nome: 'Front', itens: [itemDaApi('c1', 'checklist', '1', true)] },
    { nome: 'Back: cálculo', itens: [itemDaApi('c2', 'checklist', 2), { ...itemDaApi('c3', 'checklist', 3), grupo: 'Back: cálculo', vago: 'Não diz quais fluxos.' }] },
  ],
  testes: [itemDaApi('t1', 'teste', '1')],
  duvidas: [itemDaApi('d1', 'duvida', 1), itemDaApi('d2', 'duvida', 2)],
  regras: [itemDaApi('r1', 'regra', '1')],
  modelo: 'claude-opus-5-5',
  tokensEntrada: '2373',
  tokensSaida: 1462,
  analisadaEm: '2026-11-03T17:44:38',
}

describe('paraAnalise', () => {
  it('normaliza os números e mantém grupos e itens na ordem da API', () => {
    const analise = paraAnalise(analiseDaApi as never)

    expect(analise.versao).toBe(2)
    expect(analise.tokensEntrada).toBe(2373)
    expect(analise.checklist.map((grupo) => grupo.nome)).toEqual(['Front', 'Back: cálculo'])
    expect(analise.checklist[1]!.itens.map((item) => item.ordem)).toEqual([2, 3])
    expect(analise.checklist[1]!.itens[1]!.vago).toBe('Não diz quais fluxos.')
    expect(analise.testes[0]!.ordem).toBe(1)
    expect(analise.regras.map((regra) => [regra.ordem, regra.origem])).toEqual([[1, 'comentário de Maria em 04/11/2026 14:30']])
  })
})

describe('funções da análise', () => {
  const analise = paraAnalise(analiseDaApi as never)

  it('conta os itens feitos do checklist', () => {
    expect(progressoDoChecklist(analise)).toEqual({ feitos: 1, total: 3 })
  })

  it('numera as dúvidas, uma por linha', () => {
    expect(textoDasDuvidas(analise)).toBe('1. texto d1\n2. texto d2')
  })

  it('substitui o item atualizado em qualquer bloco', () => {
    const marcado: ItemDaAnalise = { ...analise.checklist[1]!.itens[0]!, concluido: true, concluidoEm: '2026-11-03T18:00:00' }
    const teste: ItemDaAnalise = { ...analise.testes[0]!, concluido: true }

    const atualizada: Analise = comItemAtualizado(comItemAtualizado(analise, marcado), teste)

    expect(progressoDoChecklist(atualizada)).toEqual({ feitos: 2, total: 3 })
    expect(atualizada.testes[0]!.concluido).toBe(true)
    expect(analise.testes[0]!.concluido).toBe(false)
  })

  it('substitui a regra atualizada sem perder a origem', () => {
    const regra: ItemDaAnalise = { ...analise.regras[0]!, concluido: true, concluidoEm: '2026-11-03T18:00:00' }

    const atualizada = comItemAtualizado(analise, regra)

    expect([atualizada.regras[0]!.concluido, atualizada.regras[0]!.origem]).toEqual([true, 'comentário de Maria em 04/11/2026 14:30'])
    expect(analise.regras[0]!.concluido).toBe(false)
  })
})

describe('chamadas', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
  })

  it('lista as análises da tarefa', async () => {
    get.mockResolvedValue(resposta(200, { data: [analiseDaApi] }))

    const analises = await listarAnalises('t1')

    expect(get).toHaveBeenCalledWith('/tarefas/{identifier}/analises', { params: { path: { identifier: 't1' } } })
    expect(analises[0]!.versao).toBe(2)
  })

  it('analisa e lança o erro da API com a mensagem em pt-BR', async () => {
    const detail = 'A conta da Anthropic está sem créditos para usar a Claude API.'
    post.mockResolvedValue(resposta(400, { error: { title: 'Requisição inválida.', status: 400, detail } }))

    const erro = await analisarTarefa('t1').catch((falha: unknown) => falha)

    expect(erro).toBeInstanceOf(ErroDaApi)
    expect((erro as ErroDaApi).message).toBe(detail)
    expect((erro as ErroDaApi).status).toBe(400)
  })

  it('marca o item e devolve o item normalizado', async () => {
    patch.mockResolvedValue(resposta(200, { data: itemDaApi('c2', 'checklist', '2', true) }))

    const item = await marcarItemDaAnalise('t1', 'c2', true)

    expect(patch).toHaveBeenCalledWith('/tarefas/{identifier}/analises/itens/{itemIdentifier}', {
      params: { path: { identifier: 't1', itemIdentifier: 'c2' } },
      body: { concluido: true },
    })
    expect(item).toMatchObject({ ordem: 2, concluido: true })
  })
})
