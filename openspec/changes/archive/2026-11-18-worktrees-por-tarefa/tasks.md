# Tasks

## 1. API (cliente e tipos)

- [x] 1.1 Com a API da change `worktrees-por-tarefa` do ActumAPI rodando, regenerar `src/api/schema.d.ts` a partir do OpenAPI e verificar que ele tem `cloneFront`, `pastaWorktrees` e `arquivosFront` em `EmpresaResponse` e `AlterarEmpresaRequest`, `worktree` em `BranchResponse`, `WorktreeResponse`, `SituacaoWorktree` e a rota `/tarefas/{identifier}/branches/{branchIdentifier}/worktree`
- [x] 1.2 Em `src/api/empresas.ts`, incluir `cloneFront`, `cloneBack`, `pastaWorktrees`, `arquivosFront` e `arquivosBack` em `DadosDaEmpresa` e no `alterarEmpresa` (`null` quando não informado). Atualizar `empresas.spec.ts` e cobrir o envio das listas
- [x] 1.3 Em `src/api/tarefas.ts`, exportar `Worktree`, `WorktreeParte` e `SituacaoWorktree` e criar `criarWorktree` (devolve a branch) e `removerWorktree`, com JSDoc em pt-BR. Cobrir com testes em `tarefa-detalhe.spec.ts` (rota, parâmetros e `409` como `ErroDaApi` com a mensagem)

## 2. Componentes de tarefas

- [x] 2.1 Criar `src/components/tarefas/worktrees.ts` (`acoesDoWorktree`, textos e cores da situação, `partesComFalha`) e `worktrees.spec.ts` com os casos sem worktree, criado, falhou e removido
- [x] 2.2 Criar `WorktreeDaBranch.vue` (pasta, partes com badge e erro, botões Copiar comando do Claude, Criar/Recriar e Remover worktree, desabilitados durante o processamento) e usá-lo em `BranchesDaTarefa.vue` para as branches de implementação com partes, repassando os eventos. Verificar com `npm run build`
- [x] 2.3 Em `TarefaDetalhePage.vue`, tratar criar ou recriar (notificação de sucesso ou aviso conforme as partes devolvidas) e remover (confirmação, notificação, recarga, erros com `useNotificarErro`), com o loading por branch. Verificar com `npm run build`

## 3. Empresas

- [x] 3.1 Criar `PastasLocaisDaEmpresa.vue` (popup com os cinco campos, arquivos um por linha, só o alterado vai à API, erros por campo e geral, notificação de sucesso, texto de ajuda) e usá-lo em `LinhaDaEmpresa.vue`, com a legenda da situação das pastas locais. Verificar com `npm run build`

## 4. Verificação no navegador

- [x] 4.1 Com a API da change rodando e `npm run dev`, configurar as pastas locais de uma empresa, incluindo um clone inválido (erro no popup) e a remoção de um campo
- [x] 4.2 No detalhe de uma tarefa iniciada, conferir a pasta e as partes, copiar o comando do Claude, recriar um worktree com falha, ver o `409` ao remover com alteração não commitada e remover com sucesso
- [x] 4.3 Rodar `npm run build` e `npm test` sem erros

## Workflow follow-up

- Publicar junto com a change `worktrees-por-tarefa` do ActumAPI.
- Arquivar a change depois da revisão.
