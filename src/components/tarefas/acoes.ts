import type { StatusTarefa } from '@/api/tarefas'

/** Ações do ciclo de vida oferecidas na página de detalhe. */
export type AcaoDaTarefa = 'iniciar' | 'bloquear' | 'desbloquear' | 'novoPrazo' | 'novaBranch' | 'concluir'

const EmTrabalho: readonly StatusTarefa[] = ['em_andamento', 'bloqueada', 'retrabalho']

/**
 * Ações que fazem sentido no status atual. É conveniência de tela: quem valida é a API, e uma recusa dela aparece
 * como erro.
 */
export function acoesDisponiveis(status: StatusTarefa): ReadonlySet<AcaoDaTarefa> {
  const acoes = new Set<AcaoDaTarefa>()

  if (status === 'entrada') {
    acoes.add('iniciar')
  }

  if (status === 'em_andamento' || status === 'retrabalho') {
    acoes.add('bloquear')
  }

  if (status === 'bloqueada') {
    acoes.add('desbloquear')
  }

  if (EmTrabalho.includes(status)) {
    acoes.add('novaBranch')
    acoes.add('concluir')
  }

  if (status !== 'arquivada') {
    acoes.add('novoPrazo')
  }

  return acoes
}
