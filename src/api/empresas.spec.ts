import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cliente } from './cliente'
import { alterarEmpresa } from './empresas'

vi.mock('./cliente', () => ({ cliente: { PATCH: vi.fn() } }))

const patch = vi.mocked(cliente.PATCH)

const SemPastasLocais = { cloneFront: null, cloneBack: null, pastaWorktrees: null, arquivosFront: null, arquivosBack: null }

const empresa = {
  identifier: 'e1',
  nome: 'aremas.com.br',
  cor: '#1976D2',
  sincronizar: false,
  cargaInicialEm: null,
  repositorioFront: null,
  repositorioBack: null,
  cloneFront: null,
  cloneBack: null,
  pastaWorktrees: null,
  arquivosFront: [],
  arquivosBack: [],
}

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
      body: { cor: null, sincronizar: false, repositorioFront: null, repositorioBack: null, ...SemPastasLocais },
    })
    expect(alterada).toEqual(empresa)
  })

  it('envia os repositórios, com texto vazio para remover', async () => {
    patch.mockResolvedValue(resposta(200, { data: { ...empresa, repositorioFront: 'ixact/erp-web' } }))

    const alterada = await alterarEmpresa('e1', { repositorioFront: 'ixact/erp-web', repositorioBack: '' })

    expect(patch).toHaveBeenCalledWith('/empresas/{identifier}', {
      params: { path: { identifier: 'e1' } },
      body: { cor: null, sincronizar: null, repositorioFront: 'ixact/erp-web', repositorioBack: '', ...SemPastasLocais },
    })
    expect(alterada.repositorioFront).toBe('ixact/erp-web')
  })

  it('devolve o erro de formato do repositório no campo', async () => {
    patch.mockResolvedValue(resposta(400, {
      error: {
        title: 'Um ou mais campos são inválidos.',
        status: 400,
        errors: { RepositorioFront: ['O repositório de front deve estar no formato dono/repo (ex.: ixact/erp-web).'] },
      },
    }))

    await expect(alterarEmpresa('e1', { repositorioFront: 'https://github.com/ixact/erp-web' })).rejects.toMatchObject({
      status: 400,
      errosPorCampo: { repositorioFront: ['O repositório de front deve estar no formato dono/repo (ex.: ixact/erp-web).'] },
    })
  })

  it('envia só a cor, mantendo a sincronização', async () => {
    patch.mockResolvedValue(resposta(200, { data: { ...empresa, cor: '#7B1FA2' } }))

    await alterarEmpresa('e1', { cor: '#7b1fa2' })

    expect(patch).toHaveBeenCalledWith('/empresas/{identifier}', {
      params: { path: { identifier: 'e1' } },
      body: { cor: '#7b1fa2', sincronizar: null, repositorioFront: null, repositorioBack: null, ...SemPastasLocais },
    })
  })

  it('envia as pastas locais e as listas de arquivos, com texto vazio para remover e lista vazia para limpar', async () => {
    patch.mockResolvedValue(resposta(200, { data: { ...empresa, cloneFront: 'E:\\src\\erp-web' } }))

    await alterarEmpresa('e1', { cloneFront: 'E:\\src\\erp-web', cloneBack: '', arquivosFront: ['.env.development'], arquivosBack: [] })

    expect(patch).toHaveBeenCalledWith('/empresas/{identifier}', {
      params: { path: { identifier: 'e1' } },
      body: {
        cor: null,
        sincronizar: null,
        repositorioFront: null,
        repositorioBack: null,
        cloneFront: 'E:\\src\\erp-web',
        cloneBack: '',
        pastaWorktrees: null,
        arquivosFront: ['.env.development'],
        arquivosBack: [],
      },
    })
  })

  it('devolve a mensagem da regra quando a API recusa o clone', async () => {
    patch.mockResolvedValue(resposta(400, {
      error: { status: 400, detail: 'O clone de back (E:\\src\\erp-web) aponta para ixact/erp-web, mas o repositório de back da empresa é ixact/erp-api.' },
    }))

    await expect(alterarEmpresa('e1', { cloneBack: 'E:\\src\\erp-web' })).rejects.toMatchObject({
      status: 400,
      message: 'O clone de back (E:\\src\\erp-web) aponta para ixact/erp-web, mas o repositório de back da empresa é ixact/erp-api.',
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
