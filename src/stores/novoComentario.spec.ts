import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { enviarComentario, listarParticipantes } from '@/api/comentarios'
import { ErroDaApi } from '@/api/erros'

import { useNovoComentarioStore } from './novoComentario'

vi.mock('@/api/comentarios', async (original) => ({
  ...(await original<typeof import('@/api/comentarios')>()),
  listarParticipantes: vi.fn(),
  enviarComentario: vi.fn(),
}))

const listar = vi.mocked(listarParticipantes)
const enviar = vi.mocked(enviarComentario)

const maria = { gid: '9', nome: 'Maria Angelica', sugerido: true }
const joao = { gid: '12', nome: 'João', sugerido: false }

function arquivo(nome: string, tamanho = 10): File {
  const file = new File(['x'], nome)
  Object.defineProperty(file, 'size', { value: tamanho })
  return file
}

describe('useNovoComentarioStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    listar.mockReset()
    enviar.mockReset()
    listar.mockResolvedValue([joao, maria])
  })

  it('carrega os participantes com a pessoa sugerida já mencionada', async () => {
    const store = useNovoComentarioStore()

    await store.abrir('t1')

    expect(store.participantes).toHaveLength(2)
    expect(store.mencoes).toEqual(['9'])
  })

  it('mantém o envio possível quando os participantes falham', async () => {
    listar.mockRejectedValue(new ErroDaApi('problema', 'Não foi possível comunicar com o Asana.', 502))
    const store = useNovoComentarioStore()

    await store.abrir('t1')

    expect(store.erroDosParticipantes?.message).toBe('Não foi possível comunicar com o Asana.')
    expect(store.mencoes).toEqual([])
  })

  it('recusa arquivo fora do limite com a mensagem da API', async () => {
    const store = useNovoComentarioStore()
    await store.abrir('t1')

    store.adicionarArquivos([arquivo('a.png'), arquivo('vazio.txt', 0)])

    expect(store.arquivos.map((file) => file.name)).toEqual(['a.png'])
    expect(store.erroDoEnvio).toBe('O arquivo vazio.txt está vazio.')
  })

  it('acrescenta texto depois de uma linha em branco e pede o foco', async () => {
    const store = useNovoComentarioStore()
    await store.abrir('t1')

    store.acrescentarTexto('Dúvidas sobre a tarefa:\n1. Parcelas?')
    expect(store.texto).toBe('Dúvidas sobre a tarefa:\n1. Parcelas?')

    store.texto = 'Meu texto  '
    store.acrescentarTexto('Dúvidas')
    expect(store.texto).toBe('Meu texto\n\nDúvidas')
    expect(store.pedidoDeFoco).toBe(2)
  })

  it('envia, limpa a caixa e volta a menção à sugerida', async () => {
    enviar.mockResolvedValue({ comentario: {} as never, anexos: ['a.png'] })
    const store = useNovoComentarioStore()
    await store.abrir('t1')
    store.texto = 'Segue o erro'
    store.mencoes = ['9', '12']
    store.adicionarArquivos([arquivo('a.png')])

    const enviado = await store.enviar()

    expect(enviado).toBe(true)
    expect(enviar).toHaveBeenCalledWith('t1', { texto: 'Segue o erro', mencoes: ['9', '12'], arquivos: [expect.any(File)] })
    expect([store.texto, store.arquivos.length, store.mencoes]).toEqual(['', 0, ['9']])
  })

  it('não envia sem texto nem arquivo', async () => {
    const store = useNovoComentarioStore()
    await store.abrir('t1')
    store.texto = '   '

    expect(await store.enviar()).toBe(false)
    expect(enviar).not.toHaveBeenCalled()
  })

  it('mantém o rascunho quando o envio falha', async () => {
    enviar.mockRejectedValue(new ErroDaApi('problema', 'A tarefa não existe mais no Asana.', 400))
    const store = useNovoComentarioStore()
    await store.abrir('t1')
    store.texto = 'Segue'
    store.adicionarArquivos([arquivo('a.png')])

    expect(await store.enviar()).toBe(false)

    expect(store.erroDoEnvio).toBe('A tarefa não existe mais no Asana.')
    expect([store.texto, store.arquivos.length]).toEqual(['Segue', 1])
    expect(store.enviando).toBe(false)
  })

  it('tira da caixa os anexos que já foram enviados', async () => {
    enviar.mockRejectedValue(new ErroDaApi('problema', 'Os anexos a.png já foram enviados ao Asana.', 502, {}, { anexosEnviados: ['a.png'] }))
    const store = useNovoComentarioStore()
    await store.abrir('t1')
    store.texto = 'Segue'
    store.adicionarArquivos([arquivo('a.png'), arquivo('b.pdf')])

    await store.enviar()

    expect(store.arquivos.map((file) => file.name)).toEqual(['b.pdf'])
    expect(store.texto).toBe('Segue')
  })

  it('descarta o rascunho ao trocar de tarefa', async () => {
    const store = useNovoComentarioStore()
    await store.abrir('t1')
    store.texto = 'rascunho'
    store.adicionarArquivos([arquivo('a.png')])

    await store.abrir('t2')

    expect([store.texto, store.arquivos.length]).toEqual(['', 0])
  })
})
