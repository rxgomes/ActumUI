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
O diálogo Iniciar SHALL pedir a branch base, a branch de implementação, o prazo interno e as partes (Front e/ou Back), explicando que a branch de implementação será criada no GitHub a partir da base, nos repositórios das partes marcadas. O botão Iniciar MUST ficar desabilitado sem nenhuma parte marcada. Ao confirmar, MUST enviar os quatro dados à API e, em caso de sucesso, a página MUST mostrar a tarefa em andamento com as duas branches pendentes de envio.

#### Scenario: Início válido
- **WHEN** o usuário informa base `main`, implementação `261105-consumidor-final-nf`, prazo 10/11/2026 e marca Front e Back
- **THEN** o front MUST enviar `branchBase = main`, `branchImplementacao = 261105-consumidor-final-nf`, `prazoInterno = 2026-11-10` e `partes = ["front", "back"]`, e a página MUST mostrar a tarefa "Em andamento" com as duas branches pendentes

#### Scenario: Nenhuma parte marcada
- **WHEN** o usuário desmarca Front e Back
- **THEN** o botão Iniciar MUST ficar desabilitado

#### Scenario: Criando no GitHub
- **WHEN** o usuário confirma e a API ainda não respondeu
- **THEN** o botão Iniciar MUST indicar carregamento, e o diálogo MUST NOT permitir cancelar nem confirmar de novo

#### Scenario: Base inexistente no GitHub
- **WHEN** a API responde `400` dizendo que a base não existe no repositório de back
- **THEN** o diálogo MUST mostrar essa mensagem e permanecer aberto com os dados preenchidos

#### Scenario: GitHub fora do ar
- **WHEN** a API responde `502`
- **THEN** o diálogo MUST mostrar a mensagem da API e permitir confirmar de novo

#### Scenario: Campo obrigatório ausente
- **WHEN** a API responde `400` com `errors` para `PrazoInterno` ou `Partes`
- **THEN** a mensagem MUST aparecer junto do campo do prazo interno ou das caixas Front/Back

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
O diálogo Nova branch SHALL pedir o tipo (base ou implementação), o nome e as partes (Front e/ou Back), explicando que uma branch de implementação será criada no GitHub a partir da base da tarefa e que uma base precisa existir no GitHub. O botão MUST ficar desabilitado sem nenhuma parte marcada. A página MUST permitir excluir apenas branches ainda não enviadas ao Asana, após confirmação, avisando que a branch não é excluída no GitHub.

#### Scenario: Nova implementação no retrabalho
- **WHEN** o usuário registra a implementação `fix/ipi-devolvido-pagamento` com a parte Front
- **THEN** o front MUST enviar `tipo = implementacao`, `nome = fix/ipi-devolvido-pagamento` e `partes = ["front"]`

#### Scenario: Nome repetido
- **WHEN** o usuário registra uma branch com nome já existente na tarefa e a API responde `409`
- **THEN** o diálogo MUST mostrar a mensagem da API no campo do nome

#### Scenario: Base inexistente
- **WHEN** o usuário registra uma base e a API responde `400` dizendo que ela não existe no repositório
- **THEN** o diálogo MUST mostrar essa mensagem e permanecer aberto

#### Scenario: Branch enviada
- **WHEN** uma branch já foi enviada ao Asana
- **THEN** a página MUST NOT oferecer a exclusão dessa branch

### Requirement: Prévia da conclusão
O diálogo Concluir SHALL mostrar, antes de confirmar, as tags que serão adicionadas à tarefa no Asana, exatamente como a API as devolve, e, quando a conclusão não for permitida, o motivo informado pela API, sem permitir confirmar.

#### Scenario: Conclusão permitida
- **WHEN** a prévia indica conclusão permitida com as tags `(Front, Back) => main` e `(Front, Back) => 261105-consumidor-final-nf`
- **THEN** o diálogo MUST listar as duas tags com esse texto e permitir confirmar

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

### Requirement: Bases recentes no Iniciar
A branch base do diálogo Iniciar SHALL ser um seletor com as bases recentes devolvidas pela API para a tarefa, com a primeira já selecionada, e MUST aceitar digitar uma base que não está na lista. O diálogo MUST tratar os estados da lista: carregando, vazia (orienta a digitar a base) e erro (permite digitar a base normalmente).

#### Scenario: Bases recentes
- **WHEN** a API devolve `["hotfix", "develop", "main"]`
- **THEN** o seletor MUST oferecer as três nessa ordem, com `hotfix` selecionada

#### Scenario: Base nova
- **WHEN** o usuário digita `release/2026-12`, que não está na lista
- **THEN** o front MUST enviar `branchBase = release/2026-12`

#### Scenario: Nenhuma base usada
- **WHEN** a API devolve uma lista vazia
- **THEN** o campo MUST ficar vazio, com uma orientação para digitar o nome da base

#### Scenario: Falha ao carregar as bases
- **WHEN** a consulta das bases recentes falha
- **THEN** o campo MUST continuar aceitando digitação e MUST indicar que as bases recentes não puderam ser carregadas

### Requirement: Sugestão do nome da branch de implementação
Ao abrir o diálogo Iniciar, a branch de implementação SHALL vir preenchida com `yyMMdd-` (data de hoje) seguido do título da tarefa em minúsculas, sem acentos, com cada sequência de caracteres fora de `a-z` e `0-9` trocada por um hífen e sem hífens nas pontas, limitada a 60 caracteres sem terminar em hífen. O usuário MUST poder alterar a sugestão.

#### Scenario: Título com acentos e pontuação
- **WHEN** o diálogo é aberto em 05/11/2026 para a tarefa "Consumidor final NF-e: ajuste no cálculo"
- **THEN** a branch de implementação MUST vir como `261105-consumidor-final-nf-e-ajuste-no-calculo`

#### Scenario: Título longo
- **WHEN** o título gera mais de 60 caracteres
- **THEN** a sugestão MUST ser cortada em 60 caracteres, sem hífen no fim

#### Scenario: Sugestão alterada
- **WHEN** o usuário troca a sugestão por `feature/nf-consumidor`
- **THEN** o front MUST enviar `branchImplementacao = feature/nf-consumidor`

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
