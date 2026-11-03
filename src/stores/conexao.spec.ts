import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type AsanaConexao, obterConexaoAsana } from '@/api/asana'
import { ErroDaApi, MensagemApiIndisponivel } from '@/api/erros'

import { useConexaoStore } from './conexao'

vi.mock('@/api/asana', () => ({ obterConexaoAsana: vi.fn() }))

const obterConexao = vi.mocked(obterConexaoAsana)

function conexao(configurado: boolean, valido: boolean): AsanaConexao {
  return { configurado, valido, usuario: valido ? 'Ricardo' : null, workspaces: [] }
}

describe('useConexaoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    obterConexao.mockReset()
  })

  it('começa verificando', () => {
    expect(useConexaoStore().situacao).toBe('verificando')
  })

  it.each([
    [conexao(true, true), 'ok'],
    [conexao(false, false), 'nao_configurado'],
    [conexao(true, false), 'token_invalido'],
  ] as const)('converte a resposta da API na situação', async (resposta, situacao) => {
    obterConexao.mockResolvedValue(resposta)
    const store = useConexaoStore()

    await store.verificar()

    expect(store.situacao).toBe(situacao)
    expect(store.mensagemDeErro).toBeNull()
  })

  it('guarda o usuário quando a conexão é válida', async () => {
    obterConexao.mockResolvedValue(conexao(true, true))
    const store = useConexaoStore()

    await store.verificar()

    expect(store.usuario).toBe('Ricardo')
  })

  it('transforma a falha em situação de erro com a mensagem em pt-BR', async () => {
    obterConexao.mockRejectedValue(new ErroDaApi('rede', MensagemApiIndisponivel))
    const store = useConexaoStore()

    await store.verificar()

    expect(store.situacao).toBe('erro')
    expect(store.mensagemDeErro).toBe(MensagemApiIndisponivel)
  })

  it('usa a mensagem do Problem Details quando o Asana está fora do ar', async () => {
    obterConexao.mockRejectedValue(
      new ErroDaApi('problema', 'Não foi possível comunicar com o Asana. Tente novamente em instantes.', 502),
    )
    const store = useConexaoStore()

    await store.verificar()

    expect(store.mensagemDeErro).toBe('Não foi possível comunicar com o Asana. Tente novamente em instantes.')
  })
})
