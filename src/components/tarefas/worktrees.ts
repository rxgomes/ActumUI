import type { Empresa } from '@/api/empresas'
import type { Branch, SituacaoWorktree, Worktree, WorktreeParte } from '@/api/tarefas'

/** Ações oferecidas para o worktree de uma branch de implementação. */
export interface AcoesDoWorktree {
  /** Copiar o comando que abre o Claude Code na pasta da tarefa */
  copiar: boolean
  /** Criar o worktree de uma branch que nunca teve um */
  criar: boolean
  /** Criar de novo as partes que falharam ou o worktree removido */
  recriar: boolean
  /** Remover os worktrees das partes */
  remover: boolean
}

/** Texto exibido para cada situação. */
export const TextosDaSituacao: Readonly<Record<SituacaoWorktree, string>> = {
  criado: 'Criado',
  falhou: 'Falhou',
  removido: 'Removido',
}

/** Cor do badge de cada situação (variáveis do Quasar). */
export const CoresDaSituacao: Readonly<Record<SituacaoWorktree, string>> = {
  criado: 'positive',
  falhou: 'negative',
  removido: 'grey-6',
}

/** Se a branch pode ter worktree: só branches de implementação com partes. */
export function temWorktree(branch: Pick<Branch, 'tipo' | 'partes'>): boolean {
  return branch.tipo === 'implementacao' && branch.partes.length > 0
}

/** Ações disponíveis conforme o worktree que a API devolveu (`null` quando a branch nunca teve um). */
export function acoesDoWorktree(worktree: Worktree | null): AcoesDoWorktree {
  if (worktree === null) {
    return { copiar: false, criar: true, recriar: false, remover: false }
  }

  const ativo = worktree.situacao !== 'removido'

  return {
    copiar: ativo,
    criar: false,
    recriar: worktree.situacao === 'falhou' || worktree.situacao === 'removido',
    remover: ativo,
  }
}

/** Partes cujo worktree não foi criado na última tentativa. */
export function partesComFalha(worktree: Worktree | null): WorktreeParte[] {
  return worktree?.partes.filter((parte) => parte.situacao === 'falhou') ?? []
}

/**
 * O que falta para a empresa ter worktrees nas tarefas de front e back (pasta dos worktrees, clone do front, clone
 * do back); lista vazia quando está tudo configurado.
 */
export function faltasDasPastasLocais(empresa: Pick<Empresa, 'pastaWorktrees' | 'cloneFront' | 'cloneBack'>): string[] {
  const faltas: string[] = []
  if (!empresa.pastaWorktrees) {
    faltas.push('a pasta dos worktrees')
  }

  if (!empresa.cloneFront) {
    faltas.push('o clone do front')
  }

  if (!empresa.cloneBack) {
    faltas.push('o clone do back')
  }

  return faltas
}

/** Divide o texto do campo de arquivos (um por linha) em lista, sem espaços nas pontas e sem linhas vazias. */
export function arquivosDoTexto(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
}
