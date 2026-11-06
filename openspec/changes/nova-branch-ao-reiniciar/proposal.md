# Proposal

## Why

Ao iniciar uma tarefa reaberta no Asana (em `retrabalho`), o botão Iniciar hoje só retoma a tarefa, e o retrabalho acaba sendo feito na branch antiga. A API passa a aceitar uma nova branch de implementação no próprio retomar e a indicar quando essa branch é sugerida (change `nova-branch-ao-reiniciar` no ActumAPI). O front precisa oferecer essa escolha ao iniciar, para que cada ciclo da tarefa possa ter a sua branch, criada e enviada ao GitHub como no primeiro início.

## What Changes

- Ao clicar em **Iniciar** numa tarefa com `novaBranchSugerida = true`, abre o diálogo Iniciar em modo "retrabalho". Nele o usuário escolhe uma de duas opções:
  - **Criar nova branch** (marcada ao abrir): mostra a branch base (seletor de bases recentes), a branch de implementação sugerida (`yyMMdd-titulo`) e as partes Front/Back, como no primeiro início, sem o prazo interno;
  - **Continuar na branch atual**: só retoma a tarefa, como hoje.
- Nas demais tarefas pausadas, o Iniciar continua retomando direto, sem diálogo.
- O texto do diálogo explica que a nova branch é criada no GitHub e vinculada ao retrabalho.
- Uma tarefa desarquivada que volta para a entrada é iniciada como hoje. A API passa a aceitar a base já registrada nela.
- Regeneração dos tipos da API.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `task-actions`: o Iniciar de uma tarefa reaberta passa a oferecer a criação de uma nova branch.

## Impact

- **Telas e componentes**: `IniciarTarefaDialog.vue`, que ganha o modo retrabalho, e `TarefaDetalhePage.vue`, que decide entre abrir o diálogo e retomar direto.
- **API usada**:
  - `POST /tarefas/{identifier}/retomar`, agora com corpo opcional (`branchBase`, `branchImplementacao`, `partes`);
  - `GET /tarefas/{identifier}`, com `novaBranchSugerida`;
  - `GET /tarefas/{identifier}/branches-base-recentes`, como hoje.
- **Exige alteração na API**: sim. A change `nova-branch-ao-reiniciar` do ActumAPI precisa estar implementada antes, e os tipos regerados.
- **Código**: `src/api/tarefas.ts` (`retomarTarefa` com dados opcionais) e `src/api/schema.d.ts` (gerado).
- **Dependência de change**: parte do código da `criar-branch-ao-iniciar` do ActumUI (seletor de bases, sugestão do nome, partes).

## Fora do escopo

- Tornar a nova branch obrigatória.
- Pedir o novo prazo interno no diálogo. Ele continua em "Novo prazo", com o aviso de prazo pendente que já existe.
- Oferecer a nova branch em tarefas pausadas sem reabertura. Para isso, "Nova branch" continua disponível.
- Decidir no front quando a nova branch é sugerida. O front usa `novaBranchSugerida`, que vem da API.
- Excluir ou alterar no GitHub a branch do ciclo anterior.
