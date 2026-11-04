/**
 * Origem de um erro ao chamar a API: `problema` (a API respondeu em Problem Details), `rede` (a API não foi
 * alcançada: desligada, endereço errado ou CORS) ou `inesperado` (erro sem Problem Details).
 */
export type TipoDeErro = 'problema' | 'rede' | 'inesperado'

/** Mensagem mostrada quando a API não pode ser alcançada. */
export const MensagemApiIndisponivel = 'Não foi possível conectar à Actum API. Verifique se ela está em execução.'

/** Mensagem mostrada quando o erro não traz uma explicação da API. */
export const MensagemErroInesperado = 'Ocorreu um erro inesperado. Tente novamente.'

/**
 * Erro ao chamar a API, já com a mensagem em pt-BR para o usuário e os erros de validação por campo
 * (chaves em camelCase, como os campos do front).
 */
export class ErroDaApi extends Error {
  readonly tipo: TipoDeErro

  /** Status HTTP da resposta; ausente quando a API não foi alcançada. */
  readonly status: number | undefined

  /** Mensagens de validação por campo, ex.: `{ prazoInterno: ['O prazo interno é obrigatório.'] }`. */
  readonly errosPorCampo: Readonly<Record<string, string[]>>

  /** Campos extras do Problem Details, com os nomes como vieram, ex.: `{ anexosEnviados: ['print.png'] }`. */
  readonly extensoes: Readonly<Record<string, unknown>>

  constructor(
    tipo: TipoDeErro,
    mensagem: string,
    status?: number,
    errosPorCampo: Record<string, string[]> = {},
    extensoes: Record<string, unknown> = {},
  ) {
    super(mensagem)
    this.name = 'ErroDaApi'
    this.tipo = tipo
    this.status = status
    this.errosPorCampo = errosPorCampo
    this.extensoes = extensoes
  }
}

interface ProblemDetailsRecebido {
  title?: string | null
  detail?: string | null
  errors?: Record<string, string[]>
}

/** Resultado de uma chamada do `openapi-fetch`: dado em sucesso, `error` (corpo da resposta) em falha. */
interface ResultadoDaChamada<T> {
  data?: T
  error?: unknown
  response: Response
}

/**
 * Executa uma chamada do cliente e devolve o dado da resposta. Lança `ErroDaApi` quando a API responde com
 * erro ou não pode ser alcançada.
 */
export async function executar<T>(chamada: () => Promise<ResultadoDaChamada<T>>): Promise<T> {
  let resultado: ResultadoDaChamada<T>
  try {
    resultado = await chamada()
  } catch {
    // fetch rejeita a promessa quando não há resposta: API desligada, endereço errado ou CORS.
    throw new ErroDaApi('rede', MensagemApiIndisponivel)
  }

  if (!resultado.response.ok) {
    throw erroDaResposta(resultado.error, resultado.response.status)
  }

  return resultado.data as T
}

/**
 * Converte o corpo de uma resposta de erro em `ErroDaApi`: Problem Details usa `detail` (ou `title`) como mensagem;
 * qualquer outro corpo vira erro inesperado.
 */
export function erroDaResposta(corpo: unknown, status: number): ErroDaApi {
  if (!ehProblemDetails(corpo)) {
    return new ErroDaApi('inesperado', MensagemErroInesperado, status)
  }

  const mensagem = textoOuNulo(corpo.detail) ?? textoOuNulo(corpo.title) ?? MensagemErroInesperado

  return new ErroDaApi('problema', mensagem, status, errosEmCamelCase(corpo.errors), extensoesDe(corpo))
}

/**
 * Qualquer outra exceção como `ErroDaApi`, para exibir sempre uma mensagem em pt-BR.
 */
export function comoErroDaApi(erro: unknown): ErroDaApi {
  return erro instanceof ErroDaApi ? erro : new ErroDaApi('inesperado', MensagemErroInesperado)
}

function ehProblemDetails(corpo: unknown): corpo is ProblemDetailsRecebido {
  if (typeof corpo !== 'object' || corpo === null) {
    return false
  }

  const { title, detail } = corpo as ProblemDetailsRecebido
  return typeof title === 'string' || typeof detail === 'string'
}

function textoOuNulo(valor: string | null | undefined): string | null {
  return typeof valor === 'string' && valor.trim().length > 0 ? valor : null
}

/** Campos padrão do Problem Details; os demais são extensões. */
const CamposPadrao = new Set(['type', 'title', 'status', 'detail', 'instance', 'traceId', 'errors'])

function extensoesDe(corpo: ProblemDetailsRecebido): Record<string, unknown> {
  return Object.fromEntries(Object.entries(corpo).filter(([campo]) => !CamposPadrao.has(campo)))
}

/** A API devolve as chaves de `errors` com o nome da propriedade C# (PascalCase). */
function errosEmCamelCase(errors: Record<string, string[]> | undefined): Record<string, string[]> {
  const convertidos: Record<string, string[]> = {}
  for (const [campo, mensagens] of Object.entries(errors ?? {})) {
    convertidos[campo.charAt(0).toLowerCase() + campo.slice(1)] = mensagens
  }

  return convertidos
}
