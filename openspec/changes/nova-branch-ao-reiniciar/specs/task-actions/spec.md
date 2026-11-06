# Spec Delta

## ADDED Requirements

### Requirement: Iniciar tarefa reaberta
Quando a API indicar `novaBranchSugerida = true`, o Iniciar SHALL abrir um diálogo com as opções "Criar nova branch" (marcada ao abrir) e "Continuar na branch atual". Criar nova branch MUST pedir base, implementação e partes, como o primeiro início e sem o prazo, e enviá-las no retomar. Continuar MUST só retomar. Sem a indicação, o Iniciar de uma tarefa pausada MUST retomar direto.

#### Scenario: Nova branch no retrabalho
- **WHEN** o usuário inicia uma tarefa em `retrabalho` com `novaBranchSugerida = true`, mantém "Criar nova branch", escolhe a base `main`, aceita a implementação sugerida `261106-ajuste-ipi` e marca Back
- **THEN** o front MUST enviar ao retomar `branchBase = main`, `branchImplementacao = 261106-ajuste-ipi` e `partes = ["back"]`, e a página MUST mostrar a tarefa em andamento com a nova branch pendente, do retrabalho aberto

#### Scenario: Continuar na branch atual
- **WHEN** o usuário escolhe "Continuar na branch atual" e confirma
- **THEN** o front MUST retomar a tarefa sem enviar branches, e a página MUST mostrar a tarefa em andamento

#### Scenario: Tarefa pausada sem sugestão
- **WHEN** o usuário inicia uma tarefa pausada com `novaBranchSugerida = false`
- **THEN** o front MUST retomar a tarefa direto, sem abrir o diálogo

#### Scenario: Nenhuma parte marcada
- **WHEN** "Criar nova branch" está escolhida e nenhuma parte está marcada
- **THEN** o botão de confirmação MUST ficar desabilitado

#### Scenario: Base inexistente no GitHub
- **WHEN** a API responde `400` dizendo que a base não existe no repositório
- **THEN** o diálogo MUST mostrar essa mensagem e permanecer aberto com os dados preenchidos

#### Scenario: Nome já usado na tarefa
- **WHEN** a API responde `409` porque a implementação já está registrada na tarefa
- **THEN** a mensagem MUST aparecer no campo da branch de implementação

#### Scenario: Criando no GitHub
- **WHEN** o usuário confirma e a API ainda não respondeu
- **THEN** o botão MUST indicar carregamento, e o diálogo MUST NOT permitir cancelar nem confirmar de novo
