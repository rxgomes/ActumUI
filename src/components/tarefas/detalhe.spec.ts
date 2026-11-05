import { describe, expect, it } from 'vitest'

import type { StatusTarefa } from '@/api/tarefas'

import { acoesDisponiveis, temAndamento } from './acoes'
import { corDoStatus, rotuloDoAndamento, rotuloDoStatus, textoDoMotivoArquivamento } from './textos'

function acoes(status: StatusTarefa, emAndamento = false): string[] {
  return [...acoesDisponiveis(status, emAndamento)].sort()
}

describe('acoesDisponiveis', () => {
  it('na entrada, oferece Iniciar e Novo prazo, sem Concluir', () => {
    expect(acoes('entrada')).toEqual(['iniciar', 'novoPrazo'])
  })

  it('iniciada e pausada, oferece Iniciar, Bloquear, Nova branch, Concluir e Novo prazo', () => {
    expect(acoes('em_andamento')).toEqual(['bloquear', 'concluir', 'iniciar', 'novaBranch', 'novoPrazo'])
  })

  it('em andamento, troca Iniciar por Pausar', () => {
    expect(acoes('em_andamento', true)).toEqual(['bloquear', 'concluir', 'novaBranch', 'novoPrazo', 'pausar'])
  })

  it('em retrabalho, oferece as mesmas ações da tarefa iniciada', () => {
    expect(acoes('retrabalho')).toEqual(acoes('em_andamento'))
    expect(acoes('retrabalho', true)).toEqual(acoes('em_andamento', true))
  })

  it('bloqueada, não oferece Iniciar nem Pausar', () => {
    expect(acoes('bloqueada', true)).toEqual(acoes('bloqueada'))
  })

  it('bloqueada, oferece Desbloquear, Nova branch, Concluir e Novo prazo', () => {
    expect(acoes('bloqueada')).toEqual(['concluir', 'desbloquear', 'novaBranch', 'novoPrazo'])
  })

  it('concluída, oferece só Novo prazo', () => {
    expect(acoes('concluida')).toEqual(['novoPrazo'])
  })

  it('arquivada, não oferece nenhuma ação', () => {
    expect(acoes('arquivada')).toEqual([])
  })
})

describe('textos', () => {
  it('traduz os status para pt-BR', () => {
    expect(rotuloDoStatus('em_andamento')).toBe('Iniciada')
    expect(rotuloDoStatus('concluida')).toBe('Concluída')
    expect(corDoStatus('retrabalho')).toBe('warning')
  })

  it('nomeia o andamento só nos status em que ele se aplica', () => {
    expect([rotuloDoAndamento(true), rotuloDoAndamento(false)]).toEqual(['Em andamento', 'Pausada'])
    const status: StatusTarefa[] = ['entrada', 'em_andamento', 'retrabalho', 'bloqueada', 'concluida']
    expect(status.filter(temAndamento)).toEqual(['em_andamento', 'retrabalho'])
  })

  it('explica os motivos de arquivamento', () => {
    expect(textoDoMotivoArquivamento('reatribuida')).toBe('A tarefa foi atribuída a outra pessoa no Asana.')
    expect(textoDoMotivoArquivamento('concluida_no_asana')).toBe('A tarefa foi concluída diretamente no Asana.')
    expect(textoDoMotivoArquivamento('excluida')).toBe('A tarefa foi excluída no Asana.')
  })
})

describe('errosDoDialogo', () => {
  it('leva os erros de validação para os campos do diálogo', async () => {
    const { ErroDaApi } = await import('@/api/erros')
    const { errosDoDialogo } = await import('./errosDoDialogo')
    const erro = new ErroDaApi('problema', 'Um ou mais campos são inválidos.', 400, { prazoInterno: ['O prazo interno é obrigatório.'] })

    expect(errosDoDialogo(erro, ['branchBase', 'prazoInterno'])).toEqual({
      porCampo: { prazoInterno: 'O prazo interno é obrigatório.' },
      geral: null,
    })
  })

  it('mostra a regra de negócio como mensagem geral', async () => {
    const { ErroDaApi } = await import('@/api/erros')
    const { errosDoDialogo } = await import('./errosDoDialogo')
    const erro = new ErroDaApi('problema', 'A branch base e a branch de implementação devem ser diferentes.', 400)

    expect(errosDoDialogo(erro, ['branchBase'])).toEqual({
      porCampo: {},
      geral: 'A branch base e a branch de implementação devem ser diferentes.',
    })
  })

  it('leva o 409 para o campo do conflito', async () => {
    const { ErroDaApi } = await import('@/api/erros')
    const { errosDoDialogo } = await import('./errosDoDialogo')
    const erro = new ErroDaApi('problema', 'A tarefa já tem uma branch com esse nome.', 409)

    expect(errosDoDialogo(erro, ['tipo', 'nome'], 'nome')).toEqual({
      porCampo: { nome: 'A tarefa já tem uma branch com esse nome.' },
      geral: null,
    })
  })
})
