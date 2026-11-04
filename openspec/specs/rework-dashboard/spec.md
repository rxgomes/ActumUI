# rework-dashboard Specification

## Purpose

Define a página "Retrabalho" do front: filtros de período e empresa, indicadores por empresa, evolução mensal, ranking de tarefas e o reprocessamento do histórico do Asana.

## Requirements

### Requirement: Página Retrabalho no menu
O menu lateral SHALL ter o grupo "Indicadores" com o item "Retrabalho", que abre a página `/retrabalho` com os indicadores lidos de `GET /retrabalhos/indicadores`.

#### Scenario: Abrir a página
- **WHEN** o usuário clica em Indicadores → Retrabalho
- **THEN** a página MUST abrir com o período "Últimos 6 meses" (do primeiro dia do mês, cinco meses atrás, até hoje) e todas as empresas

#### Scenario: Carregando, vazio e erro
- **WHEN** os indicadores estão sendo lidos, não há retrabalho no período ou a leitura falha
- **THEN** a página MUST mostrar respectivamente esqueletos no lugar dos blocos, a mensagem "Nenhum retrabalho no período." (os cards continuam com as tarefas concluídas) ou a mensagem da API com "Tentar novamente"

### Requirement: Filtros guardados no endereço
A página SHALL ter, numa linha acima dos blocos, o período (atalhos "Últimos 3 meses", "Últimos 6 meses", "Últimos 12 meses", "Este ano" e "Personalizado" com início e fim) e a empresa (todas ou uma). Os filtros MUST ficar na query da página e sobreviver a um recarregamento.

#### Scenario: Filtrar por empresa
- **WHEN** o usuário escolhe a empresa Aureum-ERP
- **THEN** a página MUST recarregar os indicadores só dessa empresa, e o endereço MUST conter o filtro

#### Scenario: Período personalizado inválido
- **WHEN** o início é posterior ao fim ou o período passa de 24 meses
- **THEN** a página MUST mostrar a mensagem junto ao campo, sem chamar a API

### Requirement: Cards por empresa
A página SHALL mostrar um card por empresa do filtro, mais o Total quando houver mais de uma, com a cor da empresa como marca de identidade, retrabalhos, tarefas com retrabalho, tarefas concluídas e a taxa de retrabalho com uma casa decimal.

#### Scenario: Empresa sem conclusões
- **WHEN** a taxa de uma empresa vem nula
- **THEN** o card MUST mostrar "—" na taxa, com a dica "Sem tarefas concluídas no período"

### Requirement: Evolução mensal
A página SHALL mostrar a evolução mensal em barras empilhadas por mês (uma cor por empresa, a cor da empresa), com eixo de quantidade começando em zero, legenda sempre visível quando houver mais de uma empresa, o total do mês acima da barra e uma dica ao passar o mouse com o mês e a quantidade de cada empresa. A identidade da empresa MUST NOT depender só da cor.

#### Scenario: Dica ao passar o mouse
- **WHEN** o usuário passa o mouse sobre novembro de 2026
- **THEN** a dica MUST mostrar "nov/2026" e a quantidade de cada empresa, com o nome ao lado da marca de cor

#### Scenario: Ver como tabela
- **WHEN** o usuário alterna para "Tabela"
- **THEN** a página MUST mostrar uma tabela com os meses nas linhas e as empresas nas colunas, com o total

#### Scenario: Mês sem retrabalho
- **WHEN** um mês do período não tem retrabalho
- **THEN** o mês MUST aparecer no eixo, sem barra e sem rótulo de valor

### Requirement: Ranking de tarefas
A página SHALL listar as até 10 tarefas com mais retrabalhos no período, na ordem da API, com título, empresa (nome e cor), status em pt-BR, quantidade de retrabalhos e data da última reabertura, e o título MUST abrir o detalhe da tarefa.

#### Scenario: Abrir a tarefa do ranking
- **WHEN** o usuário clica no título de uma tarefa do ranking
- **THEN** o detalhe da tarefa MUST abrir

### Requirement: Reprocessar o histórico
A página SHALL oferecer "Reprocessar histórico do Asana", que pede confirmação (lê o histórico de todas as tarefas no Asana e pode levar alguns segundos por tarefa), chama `POST /retrabalhos/reprocessamento`, mostra o progresso, notifica o resumo e recarrega os indicadores. Quando `ultimoReprocessamentoEm` vier nulo, a página MUST avisar que os retrabalhos anteriores ao Actum só entram depois do reprocessamento.

#### Scenario: Reprocessar
- **WHEN** o usuário confirma o reprocessamento e a API responde com 18 tarefas lidas e 0 → 4 retrabalhos
- **THEN** a página MUST notificar "Histórico reprocessado: 18 tarefas, retrabalhos 0 → 4." e recarregar os indicadores

#### Scenario: Falhas e conflito
- **WHEN** a resposta traz tarefas em `falhas` ou a API responde `409`
- **THEN** a página MUST listar as tarefas que falharam com a mensagem, ou mostrar a mensagem do conflito, sem perder os indicadores exibidos
