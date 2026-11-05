import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Analise, ItemDaAnalise } from './analises'
import { cliente } from './cliente'
import {
  anexosEnviados,
  enviarComentario,
  nomeDoPrint,
  tamanhoLegivel,
  TamanhoMaximoDoArquivo,
  textoDasDuvidasParaEnviar,
  validarArquivos,
} from './comentarios'
import { ErroDaApi } from './erros'

vi.mock('./cliente', () => ({ cliente: { GET: vi.fn(), POST: vi.fn() } }))

const post = vi.mocked(cliente.POST)

function resposta(status: number, corpo: { data?: unknown; error?: unknown }) {
  return { ...corpo, response: new Response(null, { status }) } as never
}

/** Arquivo com o tamanho informado, sem alocar o conteúdo. */
function arquivo(nome: string, tamanho: number): File {
  const file = new File(['x'], nome, { type: 'text/plain' })
  Object.defineProperty(file, 'size', { value: tamanho })
  return file
}

describe('enviarComentario', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('envia texto, menções e arquivos como FormData', async () => {
    post.mockResolvedValue(resposta(201, { data: { comentario: {}, anexos: ['print.png'] } }))
    const print = new File(['png'], 'print.png', { type: 'image/png' })

    await enviarComentario('t1', { texto: 'Segue o erro', mencoes: ['9', '12'], arquivos: [print] })

    const [caminho, opcoes] = post.mock.calls[0]! as unknown as [string, { params: unknown; body: FormData; bodySerializer: (corpo: unknown) => unknown }]
    expect(caminho).toBe('/tarefas/{identifier}/comentarios')
    expect(opcoes.params).toEqual({ path: { identifier: 't1' } })
    expect(opcoes.body.get('texto')).toBe('Segue o erro')
    expect(opcoes.body.getAll('mencoes')).toEqual(['9', '12'])
    expect((opcoes.body.get('arquivos') as File).name).toBe('print.png')
    expect(opcoes.bodySerializer(opcoes.body)).toBe(opcoes.body)
  })

  it('não envia texto em branco', async () => {
    post.mockResolvedValue(resposta(201, { data: { comentario: {}, anexos: [] } }))

    await enviarComentario('t1', { texto: '   ', mencoes: [], arquivos: [new File(['a'], 'a.txt')] })

    const opcoes = post.mock.calls[0]![1] as unknown as { body: FormData }
    expect(opcoes.body.has('texto')).toBe(false)
  })
})

describe('anexosEnviados', () => {
  it('lê os nomes das extensões do erro', () => {
    const erro = new ErroDaApi('problema', 'falhou', 502, {}, { anexosEnviados: ['print.png', 3] })

    expect(anexosEnviados(erro)).toEqual(['print.png'])
    expect(anexosEnviados(new ErroDaApi('rede', 'sem rede'))).toEqual([])
    expect(anexosEnviados(new Error('outro'))).toEqual([])
  })
})

describe('nomeDoPrint', () => {
  it('usa a data e a hora locais', () => {
    expect(nomeDoPrint(new Date(2026, 10, 3, 18, 15, 0))).toBe('print-20261103-181500.png')
    expect(nomeDoPrint(new Date(2026, 0, 5, 7, 4, 9))).toBe('print-20260105-070409.png')
  })
})

describe('validarArquivos', () => {
  it('aceita arquivos dentro dos limites', () => {
    const { aceitos, erro } = validarArquivos([], [arquivo('a.txt', 10), arquivo('b.txt', 20)])

    expect(aceitos.map((file) => file.name)).toEqual(['a.txt', 'b.txt'])
    expect(erro).toBeNull()
  })

  it('recusa com as mensagens da API', () => {
    expect(validarArquivos([], [arquivo('video.mp4', TamanhoMaximoDoArquivo + 1)]).erro).toBe('O arquivo video.mp4 tem mais de 25 MB, o limite por arquivo.')
    expect(validarArquivos([], [arquivo('vazio.txt', 0)]).erro).toBe('O arquivo vazio.txt está vazio.')
    expect(validarArquivos([arquivo('a.zip', 20 * 1024 * 1024), arquivo('b.zip', 20 * 1024 * 1024)], [arquivo('c.zip', 20 * 1024 * 1024)]).erro)
      .toBe('Os arquivos somam mais de 50 MB, o limite por envio.')
  })

  it('aceita até o limite de quantidade', () => {
    const atuais = Array.from({ length: 9 }, (_, indice) => arquivo(`f${indice}.txt`, 1))

    const { aceitos, erro } = validarArquivos(atuais, [arquivo('ultimo.txt', 1), arquivo('demais.txt', 1)])

    expect(aceitos.map((file) => file.name)).toEqual(['ultimo.txt'])
    expect(erro).toBe('Envie no máximo 10 arquivos por vez.')
  })
})

describe('textoDasDuvidasParaEnviar', () => {
  function duvida(texto: string, concluido: boolean): ItemDaAnalise {
    return { identifier: texto, tipo: 'duvida', ordem: 1, texto, grupo: null, vago: null, concluido, concluidoEm: null, origem: null }
  }

  function analise(duvidas: ItemDaAnalise[]): Analise {
    return {
      identifier: 'a1', versao: 1, atual: true, objetivo: 'o', checklist: [], testes: [], duvidas, regras: [],
      modelo: 'claude-opus-5-5', tokensEntrada: 1, tokensSaida: 1, analisadaEm: '2026-11-03T17:44:00',
    }
  }

  it('numera só as dúvidas não resolvidas', () => {
    const texto = textoDasDuvidasParaEnviar(analise([duvida('Parcelas?', false), duvida('Resolvida', true), duvida('Financeiro?', false)]))

    expect(texto).toBe('Dúvidas sobre a tarefa:\n1. Parcelas?\n2. Financeiro?')
  })

  it('fica vazio quando todas estão resolvidas', () => {
    expect(textoDasDuvidasParaEnviar(analise([duvida('Resolvida', true)]))).toBe('')
  })
})

describe('tamanhoLegivel', () => {
  it('formata em B, KB e MB', () => {
    expect(tamanhoLegivel(850)).toBe('850 B')
    expect(tamanhoLegivel(12_595)).toBe('12,3 KB')
    expect(tamanhoLegivel(1_258_291)).toBe('1,2 MB')
  })
})
