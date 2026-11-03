# task-board Specification

## Purpose

Define como o front exibe o painel de tarefas: os grupos devolvidos pela API, os dados de cada cartão, os filtros por empresa e texto e os estados da tela, para o usuário ver o que fazer primeiro.

## Requirements

### Requirement: Grupos do painel
O Painel SHALL exibir os grupos Retrabalho, Entrada, Atrasadas, Hoje, Esta semana, Próximas e Sem prazo, nessa ordem, com as tarefas que a API devolve em cada grupo e na ordem recebida. O front MUST NOT reagrupar nem reordenar as tarefas.

#### Scenario: Tarefas nos grupos
- **WHEN** a API devolve uma tarefa no grupo `atrasadas` e duas no grupo `hoje`
- **THEN** o Painel MUST mostrar uma tarefa na seção Atrasadas e as duas, na mesma ordem, na seção Hoje

#### Scenario: Grupo sem tarefas
- **WHEN** a API devolve o grupo `esta_semana` com a lista vazia
- **THEN** a seção Esta semana MUST continuar visível, informando que não há tarefas

### Requirement: Resumo dos grupos
O Painel SHALL exibir, acima das seções, um resumo com a quantidade de tarefas de cada grupo, cada um com ícone e cor próprios: Retrabalho em laranja, Atrasadas em vermelho e Hoje em azul.

#### Scenario: Contadores
- **WHEN** a API devolve 2 tarefas em `retrabalho`, 3 em `atrasadas` e nenhuma em `hoje`
- **THEN** o resumo MUST mostrar Retrabalho 2, Atrasadas 3 e Hoje 0

### Requirement: Cartão da tarefa
Cada tarefa SHALL ser exibida num cartão com título, nome e cor da empresa, projetos, prazo interno, prioridade, quantidade de retrabalhos e de comentários não lidos e a indicação de bloqueada.

#### Scenario: Tarefa reaberta com comentários
- **WHEN** uma tarefa tem `quantidadeRetrabalhos = 2` e `comentariosNaoLidos = 3`
- **THEN** o cartão MUST indicar 2 retrabalhos e 3 comentários não lidos

#### Scenario: Tarefa bloqueada
- **WHEN** uma tarefa tem `bloqueada = true`
- **THEN** o cartão MUST indicar que a tarefa está bloqueada

#### Scenario: Cor da empresa
- **WHEN** a tarefa é da empresa Aureum-ERP com a cor `#388E3C`
- **THEN** o cartão MUST mostrar o nome "Aureum-ERP" identificado com essa cor

### Requirement: Prazos no cartão
O cartão SHALL mostrar o prazo interno no formato `dd/MM/yyyy` e MUST mostrar o prazo do Asana somente quando ele for diferente do prazo interno. Quando o prazo interno estiver pendente após uma reabertura, o cartão MUST indicar que o novo prazo precisa ser definido.

#### Scenario: Prazos iguais
- **WHEN** a tarefa tem `prazoInterno = 2026-11-04` e `prazoAsana = 2026-11-04`
- **THEN** o cartão MUST mostrar só "04/11/2026"

#### Scenario: Prazos diferentes
- **WHEN** a tarefa tem `prazoInterno = 2026-11-04` e `prazoAsana = 2026-11-10`
- **THEN** o cartão MUST mostrar o prazo interno "04/11/2026" e o prazo do Asana "10/11/2026"

#### Scenario: Prazo pendente
- **WHEN** a tarefa tem `prazoInternoPendente = true`
- **THEN** o cartão MUST indicar que o prazo precisa ser redefinido

#### Scenario: Sem prazo interno
- **WHEN** a tarefa não tem prazo interno nem prazo do Asana
- **THEN** o cartão MUST indicar que está sem prazo

### Requirement: Filtro por empresa
O Painel SHALL permitir filtrar por uma empresa, escolhida entre as empresas devolvidas pela API, ou mostrar todas. A empresa escolhida MUST ser enviada à API, e o filtro MUST ser mantido no endereço da página.

#### Scenario: Escolher uma empresa
- **WHEN** o usuário escolhe a empresa Aureum-ERP
- **THEN** o painel MUST ser recarregado só com as tarefas da Aureum-ERP, e o endereço MUST incluir o filtro

#### Scenario: Recarregar a página
- **WHEN** o usuário recarrega o Painel com o filtro de empresa no endereço
- **THEN** o painel MUST abrir já filtrado por essa empresa

### Requirement: Busca por texto
O Painel SHALL permitir buscar por texto no título e na descrição, delegando à API a comparação sem diferenciar maiúsculas e acentos. A busca MUST ser enviada só depois que o usuário parar de digitar, e MUST ser mantida no endereço da página.

#### Scenario: Busca sem acento
- **WHEN** o usuário digita "devolucao"
- **THEN** o painel MUST ser recarregado com a busca "devolucao", mostrando as tarefas que a API devolver (como "Devolução de IPI")

#### Scenario: Limpar a busca
- **WHEN** o usuário apaga o texto da busca
- **THEN** o painel MUST voltar a mostrar todas as tarefas do filtro de empresa atual

### Requirement: Estados do painel
O Painel SHALL indicar quando está carregando, MUST mostrar a mensagem do erro em pt-BR com a opção de tentar novamente quando a carga falhar, e MUST orientar o usuário a sincronizar quando não houver nenhuma tarefa aberta.

#### Scenario: API indisponível
- **WHEN** a carga do painel falha porque a API está desligada
- **THEN** o Painel MUST mostrar a mensagem de API indisponível e um botão para tentar novamente

#### Scenario: Nenhuma tarefa
- **WHEN** a API devolve todos os grupos vazios, sem filtros aplicados
- **THEN** o Painel MUST informar que não há tarefas abertas e sugerir a sincronização com o Asana

#### Scenario: Filtro sem resultado
- **WHEN** a API devolve todos os grupos vazios com uma busca aplicada
- **THEN** o Painel MUST informar que nenhuma tarefa corresponde aos filtros

### Requirement: Abrir o detalhe pelo cartão
Clicar no cartão de uma tarefa no Painel SHALL abrir o Detalhe dessa tarefa, preservando os filtros do Painel para a volta.

#### Scenario: Abrir uma tarefa filtrada
- **WHEN** o usuário, com o Painel filtrado pela Aureum-ERP, clica no cartão "Prioridade - IPI devolvido (reabrindo)"
- **THEN** o Detalhe dessa tarefa MUST ser aberto, e a volta ao Painel MUST manter o filtro da Aureum-ERP
