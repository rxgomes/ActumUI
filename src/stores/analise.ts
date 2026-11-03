import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  type Analise,
  analisarTarefa,
  comItemAtualizado,
  type ItemDaAnalise,
  listarAnalises,
  marcarItemDaAnalise,
  obterSituacaoClaude,
  type SituacaoClaude,
} from '@/api/analises'
import { comoErroDaApi, type ErroDaApi } from '@/api/erros'

/**
 * Análise com IA da tarefa aberta no detalhe: situação da chave, versões (a mais recente primeiro), análise em
 * andamento e marcação dos itens. Separada de `useTarefaStore` para não atrasar o detalhe.
 */
export const useAnaliseStore = defineStore('analise', () => {
  const identifier = ref<string | null>(null)
  const situacao = ref<SituacaoClaude | null>(null)
  const versoes = ref<Analise[]>([])
  const versaoExibida = ref<number | null>(null)
  const carregando = ref(false)
  const erroAoCarregar = ref<ErroDaApi | null>(null)
  const analisando = ref(false)
  const erroDaAnalise = ref<ErroDaApi | null>(null)
  const marcando = ref<ReadonlySet<string>>(new Set())

  /** Versão atual (a mais recente), ou `null` quando a tarefa nunca foi analisada. */
  const atual = computed(() => versoes.value[0] ?? null)

  /** Versão na tela: a escolhida pelo usuário ou, por padrão, a atual. */
  const exibida = computed(() => versoes.value.find((analise) => analise.versao === versaoExibida.value) ?? atual.value)

  /** Se a versão na tela é uma versão anterior (somente leitura). */
  const exibindoAnterior = computed(() => exibida.value !== null && exibida.value !== atual.value)

  /** Lê a situação da chave e as versões da tarefa. A troca de tarefa limpa o estado anterior. */
  async function carregar(novoIdentifier: string): Promise<void> {
    if (identifier.value !== novoIdentifier) {
      versoes.value = []
      versaoExibida.value = null
      erroDaAnalise.value = null
      marcando.value = new Set()
    }

    identifier.value = novoIdentifier
    carregando.value = true
    erroAoCarregar.value = null
    try {
      const [lida, analises] = await Promise.all([obterSituacaoClaude(), listarAnalises(novoIdentifier)])
      if (identifier.value !== novoIdentifier) {
        return
      }

      situacao.value = lida
      versoes.value = analises
    } catch (erro) {
      if (identifier.value === novoIdentifier) {
        erroAoCarregar.value = comoErroDaApi(erro)
      }
    } finally {
      if (identifier.value === novoIdentifier) {
        carregando.value = false
      }
    }
  }

  /**
   * Analisa a demanda (chamada paga) e exibe a nova versão. Em falha, guarda o erro em `erroDaAnalise` e mantém as
   * versões. Devolve se a análise foi concluída.
   */
  async function analisar(): Promise<boolean> {
    const tarefa = identifier.value
    if (tarefa === null || analisando.value) {
      return false
    }

    analisando.value = true
    erroDaAnalise.value = null
    try {
      const nova = await analisarTarefa(tarefa)
      if (identifier.value !== tarefa) {
        return false
      }

      versoes.value = [nova, ...versoes.value.map((analise) => ({ ...analise, atual: false }))]
      versaoExibida.value = null
      return true
    } catch (erro) {
      if (identifier.value === tarefa) {
        erroDaAnalise.value = comoErroDaApi(erro)
      }
      return false
    } finally {
      analisando.value = false
    }
  }

  /** Mostra uma versão; `null` volta para a atual. */
  function exibir(versao: number | null): void {
    versaoExibida.value = versao === atual.value?.versao ? null : versao
  }

  /** Descarta a mensagem de erro da última análise. */
  function dispensarErro(): void {
    erroDaAnalise.value = null
  }

  /**
   * Marca ou desmarca um item da versão atual. Em falha, o item fica como estava e o erro é lançado para a página
   * notificar.
   */
  async function marcar(item: ItemDaAnalise, concluido: boolean): Promise<void> {
    const tarefa = identifier.value
    const analise = atual.value
    if (tarefa === null || analise === null || exibindoAnterior.value || marcando.value.has(item.identifier)) {
      return
    }

    marcando.value = new Set([...marcando.value, item.identifier])
    try {
      const atualizado = await marcarItemDaAnalise(tarefa, item.identifier, concluido)
      if (identifier.value === tarefa) {
        versoes.value = versoes.value.map((versao) => (versao.identifier === analise.identifier ? comItemAtualizado(versao, atualizado) : versao))
      }
    } finally {
      const restantes = new Set(marcando.value)
      restantes.delete(item.identifier)
      marcando.value = restantes
    }
  }

  return {
    identifier,
    situacao,
    versoes,
    versaoExibida,
    carregando,
    erroAoCarregar,
    analisando,
    erroDaAnalise,
    marcando,
    atual,
    exibida,
    exibindoAnterior,
    carregar,
    analisar,
    exibir,
    dispensarErro,
    marcar,
  }
})
