import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cliente } from './cliente'
import { alterarEmpresa } from './empresas'

vi.mock('./cliente', () => ({ cliente: { PATCH: vi.fn() } }))

const patch = vi.mocked(cliente.PATCH)

const empresa = { identifier: 'e1', nome: 'aremas.com.br', cor: '#1976D2', sincronizar: false, cargaInicialEm: null }

function resposta(status: number, corpo: { data?: unknown; error?: unknown }) {
  return { ...corpo, response: new Response(null, { status }) } as never
}

describe('alterarEmpresa', () => {
  beforeEach(() => {
    patch.mockReset()
  })

  it('envia só a sincronização, mantendo a cor', async () => {
    patch.mockResolvedValue(resposta(200, { data: empresa }))

    const alterada = await alterarEmpresa('e1', { sincronizar: false })

    expect(patch).toHaveBeenCalledWith('/empresas/{identifier}', {
      params: { path: { identifier: 'e1' } },
      body: { cor: null, sincronizar: false },
    })
    expect(alterada).toEqual(empresa)
  })

  it('envia só a cor, mantendo a sincronização', async () => {
    patch.mockResolvedValue(resposta(200, { data: { ...empresa, cor: '#7B1FA2' } }))

    await alterarEmpresa('e1', { cor: '#7b1fa2' })

    expect(patch).toHaveBeenCalledWith('/empresas/{identifier}', {
      params: { path: { identifier: 'e1' } },
      body: { cor: '#7b1fa2', sincronizar: null },
    })
  })

  it('devolve o erro de cor inválida no campo cor', async () => {
    patch.mockResolvedValue(resposta(400, {
      error: { title: 'Um ou mais campos são inválidos.', status: 400, errors: { Cor: ['A cor deve estar no formato #RRGGBB.'] } },
    }))

    await expect(alterarEmpresa('e1', { cor: 'azul' })).rejects.toMatchObject({
      status: 400,
      errosPorCampo: { cor: ['A cor deve estar no formato #RRGGBB.'] },
    })
  })
})
