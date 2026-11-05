# Proposal

## Why

Hoje o cartão do Painel só mostra quantos comentários não foram lidos. Para saber quando houve a última conversa na tarefa e quem escreveu, o usuário precisa abrir o detalhe. Mostrar essas duas informações no cartão ajuda a decidir o que olhar primeiro.

## What Changes

- O cartão da tarefa (`CartaoTarefa.vue`) passa a mostrar a data e hora e o autor do último comentário, quando a tarefa tem comentários.
- Sem comentários, o cartão não mostra nada a mais.
- Com autor desconhecido, o cartão mostra só a data e hora.
- Os tipos gerados do OpenAPI (`src/api/schema.d.ts`) são regenerados para incluir os campos novos do cartão.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `task-board`: o requisito "Cartão da tarefa" passa a incluir o último comentário (data e hora e autor).

## Impact

- **Telas e componentes:** Painel (`PainelPage.vue`) através de `components/tarefas/CartaoTarefa.vue`; textos auxiliares em `components/tarefas/textos.ts`.
- **API:** usa os campos `ultimoComentarioEm` e `ultimoComentarioAutor` de `CartaoTarefaResponse`, devolvidos por `GET /painel`. **Exige a change `ultimo-comentario-no-cartao` no `..\ActumAPI` antes**: os dados já estão no banco (tabela `tarefas.comentario`) e a API passa a expô-los no cartão.
- **Tipos:** regenerar `src/api/schema.d.ts`; `CartaoTarefa` em `src/api/tarefas.ts` herda os campos sem mudança manual.

### Fora do escopo

- Texto do último comentário no cartão.
- Ordenar ou filtrar o Painel pelo último comentário.
- Mudanças no detalhe da tarefa, na lista de comentários ou no envio de comentários.
