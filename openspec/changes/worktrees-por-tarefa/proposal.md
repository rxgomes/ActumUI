# Proposal

## Why

A change `worktrees-por-tarefa` do ActumAPI cria, para cada branch de implementação, um par de git worktrees (front e back) numa pasta da tarefa, no PC do usuário. O front precisa de duas coisas:
- permitir configurar, por empresa, os clones locais, a pasta dos worktrees e os arquivos a copiar;
- mostrar no detalhe da tarefa onde estão os worktrees e oferecer as ações de copiar o comando do Claude Code, criar ou recriar e remover.

Sem isso, o recurso só pode ser usado pela API.

## What Changes

- **Página Empresas** (`LinhaDaEmpresa`): novo botão "Pastas locais" com um popup para:
  - o clone do front e o do back;
  - a pasta dos worktrees;
  - os arquivos a copiar de cada parte, um por linha.

  A legenda da linha mostra se a configuração local está completa. Os erros da API aparecem no popup.
- **Detalhe da tarefa** (`BranchesDaTarefa`): cada branch de implementação com worktree mostra a pasta da tarefa e, por parte, o caminho, a situação (`criado`, `falhou`, `removido`) e o erro da última tentativa. As ações são:
  - "Copiar comando do Claude", que copia `comandoClaude` para a área de transferência;
  - "Criar worktree", quando não há worktree, e "Recriar worktree", quando falhou ou foi removido;
  - "Remover worktree", com confirmação. A recusa da API (`409`) aparece com a mensagem de pendências.
- **Cliente da API**: tipos regenerados, campos novos em `alterarEmpresa` e as funções `criarWorktree` e `removerWorktree`.

## Capabilities

### New Capabilities
- `task-worktrees`: exibição e ações dos worktrees das branches no detalhe da tarefa.

### Modified Capabilities
- `company-settings`: configuração local da empresa (clones, pasta dos worktrees, arquivos a copiar).

## Impact

- **Telas e componentes**:
  - `EmpresasPage` / `LinhaDaEmpresa`, com o novo componente `PastasLocaisDaEmpresa`;
  - `TarefaDetalhePage` / `BranchesDaTarefa`, com o novo componente `WorktreeDaBranch` e funções puras em `components/tarefas/worktrees.ts`.
- **Endpoints usados**:
  - `PATCH /empresas/{identifier}` (campos novos);
  - `POST` e `DELETE` em `/tarefas/{identifier}/branches/{branchIdentifier}/worktree`;
  - `GET /tarefas/{identifier}` (campo `worktree` em `branches`).
- **API**: exige a change `worktrees-por-tarefa` do ActumAPI (já aplicada). Nenhuma alteração adicional.
- **Dependências npm**: nenhuma. A cópia para a área de transferência usa `copyToClipboard` do Quasar.

## Fora do escopo

- Portas por tarefa, URL para o note e proxy do Vite (próxima change).
- Abrir Windows Terminal, WebStorm ou Rider pela tela.
- Escolher pastas com um seletor de arquivos do sistema. O navegador não dá acesso a caminhos locais, então os caminhos são digitados.
- Remover worktrees automaticamente ao concluir a tarefa.
