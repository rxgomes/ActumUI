import { describe, expect, it } from 'vitest'

import { comoErroDaApi, ErroDaApi, executar, MensagemApiIndisponivel, MensagemErroInesperado } from './erros'

function resposta(status: number): Response {
  return new Response(null, { status })
}

async function erroDe(promessa: Promise<unknown>): Promise<ErroDaApi> {
  try {
    await promessa
  } catch (erro) {
    if (erro instanceof ErroDaApi) {
      return erro
    }

    throw erro
  }

  throw new Error('A chamada deveria ter falhado.')
}

describe('executar', () => {
  it('devolve o dado em caso de sucesso', async () => {
    const dado = await executar(async () => ({ data: { valido: true }, response: resposta(200) }))

    expect(dado).toEqual({ valido: true })
  })

  it('usa o detail do Problem Details como mensagem', async () => {
    const erro = await erroDe(executar(async () => ({
      error: { title: 'Requisição inválida.', status: 400, detail: 'A branch base e a branch de implementação devem ser diferentes.' },
      response: resposta(400),
    })))

    expect(erro.tipo).toBe('problema')
    expect(erro.status).toBe(400)
    expect(erro.message).toBe('A branch base e a branch de implementação devem ser diferentes.')
  })

  it('usa o title quando não há detail', async () => {
    const erro = await erroDe(executar(async () => ({
      error: { title: 'Recurso não encontrado.', status: 404 },
      response: resposta(404),
    })))

    expect(erro.message).toBe('Recurso não encontrado.')
  })

  it('converte as chaves de errors para camelCase', async () => {
    const erro = await erroDe(executar(async () => ({
      error: {
        title: 'Um ou mais campos são inválidos.',
        status: 400,
        errors: { PrazoInterno: ['O prazo interno é obrigatório.'], BranchBase: ['A branch base é obrigatória.'] },
      },
      response: resposta(400),
    })))

    expect(erro.errosPorCampo).toEqual({
      prazoInterno: ['O prazo interno é obrigatório.'],
      branchBase: ['A branch base é obrigatória.'],
    })
    expect(erro.message).toBe('Um ou mais campos são inválidos.')
  })

  it('trata falha de conexão como API indisponível', async () => {
    const erro = await erroDe(executar(async () => {
      throw new TypeError('Failed to fetch')
    }))

    expect(erro.tipo).toBe('rede')
    expect(erro.status).toBeUndefined()
    expect(erro.message).toBe(MensagemApiIndisponivel)
  })

  it('trata erro sem Problem Details como inesperado', async () => {
    const erro = await erroDe(executar(async () => ({ error: '', response: resposta(500) })))

    expect(erro.tipo).toBe('inesperado')
    expect(erro.status).toBe(500)
    expect(erro.message).toBe(MensagemErroInesperado)
  })
})

describe('comoErroDaApi', () => {
  it('mantém um ErroDaApi e converte outras exceções em erro inesperado', () => {
    const original = new ErroDaApi('rede', MensagemApiIndisponivel)

    expect(comoErroDaApi(original)).toBe(original)
    expect(comoErroDaApi(new Error('falha interna')).message).toBe(MensagemErroInesperado)
  })
})

describe('extensões do Problem Details', () => {
  it('guarda os campos extras com os nomes como vieram', async () => {
    const corpo = { title: 'Falha', status: 502, detail: 'O Asana não respondeu.', traceId: '00-abc', anexosEnviados: ['print.png'] }

    const erro = await erroDe(executar(async () => ({ error: corpo, response: resposta(502) })))

    expect(erro.message).toBe('O Asana não respondeu.')
    expect(erro.extensoes).toEqual({ anexosEnviados: ['print.png'] })
  })

  it('fica vazio sem campos extras', async () => {
    const erro = await erroDe(executar(async () => ({ error: { title: 'Recurso não encontrado.', detail: 'Tarefa não encontrada.' }, response: resposta(404) })))

    expect(erro.extensoes).toEqual({})
  })
})
