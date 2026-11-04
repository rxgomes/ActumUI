import { cliente } from './cliente'
import { executar } from './erros'
import { paraNumero, paraNumeroOuNulo } from './numeros'
import type { components } from './schema'

type IndicadoresDaApi = components['schemas']['IndicadoresResponse']
type IndicadorDaApi = components['schemas']['IndicadorDaEmpresaResponse']
type ReprocessamentoDaApi = components['schemas']['ReprocessamentoResponse']

/** Indicadores de retrabalho de uma empresa (ou do Total, sem `identifier` nem `cor`). */
export interface IndicadorDaEmpresa extends Omit<IndicadorDaApi, 'retrabalhos' | 'tarefasComRetrabalho' | 'tarefasConcluidas' | 'taxa'> {
  retrabalhos: number
  tarefasComRetrabalho: number
  tarefasConcluidas: number
  /** Percentual com uma casa; `null` sem tarefas concluídas no período */
  taxa: number | null
}

/** Retrabalhos de um mês (`yyyy-MM`), por empresa. */
export interface MesDeRetrabalho {
  mes: string
  porEmpresa: { identifier: string; quantidade: number }[]
}

/** Tarefa do ranking de retrabalho do período. */
export interface TarefaDoRanking extends Omit<components['schemas']['TarefaDoRankingResponse'], 'retrabalhos'> {
  retrabalhos: number
}

/** Indicadores de retrabalho do período. */
export interface Indicadores extends Omit<IndicadoresDaApi, 'empresas' | 'total' | 'evolucao' | 'ranking'> {
  empresas: IndicadorDaEmpresa[]
  total: IndicadorDaEmpresa
  evolucao: MesDeRetrabalho[]
  ranking: TarefaDoRanking[]
}

/** Resumo do reprocessamento do histórico do Asana. */
export interface ResumoDoReprocessamento extends Omit<ReprocessamentoDaApi, 'tarefasLidas' | 'retrabalhosAntes' | 'retrabalhosDepois'> {
  tarefasLidas: number
  retrabalhosAntes: number
  retrabalhosDepois: number
}

/** Filtro dos indicadores: datas `yyyy-MM-dd` (pela data da reabertura) e empresa opcional. */
export interface FiltroDosIndicadores {
  de: string
  ate: string
  empresa?: string | null
}

/** Lê os indicadores de retrabalho do período, por empresa e no total. */
export async function obterIndicadores(filtro: FiltroDosIndicadores): Promise<Indicadores> {
  const indicadores = await executar(() => cliente.GET('/retrabalhos/indicadores', {
    params: { query: { De: filtro.de, Ate: filtro.ate, ...(filtro.empresa ? { Empresa: filtro.empresa } : {}) } },
  }))
  return paraIndicadores(indicadores)
}

/**
 * Relê no Asana o histórico de todas as tarefas e recalcula conclusões e retrabalhos (só leitura no Asana). Lança
 * `ErroDaApi` com status 409 quando uma sincronização ou reprocessamento já está em andamento.
 */
export async function reprocessarHistorico(): Promise<ResumoDoReprocessamento> {
  const resumo = await executar(() => cliente.POST('/retrabalhos/reprocessamento'))
  return {
    ...resumo,
    tarefasLidas: paraNumero(resumo.tarefasLidas),
    retrabalhosAntes: paraNumero(resumo.retrabalhosAntes),
    retrabalhosDepois: paraNumero(resumo.retrabalhosDepois),
  }
}

/** Converte os indicadores da API, normalizando os números. */
export function paraIndicadores(indicadores: IndicadoresDaApi): Indicadores {
  return {
    ...indicadores,
    empresas: indicadores.empresas.map(paraIndicador),
    total: paraIndicador(indicadores.total),
    evolucao: indicadores.evolucao.map((mes) => ({
      mes: mes.mes,
      porEmpresa: mes.porEmpresa.map((item) => ({ identifier: item.identifier, quantidade: paraNumero(item.quantidade) })),
    })),
    ranking: indicadores.ranking.map((tarefa) => ({ ...tarefa, retrabalhos: paraNumero(tarefa.retrabalhos) })),
  }
}

function paraIndicador(indicador: IndicadorDaApi): IndicadorDaEmpresa {
  return {
    ...indicador,
    retrabalhos: paraNumero(indicador.retrabalhos),
    tarefasComRetrabalho: paraNumero(indicador.tarefasComRetrabalho),
    tarefasConcluidas: paraNumero(indicador.tarefasConcluidas),
    taxa: paraNumeroOuNulo(indicador.taxa),
  }
}
