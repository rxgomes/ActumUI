import { cliente } from './cliente'
import { ErroDaApi, executar } from './erros'
import { paraNumero } from './numeros'
import type { components } from './schema'

type SincronizacaoDaApi = components['schemas']['SincronizacaoResponse']

/** Resumo de uma sincronização com o Asana, com os totais já como `number`. */
export interface Sincronizacao
  extends Omit<SincronizacaoDaApi, 'tarefasNovas' | 'tarefasAtualizadas' | 'tarefasArquivadas' | 'reaberturas'> {
  tarefasNovas: number
  tarefasAtualizadas: number
  tarefasArquivadas: number
  reaberturas: number
}

/**
 * Sincroniza as tarefas com o Asana e devolve o resumo. Lança `ErroDaApi` em falha: `409` se já houver uma em
 * andamento, `400` para token ausente ou recusado, `502` para Asana indisponível.
 */
export async function sincronizar(): Promise<Sincronizacao> {
  return paraSincronizacao(await executar(() => cliente.POST('/sincronizacoes')))
}

/** Obtém a última sincronização, ou `null` quando ainda não houve nenhuma. */
export async function obterUltimaSincronizacao(): Promise<Sincronizacao | null> {
  try {
    return paraSincronizacao(await executar(() => cliente.GET('/sincronizacoes/ultima')))
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 404) {
      return null
    }

    throw erro
  }
}

function paraSincronizacao(sincronizacao: SincronizacaoDaApi): Sincronizacao {
  return {
    ...sincronizacao,
    tarefasNovas: paraNumero(sincronizacao.tarefasNovas),
    tarefasAtualizadas: paraNumero(sincronizacao.tarefasAtualizadas),
    tarefasArquivadas: paraNumero(sincronizacao.tarefasArquivadas),
    reaberturas: paraNumero(sincronizacao.reaberturas),
  }
}
