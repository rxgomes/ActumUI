# task-actions Specification

## Purpose

Define como o usuário executa pelo front as ações do ciclo de vida de uma tarefa (iniciar, bloquear, desbloquear, prazo e prioridade, branches e conclusão), com as regras validadas pela API e as respostas apresentadas em pt-BR.

## Requirements

### Requirement: Ações conforme o status
A página de detalhe SHALL oferecer somente as ações que fazem sentido no status atual:
- Iniciar em `entrada`;
- Bloquear em `em_andamento` e `retrabalho`;
- Desbloquear em `bloqueada`;
- Nova branch e Concluir em `em_andamento`, `bloqueada` e `retrabalho`;
- Novo prazo em qualquer status, exceto `arquivada`.

#### Scenario: Tarefa na entrada
- **WHEN** o usuário abre uma tarefa em `entrada`
- **THEN** a página MUST oferecer Iniciar e Novo prazo, e MUST NOT oferecer Concluir

#### Scenario: Tarefa arquivada
- **WHEN** o usuário abre uma tarefa `arquivada`
- **THEN** a página MUST NOT oferecer nenhuma ação

### Requirement: Validação feita pela API
As regras das ações SHALL ser validadas pela API. Quando a API recusar uma ação, o front MUST mostrar a mensagem dela em pt-BR e MUST manter a tarefa como estava.

#### Scenario: Branches iguais ao iniciar
- **WHEN** o usuário tenta iniciar com a mesma branch como base e implementação e a API responde `400`
- **THEN** o diálogo MUST mostrar a mensagem da API e permanecer aberto, sem alterar a tarefa

### Requirement: Iniciar tarefa
O diálogo Iniciar SHALL pedir a branch base, a branch de implementação e o prazo interno. Ao confirmar, MUST enviar os três à API e, em caso de sucesso, a página MUST mostrar a tarefa em andamento com as duas branches pendentes de envio.

#### Scenario: Início válido
- **WHEN** o usuário informa base `main`, implementação `feature/ipi-devolvido` e prazo 10/11/2026
- **THEN** o front MUST enviar `branchBase = main`, `branchImplementacao = feature/ipi-devolvido` e `prazoInterno = 2026-11-10`, e a página MUST mostrar a tarefa "Em andamento" com as duas branches pendentes

#### Scenario: Campo obrigatório ausente
- **WHEN** a API responde `400` com `errors` para `PrazoInterno`
- **THEN** a mensagem MUST aparecer no campo do prazo interno do diálogo

### Requirement: Bloquear e desbloquear
O front SHALL bloquear e desbloquear a tarefa pela API e MUST mostrar o novo status, indicando o status ao qual a tarefa voltará quando estiver bloqueada.

#### Scenario: Bloqueio durante retrabalho
- **WHEN** o usuário bloqueia uma tarefa em `retrabalho` e depois a desbloqueia
- **THEN** a página MUST mostrar "Bloqueada" e, após desbloquear, "Retrabalho"

### Requirement: Novo prazo e prioridade
O diálogo Novo prazo SHALL permitir definir o prazo interno e a prioridade (1 a 3). Quando o prazo estiver pendente após uma reabertura, o diálogo MUST informar isso e mostrar o prazo anterior.

#### Scenario: Prazo pendente após reabertura
- **WHEN** o usuário abre Novo prazo numa tarefa com prazo pendente cujo prazo anterior era 20/10/2026 e informa 07/11/2026
- **THEN** o diálogo MUST mostrar o prazo anterior "20/10/2026", o front MUST enviar `prazoInterno = 2026-11-07`, e a página MUST deixar de indicar o prazo pendente

#### Scenario: Alterar só a prioridade
- **WHEN** o usuário muda apenas a prioridade para 1
- **THEN** o front MUST enviar a prioridade 1 sem alterar o prazo interno

### Requirement: Nova branch e exclusão
O diálogo Nova branch SHALL pedir o tipo (base ou implementação) e o nome. A página MUST permitir excluir apenas branches ainda não enviadas ao Asana, após confirmação.

#### Scenario: Nome repetido
- **WHEN** o usuário registra uma branch com nome já existente na tarefa e a API responde `409`
- **THEN** o diálogo MUST mostrar a mensagem da API no campo do nome

#### Scenario: Branch enviada
- **WHEN** uma branch já foi enviada ao Asana
- **THEN** a página MUST NOT oferecer a exclusão dessa branch

### Requirement: Prévia da conclusão
O diálogo Concluir SHALL mostrar, antes de confirmar, as tags que serão adicionadas à tarefa no Asana e, quando a conclusão não for permitida, o motivo informado pela API, sem permitir confirmar.

#### Scenario: Conclusão permitida
- **WHEN** a prévia indica conclusão permitida com as tags `main` e `feature/ipi-devolvido`
- **THEN** o diálogo MUST listar as duas tags e permitir confirmar

#### Scenario: Retrabalho na mesma branch
- **WHEN** a prévia indica conclusão permitida sem tags a adicionar
- **THEN** o diálogo MUST informar que nenhuma tag será adicionada e que a tarefa só será concluída no Asana

#### Scenario: Sem branch de implementação
- **WHEN** a prévia indica conclusão não permitida com o motivo "Informe a branch de implementação antes de concluir."
- **THEN** o diálogo MUST mostrar esse motivo e MUST NOT permitir confirmar

### Requirement: Concluir tarefa
Ao confirmar a conclusão, o front SHALL solicitar a conclusão à API. Em sucesso, a página MUST mostrar a tarefa concluída e as branches como enviadas. Em falha, o diálogo MUST mostrar a mensagem da API e permitir tentar de novo, atualizando a prévia.

#### Scenario: Conclusão bem-sucedida
- **WHEN** o usuário confirma a conclusão e a API responde `200`
- **THEN** a página MUST mostrar a tarefa "Concluída" com todas as branches enviadas ao Asana

#### Scenario: Asana fora do ar no meio da conclusão
- **WHEN** a API responde `502` depois de enviar a primeira tag
- **THEN** o diálogo MUST mostrar a mensagem da API e permitir tentar de novo, e a prévia atualizada MUST listar só as tags ainda não enviadas

#### Scenario: Tarefa excluída no Asana
- **WHEN** a API responde `400` informando que a tarefa não existe mais no Asana
- **THEN** o diálogo MUST mostrar essa mensagem, e a tarefa MUST permanecer com o status anterior
