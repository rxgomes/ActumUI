import { describe, expect, it } from 'vitest'

import type { Worktree } from '@/api/tarefas'

import { acoesDoWorktree, arquivosDoTexto, faltasDasPastasLocais, partesComFalha, temWorktree } from './worktrees'

function worktree(situacao: Worktree['situacao'], partes: Worktree['partes'] = []): Worktree {
  return { pasta: 'E:\\wt\\aureum\\x', situacao, partes, comandoClaude: "cd 'E:\\wt\\aureum\\x'; claude" }
}

const front = { parte: 'front', caminho: 'E:\\wt\\aureum\\x\\front', situacao: 'criado', erro: null, criadoEm: '2026-11-12T10:00:00' } as const
const backComFalha = { parte: 'back', caminho: 'E:\\wt\\aureum\\x\\back', situacao: 'falhou', erro: 'O git não conseguiu', criadoEm: null } as const

describe('acoesDoWorktree', () => {
  it('sem worktree, só oferece criar', () => {
    expect(acoesDoWorktree(null)).toEqual({ copiar: false, criar: true, recriar: false, remover: false })
  })

  it('criado: copiar e remover', () => {
    expect(acoesDoWorktree(worktree('criado', [front]))).toEqual({ copiar: true, criar: false, recriar: false, remover: true })
  })

  it('com falha: copiar, recriar e remover', () => {
    expect(acoesDoWorktree(worktree('falhou', [front, backComFalha]))).toEqual({ copiar: true, criar: false, recriar: true, remover: true })
  })

  it('removido: só recriar', () => {
    expect(acoesDoWorktree(worktree('removido'))).toEqual({ copiar: false, criar: false, recriar: true, remover: false })
  })
})

describe('partesComFalha', () => {
  it('devolve só as partes que falharam', () => {
    expect(partesComFalha(worktree('falhou', [front, backComFalha]))).toEqual([backComFalha])
    expect(partesComFalha(null)).toEqual([])
  })
})

describe('temWorktree', () => {
  it('só branches de implementação com partes', () => {
    expect(temWorktree({ tipo: 'implementacao', partes: ['back'] })).toBe(true)
    expect(temWorktree({ tipo: 'implementacao', partes: [] })).toBe(false)
    expect(temWorktree({ tipo: 'base', partes: ['front'] })).toBe(false)
  })
})

describe('faltasDasPastasLocais', () => {
  it('lista o que falta, na ordem pasta, front, back', () => {
    expect(faltasDasPastasLocais({ pastaWorktrees: 'E:\\wt', cloneFront: 'E:\\src\\web', cloneBack: null })).toEqual(['o clone do back'])
    expect(faltasDasPastasLocais({ pastaWorktrees: null, cloneFront: null, cloneBack: null })).toEqual([
      'a pasta dos worktrees',
      'o clone do front',
      'o clone do back',
    ])
    expect(faltasDasPastasLocais({ pastaWorktrees: 'E:\\wt', cloneFront: 'a', cloneBack: 'b' })).toEqual([])
  })
})

describe('arquivosDoTexto', () => {
  it('um arquivo por linha, sem espaços nem linhas vazias', () => {
    expect(arquivosDoTexto(' .env.development \r\n\n src\\Api\\appsettings.Development.json\n  ')).toEqual([
      '.env.development',
      'src\\Api\\appsettings.Development.json',
    ])
    expect(arquivosDoTexto('')).toEqual([])
  })
})
