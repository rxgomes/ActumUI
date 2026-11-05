# Tasks

Pré-requisito: a change `ultimo-comentario-no-cartao` do `..\ActumAPI` implementada e a API rodando com os campos novos.

## 1. api

- [x] 1.1 Regenerar `src/api/schema.d.ts` a partir do OpenAPI da API em execução (`npm run api:tipos`; com a API em outro PC, rodar o mesmo comando apontando para `http://192.168.15.200:5180/openapi/v1.json`). Verificar que `CartaoTarefaResponse` traz `ultimoComentarioEm` e `ultimoComentarioAutor` anuláveis e que `npm run build` passa.
- [x] 1.2 Atualizar os dados de exemplo dos testes que montam `CartaoTarefaResponse`/`CartaoTarefa` (`src/api/tarefas.spec.ts` e `src/stores/painel.spec.ts`) com os campos novos. Verificar que `npm run test` passa.

## 2. componentes

- [x] 2.1 Em `components/tarefas/textos.ts`, criar `ultimoComentarioDoCartao(cartao)` que devolve `null` sem comentário, ou o texto "Bruno · 04/11/2026 14:30" (só a data e hora quando o autor é nulo), usando `formatarDataHora` de `src/api/datas.ts`. Cobrir os três cenários (com autor, sem autor, sem comentário) em `components/tarefas/painel.spec.ts`. Verificar que `npm run test` passa.
- [x] 2.2 Em `components/tarefas/CartaoTarefa.vue`, mostrar a linha do último comentário abaixo dos projetos, com ícone `chat` em cinza e tooltip "Último comentário", só quando `ultimoComentarioDoCartao` não é `null`, mantendo o texto numa linha (`ellipsis`). Verificar que `npm run build` passa.

## 3. Verificação

- [x] 3.1 Com a API rodando e o front em `npm run dev`, conferir no Painel uma tarefa com comentários (autor e data do mais recente, iguais ao detalhe), uma sem comentários (sem a linha) e que o layout dos cartões continua alinhado na grade.

## Workflow follow-up

- Arquivar a change com `/opsx:archive` após revisão, junto com a change da API.
