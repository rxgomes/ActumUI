import { cliente } from './cliente'
import { executar } from './erros'
import { paraNumero, paraNumeroOuNulo } from './numeros'
import type { components } from './schema'

type CartaoDaApi = components['schemas']['CartaoTarefaResponse']

/** Status interno da tarefa (`entrada`, `em_andamento`, `bloqueada`, `concluida`, `retrabalho`, `arquivada`). */
export type StatusTarefa = components['schemas']['StatusTarefa']

/** Cartão de uma tarefa no painel, com os campos inteiros já como `number`. */
export interface CartaoTarefa extends Omit<CartaoDaApi, 'prioridade' | 'quantidadeRetrabalhos' | 'comentariosNaoLidos'> {
  prioridade: number | null
  quantidadeRetrabalhos: number
  comentariosNaoLidos: number
}

/** Um grupo do painel (`retrabalho`, `entrada`, `atrasadas`, `hoje`, `esta_semana`, `proximas`, `sem_prazo`). */
export interface GrupoDoPainel {
  grupo: string
  tarefas: CartaoTarefa[]
}

/** Painel: a data usada como "hoje" pela API e os grupos, na ordem de exibição. */
export interface Painel {
  hoje: string
  grupos: GrupoDoPainel[]
}

/** Filtros do painel; valores vazios não são enviados. */
export interface FiltrosDoPainel {
  /** Identifier da empresa */
  empresa?: string
  /** Texto buscado no título e na descrição */
  busca?: string
}

/** Obtém o painel de tarefas abertas, agrupado pela API, com os filtros informados. */
export async function obterPainel(filtros: FiltrosDoPainel = {}): Promise<Painel> {
  const query: FiltrosDoPainel = {}
  if (filtros.empresa) {
    query.empresa = filtros.empresa
  }

  const busca = filtros.busca?.trim()
  if (busca) {
    query.busca = busca
  }

  const painel = await executar(() => cliente.GET('/tarefas/painel', { params: { query } }))

  return {
    hoje: painel.hoje,
    grupos: painel.grupos.map((grupo) => ({ grupo: grupo.grupo, tarefas: grupo.tarefas.map(paraCartao) })),
  }
}

/** Converte o cartão da API, normalizando os campos inteiros. */
export function paraCartao(cartao: CartaoDaApi): CartaoTarefa {
  return {
    ...cartao,
    prioridade: paraNumeroOuNulo(cartao.prioridade),
    quantidadeRetrabalhos: paraNumero(cartao.quantidadeRetrabalhos),
    comentariosNaoLidos: paraNumero(cartao.comentariosNaoLidos),
  }
}
