# Tasks

Pré-requisito: a change `comentarios-na-analise` do `..\ActumAPI` implementada e a API rodando com os campos novos.

## 1. api

- [x] 1.1 Regenerar `src/api/schema.d.ts` a partir de `http://192.168.15.200:5180/openapi/v1.json` (mesmo comando de `npm run api:tipos`, com esse endereço). Verificar que `AnaliseResponse` tem `regras`, `AnaliseItemResponse` tem `origem` e `TipoItemAnalise` inclui `regra`.
- [x] 1.2 Em `src/api/analises.ts`, incluir `regras` em `Analise` (com a mesma normalização de `paraItem`), em `paraAnalise` e em `comItemAtualizado`. Atualizar os dados de exemplo e cobrir a conversão e a atualização de uma regra em `src/api/analises.spec.ts` e em `src/stores/analise.spec.ts`. Verificar que `npm run test` e `npm run build` passam.

## 2. componentes

- [x] 2.1 Em `components/tarefas/ItemDaAnalise.vue`, usar o rótulo "Regra atendida" para o tipo `regra` e mostrar a `origem`, quando houver, numa linha em cinza abaixo do texto (ícone `chat`). Verificar com `npm run build`.
- [x] 2.2 Em `components/tarefas/AnaliseDaTarefa.vue`, adicionar o bloco "Regras e observações" (ícone `rule`) depois das dúvidas, omitido quando não há regras, com as caixas habilitadas como as dos outros itens. Incluir as regras no texto explicativo da análise ("... testes, dúvidas e regras ..."). Verificar com `npm run build`.
- [x] 2.3 Depois de uma análise ou reanálise bem-sucedida em `AnaliseDaTarefa.vue`, chamar `useTarefaStore().recarregar()` para atualizar os comentários do detalhe. Não recarregar em caso de falha. Verificar com `npm run build` e com os testes existentes de `src/stores/tarefa.spec.ts` passando.

## 3. Verificação

- [x] 3.1 Com a API rodando e o front em `npm run dev`, numa tarefa com um comentário feito no Asana depois da última sincronização, rodar "Reanalisar" e conferir:
  - o comentário aparece na lista de comentários;
  - o bloco "Regras e observações" mostra as regras com a origem;
  - marcar e desmarcar uma regra funciona;
  - uma versão gravada antes desta mudança não mostra o bloco.

## Workflow follow-up

- Arquivar a change com `/opsx:archive` após revisão, junto com a change da API.
