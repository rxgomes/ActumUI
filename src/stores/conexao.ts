import { defineStore } from 'pinia'
import { ref } from 'vue'

import { type AsanaConexao, obterConexaoAsana } from '@/api/asana'
import { comoErroDaApi } from '@/api/erros'

/**
 * Situação da conexão com o Asana: `verificando`, `ok`, `nao_configurado` (sem token), `token_invalido`
 * (o Asana recusou o token) ou `erro` (Asana fora do ar ou API não alcançada).
 */
export type SituacaoDaConexao = 'verificando' | 'ok' | 'nao_configurado' | 'token_invalido' | 'erro'

/** Converte a resposta de `GET /asana/conexao` na situação da conexão. */
export function situacaoDa(conexao: AsanaConexao): SituacaoDaConexao {
  if (!conexao.configurado) {
    return 'nao_configurado'
  }

  return conexao.valido ? 'ok' : 'token_invalido'
}

/** Estado da conexão com o Asana, verificado ao abrir o front e usado pelo aviso do layout. */
export const useConexaoStore = defineStore('conexao', () => {
  const situacao = ref<SituacaoDaConexao>('verificando')
  const usuario = ref<string | null>(null)
  const mensagemDeErro = ref<string | null>(null)

  /** Consulta a conexão com o Asana e atualiza a situação. Não lança: falhas viram situação `erro`. */
  async function verificar(): Promise<void> {
    situacao.value = 'verificando'
    mensagemDeErro.value = null

    try {
      const conexao = await obterConexaoAsana()
      situacao.value = situacaoDa(conexao)
      usuario.value = conexao.usuario
    } catch (erro) {
      situacao.value = 'erro'
      usuario.value = null
      mensagemDeErro.value = comoErroDaApi(erro).message
    }
  }

  return { situacao, usuario, mensagemDeErro, verificar }
})
