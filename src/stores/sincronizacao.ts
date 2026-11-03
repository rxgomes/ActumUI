import { defineStore } from 'pinia'
import { ref } from 'vue'

import { obterUltimaSincronizacao, type Sincronizacao, sincronizar as sincronizarNaApi } from '@/api/sincronizacoes'

/** Sincronização com o Asana: a última execução e a execução em andamento. */
export const useSincronizacaoStore = defineStore('sincronizacao', () => {
  const ultima = ref<Sincronizacao | null>(null)
  const carregandoUltima = ref(false)
  const ultimaCarregada = ref(false)
  const emAndamento = ref(false)

  /** Consulta a última sincronização. Não lança: se falhar, mantém o valor anterior. */
  async function carregarUltima(): Promise<void> {
    carregandoUltima.value = true
    try {
      ultima.value = await obterUltimaSincronizacao()
      ultimaCarregada.value = true
    } catch {
      // A falha ao consultar o histórico não impede o uso do painel.
    } finally {
      carregandoUltima.value = false
    }
  }

  /**
   * Sincroniza com o Asana e devolve o resumo. Lança `ErroDaApi` em falha. Em qualquer caso, recarrega a última
   * sincronização, porque a API também registra as falhas.
   */
  async function sincronizar(): Promise<Sincronizacao> {
    emAndamento.value = true
    try {
      return await sincronizarNaApi()
    } finally {
      emAndamento.value = false
      await carregarUltima()
    }
  }

  return { ultima, carregandoUltima, ultimaCarregada, emAndamento, carregarUltima, sincronizar }
})
