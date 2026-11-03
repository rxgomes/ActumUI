/**
 * O OpenAPI do .NET publica inteiros como `number | string`, embora a API sempre envie números. As funções de
 * `src/api` usam estas conversões para que telas e stores recebam sempre `number`.
 */
export function paraNumero(valor: number | string): number {
  return typeof valor === 'number' ? valor : Number(valor)
}

/** Igual a `paraNumero`, preservando `null`. */
export function paraNumeroOuNulo(valor: number | string | null): number | null {
  return valor === null ? null : paraNumero(valor)
}
