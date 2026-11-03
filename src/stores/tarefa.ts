import { defineStore } from 'pinia'
import { ref } from 'vue'

import { comoErroDaApi, type ErroDaApi } from '@/api/erros'
import { marcarComentariosLidos, obterTarefa, type TarefaDetalhe } from '@/api/tarefas'

/** Detalhe da tarefa aberta, lido sempre da API (inclusive depois de cada ação). */
export const useTarefaStore = defineStore('tarefa', () => {
  const identifier = ref<string | null>(null)
  const detalhe = ref<TarefaDetalhe | null>(null)
  const carregando = ref(false)
  const naoEncontrada = ref(false)
  const erro = ref<ErroDaApi | null>(null)

  /** Comentários que estavam não lidos quando a tarefa foi aberta; destacados até sair da página. */
  const comentariosNovos = ref<ReadonlySet<string>>(new Set())

  /**
   * Abre uma tarefa: lê o detalhe, guarda os comentários não lidos e os marca como lidos na API. Uma falha ao marcar
   * não impede a exibição (serão marcados na próxima abertura).
   */
  async function carregar(novoIdentifier: string): Promise<void> {
    if (identifier.value !== novoIdentifier) {
      detalhe.value = null
    }

    identifier.value = novoIdentifier
    comentariosNovos.value = new Set()

    const lido = await ler()
    if (!lido) {
      return
    }

    const naoLidos = lido.comentarios.filter((comentario) => !comentario.lido).map((comentario) => comentario.identifier)
    comentariosNovos.value = new Set(naoLidos)

    if (naoLidos.length > 0) {
      try {
        await marcarComentariosLidos(novoIdentifier)
      } catch {
        // Não bloqueia o detalhe: os comentários continuam destacados e serão marcados numa próxima abertura.
      }
    }
  }

  /** Lê de novo a tarefa aberta (depois de uma ação), mantendo o destaque dos comentários novos. */
  async function recarregar(): Promise<void> {
    await ler()
  }

  async function ler(): Promise<TarefaDetalhe | null> {
    if (!identifier.value) {
      return null
    }

    carregando.value = true
    erro.value = null
    naoEncontrada.value = false

    try {
      const lido = await obterTarefa(identifier.value)
      if (lido === null) {
        naoEncontrada.value = true
        detalhe.value = null
      } else {
        detalhe.value = lido
      }

      return lido
    } catch (falha) {
      erro.value = comoErroDaApi(falha)
      return null
    } finally {
      carregando.value = false
    }
  }

  return { identifier, detalhe, carregando, naoEncontrada, erro, comentariosNovos, carregar, recarregar }
})
