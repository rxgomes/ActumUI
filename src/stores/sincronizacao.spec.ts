import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErroDaApi } from '@/api/erros'
import { obterUltimaSincronizacao, type Sincronizacao, sincronizar } from '@/api/sincronizacoes'

import { useSincronizacaoStore } from './sincronizacao'

vi.mock('@/api/sincronizacoes', () => ({ sincronizar: vi.fn(), obterUltimaSincronizacao: vi.fn() }))

const sincronizarNaApi = vi.mocked(sincronizar)
const obterUltima = vi.mocked(obterUltimaSincronizacao)

const resumo: Sincronizacao = {
  identifier: 's1',
  iniciadaEm: '2026-11-03T14:30:15',
  finalizadaEm: '2026-11-03T14:30:20',
  sucesso: true,
  tarefasNovas: 3,
  tarefasAtualizadas: 1,
  tarefasArquivadas: 0,
  reaberturas: 1,
  erro: null,
}

describe('useSincronizacaoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sincronizarNaApi.mockReset()
    obterUltima.mockReset()
  })

  it('sincroniza, devolve o resumo e recarrega a última sincronização', async () => {
    sincronizarNaApi.mockResolvedValue(resumo)
    obterUltima.mockResolvedValue(resumo)
    const store = useSincronizacaoStore()

    const resultado = store.sincronizar()
    expect(store.emAndamento).toBe(true)

    expect(await resultado).toEqual(resumo)
    expect(store.emAndamento).toBe(false)
    expect(store.ultima).toEqual(resumo)
  })

  it('em falha, relança o erro e recarrega a última sincronização registrada com falha', async () => {
    const falha = new ErroDaApi('problema', 'Não foi possível comunicar com o Asana. Tente novamente em instantes.', 502)
    sincronizarNaApi.mockRejectedValue(falha)
    obterUltima.mockResolvedValue({ ...resumo, sucesso: false, erro: falha.message })
    const store = useSincronizacaoStore()

    await expect(store.sincronizar()).rejects.toBe(falha)

    expect(store.emAndamento).toBe(false)
    expect(store.ultima?.sucesso).toBe(false)
    expect(store.ultima?.erro).toBe(falha.message)
  })

  it('registra quando nunca houve sincronização', async () => {
    obterUltima.mockResolvedValue(null)
    const store = useSincronizacaoStore()

    await store.carregarUltima()

    expect(store.ultima).toBeNull()
    expect(store.ultimaCarregada).toBe(true)
  })

  it('não lança se a consulta da última sincronização falhar', async () => {
    obterUltima.mockRejectedValue(new ErroDaApi('rede', 'indisponível'))
    const store = useSincronizacaoStore()

    await store.carregarUltima()

    expect(store.ultimaCarregada).toBe(false)
    expect(store.carregandoUltima).toBe(false)
  })
})
