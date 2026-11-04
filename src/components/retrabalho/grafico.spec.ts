import { describe, expect, it } from 'vitest'

import {
  barrasDoGrafico,
  caminhoComTopoArredondado,
  escalaDoEixo,
  mesesComRotulo,
  nomeDoMes,
  textoDoMes,
} from './grafico'

const empresas = [
  { identifier: 'a', nome: 'Aureum-ERP', cor: '#388E3C' },
  { identifier: 'b', nome: 'aremas.com.br', cor: '#1976D2' },
]

const area = { esquerda: 30, topo: 10, largura: 300, altura: 100 }

describe('escalaDoEixo', () => {
  it('usa passos 1, 2 ou 5 com no máximo 5 intervalos', () => {
    expect(escalaDoEixo(4)).toEqual({ teto: 4, marcas: [0, 1, 2, 3, 4] })
    expect(escalaDoEixo(7)).toEqual({ teto: 8, marcas: [0, 2, 4, 6, 8] })
    expect(escalaDoEixo(23)).toEqual({ teto: 25, marcas: [0, 5, 10, 15, 20, 25] })
    expect(escalaDoEixo(0)).toEqual({ teto: 1, marcas: [0, 1] })
  })
})

describe('barrasDoGrafico', () => {
  const meses = [
    { mes: '2026-10', porEmpresa: [{ identifier: 'a', quantidade: 0 }, { identifier: 'b', quantidade: 0 }] },
    { mes: '2026-11', porEmpresa: [{ identifier: 'a', quantidade: 3 }, { identifier: 'b', quantidade: 1 }] },
    { mes: '2026-12', porEmpresa: [{ identifier: 'a', quantidade: 0 }, { identifier: 'b', quantidade: 2 }] },
  ]

  it('limita a barra a 24 px e centraliza na faixa do mês', () => {
    const barras = barrasDoGrafico(meses, empresas, area, 4)

    expect(barras.map((barra) => barra.faixaX)).toEqual([30, 130, 230])
    expect(barras[1]!.segmentos.every((segmento) => segmento.largura === 24 && segmento.x === 180 - 12)).toBe(true)
  })

  it('empilha na ordem das empresas, com 2 px de intervalo e só o topo arredondado', () => {
    const [, novembro] = barrasDoGrafico(meses, empresas, area, 4)

    // escala: 25 px por retrabalho; base em y = 110
    expect(novembro!.segmentos.map((s) => [s.empresa, s.y, s.altura, s.topo])).toEqual([
      ['a', 37, 73, false],
      ['b', 10, 25, true],
    ])
    expect(novembro!.total).toBe(4)
    expect(novembro!.topoY).toBe(10)
  })

  it('mês ou empresa com zero não desenha segmento', () => {
    const [outubro, , dezembro] = barrasDoGrafico(meses, empresas, area, 4)

    expect(outubro!.segmentos).toEqual([])
    expect(outubro!.total).toBe(0)
    expect(dezembro!.segmentos.map((s) => [s.empresa, s.topo])).toEqual([['b', true]])
  })
})

describe('textos', () => {
  it('nomeia os meses em pt-BR', () => {
    expect(nomeDoMes('2026-11')).toBe('nov/26')
    expect(nomeDoMes('2026-03', false)).toBe('mar/2026')
  })

  it('rotula todos os meses até 12 e alterna acima disso, mantendo o último', () => {
    expect([...mesesComRotulo(3)]).toEqual([0, 1, 2])
    expect([...mesesComRotulo(14)]).toEqual([1, 3, 5, 7, 9, 11, 13])
  })

  it('descreve o mês para leitores de tela', () => {
    expect(textoDoMes({ mes: '2026-11', porEmpresa: [{ identifier: 'a', quantidade: 4 }] }, empresas)).toBe('nov/2026: Aureum-ERP 4, aremas.com.br 0')
  })

  it('arredonda só o topo', () => {
    expect(caminhoComTopoArredondado(0, 10, 24, 50)).toBe('M0,60 V14 Q0,10 4,10 H20 Q24,10 24,14 V60 Z')
  })
})
