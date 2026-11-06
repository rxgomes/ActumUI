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

/** Um grupo do painel (`retrabalho`, `entrada`, `atrasadas`, `hoje`, `esta_semana`, `proximas`, `sem_prazo`, `concluidas`). */
export interface GrupoDoPainel {
  grupo: string
  tarefas: CartaoTarefa[]
}

/** Painel: a data usada como "hoje" pela API e os grupos, na ordem de exibição. */
export interface Painel {
  hoje: string
  grupos: GrupoDoPainel[]
}

/** Status que podem aparecer no painel (as arquivadas nunca aparecem), na ordem do filtro. */
export const StatusDoPainel = ['entrada', 'em_andamento', 'bloqueada', 'retrabalho', 'concluida'] as const satisfies readonly StatusTarefa[]

/** Um status aceito pelo filtro do painel. */
export type StatusDoPainel = (typeof StatusDoPainel)[number]

/** Se o texto (ex.: lido do endereço) é um status aceito pelo filtro do painel. */
export function ehStatusDoPainel(valor: string): valor is StatusDoPainel {
  return (StatusDoPainel as readonly string[]).includes(valor)
}

/** Filtros do painel; valores vazios não são enviados. */
export interface FiltrosDoPainel {
  /** Identifier da empresa */
  empresa?: string
  /** Status da tarefa */
  status?: StatusDoPainel
  /** Texto buscado no título e na descrição */
  busca?: string
}

/** Obtém o painel de tarefas abertas, agrupado pela API, com os filtros informados. */
export async function obterPainel(filtros: FiltrosDoPainel = {}): Promise<Painel> {
  const query: FiltrosDoPainel = {}
  if (filtros.empresa) {
    query.empresa = filtros.empresa
  }

  if (filtros.status) {
    query.status = filtros.status
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

/** Parte do sistema a que a branch pertence: `front` ou `back`; cada uma tem seu repositório no GitHub. */
export type ParteBranch = components['schemas']['ParteBranch']

/** Motivo do arquivamento: `concluida_no_asana`, `reatribuida` ou `excluida`. */
export type MotivoArquivamento = NonNullable<components['schemas']['MotivoArquivamento']>

/** Comentário da tarefa, copiado do Asana. */
export type Comentario = components['schemas']['ComentarioResponse']

/** Branch da tarefa, com as partes e o texto da tag (`tag`) que vai ao Asana na conclusão. */
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

/**
 * Dados para iniciar uma tarefa da entrada; o prazo vai no formato `yyyy-MM-dd`. A API cria a branch de
 * implementação no GitHub, a partir da base, nos repositórios das `partes`.
 */
export interface DadosParaIniciar {
  branchBase: string
  branchImplementacao: string
  prazoInterno: string
  partes: ParteBranch[]
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

/**
 * Inicia uma tarefa da entrada com as branches, as partes e o prazo interno. Lança `ErroDaApi` em falha (`400`
 * regra, base inexistente no GitHub ou parte sem repositório; `502` GitHub indisponível); a tarefa fica como estava.
 */
export async function iniciarTarefa(identifier: string, dados: DadosParaIniciar): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/iniciar', {
    params: { path: { identifier } },
    body: {
      branchBase: dados.branchBase,
      branchImplementacao: dados.branchImplementacao,
      prazoInterno: dados.prazoInterno,
      partes: dados.partes,
    },
  }))
}

/** Lista até 3 branches base usadas mais recentemente nas tarefas da mesma empresa, da mais recente para a mais antiga. */
export function listarBasesRecentes(identifier: string): Promise<string[]> {
  return executar(() => cliente.GET('/tarefas/{identifier}/branches-base-recentes', { params: { path: { identifier } } }))
}

/** Põe em andamento uma tarefa pausada (já iniciada ou em retrabalho). */
export async function retomarTarefa(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/retomar', { params: { path: { identifier } } }))
}

/** Pausa uma tarefa em andamento. */
export async function pausarTarefa(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/pausar', { params: { path: { identifier } } }))
}

/** Bloqueia uma tarefa em andamento ou em retrabalho. */
export async function bloquearTarefa(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/bloquear', { params: { path: { identifier } } }))
}

/** Desbloqueia a tarefa, que volta ao status anterior ao bloqueio. */
export async function desbloquearTarefa(identifier: string): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/desbloquear', { params: { path: { identifier } } }))
}

/**
 * Registra uma branch nas partes informadas: uma base precisa existir no GitHub; uma implementação é criada no GitHub
 * a partir da base da tarefa. Lança `ErroDaApi` com status 409 quando o nome já existe na tarefa.
 */
export async function adicionarBranch(identifier: string, tipo: TipoBranch, nome: string, partes: ParteBranch[]): Promise<void> {
  await executar(() => cliente.POST('/tarefas/{identifier}/branches', {
    params: { path: { identifier } },
    body: { tipo, nome, partes },
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
