import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErroDaApi, MensagemApiIndisponivel } from '@/api/erros'
import { type Comentario, marcarComentariosLidos, obterTarefa, type TarefaDetalhe } from '@/api/tarefas'

import { useTarefaStore } from './tarefa'

vi.mock('@/api/tarefas', () => ({ obterTarefa: vi.fn(), marcarComentariosLidos: vi.fn() }))

const obter = vi.mocked(obterTarefa)
const marcar = vi.mocked(marcarComentariosLidos)

function comentario(identifier: string, lido: boolean): Comentario {
  return { identifier, autor: 'Maria', texto: identifier, criadoEm: '2026-11-01T10:00:00', lido }
}

function detalhe(comentarios: Comentario[]): TarefaDetalhe {
  return {
    identifier: 't1', titulo: 'Tarefa', descricao: '', descricaoHtml: '', projetos: '', linkAsana: '',
    empresa: { identifier: 'e1', nome: 'Aureum-ERP', cor: '#388E3C' },
    status: 'retrabalho', statusAnterior: null, prazoInterno: null, prazoInternoPendente: false, prazoAsana: null,
    prioridade: null, concluidaEm: null, arquivadaEm: null, motivoArquivamento: null, sincronizadaEm: '2026-11-03T15:32:00',
    branches: [], retrabalhos: [], comentarios,
  }
}

describe('useTarefaStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    obter.mockReset()
    marcar.mockReset()
    marcar.mockResolvedValue()
  })

  it('guarda os comentários não lidos e os marca como lidos uma vez', async () => {
    obter.mockResolvedValue(detalhe([comentario('c1', true), comentario('c2', false), comentario('c3', false)]))
    const store = useTarefaStore()

    await store.carregar('t1')

    expect([...store.comentariosNovos]).toEqual(['c2', 'c3'])
    expect(marcar).toHaveBeenCalledTimes(1)
    expect(marcar).toHaveBeenCalledWith('t1')
    expect(store.detalhe?.identifier).toBe('t1')
  })

  it('não chama a marcação quando não há comentários não lidos', async () => {
    obter.mockResolvedValue(detalhe([comentario('c1', true)]))
    const store = useTarefaStore()

    await store.carregar('t1')

    expect(marcar).not.toHaveBeenCalled()
    expect(store.comentariosNovos.size).toBe(0)
  })

  it('mantém o detalhe quando a marcação de lidos falha', async () => {
    obter.mockResolvedValue(detalhe([comentario('c1', false)]))
    marcar.mockRejectedValue(new ErroDaApi('rede', MensagemApiIndisponivel))
    const store = useTarefaStore()

    await store.carregar('t1')

    expect(store.detalhe).not.toBeNull()
    expect(store.erro).toBeNull()
    expect([...store.comentariosNovos]).toEqual(['c1'])
  })

  it('indica tarefa não encontrada (404)', async () => {
    obter.mockResolvedValue(null)
    const store = useTarefaStore()

    await store.carregar('inexistente')

    expect(store.naoEncontrada).toBe(true)
    expect(store.detalhe).toBeNull()
  })

  it('guarda o erro quando a API não responde', async () => {
    obter.mockRejectedValue(new ErroDaApi('rede', MensagemApiIndisponivel))
    const store = useTarefaStore()

    await store.carregar('t1')

    expect(store.erro?.message).toBe(MensagemApiIndisponivel)
    expect(store.carregando).toBe(false)
  })

  it('recarrega mantendo o destaque dos comentários novos', async () => {
    obter.mockResolvedValueOnce(detalhe([comentario('c1', false)])).mockResolvedValueOnce(detalhe([comentario('c1', true)]))
    const store = useTarefaStore()
    await store.carregar('t1')

    await store.recarregar()

    expect(obter).toHaveBeenCalledTimes(2)
    expect([...store.comentariosNovos]).toEqual(['c1'])
    expect(store.detalhe?.comentarios[0].lido).toBe(true)
    expect(marcar).toHaveBeenCalledTimes(1)
  })
})
