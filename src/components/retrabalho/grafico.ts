/*
 * Geometria do gráfico de evolução mensal (barras empilhadas por mês, uma cor por empresa), sem dependência de
 * biblioteca. Especificação das marcas: barra de no máximo 24 px, topo arredondado em 4 px e base reta, 2 px de
 * intervalo na cor da superfície entre segmentos, eixo a partir de zero com valores "redondos".
 */

/** Largura máxima de uma barra, em px. */
export const LarguraMaximaDaBarra = 24

/** Intervalo entre segmentos empilhados, em px. */
export const IntervaloEntreSegmentos = 2

/** Raio do topo arredondado, em px. */
export const RaioDoTopo = 4

const NomesDosMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Escala do eixo Y: teto "redondo" e as marcas de 0 até ele. */
export interface EscalaDoEixo {
  teto: number
  marcas: number[]
}

/**
 * Teto e marcas "redondos" (passo 1, 2 ou 5 × 10ⁿ, inteiro) para o maior valor, com 2 a 5 intervalos. Sem dados
 * (máximo 0), o eixo vai de 0 a 1.
 */
export function escalaDoEixo(maximo: number): EscalaDoEixo {
  if (maximo <= 0) {
    return { teto: 1, marcas: [0, 1] }
  }

  let passo = 1
  for (let potencia = 1; ; potencia *= 10) {
    const candidato = [1, 2, 5].map((fator) => fator * potencia).find((valor) => Math.ceil(maximo / valor) <= 5)
    if (candidato !== undefined) {
      passo = candidato
      break
    }
  }

  const teto = Math.ceil(maximo / passo) * passo
  const marcas: number[] = []
  for (let valor = 0; valor <= teto; valor += passo) {
    marcas.push(valor)
  }

  return { teto, marcas }
}

/** Segmento de uma empresa numa barra. */
export interface Segmento {
  empresa: string
  cor: string
  quantidade: number
  x: number
  y: number
  largura: number
  altura: number
  /** O segmento do topo tem os cantos de cima arredondados */
  topo: boolean
}

/** Barra de um mês: faixa inteira (alvo do hover), segmentos e total. */
export interface BarraDoMes {
  mes: string
  faixaX: number
  faixaLargura: number
  centro: number
  total: number
  /** Y do topo da pilha (para o rótulo do total) */
  topoY: number
  segmentos: Segmento[]
}

/** Área de desenho do gráfico. */
export interface AreaDoGrafico {
  esquerda: number
  topo: number
  largura: number
  altura: number
}

/** Empresa do gráfico, na ordem fixa em que é empilhada (de baixo para cima). */
export interface SerieDaEmpresa {
  identifier: string
  nome: string
  cor: string
}

/**
 * Posições das barras empilhadas: uma faixa por mês, barra centrada (no máximo 24 px), segmentos na ordem das
 * empresas, de baixo para cima, com 2 px de intervalo entre eles; mês ou empresa com zero não desenha segmento.
 */
export function barrasDoGrafico(
  meses: { mes: string; porEmpresa: { identifier: string; quantidade: number }[] }[],
  empresas: SerieDaEmpresa[],
  area: AreaDoGrafico,
  teto: number,
): BarraDoMes[] {
  const faixa = meses.length === 0 ? 0 : area.largura / meses.length
  const largura = Math.max(2, Math.min(LarguraMaximaDaBarra, faixa * 0.6))
  const base = area.topo + area.altura
  const escala = teto > 0 ? area.altura / teto : 0

  return meses.map((mes, indice) => {
    const faixaX = area.esquerda + indice * faixa
    const centro = faixaX + faixa / 2
    const valores = empresas
      .map((empresa) => ({ empresa, quantidade: mes.porEmpresa.find((item) => item.identifier === empresa.identifier)?.quantidade ?? 0 }))
      .filter((item) => item.quantidade > 0)

    const segmentos: Segmento[] = []
    let cursor = base
    valores.forEach((item, posicao) => {
      const altura = item.quantidade * escala
      const topo = posicao === valores.length - 1
      // O intervalo fica no alto de cada segmento que tem outro por cima.
      const desconto = topo ? 0 : Math.min(IntervaloEntreSegmentos, altura - 1)
      segmentos.push({
        empresa: item.empresa.identifier,
        cor: item.empresa.cor,
        quantidade: item.quantidade,
        x: centro - largura / 2,
        y: cursor - altura + desconto,
        largura,
        altura: Math.max(1, altura - desconto),
        topo,
      })
      cursor -= altura
    })

    return {
      mes: mes.mes,
      faixaX,
      faixaLargura: faixa,
      centro,
      total: valores.reduce((soma, item) => soma + item.quantidade, 0),
      topoY: cursor,
      segmentos,
    }
  })
}

/** Caminho SVG de um retângulo com só os cantos de cima arredondados (base reta, apoiada no eixo). */
export function caminhoComTopoArredondado(x: number, y: number, largura: number, altura: number): string {
  const raio = Math.min(RaioDoTopo, largura / 2, altura)
  return [
    `M${x},${y + altura}`,
    `V${y + raio}`,
    `Q${x},${y} ${x + raio},${y}`,
    `H${x + largura - raio}`,
    `Q${x + largura},${y} ${x + largura},${y + raio}`,
    `V${y + altura}`,
    'Z',
  ].join(' ')
}

/** "2026-11" → "nov/26" (eixo) ou "nov/2026" (dica e tabela). */
export function nomeDoMes(mes: string, curto = true): string {
  const [ano, numero] = mes.split('-')
  const nome = NomesDosMeses[Number(numero) - 1] ?? numero
  return `${nome}/${curto ? ano!.slice(2) : ano}`
}

/** Meses que recebem rótulo no eixo: todos até 12; acima disso, um sim, um não (o último sempre). */
export function mesesComRotulo(quantidade: number): Set<number> {
  const indices = new Set<number>()
  for (let indice = 0; indice < quantidade; indice++) {
    if (quantidade <= 12 || indice % 2 === (quantidade - 1) % 2) {
      indices.add(indice)
    }
  }
  return indices
}

/** Texto acessível de um mês: "nov/2026: Aureum-ERP 4, aremas.com.br 0". */
export function textoDoMes(mes: { mes: string; porEmpresa: { identifier: string; quantidade: number }[] }, empresas: SerieDaEmpresa[]): string {
  const partes = empresas.map((empresa) => `${empresa.nome} ${mes.porEmpresa.find((item) => item.identifier === empresa.identifier)?.quantidade ?? 0}`)
  return `${nomeDoMes(mes.mes, false)}: ${partes.join(', ')}`
}
