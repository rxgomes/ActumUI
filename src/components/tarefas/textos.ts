import { formatarDataHora } from '@/api/datas'
import type { CartaoTarefa, MotivoArquivamento, StatusTarefa } from '@/api/tarefas'

const Rotulos: Record<StatusTarefa, string> = {
  entrada: 'Entrada',
  em_andamento: 'Iniciada',
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

/** Nome do status em pt-BR, ex.: `em_andamento` → "Iniciada" (o andamento tem rótulo próprio). */
export function rotuloDoStatus(status: StatusTarefa): string {
  return Rotulos[status] ?? status
}

/** Cor do Quasar usada para o status. */
export function corDoStatus(status: StatusTarefa): string {
  return Cores[status] ?? 'grey'
}

/** Rótulo do indicador de andamento: "Em andamento" ou "Pausada". */
export function rotuloDoAndamento(emAndamento: boolean): string {
  return emAndamento ? 'Em andamento' : 'Pausada'
}

/** Cor do Quasar do indicador de andamento. */
export function corDoAndamento(emAndamento: boolean): string {
  return emAndamento ? 'secondary' : 'grey-7'
}

/**
 * Último comentário do cartão, ex.: "Bruno · 04/11/2026 14:30"; só a data e hora quando o autor é desconhecido,
 * e `null` quando a tarefa não tem comentários.
 */
export function ultimoComentarioDoCartao(
  cartao: Pick<CartaoTarefa, 'ultimoComentarioEm' | 'ultimoComentarioAutor'>,
): string | null {
  if (!cartao.ultimoComentarioEm) {
    return null
  }

  const quando = formatarDataHora(cartao.ultimoComentarioEm)
  return cartao.ultimoComentarioAutor ? `${cartao.ultimoComentarioAutor} · ${quando}` : quando
}

/** Explicação em pt-BR do motivo do arquivamento. */
export function textoDoMotivoArquivamento(motivo: MotivoArquivamento): string {
  return Motivos[motivo] ?? 'A tarefa saiu da lista de tarefas abertas no Asana.'
}
