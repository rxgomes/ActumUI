import type { Analise } from './analises'
import { cliente } from './cliente'
import { ErroDaApi, executar } from './erros'
import type { components } from './schema'

/** Pessoa que segue a tarefa no Asana e pode ser mencionada. */
export type Participante = components['schemas']['ParticipanteResponse']

/** Comentário publicado no Asana e registrado no Actum, com os anexos enviados. */
export type ComentarioEnviado = components['schemas']['ComentarioEnviadoResponse']

/** Conteúdo de um comentário a enviar ao Asana. */
export interface NovoComentario {
  texto: string
  /** `gid` dos participantes a mencionar */
  mencoes: string[]
  arquivos: File[]
}

/** Limites dos arquivos, os mesmos da API. */
export const MaximoDeArquivos = 10
export const TamanhoMaximoDoArquivo = 25 * 1024 * 1024
export const TamanhoMaximoDoEnvio = 50 * 1024 * 1024

/** Lê do Asana, na hora, quem segue a tarefa (exceto o próprio usuário), com a pessoa sugerida para menção. */
export function listarParticipantes(identifier: string): Promise<Participante[]> {
  return executar(() => cliente.GET('/tarefas/{identifier}/participantes', { params: { path: { identifier } } }))
}

/**
 * Anexa os arquivos à tarefa no Asana e publica o comentário com as menções. Lança `ErroDaApi` em falha; quando
 * parte dos anexos já subiu, `anexosEnviados(erro)` traz os nomes.
 */
export function enviarComentario(identifier: string, comentario: NovoComentario): Promise<ComentarioEnviado> {
  const formulario = new FormData()
  if (comentario.texto.trim().length > 0) {
    formulario.append('texto', comentario.texto)
  }

  for (const gid of comentario.mencoes) {
    formulario.append('mencoes', gid)
  }

  for (const arquivo of comentario.arquivos) {
    formulario.append('arquivos', arquivo, arquivo.name)
  }

  return executar(() => cliente.POST('/tarefas/{identifier}/comentarios', {
    params: { path: { identifier } },
    // O OpenAPI descreve o formulário de forma genérica; o corpo vai como FormData e o navegador define o boundary.
    body: formulario as never,
    bodySerializer: (corpo) => corpo as unknown as FormData,
  }))
}

/** Nomes dos anexos que já foram enviados ao Asana quando o envio falhou no meio. */
export function anexosEnviados(erro: unknown): string[] {
  if (!(erro instanceof ErroDaApi)) {
    return []
  }

  const nomes = erro.extensoes.anexosEnviados
  return Array.isArray(nomes) ? nomes.filter((nome): nome is string => typeof nome === 'string') : []
}

/** Nome do arquivo de um print colado: `print-AAAAMMDD-HHMMSS.png`, na hora local. */
export function nomeDoPrint(data: Date): string {
  const dois = (valor: number) => String(valor).padStart(2, '0')
  const dia = `${data.getFullYear()}${dois(data.getMonth() + 1)}${dois(data.getDate())}`
  const hora = `${dois(data.getHours())}${dois(data.getMinutes())}${dois(data.getSeconds())}`
  return `print-${dia}-${hora}.png`
}

/**
 * Confere os arquivos novos com os limites da API, considerando os que já estão na caixa. Aceita até o primeiro
 * arquivo recusado e devolve a mensagem dele, igual à da API.
 */
export function validarArquivos(atuais: readonly File[], novos: readonly File[]): { aceitos: File[]; erro: string | null } {
  const aceitos: File[] = []
  let total = atuais.reduce((soma, arquivo) => soma + arquivo.size, 0)

  for (const arquivo of novos) {
    let erro: string | null = null
    if (atuais.length + aceitos.length >= MaximoDeArquivos) {
      erro = `Envie no máximo ${MaximoDeArquivos} arquivos por vez.`
    } else if (arquivo.size === 0) {
      erro = `O arquivo ${arquivo.name} está vazio.`
    } else if (arquivo.size > TamanhoMaximoDoArquivo) {
      erro = `O arquivo ${arquivo.name} tem mais de 25 MB, o limite por arquivo.`
    } else if (total + arquivo.size > TamanhoMaximoDoEnvio) {
      erro = 'Os arquivos somam mais de 50 MB, o limite por envio.'
    }

    if (erro !== null) {
      return { aceitos, erro }
    }

    aceitos.push(arquivo)
    total += arquivo.size
  }

  return { aceitos, erro: null }
}

/** Texto do comentário com as dúvidas ainda não resolvidas da análise, numeradas; vazio quando não há. */
export function textoDasDuvidasParaEnviar(analise: Analise): string {
  const pendentes = analise.duvidas.filter((duvida) => !duvida.concluido)
  if (pendentes.length === 0) {
    return ''
  }

  return ['Dúvidas sobre a tarefa:', ...pendentes.map((duvida, indice) => `${indice + 1}. ${duvida.texto}`)].join('\n')
}

const FormatoDeTamanho = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Tamanho para exibição: "850 B", "12,3 KB", "1,2 MB". */
export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${FormatoDeTamanho.format(bytes / 1024)} KB`
  }

  return `${FormatoDeTamanho.format(bytes / (1024 * 1024))} MB`
}
