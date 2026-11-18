import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type Analise,
  analisarTarefa,
  comItemAtualizado,
  type FontesDaVersao,
  fontesPadrao,
  fontesParaReanalise,
  type ItemDaAnalise,
  listarAnalises,
  marcarItemDaAnalise,
  paraAnalise,
  progressoDoChecklist,
  textoDasDuvidas,
  textoDasFontes,
  textoParaExploreDoOpenSpec,
} from './analises'
import { cliente } from './cliente'
import { formatarDataHora } from './datas'
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
    trecho: null,
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

  describe('textoParaExploreDoOpenSpec', () => {
    const tarefa = { titulo: 'Abater IPI na nota', projetos: 'Fiscal, NF-e', linkAsana: 'https://app.asana.com/0/1/2', empresa: { nome: 'Aureum' } }

    it('começa com o comando e traz os dados da tarefa e o objetivo', () => {
      const texto = textoParaExploreDoOpenSpec(analise, tarefa)

      expect(texto.startsWith('/opsx:explore Abater IPI na nota\n')).toBe(true)
      expect(texto).toContain('- **Empresa:** Aureum\n- **Projetos:** Fiscal, NF-e\n- **Asana:** https://app.asana.com/0/1/2\n')
      expect(texto).toContain(`- **Análise:** versão 2, de ${formatarDataHora('2026-11-03T17:44:38')}`)
      expect(texto).toContain('## Objetivo\n\nAbater o IPI.\n')
    })

    it('lista os blocos na ordem da tela, com marcação, trecho vago e origem', () => {
      const texto = textoParaExploreDoOpenSpec(analise, tarefa)

      expect(texto).toContain(
        '## Checklist\n\n### Front\n\n- [x] texto c1\n\n### Back: cálculo\n\n- [ ] texto c2\n- [ ] texto c3\n  - ⚠️ Vago: Não diz quais fluxos.\n',
      )
      expect(texto).toContain('## Testes\n\n- [ ] texto t1\n')
      expect(texto).toContain('## Dúvidas para o solicitante\n\n- [ ] texto d1\n- [ ] texto d2\n')
      expect(texto).toContain('## Regras e observações\n\n- [ ] texto r1\n  - Origem: comentário de Maria em 04/11/2026 14:30\n')
      const ordem = ['## Objetivo', '## Checklist', '## Testes', '## Dúvidas', '## Regras', '## Locais', '## Notas'].map((titulo) => texto.indexOf(titulo))
      expect(ordem).toEqual([...ordem].sort((a, b) => a - b))
    })

    it('cita o trecho que gerou a dúvida, com a origem, em uma linha', () => {
      const duvida: ItemDaAnalise = {
        ...analise.duvidas[0]!,
        origem: 'descrição',
        trecho: 'Preencher ao criar,\n  pois se o usuário mudar algo a mão, segue o dele.',
      }
      const semOrigem: ItemDaAnalise = { ...analise.duvidas[1]!, trecho: 'Somar o IPI.' }

      const texto = textoParaExploreDoOpenSpec({ ...analise, duvidas: [duvida, semOrigem] }, tarefa)

      expect(texto).toContain(
        '## Dúvidas para o solicitante\n\n- [ ] texto d1\n  - Trecho (descrição): "Preencher ao criar, pois se o usuário mudar algo a mão, segue o dele."\n' +
          '- [ ] texto d2\n  - Trecho: "Somar o IPI."\n',
      )
    })

    it('cita o trecho dos itens do checklist com a origem', () => {
      const item: ItemDaAnalise = { ...analise.checklist[0]!.itens[0]!, origem: 'anexo especificacao.pdf, página 3', trecho: 'Agrupar por filial.' }

      const texto = textoParaExploreDoOpenSpec({ ...analise, checklist: [{ nome: 'Front', itens: [item] }] }, tarefa)

      expect(texto).toContain('### Front\n\n- [x] texto c1\n  - Trecho (anexo especificacao.pdf, página 3): "Agrupar por filial."\n')
    })

    it('traz as fontes nos dados da tarefa e, no modo prompt, o texto como citação', () => {
      const comAnexo: FontesDaVersao = { modo: 'tarefa', descricao: true, comentarios: false, anexos: [{ gid: 'a1', nome: 'layout.pdf' }], prompt: null }
      const porPrompt: FontesDaVersao = { modo: 'prompt', descricao: false, comentarios: false, anexos: [], prompt: 'Siga o modelo.\nSem pressa.' }

      expect(textoParaExploreDoOpenSpec({ ...analise, fontes: comAnexo }, tarefa)).toContain('- **Fontes:** Descrição, layout.pdf\n\n## Objetivo')
      expect(textoParaExploreDoOpenSpec({ ...analise, fontes: porPrompt }, tarefa)).toContain('- **Fontes:** Prompt\n\n> Siga o modelo.\n> Sem pressa.\n\n## Objetivo')
      expect(textoParaExploreDoOpenSpec(analise, tarefa)).toContain('- **Fontes:** Descrição e comentários\n')
    })

    it('termina sempre com os locais do código e as notas para a exploração', () => {
      const locais =
        '## Locais\n\n- Front: D:\\Aureum\\erp-frontend\\erp-aureum\\src\\pages\\\n' +
        '- Back:  Z:\\Aureum\\erp-backend\\Source\\ErpAureum\\ErpAureum\\\n' +
        '- Varrer os endpoints que alimentam essa lista\n'
      const notas = '## Notas\n\n1. Decisões que eu preciso tomar, com opções e recomendação.\n2. Não altere código, apenas analise.\n'

      expect(textoParaExploreDoOpenSpec(analise, tarefa).endsWith(`\n\n${locais}\n${notas}`)).toBe(true)
    })

    it('omite blocos vazios e projetos em branco', () => {
      const vazia: Analise = { ...analise, checklist: [], testes: [], duvidas: [], regras: [] }

      const texto = textoParaExploreDoOpenSpec(vazia, { ...tarefa, projetos: '' })

      expect(texto).not.toMatch(/Checklist|Testes|Dúvidas|Regras|Projetos/)
      expect(texto).toContain('## Objetivo\n\nAbater o IPI.\n\n## Locais\n')
    })
  })

  describe('fontes', () => {
    it('o padrão é descrição e comentários, sem anexos', () => {
      expect(fontesPadrao()).toEqual({ modo: 'tarefa', descricao: true, comentarios: true, anexos: [], prompt: null })
    })

    it('a reanálise reaproveita as fontes da versão, com o prompt', () => {
      const fontes: FontesDaVersao = { modo: 'prompt', descricao: false, comentarios: true, anexos: [{ gid: 'a1', nome: 'modelo.pdf' }], prompt: 'Siga @modelo.pdf' }

      expect(fontesParaReanalise({ ...analise, fontes })).toEqual({ modo: 'prompt', descricao: false, comentarios: true, anexos: ['a1'], prompt: 'Siga @modelo.pdf' })
      expect(fontesParaReanalise(analise)).toEqual(fontesPadrao())
      expect(fontesParaReanalise(null)).toEqual(fontesPadrao())
    })

    it('descreve as fontes de cada versão', () => {
      expect(textoDasFontes(null)).toBe('Descrição e comentários')
      expect(textoDasFontes({ modo: 'tarefa', descricao: true, comentarios: true, anexos: [{ gid: 'a1', nome: 'layout.pdf' }], prompt: null })).toBe(
        'Descrição, Comentários, layout.pdf',
      )
      expect(textoDasFontes({ modo: 'tarefa', descricao: false, comentarios: false, anexos: [{ gid: 'a1', nome: 'a.pdf' }, { gid: 'a2', nome: 'b.png' }], prompt: null })).toBe('a.pdf, b.png')
      expect(textoDasFontes({ modo: 'prompt', descricao: false, comentarios: false, anexos: [], prompt: 'x' })).toBe('Prompt')
    })
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

  it('analisa enviando as fontes no corpo', async () => {
    post.mockResolvedValue(resposta(201, { data: { ...analiseDaApi, fontes: null } }))
    const fontes = { modo: 'tarefa' as const, descricao: false, comentarios: false, anexos: ['a1'], prompt: null }

    const analise = await analisarTarefa('t1', fontes)

    expect(post).toHaveBeenCalledWith('/tarefas/{identifier}/analises', { params: { path: { identifier: 't1' } }, body: fontes })
    expect(analise.fontes).toBeNull()
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
