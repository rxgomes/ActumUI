import { cliente } from './cliente'
import { executar } from './erros'
import { paraNumeroOuNulo } from './numeros'
import type { components } from './schema'

type AnexoDaApi = components['schemas']['AnexoResponse']

/**
 * Arquivo anexado à tarefa no Asana (na própria tarefa ou num comentário), com a indicação da API de que pode ser
 * fonte da análise com IA (`legivelNaAnalise`) e, se não puder, o `motivo`.
 */
export interface Anexo extends Omit<AnexoDaApi, 'tamanho'> {
  /** Tamanho em bytes; `null` quando o Asana não sabe (arquivos externos, como Google Drive) */
  tamanho: number | null
}

/** Lê do Asana, na hora, os anexos da tarefa, do mais antigo para o mais recente. */
export async function listarAnexos(identifier: string): Promise<Anexo[]> {
  const anexos = await executar(() => cliente.GET('/tarefas/{identifier}/anexos', { params: { path: { identifier } } }))

  return anexos.map((anexo) => ({ ...anexo, tamanho: paraNumeroOuNulo(anexo.tamanho) }))
}

/**
 * Endereço da API que baixa o anexo: ela pede ao Asana um link novo (os do Asana expiram em minutos) e redireciona.
 * Use como `href` de um link; arquivos externos abrem no serviço onde estão.
 */
export function enderecoDeDownload(identifier: string, anexoGid: string): string {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

  return `${base}/tarefas/${encodeURIComponent(identifier)}/anexos/${encodeURIComponent(anexoGid)}/download`
}

/** Se o arquivo fica fora do Asana (Google Drive, Dropbox...) e abre no serviço em vez de baixar. */
export function ehExterno(anexo: Anexo): boolean {
  return anexo.hospedagem !== '' && anexo.hospedagem !== 'asana'
}
