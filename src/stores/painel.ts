import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { type Empresa, listarEmpresas } from '@/api/empresas'
import { comoErroDaApi, type ErroDaApi } from '@/api/erros'
import { type FiltrosDoPainel, obterPainel, type Painel } from '@/api/tarefas'

/** Painel de tarefas: dados agrupados pela API, filtros usados e empresas para o filtro. */
export const usePainelStore = defineStore('painel', () => {
  const painel = ref<Painel | null>(null)
  const carregando = ref(false)
  const erro = ref<ErroDaApi | null>(null)
  const filtros = ref<FiltrosDoPainel>({})

  const empresas = ref<Empresa[]>([])
  const carregandoEmpresas = ref(false)

  /** Quantidade de tarefas por grupo, ex.: `{ retrabalho: 2, hoje: 0 }`. */
  const contagemPorGrupo = computed<Record<string, number>>(() =>
    Object.fromEntries((painel.value?.grupos ?? []).map((grupo) => [grupo.grupo, grupo.tarefas.length])),
  )

  /** Total de tarefas no painel atual (abertas e concluídas pelo Actum). */
  const total = computed(() => Object.values(contagemPorGrupo.value).reduce((soma, quantidade) => soma + quantidade, 0))

  /**
   * Carrega o painel com os filtros informados. Em falha, preenche `erro` e mantém os dados anteriores na tela.
   */
  async function carregar(novosFiltros: FiltrosDoPainel = {}): Promise<void> {
    filtros.value = { ...novosFiltros }
    carregando.value = true
    erro.value = null

    try {
      painel.value = await obterPainel(filtros.value)
    } catch (falha) {
      erro.value = comoErroDaApi(falha)
    } finally {
      carregando.value = false
    }
  }

  /** Carrega o painel de novo com os últimos filtros usados (ex.: depois de sincronizar). */
  function recarregar(): Promise<void> {
    return carregar(filtros.value)
  }

  /** Carrega as empresas para o filtro. Lança `ErroDaApi` em falha, para a tela notificar. */
  async function carregarEmpresas(): Promise<void> {
    carregandoEmpresas.value = true
    try {
      empresas.value = await listarEmpresas()
    } finally {
      carregandoEmpresas.value = false
    }
  }

  return { painel, carregando, erro, filtros, empresas, carregandoEmpresas, contagemPorGrupo, total, carregar, recarregar, carregarEmpresas }
})
