# task-sync Specification

## Purpose

Define como o usuário dispara pelo front a sincronização com o Asana e acompanha o resultado e a última sincronização, sem precisar chamar a API diretamente.

## Requirements

### Requirement: Sincronizar pelo Painel
O Painel SHALL oferecer um botão Sincronizar que solicita a sincronização à API. Enquanto ela estiver em andamento, o botão MUST indicar progresso e MUST NOT aceitar um novo clique.

#### Scenario: Sincronização em andamento
- **WHEN** o usuário clica em Sincronizar
- **THEN** o botão MUST indicar progresso e ficar indisponível até a API responder

### Requirement: Resultado da sincronização
Ao concluir a sincronização, o front SHALL mostrar o resumo em pt-BR (tarefas novas, atualizadas, arquivadas e reaberturas) e MUST recarregar o painel com os filtros atuais.

#### Scenario: Sincronização bem-sucedida
- **WHEN** a API responde com 3 tarefas novas, 1 atualizada, 0 arquivadas e 1 reabertura
- **THEN** o usuário MUST ver um resumo com esses números, e o painel MUST ser recarregado

### Requirement: Falha da sincronização
Quando a sincronização falhar, o front SHALL mostrar a mensagem de erro da API em pt-BR e MUST manter o painel como estava.

#### Scenario: Sincronização já em andamento
- **WHEN** a API responde `409` porque já existe uma sincronização em andamento
- **THEN** o usuário MUST ver a mensagem da API sobre a sincronização em andamento

#### Scenario: Asana indisponível
- **WHEN** a API responde `502` durante a sincronização
- **THEN** o usuário MUST ver a mensagem da API sobre a falha de comunicação com o Asana, e a informação da última sincronização MUST passar a indicar a falha

### Requirement: Sincronização indisponível sem token válido
O botão Sincronizar MUST ficar indisponível quando a conexão com o Asana indicar token não configurado ou inválido, informando o motivo ao usuário.

#### Scenario: Token não configurado
- **WHEN** a conexão com o Asana indica `configurado = false`
- **THEN** o botão Sincronizar MUST estar indisponível, com a explicação de que o token do Asana não está configurado

### Requirement: Última sincronização
O Painel SHALL exibir a data e a hora da última sincronização e se ela teve sucesso ou falhou, com a mensagem do erro quando houver. Quando nunca houve sincronização, MUST informar isso.

#### Scenario: Última sincronização bem-sucedida
- **WHEN** a última sincronização começou em `2026-11-03T14:30:15` e teve sucesso
- **THEN** o Painel MUST mostrar "Última sincronização: 03/11/2026 14:30" indicando sucesso

#### Scenario: Última sincronização com falha
- **WHEN** a última sincronização falhou com o erro "Não foi possível comunicar com o Asana. Tente novamente em instantes."
- **THEN** o Painel MUST indicar a falha e permitir ver essa mensagem

#### Scenario: Nunca sincronizado
- **WHEN** a API responde `404` à consulta da última sincronização
- **THEN** o Painel MUST informar que ainda não houve sincronização
