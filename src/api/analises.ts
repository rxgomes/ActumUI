import { cliente } from './cliente'
import { executar } from './erros'
import { paraNumero } from './numeros'
import type { components } from './schema'

type AnaliseDaApi = components['schemas']['AnaliseResponse']
type ItemDaApi = components['schemas']['AnaliseItemResponse']

/** Situação da chave da Claude API na API (a chave nunca é devolvida). */
export type SituacaoClaude = components['schemas']['ClaudeSituacaoResponse']

/** Tipo do item: ação do checklist, teste ou dúvida para quem pediu. */
export type TipoItemDaAnalise = components['schemas']['TipoItemAnalise']

/** Item marcável da análise (checklist feito, teste realizado, dúvida resolvida). */
export interface ItemDaAnalise extends Omit<ItemDaApi, 'ordem'> {
  ordem: number
}

/** Área do checklist (ex.: "Front", "Back: cálculo") com os itens, na ordem de execução. */
export interface GrupoDoChecklist {
  nome: string
  itens: ItemDaAnalise[]
}

/** Uma versão da análise da demanda feita pela IA. */
export interface Analise extends Omit<AnaliseDaApi, 'versao' | 'tokensEntrada' | 'tokensSaida' | 'checklist' | 'testes' | 'duvidas'> {
  versao: number
  tokensEntrada: number
  tokensSaida: number
  checklist: GrupoDoChecklist[]
  testes: ItemDaAnalise[]
  duvidas: ItemDaAnalise[]
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
 * Analisa a demanda com IA e devolve a nova versão (atual). Chamada paga, que pode levar até um minuto. Lança
 * `ErroDaApi` em falha (`400` sem chave, sem créditos, chave recusada, recusa do modelo ou tarefa arquivada; `409`
 * análise em andamento; `502` Anthropic indisponível ou resposta incompleta).
 */
export async function analisarTarefa(identifier: string): Promise<Analise> {
  const analise = await executar(() => cliente.POST('/tarefas/{identifier}/analises', { params: { path: { identifier } } }))
  return paraAnalise(analise)
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

/** Devolve a análise com o item substituído pela versão atualizada (mesmo `identifier`). */
export function comItemAtualizado(analise: Analise, atualizado: ItemDaAnalise): Analise {
  const trocar = (itens: ItemDaAnalise[]) => itens.map((item) => (item.identifier === atualizado.identifier ? atualizado : item))

  return {
    ...analise,
    checklist: analise.checklist.map((grupo) => ({ ...grupo, itens: trocar(grupo.itens) })),
    testes: trocar(analise.testes),
    duvidas: trocar(analise.duvidas),
  }
}
