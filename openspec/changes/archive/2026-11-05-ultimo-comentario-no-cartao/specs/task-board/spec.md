# Spec Delta

## MODIFIED Requirements

### Requirement: Cartão da tarefa
Cada tarefa SHALL ser exibida num cartão com título, nome e cor da empresa, projetos, prazo interno, prioridade, quantidade de retrabalhos e de comentários não lidos, a indicação de bloqueada e, quando a tarefa tem comentários, a data e hora e o autor do último comentário.

#### Scenario: Tarefa reaberta com comentários
- **WHEN** uma tarefa tem `quantidadeRetrabalhos = 2` e `comentariosNaoLidos = 3`
- **THEN** o cartão MUST indicar 2 retrabalhos e 3 comentários não lidos

#### Scenario: Tarefa bloqueada
- **WHEN** uma tarefa tem `bloqueada = true`
- **THEN** o cartão MUST indicar que a tarefa está bloqueada

#### Scenario: Cor da empresa
- **WHEN** a tarefa é da empresa Aureum-ERP com a cor `#388E3C`
- **THEN** o cartão MUST mostrar o nome "Aureum-ERP" identificado com essa cor

#### Scenario: Último comentário
- **WHEN** a tarefa tem `ultimoComentarioEm = 2026-11-04T14:30:00` e `ultimoComentarioAutor = "Bruno"`
- **THEN** o cartão MUST mostrar "Bruno" e "04/11/2026 14:30", identificados como o último comentário

#### Scenario: Último comentário sem autor
- **WHEN** a tarefa tem `ultimoComentarioEm = 2026-11-04T14:30:00` e `ultimoComentarioAutor` nulo
- **THEN** o cartão MUST mostrar só "04/11/2026 14:30", identificado como o último comentário

#### Scenario: Tarefa sem comentários
- **WHEN** a tarefa tem `ultimoComentarioEm` nulo
- **THEN** o cartão MUST NOT mostrar a informação de último comentário
