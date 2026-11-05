# Proposal

## Why

A análise com IA passa a considerar todos os comentários da tarefa, atualizados pelo Asana na hora da análise, e a devolver uma seção de regras e observações com a origem de cada item (change `comentarios-na-analise` no `..\ActumAPI`). O front precisa mostrar essa seção e refletir os comentários que a análise trouxe do Asana.

## What Changes

- A seção "Análise com IA" do detalhe da tarefa (`AnaliseDaTarefa.vue`) passa a mostrar o bloco "Regras e observações", depois das dúvidas. Cada regra tem uma caixa de marcação ("Regra atendida") e a origem embaixo (ex.: "comentário de Maria em 04/11/2026 14:30"). Sem regras, o bloco é omitido.
- `ItemDaAnalise.vue` mostra a origem quando o item tem uma.
- Depois de uma análise bem-sucedida, o detalhe da tarefa é recarregado, para os comentários trazidos do Asana aparecerem na lista de comentários.
- Os tipos do OpenAPI (`src/api/schema.d.ts`) são regenerados, e `src/api/analises.ts` passa a converter e atualizar as regras.
- O texto que explica a análise passa a citar as regras.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `task-analysis`: a exibição e a marcação passam a incluir as regras com origem, e a análise concluída recarrega os comentários do detalhe.

## Impact

- **Telas e componentes:** detalhe da tarefa (`TarefaDetalhePage.vue`), através de `components/tarefas/AnaliseDaTarefa.vue` e `components/tarefas/ItemDaAnalise.vue`.
- **API:** `POST /tarefas/{identifier}/analises` (pode responder `502` também quando o Asana falha, tratado como os outros erros da análise), `GET /tarefas/{identifier}/analises` e `PATCH /tarefas/{identifier}/analises/itens/{itemIdentifier}`. **Exige a change `comentarios-na-analise` no `..\ActumAPI` antes** (campos `regras` e `origem` e valor `regra` em `TipoItemAnalise`).
- **Stores:** `useAnaliseStore` sem mudança de interface. `useTarefaStore.recarregar` passa a ser chamado depois da análise.

### Fora do escopo

- Copiar ou enviar as regras ao Asana (como já se faz com as dúvidas).
- Progresso das regras (como o "3 de 11 itens feitos" do checklist).
- Link da origem até o comentário na lista.
