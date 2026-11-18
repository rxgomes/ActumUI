import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { type Anexo, listarAnexos } from '@/api/anexos'
import { ErroDaApi } from '@/api/erros'

import { useAnexosDaTarefa } from './useAnexosDaTarefa'

vi.mock('@/api/anexos', () => ({ listarAnexos: vi.fn() }))

const listar = vi.mocked(listarAnexos)

function anexo(gid: string): Anexo {
  return { gid, nome: `${gid}.pdf`, criadoEm: '2026-11-03T10:00:00', tamanho: 10, hospedagem: 'asana', legivelNaAnalise: true, motivo: null }
}

describe('useAnexosDaTarefa', () => {
  beforeEach(() => {
    listar.mockReset()
  })

  it('lê os anexos da tarefa', async () => {
    listar.mockResolvedValue([anexo('a1')])
    const { anexos, carregando, erro, carregar } = useAnexosDaTarefa(ref('t1'))

    await carregar()

    expect(listar).toHaveBeenCalledWith('t1')
    expect(anexos.value.map((lido) => lido.gid)).toEqual(['a1'])
    expect([carregando.value, erro.value]).toEqual([false, null])
  })

  it('guarda a mensagem da API em falha', async () => {
    listar.mockRejectedValue(new ErroDaApi('problema', 'A tarefa não existe mais no Asana.', 400))
    const { erro, carregar } = useAnexosDaTarefa(ref('t1'))

    await carregar()

    expect(erro.value).toBe('A tarefa não existe mais no Asana.')
  })

  it('uma resposta antiga não sobrescreve a mais recente', async () => {
    let responderAntiga: (anexos: Anexo[]) => void = () => {}
    listar.mockReturnValueOnce(new Promise((resolver) => (responderAntiga = resolver))).mockResolvedValueOnce([anexo('nova')])
    const identifier = ref('t1')
    const { anexos, carregar } = useAnexosDaTarefa(identifier)

    const antiga = carregar()
    identifier.value = 't2'
    await carregar()
    responderAntiga([anexo('antiga')])
    await antiga

    expect(anexos.value.map((lido) => lido.gid)).toEqual(['nova'])
  })
})
