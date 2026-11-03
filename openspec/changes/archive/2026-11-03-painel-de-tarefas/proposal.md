# Proposal

## Why

Com a fundação pronta, o front ainda não mostra nenhuma tarefa: a página Painel é só um texto provisório, e as tarefas sincronizadas do Asana só aparecem pela API. O Painel é a tela principal do Actum. É nela que o usuário vê o que fazer primeiro (reabertas, caixa de entrada e tarefas por prazo interno) e dispara a sincronização com o Asana, sem precisar procurar nos e-mails o que mudou.

## What Changes

- Página Painel real: resumo com a quantidade de tarefas de cada grupo e as seções Retrabalho, Entrada, Atrasadas, Hoje, Esta semana, Próximas e Sem prazo, na ordem e com o agrupamento definidos pela API.
- Cartão da tarefa com título, empresa (nome e cor), projetos, prazo interno (ou indicação de prazo pendente), prazo do Asana quando diferente do interno, prioridade, quantidade de retrabalhos, comentários não lidos e indicação de bloqueada.
- Filtros por empresa e por texto, refletidos no endereço da página para sobreviverem a um recarregamento.
- Botão Sincronizar com o Asana, que mostra o resumo da execução (novas, atualizadas, arquivadas, reaberturas) e recarrega o painel.
- Informação da última sincronização (data, sucesso ou falha) no topo do Painel.
- Estados de carregando, vazio e erro do painel.

## Capabilities

### New Capabilities

- `task-board`: exibição do painel de tarefas no front (resumo, grupos, cartões, filtros e estados da tela).
- `task-sync`: disparo da sincronização com o Asana pelo front e exibição do resultado e da última sincronização.

### Modified Capabilities

Nenhuma. O aviso do Asana (`app-shell`) e o tratamento de erros (`api-client`) são usados como estão.

## Impact

- **Telas e componentes afetados:**
  - `PainelPage.vue` deixa de ser provisória.
  - Componentes novos em `src/components/tarefas/`: cartão da tarefa, seção do grupo, resumo dos grupos, filtros e barra de sincronização.
  - Funções novas em `src/api/` para tarefas, sincronizações e empresas.
  - Stores novas para o painel e a sincronização.
- **Endpoints da API usados:** `GET /tarefas/painel` (filtros `empresa` e `busca`), `POST /sincronizacoes`, `GET /sincronizacoes/ultima` e `GET /empresas`. Todos já existem e estão em `src/api/schema.d.ts`, então nenhuma alteração na API é necessária.
- **Dependências novas:** nenhuma.

### Fora do escopo

- Detalhe da tarefa e diálogos Iniciar, Novo prazo, Nova branch e Concluir (próxima change). Nesta change o cartão não abre o detalhe.
- Configuração das empresas (cor, sincronizar) e listagem paginada de tarefas (`GET /tarefas`).
- Atualização automática do painel ou sincronização em segundo plano.
- Ordenação personalizada e arrastar cartões.
