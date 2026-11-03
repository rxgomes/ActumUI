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
]

/**
 * Metadados de um grupo. Um grupo que a API venha a acrescentar e o front ainda não conheça é exibido com o próprio
 * nome e um ícone genérico, sem quebrar a tela.
 */
export function metadadosDoGrupo(grupo: string): MetadadosDoGrupo {
  return GruposDoPainel.find((conhecido) => conhecido.grupo === grupo) ?? { grupo, rotulo: grupo, icone: 'label', cor: 'grey' }
}
