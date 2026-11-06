import type { CartaoTarefa, GrupoDoPainel } from '@/api/tarefas'

import { temAndamento } from './acoes'

/** Como um grupo do painel é exibido: rótulo em pt-BR, ícone Material e cor do Quasar. */
export interface MetadadosDoGrupo {
  grupo: string
  rotulo: string
  icone: string
  cor: string
}

/** Grupos conhecidos, na ordem em que a API os devolve. */
export const GruposDoPainel: readonly MetadadosDoGrupo[] = [
  { grupo: 'retrabalho', rotulo: 'Retrabalho', icone: 'replay', cor: 'warning' },
  { grupo: 'entrada', rotulo: 'Entrada', icone: 'inbox', cor: 'blue-grey' },
  { grupo: 'atrasadas', rotulo: 'Atrasadas', icone: 'event_busy', cor: 'negative' },
  { grupo: 'hoje', rotulo: 'Hoje', icone: 'today', cor: 'secondary' },
  { grupo: 'esta_semana', rotulo: 'Esta semana', icone: 'date_range', cor: 'light-blue' },
  { grupo: 'proximas', rotulo: 'Próximas', icone: 'event', cor: 'teal' },
  { grupo: 'sem_prazo', rotulo: 'Sem prazo', icone: 'event_available', cor: 'grey' },
  { grupo: 'concluidas', rotulo: 'Concluídas', icone: 'task_alt', cor: 'positive' },
]

/**
 * Metadados de um grupo. Um grupo que a API venha a acrescentar e o front ainda não conheça é exibido com o próprio
 * nome e um ícone genérico, sem quebrar a tela.
 */
export function metadadosDoGrupo(grupo: string): MetadadosDoGrupo {
  return GruposDoPainel.find((conhecido) => conhecido.grupo === grupo) ?? { grupo, rotulo: grupo, icone: 'label', cor: 'grey' }
}

/** Cartão exibido no topo do painel, com o grupo da API a que pertence (usado na cor de fundo). */
export interface CartaoEmAndamento {
  grupo: string
  cartao: CartaoTarefa
}

/**
 * Separa as tarefas em andamento, exibidas no topo do painel sem cabeçalho de grupo, dos grupos devolvidos pela API.
 * Os grupos mantêm a ordem da API e deixam de listar essas tarefas, para que não apareçam duas vezes.
 */
export function separarEmAndamento(grupos: readonly GrupoDoPainel[]): { emAndamento: CartaoEmAndamento[]; grupos: GrupoDoPainel[] } {
  // Mesma regra do indicador do cartão: só conta o andamento em status que o têm (uma concluída fica no grupo dela).
  const estaEmAndamento = (cartao: CartaoTarefa): boolean => cartao.emAndamento && temAndamento(cartao.status)

  const emAndamento = grupos.flatMap((grupo) =>
    grupo.tarefas.filter(estaEmAndamento).map((cartao) => ({ grupo: grupo.grupo, cartao })),
  )

  return {
    emAndamento,
    grupos: grupos.map((grupo) => ({ grupo: grupo.grupo, tarefas: grupo.tarefas.filter((cartao) => !estaEmAndamento(cartao)) })),
  }
}

/** Fundo do cartão conforme o grupo: concluídas e atrasadas têm cor própria; os demais ficam com o fundo padrão. */
export function fundoDoCartao(grupo: string): 'concluida' | 'atrasada' | null {
  if (grupo === 'concluidas') {
    return 'concluida'
  }

  if (grupo === 'atrasadas') {
    return 'atrasada'
  }

  return null
}
