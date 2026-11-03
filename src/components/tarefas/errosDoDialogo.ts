import { comoErroDaApi } from '@/api/erros'

/** Erros de um diálogo: mensagens por campo (para os inputs) e a mensagem geral (para o aviso do diálogo). */
export interface ErrosDoDialogo {
  porCampo: Record<string, string>
  geral: string | null
}

/**
 * Separa o erro da API entre os campos do diálogo e a mensagem geral. Mensagens de campos que o diálogo não tem vão
 * para a mensagem geral. `campoDoConflito` recebe a mensagem de um `409` (ex.: nome de branch repetido).
 */
export function errosDoDialogo(erro: unknown, campos: readonly string[], campoDoConflito?: string): ErrosDoDialogo {
  const erroDaApi = comoErroDaApi(erro)
  const porCampo: Record<string, string> = {}
  const outros: string[] = []

  for (const [campo, mensagens] of Object.entries(erroDaApi.errosPorCampo)) {
    if (campos.includes(campo)) {
      porCampo[campo] = mensagens.join(' ')
    } else {
      outros.push(...mensagens)
    }
  }

  if (erroDaApi.status === 409 && campoDoConflito && campos.includes(campoDoConflito)) {
    porCampo[campoDoConflito] = erroDaApi.message
  }

  const temErroDeCampo = Object.keys(porCampo).length > 0
  const geral = outros.length > 0 ? outros.join(' ') : temErroDeCampo ? null : erroDaApi.message

  return { porCampo, geral }
}
