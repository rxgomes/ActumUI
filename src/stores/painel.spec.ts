import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErroDaApi, MensagemApiIndisponivel } from '@/api/erros'
import { obterPainel, type Painel } from '@/api/tarefas'

import { usePainelStore } from './painel'

vi.mock('@/api/tarefas', () => ({ obterPainel: vi.fn() }))
vi.mock('@/api/empresas', () => ({ listarEmpresas: vi.fn() }))

const obter = vi.mocked(obterPainel)

const cartao = {
  identifier: 't1',
  titulo: 'Tarefa',
  empresa: { identifier: 'e1', nome: 'Aureum-ERP', cor: '#388E3C' },
  projetos: '',
  status: 'em_andamento' as const,
  prazoInterno: '2026-11-03',
  prazoAsana: null,
  prazoInternoPendente: false,
  prioridade: null,
  quantidadeRetrabalhos: 0,
  comentariosNaoLidos: 0,
  bloqueada: false,
  emAndamento: false,
}

const painel: Painel = {
  hoje: '2026-11-04',
  grupos: [
    { grupo: 'retrabalho', tarefas: [cartao, { ...cartao, identifier: 't2' }] },
    { grupo: 'atrasadas', tarefas: [{ ...cartao, identifier: 't3' }] },
    { grupo: 'hoje', tarefas: [] },
  ],
}

describe('usePainelStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    obter.mockReset()
  })

  it('carrega o painel com os filtros e conta as tarefas por grupo', async () => {
    obter.mockResolvedValue(painel)
    const store = usePainelStore()

    await store.carregar({ empresa: 'e1', busca: 'ipi' })

    expect(obter).toHaveBeenCalledWith({ empresa: 'e1', busca: 'ipi' })
    expect(store.painel).toEqual(painel)
    expect(store.contagemPorGrupo).toEqual({ retrabalho: 2, atrasadas: 1, hoje: 0 })
    expect(store.total).toBe(3)
    expect(store.carregando).toBe(false)
    expect(store.erro).toBeNull()
  })

  it('em falha, guarda o erro e mantém os dados anteriores', async () => {
    obter.mockResolvedValueOnce(painel).mockRejectedValueOnce(new ErroDaApi('rede', MensagemApiIndisponivel))
    const store = usePainelStore()
    await store.carregar()

    await store.carregar({ busca: 'x' })

    expect(store.erro?.message).toBe(MensagemApiIndisponivel)
    expect(store.painel).toEqual(painel)
    expect(store.carregando).toBe(false)
  })

  it('recarrega com os últimos filtros usados', async () => {
    obter.mockResolvedValue(painel)
    const store = usePainelStore()
    await store.carregar({ empresa: 'e1' })

    await store.recarregar()

    expect(obter).toHaveBeenLastCalledWith({ empresa: 'e1' })
  })
})
