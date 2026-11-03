import { cliente } from './cliente'
import { executar } from './erros'
import type { components } from './schema'

/** Estado da conexão com o Asana: token configurado, aceito pelo Asana, usuário e workspaces. */
export type AsanaConexao = components['schemas']['AsanaConexaoResponse']

/**
 * Consulta se o token do Asana está configurado e é válido. Token ausente ou inválido não é erro: vem em
 * `configurado`/`valido`. Lança `ErroDaApi` se o Asana estiver fora do ar (502) ou a API não for alcançada.
 */
export function obterConexaoAsana(): Promise<AsanaConexao> {
  return executar(() => cliente.GET('/asana/conexao'))
}
