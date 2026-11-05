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
A seção SHALL exibir a versão atual com o objetivo, o checklist agrupado por área na ordem da API, os testes, as dúvidas, as regras e observações (cada uma com a origem), o progresso do checklist e o rodapé com versão, data e hora, modelo e tokens.

#### Scenario: Checklist por área com trecho vago
- **WHEN** a análise tem os grupos "Front", "Back: cálculo" e "Back: integração TecnoSpeed" e um item do grupo "Back: cálculo" tem `vago` preenchido
- **THEN** os itens MUST aparecer sob o título de cada grupo, nessa ordem, e o item vago MUST mostrar um aviso ⚠️ com a explicação

#### Scenario: Progresso do checklist
- **WHEN** 3 dos 11 itens do checklist estão marcados
- **THEN** a seção MUST mostrar "3 de 11 itens feitos"

#### Scenario: Sem testes ou sem dúvidas
- **WHEN** a análise não tem testes ou não tem dúvidas
- **THEN** o bloco correspondente MUST ser omitido

#### Scenario: Regras com origem
- **WHEN** a análise tem a regra "O desconto não pode passar de 10%" com origem "comentário de Maria em 04/11/2026 14:30"
- **THEN** o bloco "Regras e observações" MUST mostrar a regra e, abaixo dela, a origem

#### Scenario: Sem regras
- **WHEN** a análise não tem regras, inclusive versões gravadas antes da seção existir
- **THEN** o bloco "Regras e observações" MUST ser omitido

### Requirement: Marcação dos itens
Cada item do checklist, teste, dúvida e regra da versão atual SHALL ter uma caixa de marcação que chama `PATCH /tarefas/{identifier}/analises/itens/{itemIdentifier}` e mostra o item como feito (checklist), realizado (teste), resolvido (dúvida) ou atendido (regra).

#### Scenario: Marcar item
- **WHEN** o usuário marca um item do checklist
- **THEN** a caixa MUST ficar indisponível até a resposta da API, e o item MUST aparecer marcado e riscado, com o progresso atualizado

#### Scenario: Marcar regra
- **WHEN** o usuário marca uma regra
- **THEN** a regra MUST aparecer marcada e riscada, com a dica "Regra atendida em" e a data da marcação

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

### Requirement: Enviar dúvidas ao Asana
A seção "Análise com IA" SHALL oferecer "Enviar dúvidas ao Asana", que preenche a caixa de comentário da tarefa com as dúvidas ainda não resolvidas da versão exibida, numeradas, e leva o foco até a caixa. Nada MUST ser enviado sem o clique em "Enviar ao Asana".

#### Scenario: Dúvidas não resolvidas
- **WHEN** a análise tem três dúvidas, uma delas marcada como resolvida, e o usuário clica em "Enviar dúvidas ao Asana"
- **THEN** a caixa de comentário MUST receber "Dúvidas sobre a tarefa:" seguido das duas dúvidas não resolvidas, numeradas 1 e 2, a página MUST rolar até a caixa e nenhuma chamada de envio MUST ser feita

#### Scenario: Caixa já com texto
- **WHEN** a caixa já tem um texto escrito pelo usuário
- **THEN** as dúvidas MUST ser acrescentadas depois de uma linha em branco, sem apagar o texto

#### Scenario: Todas resolvidas
- **WHEN** todas as dúvidas estão marcadas como resolvidas
- **THEN** o botão MUST ficar desabilitado com a dica "Todas as dúvidas estão resolvidas."

### Requirement: Comentários atualizados pela análise
Depois de uma análise ou reanálise concluída, a página de detalhe SHALL recarregar a tarefa, para os comentários que a API trouxe do Asana aparecerem na lista de comentários.

#### Scenario: Comentário novo trazido pela análise
- **WHEN** a análise termina com sucesso e a API gravou um comentário que estava só no Asana
- **THEN** o comentário MUST aparecer na lista de comentários do detalhe sem o usuário recarregar a página

#### Scenario: Análise com falha
- **WHEN** a análise falha
- **THEN** o detalhe MUST NOT ser recarregado e a mensagem da API MUST ser exibida como nas outras falhas da análise
