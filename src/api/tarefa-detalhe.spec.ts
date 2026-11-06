import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cliente } from './cliente'
import { ErroDaApi } from './erros'
import { adicionarBranch, alterarTarefa, concluirTarefa, iniciarTarefa, listarBasesRecentes, obterTarefa } from './tarefas'

vi.mock('./cliente', () => ({ cliente: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn(), DELETE: vi.fn() } }))

const get = vi.mocked(cliente.GET)
const post = vi.mocked(cliente.POST)
const patch = vi.mocked(cliente.PATCH)

function resposta(status: number, corpo: { data?: unknown; error?: unknown } = {}) {
  return { ...corpo, response: new Response(null, { status }) } as never
}

const detalheDaApi = {
  identifier: 't1',
  titulo: 'Devolução de IPI',
  descricao: 'linha 1\nlinha 2',
  descricaoHtml: '<body>linha 1</body>',
  projetos: 'ERP2',
  linkAsana: 'https://app.asana.com/0/0/1',
  empresa: { identifier: 'e1', nome: 'Aureum-ERP', cor: '#388E3C' },
  status: 'retrabalho',
  statusAnterior: null,
  prazoInterno: '2026-10-20',
  prazoInternoPendente: true,
  prazoAsana: '2026-10-20',
  prioridade: '2',
  concluidaEm: null,
  arquivadaEm: null,
  motivoArquivamento: null,
  sincronizadaEm: '2026-11-03T15:32:00',
  branches: [
    { identifier: 'b1', tipo: 'base', nome: 'main', enviada: true, enviadaAsanaEm: '2026-10-31T17:00:00', retrabalhoNumero: null, partes: [], tag: 'main' },
    {
      identifier: 'b2', tipo: 'implementacao', nome: 'fix/x', enviada: false, enviadaAsanaEm: null, retrabalhoNumero: '1',
      partes: ['front'], tag: '(Front) => fix/x',
    },
  ],
  retrabalhos: [
    {
      identifier: 'r1', numero: '1', reabertaEm: '2026-11-01T10:00:00', reabertaPor: 'Maria',
      prazoInternoAnterior: '2026-10-20', prazoInternoNovo: null, resolvidoEm: null, comentarios: [],
    },
  ],
  comentarios: [],
}

describe('detalhe e ações da tarefa', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
  })

  it('converte o detalhe com os inteiros como number', async () => {
    get.mockResolvedValue(resposta(200, { data: detalheDaApi }))

    const detalhe = await obterTarefa('t1')

    expect(get).toHaveBeenCalledWith('/tarefas/{identifier}', { params: { path: { identifier: 't1' } } })
    expect(detalhe?.prioridade).toBe(2)
    expect(detalhe?.branches.map((branch) => branch.retrabalhoNumero)).toEqual([null, 1])
    expect(detalhe?.retrabalhos[0].numero).toBe(1)
    expect(detalhe?.branches.map((branch) => [branch.partes, branch.tag])).toEqual([[[], 'main'], [['front'], '(Front) => fix/x']])
  })

  it('devolve null quando a tarefa não existe (404)', async () => {
    get.mockResolvedValue(resposta(404, { error: { title: 'Recurso não encontrado.', status: 404, detail: 'Tarefa não encontrada.' } }))

    expect(await obterTarefa('inexistente')).toBeNull()
  })

  it('inicia enviando as branches, as partes e o prazo no formato da API', async () => {
    post.mockResolvedValue(resposta(200, { data: {} }))

    await iniciarTarefa('t1', {
      branchBase: 'main',
      branchImplementacao: '261105-consumidor-final-nf',
      prazoInterno: '2026-11-10',
      partes: ['front', 'back'],
    })

    expect(post).toHaveBeenCalledWith('/tarefas/{identifier}/iniciar', {
      params: { path: { identifier: 't1' } },
      body: { branchBase: 'main', branchImplementacao: '261105-consumidor-final-nf', prazoInterno: '2026-11-10', partes: ['front', 'back'] },
    })
  })

  it('lista as bases recentes da empresa da tarefa', async () => {
    get.mockResolvedValue(resposta(200, { data: ['hotfix', 'develop', 'main'] }))

    const bases = await listarBasesRecentes('t1')

    expect(get).toHaveBeenCalledWith('/tarefas/{identifier}/branches-base-recentes', { params: { path: { identifier: 't1' } } })
    expect(bases).toEqual(['hotfix', 'develop', 'main'])
  })

  it('registra a branch com as partes', async () => {
    post.mockResolvedValue(resposta(201, { data: {} }))

    await adicionarBranch('t1', 'implementacao', 'fix/ipi-devolvido-pagamento', ['front'])

    expect(post).toHaveBeenCalledWith('/tarefas/{identifier}/branches', {
      params: { path: { identifier: 't1' } },
      body: { tipo: 'implementacao', nome: 'fix/ipi-devolvido-pagamento', partes: ['front'] },
    })
  })

  it('altera só a prioridade, enviando null para manter o prazo', async () => {
    patch.mockResolvedValue(resposta(200, { data: {} }))

    await alterarTarefa('t1', { prioridade: 1 })

    expect(patch).toHaveBeenCalledWith('/tarefas/{identifier}', {
      params: { path: { identifier: 't1' } },
      body: { prazoInterno: null, prioridade: 1 },
    })
  })

  it('lança 409 quando a branch já existe na tarefa', async () => {
    post.mockResolvedValue(resposta(409, { error: { title: 'Conflito.', status: 409, detail: 'A tarefa já tem uma branch com esse nome.' } }))

    const erro = await adicionarBranch('t1', 'implementacao', 'fix/x', ['back']).catch((falha: unknown) => falha)

    expect(erro).toBeInstanceOf(ErroDaApi)
    expect(erro).toMatchObject({ status: 409, message: 'A tarefa já tem uma branch com esse nome.' })
  })

  it('lança a mensagem da API quando o Asana falha na conclusão (502)', async () => {
    post.mockResolvedValue(resposta(502, {
      error: { title: 'Falha na comunicação com um serviço externo.', status: 502, detail: 'Não foi possível comunicar com o Asana. Tente novamente em instantes.' },
    }))

    await expect(concluirTarefa('t1')).rejects.toMatchObject({
      status: 502,
      message: 'Não foi possível comunicar com o Asana. Tente novamente em instantes.',
    })
  })
})
