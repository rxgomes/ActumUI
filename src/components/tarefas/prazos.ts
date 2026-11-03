import { formatarData } from '@/api/datas'
import type { CartaoTarefa } from '@/api/tarefas'

/** O que o cartão mostra sobre os prazos da tarefa. */
export interface PrazosDoCartao {
  /** O prazo interno precisa ser redefinido depois de uma reabertura */
  pendente: boolean
  /** Prazo interno formatado (`04/11/2026`), ou "Sem prazo" */
  interno: string
  /** Prazo do Asana formatado, só quando difere do interno; senão `null` */
  asana: string | null
}

/** Prazos a exibir no cartão: o do Asana aparece só quando é diferente do prazo interno. */
export function prazosDoCartao(cartao: Pick<CartaoTarefa, 'prazoInterno' | 'prazoAsana' | 'prazoInternoPendente'>): PrazosDoCartao {
  const asanaDiferente = cartao.prazoAsana !== null && cartao.prazoAsana !== cartao.prazoInterno

  return {
    pendente: cartao.prazoInternoPendente,
    interno: cartao.prazoInterno ? formatarData(cartao.prazoInterno) : 'Sem prazo',
    asana: asanaDiferente ? formatarData(cartao.prazoAsana!) : null,
  }
}
