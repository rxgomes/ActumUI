# Proposal

## Why

A API da Fase 4 (ActumAPI, change `indicadores-de-retrabalho-e-anotacoes`) calcula os retrabalhos pela regra do usuário: cada "concluiu" seguido de "marcou como não concluída" no histórico do Asana. Ela também expõe os indicadores por empresa, o reprocessamento do histórico e as anotações privadas da tarefa. No front, nada disso aparece ainda. Falta a página para acompanhar o retrabalho por empresa e falta, no detalhe, onde registrar as decisões e o que foi testado sem mandar nada ao Asana.

## What Changes

- **Página "Retrabalho"** (rota `/retrabalho`, menu Indicadores → Retrabalho):
  - **filtro** de período (atalhos "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses", "Este ano" e "Personalizado" com início e fim) e de empresa, guardado no endereço da página;
  - **cards por empresa e Total**: retrabalhos, tarefas com retrabalho, tarefas concluídas e taxa de retrabalho (ou "—" sem conclusões);
  - **evolução mensal**: barras empilhadas por mês, uma cor por empresa, com legenda, valores no topo, dica ao passar o mouse e alternância para tabela;
  - **ranking**: as 10 tarefas com mais retrabalhos, com empresa, status, quantidade e última reabertura, e link para o detalhe;
  - **"Reprocessar histórico do Asana"**, com confirmação, progresso e resumo (tarefas lidas, retrabalhos antes e depois, falhas). Quando nunca houve reprocessamento, um aviso explica que os pares antigos só entram depois dele.
- **Card "Anotações privadas"** no detalhe da tarefa: lista em ordem cronológica com data (e "editada em"), nova anotação, edição no lugar, exclusão com confirmação e o aviso de que as anotações não vão para o Asana. Funciona também em tarefa arquivada.
- **Retrabalhos no detalhe:** cada retrabalho mostra também quando a tarefa tinha sido concluída antes da reabertura (`concluidaEm`), quando houver.

## Capabilities

### New Capabilities

- `rework-dashboard`: página de indicadores de retrabalho, com filtros, cards, evolução mensal, ranking e reprocessamento.
- `task-notes`: anotações privadas no detalhe da tarefa.

### Modified Capabilities

- `task-detail`: o histórico de retrabalho passa a mostrar a conclusão que precedeu cada reabertura.

## Impact

- **Telas e componentes afetados:**
  - página nova `RetrabalhoPage.vue` e item novo no menu do `MainLayout`;
  - em `src/components/retrabalho/`: `FiltrosDoRetrabalho.vue`, `CartaoDaEmpresa.vue`, `EvolucaoMensal.vue` (gráfico em SVG próprio), `RankingDeRetrabalho.vue` e `ReprocessarDialog` via `quasar.dialog`;
  - no detalhe: `AnotacoesDaTarefa.vue` novo e `RetrabalhosDaTarefa.vue` alterado.
- **Código novo:** `src/api/retrabalhos.ts`, `src/api/anotacoes.ts`, stores `useRetrabalhoStore` e `useAnotacoesStore`, rota `retrabalho`.
- **Endpoints da API usados:** `GET /retrabalhos/indicadores`, `POST /retrabalhos/reprocessamento`, `GET/POST /tarefas/{identifier}/anotacoes` e `PUT/DELETE /tarefas/{identifier}/anotacoes/{anotacaoIdentifier}`. Já existem no ActumAPI (change ainda não arquivada); é preciso regenerar `src/api/schema.d.ts`. Nenhuma alteração na API.
- **Dependências novas:** nenhuma. O gráfico é um SVG próprio, para não trazer biblioteca de gráficos por causa de um único gráfico de barras.

### Fora do escopo

- Exportar indicadores (CSV ou planilha), gráficos de quem reabriu e de tempo até a reabertura.
- Indicadores no Painel ou no cartão da tarefa.
- Modo escuro (o app não tem).
- Formatação rica, anexos ou busca nas anotações.
