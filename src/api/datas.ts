/*
 * Datas no formato da Actum API:
 * - sem horário: `yyyy-MM-dd` (ex.: prazoInterno). Nunca passe por `new Date('yyyy-MM-dd')`: o JavaScript lê como
 *   UTC e, no Brasil, o dia volta um;
 * - com horário: `yyyy-MM-ddTHH:mm:ss[.fff]`, no horário local e sem fuso; `new Date` lê corretamente como hora local.
 */

const DataSemHorario = /^(\d{4})-(\d{2})-(\d{2})$/

/** Formata uma data sem horário da API (`2026-11-04`) como `04/11/2026`. */
export function formatarData(data: string): string {
  const partes = DataSemHorario.exec(data)
  if (!partes) {
    throw new Error(`Data inválida: '${data}'. Esperado yyyy-MM-dd.`)
  }

  const [, ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

/** Converte o dia escolhido pelo usuário (no fuso local) para o formato da API: `yyyy-MM-dd`. */
export function paraDataDaApi(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const FormatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Formata uma data com horário da API (`2026-11-03T14:30:15.123`, hora local) como `03/11/2026 14:30`. */
export function formatarDataHora(dataHora: string): string {
  return FormatoDataHora.format(new Date(dataHora)).replace(', ', ' ')
}

const FormatoPorExtenso = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/** Data por extenso com a primeira letra maiúscula, ex.: `Quarta-feira, 04 de novembro de 2026`. */
export function hojePorExtenso(hoje: Date = new Date()): string {
  const texto = FormatoPorExtenso.format(hoje)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
