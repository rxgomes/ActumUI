import { cliente } from './cliente'
import { ErroDaApi, executar } from './erros'
import { paraNumero, paraNumeroOuNulo } from './numeros'
import type { components } from './schema'

type CartaoDaApi = components['schemas']['CartaoTarefaResponse']

/** Status interno da tarefa (`entrada`, `em_andamento`, `bloqueada`, `concluida`, `retrabalho`, `arquivada`). */
export type StatusTarefa = components['schemas']['StatusTarefa']

/** Cartão de uma tarefa no painel, com os campos inteiros já como `number`. */
export interface CartaoTarefa extends Omit<CartaoDaApi, 'prioridade' | 'quantidadeRetrabalhos' | 'comentariosNaoLidos'> {
  prioridade: number | null
  quantidadeRetrabalhos: number
  comentariosNaoLidos: number
}

/** Um grupo do painel (`retrabalho`, `entrada`, `atrasadas`, `hoje`, `esta_semana`, `proximas`, `sem_prazo`). */
export interface GrupoDoPainel {
  grupo: string
  tarefas: CartaoTarefa[]
}

/** Painel: a data usada como "hoje" pela API e os grupos, na ordem de exibição. */
export interface Painel {
  hoje: string
  grupos: GrupoDoPainel[]
}

/** Filtros do painel; valores vazios não são enviados. */
export interface FiltrosDoPainel {
  /** Identifier da empresa */
  empresa?: string
  /** Texto buscado no título e na descrição */
  busca?: string
}

/** Obtém o painel de tarefas abertas, agrupado pela API, com os filtros informados. */
export async function obterPainel(filtros: FiltrosDoPainel = {}): Promise<Painel> {
  const query: FiltrosDoPainel = {}
  if (filtros.empresa) {
    query.empresa = filtros.empresa
  }

  const busca = filtros.busca?.trim()
  if (busca) {
    query.busca = busca
  }

  const painel = await executar(() => cliente.GET('/tarefas/painel', { params: { query } }))

  return {
    hoje: painel.hoje,
    grupos: painel.grupos.map((grupo) => ({ grupo: grupo.grupo, tarefas: grupo.tarefas.map(paraCartao) })),
  }
}

/** Converte o cartão da API, normalizando os campos inteiros. */
export function paraCartao(cartao: CartaoDaApi): CartaoTarefa {
  return {
    ...cartao,
    prioridade: paraNumeroOuNulo(cartao.prioridade),
    quantidadeRetrabalhos: paraNumero(cartao.quantidadeRetrabalhos),
    comentariosNaoLidos: paraNumero(cartao.comentariosNaoLidos),
  }
}

type DetalheDaApi = components['schemas']['TarefaDetalheResponse']
type BranchDaApi = components['schemas']['BranchResponse']
type RetrabalhoDaApi = components['schemas']['RetrabalhoResponse']

/** Papel da branch na tarefa: `base` ou `implementacao`. */
export type TipoBranch = components['schemas']['TipoBranch']

/** Motivo do arquivamento: `concluida_no_asana`, `reatribuida` ou `excluida`. */
export type MotivoArquivamento = NonNullable<components['schemas']['MotivoArquivamento']>

/** Comentário da tarefa, copiado do Asana. */
export type Comentario = components['schemas']['ComentarioResponse']

/** Branch da tarefa; vira tag no Asana na conclusão. */
export interface Branch extends Omit<BranchDaApi, 'retrabalhoNumero'> {
  retrabalhoNumero: number | null
}

/** Reabertura da tarefa, com os comentários que a API associa a ela. */
export interface Retrabalho extends Omit<RetrabalhoDaApi, 'numero'> {
  numero: number
}

/** Detalhe completo da tarefa, com os campos inteiros já como `number`. */
export interface TarefaDetalhe extends Omit<DetalheDaApi, 'prioridade' | 'branches' | 'retrabalhos'> {
  prioridade: number | null
  branches: Branch[]
  retrabalhos: Retrabalho[]
}

/** Prévia da conclusão: se é permitida (ou o motivo) e as tags que serão adicionadas no Asana. */
export type PreviaDaConclusao = components['schemas']['ConclusaoPreviaResponse']

/** Dados para iniciar uma tarefa da entrada; o prazo vai no formato `yyyy-MM-dd`. */
export interface DadosParaIniciar {
  branchBase: string
  branchImplementacao: string
  prazoInterno: string
}

/** Alteração de prazo interno (`yyyy-MM-dd`) e/ou prioridade; o que não for informado é mantido. */
export interface DadosParaAlterar {
  prazoInterno?: string
  prioridade?: number
}

/** Obtém o detalhe da tarefa, ou `null` quando ela não existe (404). */
export async function obterTarefa(identifier: string): Promise<TarefaDetalhe | null> {
  try {
    const detalhe = await executar(() => cliente.GET('/tarefas/{identifier}', { params: { path: { identifier } } }))
    return paraDetalhe(detalhe)
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 404) {
      return null
    }

    throw erro
  }
}

/** Marca como lidos todos os comentários da tarefa. */
export async function marcarComentariosLidos(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/comentarios/marcar-lidos', { params: { path: { identifier } } }))
}

/** Altera o prazo interno e/ou a prioridade; campos não informados são mantidos pela API. */
export async function alterarTarefa(identifier: string, dados: DadosParaAlterar): Promise<void> {
  await executar(() => cliente.PATCH('/tarefas/{identifier}', {
    params: { path: { identifier } },
    body: { prazoInterno: dados.prazoInterno ?? null, prioridade: dados.prioridade ?? null },
  }))
}

/** Inicia uma tarefa da entrada com as branches e o prazo interno. */
export async function iniciarTarefa(identifier: string, dados: DadosParaIniciar): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/iniciar', {
    params: { path: { identifier } },
    body: { branchBase: dados.branchBase, branchImplementacao: dados.branchImplementacao, prazoInterno: dados.prazoInterno },
  }))
}

/** Bloqueia uma tarefa em andamento ou em retrabalho. */
export async function bloquearTarefa(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/bloquear', { params: { path: { identifier } } }))
}

/** Desbloqueia a tarefa, que volta ao status anterior ao bloqueio. */
export async function desbloquearTarefa(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/desbloquear', { params: { path: { identifier } } }))
}

/** Registra uma branch. Lança `ErroDaApi` com status 409 quando o nome já existe na tarefa. */
export async function adicionarBranch(identifier: string, tipo: TipoBranch, nome: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/branches', {
    params: { path: { identifier } },
    body: { tipo, nome },
  }))
}

/** Exclui uma branch ainda não enviada ao Asana. */
export async function removerBranch(identifier: string, branchIdentifier: string): Promise<void> {
  await executar(() => cliente.DELETE('/tarefas/{identifier}/branches/{branchIdentifier}', {
    params: { path: { identifier, branchIdentifier } },
  }))
}

/** Prévia da conclusão: tags que serão adicionadas e se a conclusão é permitida. Não consulta o Asana. */
export function obterPreviaDaConclusao(identifier: string): Promise<PreviaDaConclusao> {
  return executar(() => cliente.GET('/tarefas/{identifier}/conclusao/previa', { params: { path: { identifier } } }))
}

/**
 * Conclui a tarefa: adiciona no Asana as tags pendentes e conclui no Asana e no Actum. Lança `ErroDaApi` em falha
 * (`400` regra ou tarefa excluída no Asana, `502` Asana indisponível); as tags já enviadas ficam registradas.
 */
export async function concluirTarefa(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/concluir', { params: { path: { identifier } } }))
}

/** Converte o detalhe da API, normalizando os campos inteiros. */
export function paraDetalhe(detalhe: DetalheDaApi): TarefaDetalhe {
  return {
    ...detalhe,
    prioridade: paraNumeroOuNulo(detalhe.prioridade),
    branches: detalhe.branches.map((branch) => ({ ...branch, retrabalhoNumero: paraNumeroOuNulo(branch.retrabalhoNumero) })),
    retrabalhos: detalhe.retrabalhos.map((retrabalho) => ({ ...retrabalho, numero: paraNumero(retrabalho.numero) })),
  }
}
