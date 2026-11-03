# Proposal

## Why

O Painel mostra o que fazer primeiro, mas o usuário ainda não consegue agir sobre uma tarefa pelo front. Iniciar com as branches, bloquear, definir o novo prazo depois de uma reabertura e concluir enviando as tags ao Asana só são possíveis chamando a API diretamente. Também falta ver o histórico de retrabalho e os comentários de cada reabertura, que explicam o que o testador pediu. Esta change completa as telas da Fase 1: o Detalhe da tarefa e os diálogos Iniciar, Novo prazo, Nova branch e Concluir.

## What Changes

- Nova página Detalhe da tarefa (`/tarefas/:identifier`), aberta ao clicar num cartão do Painel. Ela mostra:
  - dados da tarefa (empresa, status, prazos, prioridade, projetos, descrição e link para o Asana);
  - branches, indicando as já enviadas ao Asana;
  - retrabalhos em ordem, cada um com os comentários da sua reabertura;
  - todos os comentários.
- Ao abrir o detalhe, os comentários não lidos aparecem destacados e são marcados como lidos na API. O contador do cartão no Painel zera.
- Ações conforme o status da tarefa: Iniciar, Bloquear, Desbloquear, Novo prazo (prazo interno e prioridade), Nova branch, excluir branch não enviada e Concluir.
- Diálogos com validação e mensagens da API em pt-BR, incluindo erros por campo:
  - **Iniciar:** branch base, branch de implementação e prazo interno.
  - **Novo prazo:** destaca quando o prazo está pendente após uma reabertura.
  - **Nova branch:** tipo e nome.
  - **Concluir:** mostra a prévia das tags que serão adicionadas no Asana e o motivo quando a conclusão não é permitida. Permite tentar de novo depois de uma falha.
- Estados da página: carregando, tarefa não encontrada e erro com "Tentar novamente".

## Capabilities

### New Capabilities

- `task-detail`: exibição do detalhe de uma tarefa no front (dados, branches, retrabalhos com comentários, comentários e leitura dos não lidos).
- `task-actions`: ações do ciclo de vida da tarefa pelo front (iniciar, bloquear, desbloquear, prazo e prioridade, branches e conclusão com a prévia das tags).

### Modified Capabilities

- `task-board`: o cartão da tarefa passa a abrir o Detalhe da tarefa.

## Impact

- **Telas e componentes afetados:**
  - Nova `TarefaDetalhePage.vue` e nova rota `detalheTarefa`.
  - Componentes do detalhe e os diálogos `IniciarTarefaDialog`, `NovoPrazoDialog`, `NovaBranchDialog` e `ConcluirTarefaDialog`, em `src/components/tarefas/`.
  - `CartaoTarefa.vue` passa a ser clicável.
  - Funções novas em `src/api/tarefas.ts` e store nova para o detalhe.
- **Endpoints da API usados:**
  - `GET /tarefas/{identifier}` e `POST /tarefas/{identifier}/comentarios/marcar-lidos`;
  - `PATCH /tarefas/{identifier}`;
  - `POST /tarefas/{identifier}/iniciar`, `/bloquear` e `/desbloquear`;
  - `POST` e `DELETE /tarefas/{identifier}/branches`;
  - `GET /tarefas/{identifier}/conclusao/previa` e `POST /tarefas/{identifier}/concluir`.

  Todos já existem e estão em `src/api/schema.d.ts`, então nenhuma alteração na API é necessária.
- **Dependências novas:** nenhuma.

### Fora do escopo

- Descrição em HTML formatado. A descrição é exibida como texto, preservando as quebras de linha.
- Remover a prioridade depois de definida. A API não oferece essa opção (prioridade nula significa "manter").
- Enviar comentários, anexos ou prints ao Asana (Fase 3).
- Desfazer uma conclusão (a reabertura acontece no Asana e é detectada na sincronização).
- Configuração das empresas e listagem paginada de tarefas.
