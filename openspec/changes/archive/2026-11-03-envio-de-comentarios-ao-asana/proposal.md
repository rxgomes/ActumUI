# Proposal

## Why

A API já envia comentários, anexos e prints para a tarefa do Asana, com menção a quem pediu (ActumAPI, change `envio-de-comentarios-ao-asana`). No front, o usuário ainda precisa abrir o Asana para responder, mandar o print de um erro ou postar as dúvidas levantadas pela análise com IA. Esta change leva isso para o detalhe da tarefa.

## What Changes

- Caixa **Novo comentário** no topo do card Comentários do detalhe da tarefa:
  - texto com várias linhas; Ctrl+Enter envia;
  - arquivos por botão "Anexar", por arrastar e soltar no card ou colando um print com **Ctrl+V** (vira `print-AAAAMMDD-HHMMSS.png`);
  - prévia em miniatura das imagens, nome e tamanho de cada arquivo, com remoção;
  - **Mencionar**, com os participantes da tarefa no Asana, já marcando a pessoa sugerida (quem reabriu ou comentou por último);
  - botão **Enviar ao Asana**, com progresso, desabilitado sem texto nem arquivo.
- Os limites de arquivos (até 10, 25 MB cada, 50 MB no total, sem arquivo vazio) são conferidos antes do envio, com a mesma mensagem da API.
- Depois do envio: notificação, caixa limpa e o comentário novo aparece na lista (o detalhe é recarregado).
- Falha parcial (anexos enviados e comentário não): a mensagem da API aparece na caixa, os arquivos já enviados saem da caixa e o texto continua para reenvio.
- Na **Análise com IA**, o botão **Enviar dúvidas ao Asana** preenche a caixa com as dúvidas ainda não resolvidas, numeradas, e leva o foco até ela para revisão. Nada é enviado sem o clique em "Enviar ao Asana".
- Tarefa arquivada: a caixa fica desabilitada, com a explicação.
- O cliente da API passa a guardar as extensões do Problem Details (ex.: `anexosEnviados`) no `ErroDaApi`.

## Capabilities

### New Capabilities

- `task-comments`: caixa de comentário no detalhe da tarefa, com anexos, prints colados, menções e envio ao Asana.

### Modified Capabilities

- `task-analysis`: novo requisito "Enviar dúvidas ao Asana", que preenche a caixa de comentário.
- `api-client`: novo requisito de extensões do Problem Details no `ErroDaApi`.

## Impact

- **Telas e componentes afetados:**
  - `TarefaDetalhePage.vue` e `ComentariosDaTarefa.vue`, que recebe a caixa nova.
  - Componente novo `NovoComentario.vue` em `src/components/tarefas/`.
  - `AnaliseDaTarefa.vue` ganha o botão "Enviar dúvidas ao Asana".
- **Código novo ou alterado:**
  - funções novas em `src/api/comentarios.ts`;
  - `ErroDaApi` com `extensoes`;
  - store nova `useNovoComentarioStore` (rascunho compartilhado entre a análise e a caixa).
- **Endpoints da API usados:**
  - `GET /tarefas/{identifier}/participantes` e `POST /tarefas/{identifier}/comentarios` (`multipart/form-data`);
  - `GET /tarefas/{identifier}`, já usado, para recarregar.

  Os endpoints existem no ActumAPI (change `envio-de-comentarios-ao-asana`, ainda não arquivada); é preciso regenerar `src/api/schema.d.ts`. Nenhuma outra alteração na API.
- **Dependências novas:** nenhuma. Colar, arrastar e miniaturas usam APIs do navegador e componentes do Quasar.
- **Escrita visível a terceiros:** cada envio publica no Asana e notifica os mencionados. A verificação real no navegador só acontece com autorização do usuário, numa tarefa escolhida por ele.

### Fora do escopo

- Editar ou excluir comentários enviados; responder a um comentário específico.
- Formatação rica (negrito, listas) e menção a pessoas que não seguem a tarefa.
- Exibir ou baixar os anexos que já estão no Asana.
- Guardar o rascunho entre visitas (ao sair do detalhe, o rascunho é descartado).
