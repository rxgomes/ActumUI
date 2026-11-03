import type { MotivoArquivamento, StatusTarefa } from '@/api/tarefas'

const Rotulos: Record<StatusTarefa, string> = {
  entrada: 'Entrada',
  em_andamento: 'Em andamento',
  bloqueada: 'Bloqueada',
  concluida: 'Concluída',
  retrabalho: 'Retrabalho',
  arquivada: 'Arquivada',
}

const Cores: Record<StatusTarefa, string> = {
  entrada: 'blue-grey',
  em_andamento: 'secondary',
  bloqueada: 'negative',
  concluida: 'positive',
  retrabalho: 'warning',
  arquivada: 'grey',
}

const Motivos: Record<MotivoArquivamento, string> = {
  concluida_no_asana: 'A tarefa foi concluída diretamente no Asana.',
  reatribuida: 'A tarefa foi atribuída a outra pessoa no Asana.',
  excluida: 'A tarefa foi excluída no Asana.',
}

/** Nome do status em pt-BR, ex.: `em_andamento` → "Em andamento". */
export function rotuloDoStatus(status: StatusTarefa): string {
  return Rotulos[status] ?? status
}

/** Cor do Quasar usada para o status. */
export function corDoStatus(status: StatusTarefa): string {
  return Cores[status] ?? 'grey'
}

/** Explicação em pt-BR do motivo do arquivamento. */
export function textoDoMotivoArquivamento(motivo: MotivoArquivamento): string {
  return Motivos[motivo] ?? 'A tarefa saiu da lista de tarefas abertas no Asana.'
}
