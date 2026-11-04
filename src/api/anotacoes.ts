import { cliente } from './cliente'
import { executar } from './erros'
import type { components } from './schema'

/** Anotação privada da tarefa: fica só no Actum, nunca vai para o Asana. */
export type Anotacao = components['schemas']['AnotacaoResponse']

/** Lista as anotações da tarefa, da mais antiga para a mais recente. */
export function listarAnotacoes(identifier: string): Promise<Anotacao[]> {
  return executar(() => cliente.GET('/tarefas/{identifier}/anotacoes', { params: { path: { identifier } } }))
}

/** Cria uma anotação. Lança `ErroDaApi` com `errosPorCampo.texto` quando o texto é inválido. */
export function criarAnotacao(identifier: string, texto: string): Promise<Anotacao> {
  return executar(() => cliente.POST('/tarefas/{identifier}/anotacoes', { params: { path: { identifier } }, body: { texto } }))
}

/** Altera o texto de uma anotação e devolve a anotação com a data da alteração. */
export function alterarAnotacao(identifier: string, anotacaoIdentifier: string, texto: string): Promise<Anotacao> {
  return executar(() => cliente.PUT('/tarefas/{identifier}/anotacoes/{anotacaoIdentifier}', {
    params: { path: { identifier, anotacaoIdentifier } },
    body: { texto },
  }))
}

/** Exclui uma anotação. */
export async function excluirAnotacao(identifier: string, anotacaoIdentifier: string): Promise<void> {
  await executar(() => cliente.DELETE('/tarefas/{identifier}/anotacoes/{anotacaoIdentifier}', {
    params: { path: { identifier, anotacaoIdentifier } },
  }))
}
