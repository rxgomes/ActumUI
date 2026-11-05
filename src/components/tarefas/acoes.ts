import type { StatusTarefa } from '@/api/tarefas'

/** Ações do ciclo de vida oferecidas na página de detalhe. */
export type AcaoDaTarefa = 'iniciar' | 'pausar' | 'bloquear' | 'desbloquear' | 'novoPrazo' | 'novaBranch' | 'concluir'

const EmTrabalho: readonly StatusTarefa[] = ['em_andamento', 'bloqueada', 'retrabalho']

/** Status em que a tarefa pode estar "Em andamento" ou "Pausada" (a bloqueada fica sempre pausada). */
const ComAndamento: readonly StatusTarefa[] = ['em_andamento', 'retrabalho']

/** Se o indicador "Em andamento"/"Pausada" se aplica à tarefa no status informado. */
export function temAndamento(status: StatusTarefa): boolean {
  return ComAndamento.includes(status)
}

/**
 * Ações que fazem sentido no status atual. É conveniência de tela: quem valida é a API, e uma recusa dela aparece
 * como erro. `iniciar` vale para a entrada (com branches e prazo) e para a tarefa pausada (retoma direto).
 */
export function acoesDisponiveis(status: StatusTarefa, emAndamento = false): ReadonlySet<AcaoDaTarefa> {
  const acoes = new Set<AcaoDaTarefa>()

  if (status === 'entrada' || (temAndamento(status) && !emAndamento)) {
    acoes.add('iniciar')
  }

  if (temAndamento(status) && emAndamento) {
    acoes.add('pausar')
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
