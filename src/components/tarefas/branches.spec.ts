import { describe, expect, it } from 'vitest'

import { sugerirBranchDeImplementacao, TamanhoMaximoDaSugestao } from './branches'

describe('sugerirBranchDeImplementacao', () => {
  const hoje = new Date(2026, 10, 5, 9, 0, 0)

  it('usa a data de hoje e o título sem acentos e pontuação', () => {
    expect(sugerirBranchDeImplementacao('Consumidor final NF-e: ajuste no cálculo', hoje)).toBe('261105-consumidor-final-nf-e-ajuste-no-calculo')
  })

  it('tira hífens das pontas do título', () => {
    expect(sugerirBranchDeImplementacao('  [ERP] Devolução de IPI!  ', hoje)).toBe('261105-erp-devolucao-de-ipi')
  })

  it('corta em 60 caracteres sem terminar em hífen', () => {
    // O 60º caractere é o hífen depois de "compras": o corte o retira.
    const sugestao = sugerirBranchDeImplementacao('Ajuste do cálculo de ICMS ST na devolução de compras com IPI destacado', hoje)

    expect(sugestao.length).toBeLessThanOrEqual(TamanhoMaximoDaSugestao)
    expect(sugestao).toBe('261105-ajuste-do-calculo-de-icms-st-na-devolucao-de-compras')
    expect(sugestao.endsWith('-')).toBe(false)
  })

  it('monta a data pela hora local, sem voltar um dia', () => {
    expect(sugerirBranchDeImplementacao('nf', new Date(2026, 10, 5, 23, 30, 0))).toBe('261105-nf')
    expect(sugerirBranchDeImplementacao('nf', new Date(2026, 0, 1, 0, 5, 0))).toBe('260101-nf')
  })

  it('usa só a data quando o título não tem letras nem números', () => {
    expect(sugerirBranchDeImplementacao('***', hoje)).toBe('261105')
  })
})
