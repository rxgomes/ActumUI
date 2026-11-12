# Spec Delta

## Purpose

Define como o detalhe da tarefa mostra os worktrees locais das branches de implementação e as ações sobre eles: copiar o comando do Claude Code, criar ou recriar e remover.

## ADDED Requirements

### Requirement: Worktree da branch no detalhe
Cada branch de implementação com partes SHALL mostrar, abaixo dela, o worktree que a API devolve: a pasta da tarefa e, por parte, o caminho, a situação (Criado, Falhou ou Removido) e o erro da última tentativa. Sem worktree, MUST mostrar "Sem worktree no PC". Branches base MUST NOT mostrar worktree.

#### Scenario: Worktree criado
- **WHEN** a branch tem worktree `criado` com front e back
- **THEN** o detalhe MUST mostrar a pasta e as duas partes com o badge Criado

#### Scenario: Parte com falha
- **WHEN** a parte back está `falhou` com o erro "O git não conseguiu criar o worktree..."
- **THEN** a parte MUST aparecer com o badge Falhou e o texto do erro

### Requirement: Copiar o comando do Claude
Um worktree não removido SHALL ter o botão "Copiar comando do Claude", que copia `comandoClaude` para a área de transferência e notifica. Se a cópia falhar, o comando MUST aparecer na notificação.

#### Scenario: Cópia
- **WHEN** o usuário clica em "Copiar comando do Claude"
- **THEN** `cd '<pasta>'; claude` MUST ir para a área de transferência e o front MUST notificar "Comando copiado."

### Requirement: Criar e recriar o worktree
A branch sem worktree SHALL ter "Criar worktree". O worktree que falhou ou foi removido SHALL ter "Recriar worktree". As duas ações chamam `POST .../worktree`, recarregam o detalhe e notificam: sucesso quando todas as partes ficaram criadas e aviso quando alguma falhou. Um `400` da API MUST aparecer numa notificação.

#### Scenario: Recriar depois de falha
- **WHEN** o usuário clica em "Recriar worktree" e a API devolve as duas partes criadas
- **THEN** o front MUST notificar "Worktree criado." e mostrar as partes como Criado

#### Scenario: Empresa sem configuração
- **WHEN** o usuário clica em "Criar worktree" e a API responde `400` pedindo para configurar a empresa
- **THEN** a mensagem da API MUST aparecer numa notificação

### Requirement: Remover o worktree
Um worktree não removido SHALL ter "Remover worktree", que pede confirmação e chama `DELETE .../worktree`. Depois do sucesso, o detalhe MUST ser recarregado. Uma recusa `409` (pendências) ou `400` (arquivo em uso) MUST aparecer numa notificação com a mensagem da API, sem alterar a tela.

#### Scenario: Pendências
- **WHEN** a API responde `409` com "back: 2 alterações não commitadas"
- **THEN** a notificação MUST mostrar a mensagem e o worktree MUST continuar como Criado
