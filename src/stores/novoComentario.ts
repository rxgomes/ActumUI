import { defineStore } from 'pinia'
import { ref } from 'vue'

import { anexosEnviados, enviarComentario, listarParticipantes, type Participante, validarArquivos } from '@/api/comentarios'
import { comoErroDaApi, ErroDaApi } from '@/api/erros'

/**
 * Rascunho do comentário da tarefa aberta, compartilhado entre a caixa de comentário (que edita e envia) e a
 * análise com IA (que acrescenta as dúvidas). A troca de tarefa descarta o rascunho.
 */
export const useNovoComentarioStore = defineStore('novoComentario', () => {
  const identifier = ref<string | null>(null)
  const texto = ref('')
  const arquivos = ref<File[]>([])
  const mencoes = ref<string[]>([])
  const participantes = ref<Participante[]>([])
  const carregandoParticipantes = ref(false)
  const erroDosParticipantes = ref<ErroDaApi | null>(null)
  const enviando = ref(false)
  const erroDoEnvio = ref<string | null>(null)

  /** Incrementado quando outra parte da tela pede para a caixa rolar até a vista e receber o foco. */
  const pedidoDeFoco = ref(0)

  function sugeridos(): string[] {
    return participantes.value.filter((participante) => participante.sugerido).map((participante) => participante.gid)
  }

  /** Prepara a caixa para a tarefa: troca de tarefa limpa o rascunho; os participantes são relidos do Asana. */
  async function abrir(novoIdentifier: string): Promise<void> {
    if (identifier.value !== novoIdentifier) {
      identifier.value = novoIdentifier
      texto.value = ''
      arquivos.value = []
      mencoes.value = []
      participantes.value = []
      erroDoEnvio.value = null
    }

    await carregarParticipantes()
  }

  /** Lê os participantes; as menções começam com os sugeridos quando ainda não há escolha. */
  async function carregarParticipantes(): Promise<void> {
    const tarefa = identifier.value
    if (tarefa === null) {
      return
    }

    carregandoParticipantes.value = true
    erroDosParticipantes.value = null
    try {
      const lidos = await listarParticipantes(tarefa)
      if (identifier.value !== tarefa) {
        return
      }

      participantes.value = lidos
      if (mencoes.value.length === 0) {
        mencoes.value = sugeridos()
      }
    } catch (erro) {
      if (identifier.value === tarefa) {
        erroDosParticipantes.value = comoErroDaApi(erro)
      }
    } finally {
      if (identifier.value === tarefa) {
        carregandoParticipantes.value = false
      }
    }
  }

  /** Adiciona arquivos dentro dos limites da API; o primeiro recusado vira a mensagem de erro da caixa. */
  function adicionarArquivos(novos: readonly File[]): void {
    const { aceitos, erro } = validarArquivos(arquivos.value, novos)
    arquivos.value = [...arquivos.value, ...aceitos]
    erroDoEnvio.value = erro
  }

  function removerArquivo(indice: number): void {
    arquivos.value = arquivos.value.filter((_, posicao) => posicao !== indice)
  }

  /** Acrescenta um texto ao rascunho (depois de uma linha em branco, se já houver texto) e pede o foco da caixa. */
  function acrescentarTexto(novo: string): void {
    if (novo.trim().length === 0) {
      return
    }

    texto.value = texto.value.trim().length === 0 ? novo : `${texto.value.trimEnd()}\n\n${novo}`
    pedidoDeFoco.value++
  }

  /**
   * Envia o rascunho ao Asana. Em sucesso, limpa a caixa e volta as menções aos sugeridos. Em erro, guarda a
   * mensagem e mantém o rascunho, tirando dele os anexos que já foram enviados. Devolve se enviou.
   */
  async function enviar(): Promise<boolean> {
    const tarefa = identifier.value
    if (tarefa === null || enviando.value || (texto.value.trim().length === 0 && arquivos.value.length === 0)) {
      return false
    }

    enviando.value = true
    erroDoEnvio.value = null
    try {
      await enviarComentario(tarefa, { texto: texto.value, mencoes: mencoes.value, arquivos: arquivos.value })
      if (identifier.value === tarefa) {
        texto.value = ''
        arquivos.value = []
        mencoes.value = sugeridos()
      }
      return true
    } catch (erro) {
      if (identifier.value === tarefa) {
        erroDoEnvio.value = comoErroDaApi(erro).message
        const enviados = new Set(anexosEnviados(erro))
        arquivos.value = arquivos.value.filter((arquivo) => !enviados.has(arquivo.name))
      }
      return false
    } finally {
      enviando.value = false
    }
  }

  return {
    identifier,
    texto,
    arquivos,
    mencoes,
    participantes,
    carregandoParticipantes,
    erroDosParticipantes,
    enviando,
    erroDoEnvio,
    pedidoDeFoco,
    abrir,
    carregarParticipantes,
    adicionarArquivos,
    removerArquivo,
    acrescentarTexto,
    enviar,
  }
})
