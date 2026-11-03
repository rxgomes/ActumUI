import { describe, expect, it } from 'vitest'

import { formatarData, formatarDataHora, hojePorExtenso, paraDataDaApi } from './datas'

// Os testes rodam com TZ=America/Sao_Paulo (vitest.config.ts), onde ler yyyy-MM-dd como UTC voltaria um dia.
describe('datas no fuso de São Paulo', () => {
  it('confirma o fuso dos testes', () => {
    expect(new Date(2026, 10, 4).getTimezoneOffset()).toBe(180)
  })

  it('formata data sem horário sem mudar o dia', () => {
    expect(formatarData('2026-11-04')).toBe('04/11/2026')
    expect(formatarData('2026-01-01')).toBe('01/01/2026')
  })

  it('rejeita data fora do formato da API', () => {
    expect(() => formatarData('04/11/2026')).toThrow()
  })

  it('envia o dia escolhido no formato da API', () => {
    expect(paraDataDaApi(new Date(2026, 10, 7))).toBe('2026-11-07')
    expect(paraDataDaApi(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07')
  })

  it('formata data com horário local', () => {
    expect(formatarDataHora('2026-11-03T14:30:15.123')).toBe('03/11/2026 14:30')
    expect(formatarDataHora('2026-11-03T23:59:00')).toBe('03/11/2026 23:59')
  })

  it('escreve a data por extenso com a primeira letra maiúscula', () => {
    expect(hojePorExtenso(new Date(2026, 10, 4))).toBe('Quarta-feira, 04 de novembro de 2026')
  })
})
