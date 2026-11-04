import { defineStore } from 'pinia'
import { ref } from 'vue'

import { paraDataDaApi } from '@/api/datas'
import { comoErroDaApi, type ErroDaApi } from '@/api/erros'
import { type Indicadores, obterIndicadores, reprocessarHistorico, type ResumoDoReprocessamento } from '@/api/retrabalhos'

/** Atalhos de período da página Retrabalho. */
export type AtalhoDePeriodo = 'ultimos3' | 'ultimos6' | 'ultimos12' | 'esteAno' | 'personalizado'

/** Período padrão ao abrir a página. */
export const AtalhoPadrao: AtalhoDePeriodo = 'ultimos6'

/** Maior período aceito pela API, em meses. */
export const MaximoDeMeses = 24

/** Filtro da página: atalho, datas `yyyy-MM-dd` e empresa (`null` = todas). */
export interface FiltroDoRetrabalho {
  atalho: AtalhoDePeriodo
  de: string
  ate: string
  empresa: string | null
}

/**
 * Datas de um atalho, na data local: "Últimos N meses" vai do 1º dia do mês, N−1 meses atrás, até hoje; "Este ano",
 * de 1º de janeiro até hoje.
 */
export function periodoDoAtalho(atalho: Exclude<AtalhoDePeriodo, 'personalizado'>, hoje: Date): { de: string; ate: string } {
  const meses = { ultimos3: 3, ultimos6: 6, ultimos12: 12 } as const
  const inicio = atalho === 'esteAno'
    ? new Date(hoje.getFullYear(), 0, 1)
    : new Date(hoje.getFullYear(), hoje.getMonth() - (meses[atalho] - 1), 1)

  return { de: paraDataDaApi(inicio), ate: paraDataDaApi(hoje) }
}

/** Mensagem do período personalizado inválido (as mesmas regras da API), ou `null` quando é válido. */
export function erroDoPeriodo(de: string, ate: string): string | null {
  if (!de || !ate) {
    return 'Informe o início e o fim do período.'
  }

  if (de > ate) {
    return 'O início do período deve ser anterior ou igual ao fim.'
  }

  const [ano, mes, dia] = de.split('-').map(Number) as [number, number, number]
  const limite = paraDataDaApi(new Date(ano, mes - 1 + MaximoDeMeses, dia))
  return ate > limite ? `O período deve ter no máximo ${MaximoDeMeses} meses.` : null
}

/** Indicadores da página Retrabalho e o reprocessamento do histórico do Asana. */
export const useRetrabalhoStore = defineStore('retrabalho', () => {
  const filtro = ref<FiltroDoRetrabalho>({ atalho: AtalhoPadrao, ...periodoDoAtalho(AtalhoPadrao, new Date()), empresa: null })
  const indicadores = ref<Indicadores | null>(null)
  const carregando = ref(false)
  const erro = ref<ErroDaApi | null>(null)
  const reprocessando = ref(false)
  const ultimoResumo = ref<ResumoDoReprocessamento | null>(null)

  /** Aplica o filtro (datas recalculadas pelo atalho, exceto no personalizado) e recarrega quando é válido. */
  async function aplicar(novo: FiltroDoRetrabalho, hoje: Date = new Date()): Promise<void> {
    filtro.value = novo.atalho === 'personalizado' ? { ...novo } : { ...novo, ...periodoDoAtalho(novo.atalho, hoje) }
    if (erroDoPeriodo(filtro.value.de, filtro.value.ate) === null) {
      await carregar()
    }
  }

  /** Lê os indicadores do filtro atual; uma recarga com dados na tela os mantém até a resposta. */
  async function carregar(): Promise<void> {
    const pedido = { ...filtro.value }
    carregando.value = true
    erro.value = null
    try {
      const lidos = await obterIndicadores(pedido)
      if (mesmoFiltro(pedido)) {
        indicadores.value = lidos
      }
    } catch (falha) {
      if (mesmoFiltro(pedido)) {
        erro.value = comoErroDaApi(falha)
      }
    } finally {
      if (mesmoFiltro(pedido)) {
        carregando.value = false
      }
    }
  }

  /** Reprocessa o histórico (só leitura no Asana) e recarrega os indicadores. Lança o erro da API em falha. */
  async function reprocessar(): Promise<ResumoDoReprocessamento> {
    reprocessando.value = true
    try {
      const resumo = await reprocessarHistorico()
      ultimoResumo.value = resumo
      await carregar()
      return resumo
    } finally {
      reprocessando.value = false
    }
  }

  function dispensarResumo(): void {
    ultimoResumo.value = null
  }

  function mesmoFiltro(pedido: FiltroDoRetrabalho): boolean {
    const atual = filtro.value
    return atual.de === pedido.de && atual.ate === pedido.ate && atual.empresa === pedido.empresa
  }

  return { filtro, indicadores, carregando, erro, reprocessando, ultimoResumo, aplicar, carregar, reprocessar, dispensarResumo }
})
