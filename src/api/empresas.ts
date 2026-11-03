import { cliente } from './cliente'
import { executar } from './erros'
import type { components } from './schema'

/** Empresa (workspace do Asana), com a cor que identifica as tarefas dela. */
export type Empresa = components['schemas']['EmpresaResponse']

/** Lista as empresas, ordenadas por nome. */
export function listarEmpresas(): Promise<Empresa[]> {
  return executar(() => cliente.GET('/empresas'))
}
