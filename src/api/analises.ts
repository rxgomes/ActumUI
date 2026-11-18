import { cliente } from './cliente'
import { formatarDataHora } from './datas'
import { executar } from './erros'
import { paraNumero } from './numeros'
import type { components } from './schema'

type AnaliseDaApi = components['schemas']['AnaliseResponse']
type ItemDaApi = components['schemas']['AnaliseItemResponse']

/** Situação da chave da Claude API na API (a chave nunca é devolvida). */
export type SituacaoClaude = components['schemas']['ClaudeSituacaoResponse']

/** Tipo do item: ação do checklist, teste, dúvida para quem pediu ou regra a respeitar. */
export type TipoItemDaAnalise = components['schemas']['TipoItemAnalise']

/** Como as fontes foram escolhidas: `tarefa` (descrição, comentários e/ou anexos) ou `prompt` (texto do usuário). */
export type ModoDaAnalise = components['schemas']['ModoDaAnalise']

/**
 * Fontes pedidas para uma análise (corpo do `POST`): no modo `tarefa`, descrição, comentários e os gids dos anexos
 * escolhidos; no modo `prompt`, o texto do usuário, os comentários e os gids dos anexos citados nele.
 */
export type FontesDaAnalise = components['schemas']['FontesDaAnaliseRequest']

/** Fontes que a API gravou numa versão da análise (anexos com gid e nome). */
export type FontesDaVersao = components['schemas']['FontesDaAnaliseResponse']

/** Item marcável da análise (checklist feito, teste realizado, dúvida resolvida, regra atendida). */
export interface ItemDaAnalise extends Omit<ItemDaApi, 'ordem'> {
  ordem: number
}

/** Área do checklist (ex.: "Front", "Back: cálculo") com os itens, na ordem de execução. */
export interface GrupoDoChecklist {
  nome: string
  itens: ItemDaAnalise[]
}

/** Uma versão da análise da demanda feita pela IA. */
export interface Analise extends Omit<AnaliseDaApi, 'versao' | 'tokensEntrada' | 'tokensSaida' | 'checklist' | 'testes' | 'duvidas' | 'regras'> {
  versao: number
  tokensEntrada: number
  tokensSaida: number
  checklist: GrupoDoChecklist[]
  testes: ItemDaAnalise[]
  duvidas: ItemDaAnalise[]
  /** Regras, restrições e sugestões, cada uma com a origem; vazia em versões anteriores às regras */
  regras: ItemDaAnalise[]
  /** Fontes enviadas à IA; `null` em versões feitas antes de as fontes serem gravadas */
  fontes: FontesDaVersao | null
}

/** Informa se a chave da Claude API está configurada e o modelo das análises. Não chama a Anthropic. */
export function obterSituacaoClaude(): Promise<SituacaoClaude> {
  return executar(() => cliente.GET('/claude/situacao'))
}

/** Lista as versões da análise da tarefa, da mais recente (atual) para a mais antiga. */
export async function listarAnalises(identifier: string): Promise<Analise[]> {
  const analises = await executar(() => cliente.GET('/tarefas/{identifier}/analises', { params: { path: { identifier } } }))
  return analises.map(paraAnalise)
}

/**
 * Analisa a demanda com IA, com as fontes escolhidas (sem fontes, a API usa descrição e comentários), e devolve a nova
 * versão (atual). Chamada paga, que pode levar minutos com anexos. Lança `ErroDaApi` em falha (`400` com
 * `errosPorCampo` em `fontes`, `anexos` ou `prompt`, sem chave, sem créditos, chave recusada, anexo recusado, recusa
 * do modelo ou tarefa arquivada; `409` análise em andamento; `502` Asana ou Anthropic indisponível ou resposta incompleta).
 */
export async function analisarTarefa(identifier: string, fontes?: FontesDaAnalise): Promise<Analise> {
  const analise = await executar(() => cliente.POST('/tarefas/{identifier}/analises', { params: { path: { identifier } }, body: fontes }))
  return paraAnalise(analise)
}

/** Fontes de uma primeira análise: descrição e comentários, sem anexos. */
export function fontesPadrao(): FontesDaAnalise {
  return { modo: 'tarefa', descricao: true, comentarios: true, anexos: [], prompt: null }
}

/** Fontes para reanalisar: as que a versão usou (com o texto do prompt), ou o padrão para versões sem fontes gravadas. */
export function fontesParaReanalise(analise: Analise | null): FontesDaAnalise {
  const fontes = analise?.fontes
  if (!fontes) {
    return fontesPadrao()
  }

  return {
    modo: fontes.modo,
    descricao: fontes.descricao,
    comentarios: fontes.comentarios,
    anexos: fontes.anexos.map((anexo) => anexo.gid),
    prompt: fontes.prompt,
  }
}

/** Fontes de uma versão em texto, para o rodapé e o OpenSpec (ex.: "Descrição, layout.pdf", "Prompt"). */
export function textoDasFontes(fontes: FontesDaVersao | null): string {
  if (!fontes) {
    return 'Descrição e comentários'
  }

  const partes: string[] = []
  if (fontes.modo === 'prompt') {
    partes.push('Prompt')
  }
  if (fontes.descricao) {
    partes.push('Descrição')
  }
  if (fontes.comentarios) {
    partes.push('Comentários')
  }
  partes.push(...fontes.anexos.map((anexo) => anexo.nome))

  return partes.join(', ')
}

/** Marca (feito, realizado ou resolvido) ou desmarca um item da versão atual e devolve o item atualizado. */
export async function marcarItemDaAnalise(identifier: string, itemIdentifier: string, concluido: boolean): Promise<ItemDaAnalise> {
  const item = await executar(() => cliente.PATCH('/tarefas/{identifier}/analises/itens/{itemIdentifier}', {
    params: { path: { identifier, itemIdentifier } },
    body: { concluido },
  }))
  return paraItem(item)
}

/** Converte a análise da API, normalizando os campos inteiros. */
export function paraAnalise(analise: AnaliseDaApi): Analise {
  return {
    ...analise,
    versao: paraNumero(analise.versao),
    tokensEntrada: paraNumero(analise.tokensEntrada),
    tokensSaida: paraNumero(analise.tokensSaida),
    checklist: analise.checklist.map((grupo) => ({ nome: grupo.nome, itens: grupo.itens.map(paraItem) })),
    testes: analise.testes.map(paraItem),
    duvidas: analise.duvidas.map(paraItem),
    regras: analise.regras.map(paraItem),
  }
}

/** Converte o item da API, normalizando a ordem. */
export function paraItem(item: ItemDaApi): ItemDaAnalise {
  return { ...item, ordem: paraNumero(item.ordem) }
}

/** Itens do checklist, na ordem dos grupos. */
export function itensDoChecklist(analise: Analise): ItemDaAnalise[] {
  return analise.checklist.flatMap((grupo) => grupo.itens)
}

/** Quantos itens do checklist estão feitos, do total. */
export function progressoDoChecklist(analise: Analise): { feitos: number; total: number } {
  const itens = itensDoChecklist(analise)
  return { feitos: itens.filter((item) => item.concluido).length, total: itens.length }
}

/** Dúvidas numeradas, uma por linha, para colar no Asana. */
export function textoDasDuvidas(analise: Analise): string {
  return analise.duvidas.map((duvida, indice) => `${indice + 1}. ${duvida.texto}`).join('\n')
}

/** Dados da tarefa que acompanham a análise no texto do OpenSpec. */
export interface TarefaParaOpenSpec {
  titulo: string
  projetos: string
  linkAsana: string
  empresa: { nome: string }
}

/** Locais fixos do código do ERP Aureum, logo antes das notas do texto do `/opsx:explore`. */
const LocaisDoExplore = [
  '- Front: D:\\Aureum\\erp-frontend\\erp-aureum\\src\\pages\\',
  '- Back:  Z:\\Aureum\\erp-backend\\Source\\ErpAureum\\ErpAureum\\',
  '- Varrer os endpoints que alimentam essa lista',
]

/** Orientações fixas ao fim do texto do `/opsx:explore`. */
const NotasDoExplore = ['1. Decisões que eu preciso tomar, com opções e recomendação.', '2. Não altere código, apenas analise.']

/**
 * Texto em Markdown pronto para colar no Claude Code: começa com `/opsx:explore <título>` e traz os dados da tarefa,
 * as fontes da análise (com o texto do prompt, quando houver), o objetivo, o checklist por área, os testes, as dúvidas
 * e as regras como listas de tarefas (`[x]` nos marcados), com os trechos vagos, o trecho que gerou cada item (com a
 * origem) e a origem das regras, e termina sempre com as seções "Locais" (onde está o código do ERP)
 * e "Notas" (orientações para a exploração).
 * Blocos vazios são omitidos.
 */
export function textoParaExploreDoOpenSpec(analise: Analise, tarefa: TarefaParaOpenSpec): string {
  const linhas: string[] = [
    `/opsx:explore ${tarefa.titulo}`,
    '',
    'Demanda recebida pelo Asana e organizada pela análise com IA do Actum. Use como ponto de partida para explorar a mudança: os trechos marcados como vagos e as dúvidas ainda podem não ter resposta de quem pediu.',
    '',
    `- **Tarefa:** ${tarefa.titulo}`,
    `- **Empresa:** ${tarefa.empresa.nome}`,
  ]

  if (tarefa.projetos) {
    linhas.push(`- **Projetos:** ${tarefa.projetos}`)
  }

  linhas.push(`- **Asana:** ${tarefa.linkAsana}`)
  linhas.push(`- **Análise:** versão ${analise.versao}, de ${formatarDataHora(analise.analisadaEm)}`)
  linhas.push(`- **Fontes:** ${textoDasFontes(analise.fontes)}`)
  if (analise.fontes?.modo === 'prompt' && analise.fontes.prompt) {
    linhas.push('', ...analise.fontes.prompt.split(/\r?\n/).map((linha) => `> ${linha}`.trimEnd()))
  }
  linhas.push('', '## Objetivo', '', analise.objetivo.trim())

  const itens = (lista: ItemDaAnalise[]) => lista.flatMap(linhasDoItem)

  if (analise.checklist.length > 0) {
    linhas.push('', '## Checklist')
    for (const grupo of analise.checklist) {
      linhas.push('', `### ${grupo.nome}`, '', ...itens(grupo.itens))
    }
  }

  const secoes: [string, ItemDaAnalise[]][] = [
    ['Testes', analise.testes],
    ['Dúvidas para o solicitante', analise.duvidas],
    ['Regras e observações', analise.regras],
  ]
  for (const [titulo, lista] of secoes) {
    if (lista.length > 0) {
      linhas.push('', `## ${titulo}`, '', ...itens(lista))
    }
  }

  linhas.push('', '## Locais', '', ...LocaisDoExplore)
  linhas.push('', '## Notas', '', ...NotasDoExplore)

  return linhas.join('\n') + '\n'
}

function linhasDoItem(item: ItemDaAnalise): string[] {
  const linhas = [`- [${item.concluido ? 'x' : ' '}] ${item.texto}`]
  if (item.vago) {
    linhas.push(`  - ⚠️ Vago: ${item.vago}`)
  }
  if (item.trecho) {
    const trecho = item.trecho.replace(/\s*\n\s*/g, ' ')
    linhas.push(item.origem ? `  - Trecho (${item.origem}): "${trecho}"` : `  - Trecho: "${trecho}"`)
  } else if (item.origem) {
    linhas.push(`  - Origem: ${item.origem}`)
  }
  return linhas
}

/** Devolve a análise com o item substituído pela versão atualizada (mesmo `identifier`). */
export function comItemAtualizado(analise: Analise, atualizado: ItemDaAnalise): Analise {
  const trocar = (itens: ItemDaAnalise[]) => itens.map((item) => (item.identifier === atualizado.identifier ? atualizado : item))

  return {
    ...analise,
    checklist: analise.checklist.map((grupo) => ({ ...grupo, itens: trocar(grupo.itens) })),
    testes: trocar(analise.testes),
    duvidas: trocar(analise.duvidas),
    regras: trocar(analise.regras),
  }
}
