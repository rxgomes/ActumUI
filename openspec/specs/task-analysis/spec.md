# task-analysis Specification

## Purpose

Define como o front exibe e conduz a análise com IA da demanda de uma tarefa no detalhe: geração com um clique, objetivo, checklist por área com os trechos vagos, testes e dúvidas marcáveis, reanálise e versões anteriores.

## Requirements

### Requirement: Seção Análise com IA no detalhe
A página de detalhe da tarefa SHALL exibir a seção "Análise com IA" no topo da coluna lateral, ao lado dos dados e da descrição (visível ao abrir a tarefa, sem rolar), carregada por `GET /tarefas/{identifier}/analises` e `GET /claude/situacao`, sem atrasar a exibição do resto do detalhe.

#### Scenario: Carregando
- **WHEN** o detalhe da tarefa já foi exibido e as análises ainda estão sendo lidas
- **THEN** a seção MUST mostrar um indicador de carregamento enquanto o resto da página continua utilizável

#### Scenario: Falha ao carregar
- **WHEN** a leitura das análises falha
- **THEN** a seção MUST mostrar a mensagem de erro da API e um botão "Tentar novamente", sem afetar o resto do detalhe

### Requirement: Análise com um clique
Sem análise, a seção SHALL oferecer o botão "Analisar com IA", que chama `POST /tarefas/{identifier}/analises` e exibe a análise devolvida. A seção MUST informar que a análise é paga e envia o conteúdo da tarefa à Anthropic.

#### Scenario: Primeira análise
- **WHEN** a tarefa nunca foi analisada e o usuário clica em "Analisar com IA"
- **THEN** a seção MUST mostrar o progresso (a análise pode levar até um minuto) e, ao terminar, exibir a análise e notificar "Análise concluída."

#### Scenario: Chave não configurada
- **WHEN** `GET /claude/situacao` informa `configurado=false`
- **THEN** a seção MUST explicar que a chave da Claude API não está configurada, mostrar o comando `dotnet user-secrets set "Claude:ApiKey" "<sua-chave>" --project src/Actum.Api` e não oferecer o botão de análise

#### Scenario: Tarefa arquivada
- **WHEN** a tarefa está arquivada
- **THEN** o botão de análise MUST ficar desabilitado com a explicação de que tarefas arquivadas não podem ser analisadas; análises existentes continuam visíveis

#### Scenario: Falha da análise
- **WHEN** a API responde erro ao analisar (`400` sem créditos, chave recusada ou recusa do modelo; `409` análise em andamento; `502` indisponível ou resposta incompleta; falha de rede)
- **THEN** a seção MUST exibir a mensagem da API em destaque, manter a análise anterior (se houver) e permitir tentar de novo

### Requirement: Exibição da análise
A seção SHALL exibir a versão atual com o objetivo, o checklist agrupado por área na ordem da API, os testes, as dúvidas, o progresso do checklist e o rodapé com versão, data e hora, modelo e tokens.

#### Scenario: Checklist por área com trecho vago
- **WHEN** a análise tem os grupos "Front", "Back: cálculo" e "Back: integração TecnoSpeed" e um item do grupo "Back: cálculo" tem `vago` preenchido
- **THEN** os itens MUST aparecer sob o título de cada grupo, nessa ordem, e o item vago MUST mostrar um aviso ⚠️ com a explicação

#### Scenario: Progresso do checklist
- **WHEN** 3 dos 11 itens do checklist estão marcados
- **THEN** a seção MUST mostrar "3 de 11 itens feitos"

#### Scenario: Sem testes ou sem dúvidas
- **WHEN** a análise não tem testes ou não tem dúvidas
- **THEN** o bloco correspondente MUST ser omitido

### Requirement: Marcação dos itens
Cada item do checklist, teste e dúvida da versão atual SHALL ter uma caixa de marcação que chama `PATCH /tarefas/{identifier}/analises/itens/{itemIdentifier}` e mostra o item como feito (checklist), realizado (teste) ou resolvido (dúvida).

#### Scenario: Marcar item
- **WHEN** o usuário marca um item do checklist
- **THEN** a caixa MUST ficar indisponível até a resposta da API, e o item MUST aparecer marcado e riscado, com o progresso atualizado

#### Scenario: Falha ao marcar
- **WHEN** a API responde erro à marcação
- **THEN** o item MUST voltar ao estado anterior e o erro MUST ser notificado

### Requirement: Reanálise e versões
A seção SHALL oferecer "Reanalisar", que pede confirmação (a chamada é paga e gera nova versão) e exibe a nova versão como atual. As versões anteriores SHALL poder ser consultadas, somente leitura.

#### Scenario: Reanalisar
- **WHEN** a tarefa tem a versão 1 e o usuário confirma "Reanalisar"
- **THEN** a seção MUST exibir a versão 2 como atual, com os itens que a API devolveu já marcados

#### Scenario: Cancelar a reanálise
- **WHEN** o usuário cancela a confirmação
- **THEN** nenhuma chamada MUST ser feita

#### Scenario: Consultar versão anterior
- **WHEN** a tarefa tem duas versões e o usuário escolhe a versão 1
- **THEN** a seção MUST exibir a versão 1 com as caixas de marcação desabilitadas e a indicação de que é uma versão anterior, com a opção de voltar à atual

### Requirement: Copiar dúvidas
A seção SHALL oferecer "Copiar dúvidas", que copia as dúvidas da versão exibida, numeradas, para a área de transferência.

#### Scenario: Copiar
- **WHEN** a análise tem duas dúvidas e o usuário clica em "Copiar dúvidas"
- **THEN** a área de transferência MUST conter as duas perguntas numeradas, uma por linha, e o usuário MUST ser notificado "Dúvidas copiadas."
