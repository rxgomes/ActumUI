import { defineStore } from 'pinia'
import { ref } from 'vue'

import { alterarAnotacao, type Anotacao, criarAnotacao, excluirAnotacao, listarAnotacoes } from '@/api/anotacoes'
import { comoErroDaApi, type ErroDaApi } from '@/api/erros'

/**
 * Anotações privadas da tarefa aberta no detalhe. As ações lançam o `ErroDaApi` em falha para o card mostrar no campo
 * (validação) ou notificar; a lista só muda com a resposta da API.
 */
export const useAnotacoesStore = defineStore('anotacoes', () => {
  const identifier = ref<string | null>(null)
  const anotacoes = ref<Anotacao[]>([])
  const carregando = ref(false)
  const erro = ref<ErroDaApi | null>(null)

  /** Anotação em gravação: `identifier` da anotação, ou `'nova'` ao criar. */
  const salvando = ref<string | null>(null)

  async function carregar(novoIdentifier: string): Promise<void> {
    if (identifier.value !== novoIdentifier) {
      anotacoes.value = []
    }

    identifier.value = novoIdentifier
    carregando.value = true
    erro.value = null
    try {
      const lidas = await listarAnotacoes(novoIdentifier)
      if (identifier.value === novoIdentifier) {
        anotacoes.value = lidas
      }
    } catch (falha) {
      if (identifier.value === novoIdentifier) {
        erro.value = comoErroDaApi(falha)
      }
    } finally {
      if (identifier.value === novoIdentifier) {
        carregando.value = false
      }
    }
  }

  async function criar(texto: string): Promise<void> {
    await executarNaTarefa('nova', async (tarefa) => {
      const criada = await criarAnotacao(tarefa, texto)
      anotacoes.value = [...anotacoes.value, criada]
    })
  }

  async function alterar(anotacao: string, texto: string): Promise<void> {
    await executarNaTarefa(anotacao, async (tarefa) => {
      const alterada = await alterarAnotacao(tarefa, anotacao, texto)
      anotacoes.value = anotacoes.value.map((item) => (item.identifier === anotacao ? alterada : item))
    })
  }

  async function excluir(anotacao: string): Promise<void> {
    await executarNaTarefa(anotacao, async (tarefa) => {
      await excluirAnotacao(tarefa, anotacao)
      anotacoes.value = anotacoes.value.filter((item) => item.identifier !== anotacao)
    })
  }

  async function executarNaTarefa(chave: string, acao: (tarefa: string) => Promise<void>): Promise<void> {
    const tarefa = identifier.value
    if (tarefa === null) {
      return
    }

    salvando.value = chave
    try {
      await acao(tarefa)
    } finally {
      salvando.value = null
    }
  }

  return { identifier, anotacoes, carregando, erro, salvando, carregar, criar, alterar, excluir }
})
