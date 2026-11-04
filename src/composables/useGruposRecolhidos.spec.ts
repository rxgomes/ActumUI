import { describe, expect, it } from 'vitest'

import { type Armazenamento, ChaveDosGruposRecolhidos, useGruposRecolhidos } from './useGruposRecolhidos'

function armazenamentoFalso(inicial: Record<string, string> = {}): Armazenamento & { dados: Record<string, string> } {
  const dados = { ...inicial }
  return {
    dados,
    getItem: (chave) => dados[chave] ?? null,
    setItem: (chave, valor) => {
      dados[chave] = valor
    },
  }
}

describe('useGruposRecolhidos', () => {
  it('começa com todos os grupos abertos', () => {
    const grupos = useGruposRecolhidos(armazenamentoFalso())

    expect(grupos.aberto('retrabalho')).toBe(true)
    expect(grupos.aberto('sem_prazo')).toBe(true)
  })

  it('recolhe, abre e lembra a escolha', () => {
    const armazenamento = armazenamentoFalso()
    const grupos = useGruposRecolhidos(armazenamento)

    grupos.alternar('proximas')
    grupos.alternar('sem_prazo')
    grupos.alternar('sem_prazo')

    expect(grupos.aberto('proximas')).toBe(false)
    expect(grupos.aberto('sem_prazo')).toBe(true)
    expect(JSON.parse(armazenamento.dados[ChaveDosGruposRecolhidos]!)).toEqual(['proximas'])
    expect(useGruposRecolhidos(armazenamento).aberto('proximas')).toBe(false)
  })

  it('abre o grupo recolhido ao pedir', () => {
    const grupos = useGruposRecolhidos(armazenamentoFalso({ [ChaveDosGruposRecolhidos]: '["hoje"]' }))

    grupos.abrir('hoje')
    grupos.abrir('entrada')

    expect(grupos.aberto('hoje')).toBe(true)
    expect(grupos.aberto('entrada')).toBe(true)
  })

  it('ignora valor salvo inválido', () => {
    const grupos = useGruposRecolhidos(armazenamentoFalso({ [ChaveDosGruposRecolhidos]: 'não é json' }))

    expect(grupos.aberto('hoje')).toBe(true)
  })
})
