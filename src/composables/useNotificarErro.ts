import { useQuasar } from 'quasar'

import { comoErroDaApi } from '@/api/erros'

/**
 * Mostra ao usuário, numa notificação, a mensagem em pt-BR de um erro ao chamar a API (`ErroDaApi`) ou uma
 * mensagem genérica para qualquer outra exceção. Use em ações do usuário (salvar, concluir, sincronizar).
 */
export function useNotificarErro(): (erro: unknown) => void {
  const quasar = useQuasar()

  return (erro: unknown) => {
    quasar.notify({
      type: 'negative',
      message: comoErroDaApi(erro).message,
      position: 'top',
      timeout: 6000,
    })
  }
}
