import { cliente } from './cliente'
import { executar } from './erros'
import type { components } from './schema'

/** Empresa (workspace do Asana), com a cor que identifica as tarefas dela. */
export type Empresa = components['schemas']['EmpresaResponse']

/** Lista as empresas, ordenadas por nome. */
export function listarEmpresas(): Promise<Empresa[]> {
  return executar(() => cliente.GET('/empresas'))
}

/** Alteração de uma empresa; o que não for informado é mantido pela API. */
export interface DadosDaEmpresa {
  /** Nova cor no formato `#RRGGBB` */
  cor?: string
  /** Se a empresa entra na sincronização */
  sincronizar?: boolean
  /** Repositório do front no GitHub (`dono/repo`); texto vazio remove */
  repositorioFront?: string
  /** Repositório do back no GitHub (`dono/repo`); texto vazio remove */
  repositorioBack?: string
}

/**
 * Altera a cor, a participação na sincronização e/ou os repositórios da empresa e devolve a empresa atualizada.
 * Lança `ErroDaApi` em falha (`400` com `errosPorCampo.cor`, `repositorioFront` ou `repositorioBack` para valor
 * inválido, `404` para empresa inexistente).
 */
export function alterarEmpresa(identifier: string, dados: DadosDaEmpresa): Promise<Empresa> {
  return executar(() => cliente.PATCH('/empresas/{identifier}', {
    params: { path: { identifier } },
    body: {
      cor: dados.cor ?? null,
      sincronizar: dados.sincronizar ?? null,
      repositorioFront: dados.repositorioFront ?? null,
      repositorioBack: dados.repositorioBack ?? null,
    },
  }))
}
