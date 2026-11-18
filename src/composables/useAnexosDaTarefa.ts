import { type Ref, ref } from 'vue'

import { type Anexo, listarAnexos } from '@/api/anexos'
import { comoErroDaApi } from '@/api/erros'

/**
 * Anexos da tarefa lidos do Asana na hora, com os estados carregando e erro. Cada chamada tem o seu estado (o
 * cartão de anexos e o diálogo de fontes da análise leem por conta própria). Uma resposta antiga, de outra tarefa
 * ou de uma leitura anterior, nunca sobrescreve a mais recente.
 */
export function useAnexosDaTarefa(identifier: Ref<string>) {
  const anexos = ref<Anexo[]>([])
  const carregando = ref(false)
  const erro = ref<string | null>(null)

  /** Identificador da última leitura: uma resposta antiga não sobrescreve a da tarefa atual. */
  let leitura = 0

  /** Lê (ou relê) os anexos da tarefa atual. */
  async function carregar(): Promise<void> {
    const atual = ++leitura
    carregando.value = true
    erro.value = null
    try {
      const lidos = await listarAnexos(identifier.value)
      if (atual === leitura) {
        anexos.value = lidos
      }
    } catch (falha) {
      if (atual === leitura) {
        erro.value = comoErroDaApi(falha).message
      }
    } finally {
      if (atual === leitura) {
        carregando.value = false
      }
    }
  }

  /** Esquece os anexos lidos (ex.: ao trocar de tarefa). */
  function limpar(): void {
    anexos.value = []
  }

  return { anexos, carregando, erro, carregar, limpar }
}
