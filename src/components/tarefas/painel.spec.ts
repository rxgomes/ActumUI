import { describe, expect, it } from 'vitest'

import { GruposDoPainel, metadadosDoGrupo } from './grupos'
import { prazosDoCartao } from './prazos'
import { ultimoComentarioDoCartao } from './textos'

describe('metadados dos grupos', () => {
  it('lista os oito grupos na ordem do painel, com as concluídas por último', () => {
    expect(GruposDoPainel.map((grupo) => grupo.rotulo)).toEqual(
      ['Retrabalho', 'Entrada', 'Atrasadas', 'Hoje', 'Esta semana', 'Próximas', 'Sem prazo', 'Concluídas'],
    )
  })

  it('usa laranja para retrabalho, vermelho para atrasadas e azul para hoje', () => {
    expect(metadadosDoGrupo('retrabalho').cor).toBe('warning')
    expect(metadadosDoGrupo('atrasadas').cor).toBe('negative')
    expect(metadadosDoGrupo('hoje').cor).toBe('secondary')
  })

  it('exibe um grupo desconhecido com o próprio nome', () => {
    expect(metadadosDoGrupo('urgentes')).toEqual({ grupo: 'urgentes', rotulo: 'urgentes', icone: 'label', cor: 'grey' })
  })
})

describe('prazosDoCartao', () => {
  it('mostra só o prazo interno quando os prazos são iguais', () => {
    expect(prazosDoCartao({ prazoInterno: '2026-11-04', prazoAsana: '2026-11-04', prazoInternoPendente: false }))
      .toEqual({ pendente: false, interno: '04/11/2026', asana: null })
  })

  it('mostra os dois prazos quando são diferentes', () => {
    expect(prazosDoCartao({ prazoInterno: '2026-11-04', prazoAsana: '2026-11-10', prazoInternoPendente: false }))
      .toEqual({ pendente: false, interno: '04/11/2026', asana: '10/11/2026' })
  })

  it('indica prazo pendente após reabertura', () => {
    expect(prazosDoCartao({ prazoInterno: '2026-10-20', prazoAsana: '2026-10-20', prazoInternoPendente: true }).pendente).toBe(true)
  })

  it('indica sem prazo quando não há prazo interno nem do Asana', () => {
    expect(prazosDoCartao({ prazoInterno: null, prazoAsana: null, prazoInternoPendente: false }))
      .toEqual({ pendente: false, interno: 'Sem prazo', asana: null })
  })

  it('mostra o prazo do Asana na entrada, ainda sem prazo interno', () => {
    expect(prazosDoCartao({ prazoInterno: null, prazoAsana: '2026-11-06', prazoInternoPendente: false }))
      .toEqual({ pendente: false, interno: 'Sem prazo', asana: '06/11/2026' })
  })
})

describe('ultimoComentarioDoCartao', () => {
  it('mostra o autor e a data e hora do último comentário', () => {
    expect(ultimoComentarioDoCartao({ ultimoComentarioEm: '2026-11-04T14:30:00', ultimoComentarioAutor: 'Bruno' }))
      .toBe('Bruno · 04/11/2026 14:30')
  })

  it('mostra só a data e hora quando o autor é desconhecido', () => {
    expect(ultimoComentarioDoCartao({ ultimoComentarioEm: '2026-11-04T14:30:00', ultimoComentarioAutor: null }))
      .toBe('04/11/2026 14:30')
  })

  it('não mostra nada quando a tarefa não tem comentários', () => {
    expect(ultimoComentarioDoCartao({ ultimoComentarioEm: null, ultimoComentarioAutor: null })).toBeNull()
  })
})
