# Spec Delta

## ADDED Requirements

### Requirement: Abrir o detalhe pelo cartão
Clicar no cartão de uma tarefa no Painel SHALL abrir o Detalhe dessa tarefa, preservando os filtros do Painel para a volta.

#### Scenario: Abrir uma tarefa filtrada
- **WHEN** o usuário, com o Painel filtrado pela Aureum-ERP, clica no cartão "Prioridade - IPI devolvido (reabrindo)"
- **THEN** o Detalhe dessa tarefa MUST ser aberto, e a volta ao Painel MUST manter o filtro da Aureum-ERP
