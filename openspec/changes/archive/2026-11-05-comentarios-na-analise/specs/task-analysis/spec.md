# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Comentários atualizados pela análise
Depois de uma análise ou reanálise concluída, a página de detalhe SHALL recarregar a tarefa, para os comentários que a API trouxe do Asana aparecerem na lista de comentários.

#### Scenario: Comentário novo trazido pela análise
- **WHEN** a análise termina com sucesso e a API gravou um comentário que estava só no Asana
- **THEN** o comentário MUST aparecer na lista de comentários do detalhe sem o usuário recarregar a página

#### Scenario: Análise com falha
- **WHEN** a análise falha
- **THEN** o detalhe MUST NOT ser recarregado e a mensagem da API MUST ser exibida como nas outras falhas da análise
