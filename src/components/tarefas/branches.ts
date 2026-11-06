/** Tamanho máximo da sugestão de nome da branch de implementação. */
export const TamanhoMaximoDaSugestao = 60

/**
 * Sugere o nome da branch de implementação: `yyMMdd-` (data de `hoje`, pela hora local) seguido do título em
 * minúsculas, sem acentos e com hífens no lugar do que não for letra ou número, limitado a 60 caracteres.
 */
export function sugerirBranchDeImplementacao(titulo: string, hoje: Date): string {
  const ano = String(hoje.getFullYear() % 100).padStart(2, '0')
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')

  const textoDoTitulo = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const sugestao = textoDoTitulo.length > 0 ? `${ano}${mes}${dia}-${textoDoTitulo}` : `${ano}${mes}${dia}`

  return sugestao.slice(0, TamanhoMaximoDaSugestao).replace(/-+$/, '')
}
