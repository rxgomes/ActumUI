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
  /** Pasta do clone local do front (caminho absoluto); texto vazio remove */
  cloneFront?: string
  /** Pasta do clone local do back (caminho absoluto); texto vazio remove */
  cloneBack?: string
  /** Pasta raiz dos worktrees das tarefas (caminho absoluto); texto vazio remove */
  pastaWorktrees?: string
  /** Arquivos fora do git copiados do clone do front para cada worktree novo; lista vazia limpa */
  arquivosFront?: string[]
  /** Arquivos fora do git copiados do clone do back para cada worktree novo; lista vazia limpa */
  arquivosBack?: string[]
}

/**
 * Altera a cor, a participação na sincronização, os repositórios e/ou as pastas locais da empresa e devolve a empresa
 * atualizada. Lança `ErroDaApi` em falha (`400` com `errosPorCampo` para formato inválido, ou com a mensagem da regra,
 * como clone de outro repositório ou caminho relativo; `404` para empresa inexistente).
 */
export function alterarEmpresa(identifier: string, dados: DadosDaEmpresa): Promise<Empresa> {
  return executar(() => cliente.PATCH('/empresas/{identifier}', {
    params: { path: { identifier } },
    body: {
      cor: dados.cor ?? null,
      sincronizar: dados.sincronizar ?? null,
      repositorioFront: dados.repositorioFront ?? null,
      repositorioBack: dados.repositorioBack ?? null,
      cloneFront: dados.cloneFront ?? null,
      cloneBack: dados.cloneBack ?? null,
      pastaWorktrees: dados.pastaWorktrees ?? null,
      arquivosFront: dados.arquivosFront ?? null,
      arquivosBack: dados.arquivosBack ?? null,
    },
  }))
}
