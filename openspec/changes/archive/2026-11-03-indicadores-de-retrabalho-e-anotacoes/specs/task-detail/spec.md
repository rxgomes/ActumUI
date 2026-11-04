## MODIFIED Requirements

### Requirement: Histórico de retrabalho
A página SHALL listar os retrabalhos em ordem, cada um com número, data da conclusão que precedeu a reabertura (quando a API a informa), data da reabertura, quem reabriu, prazo anterior, novo prazo e se já foi resolvido, junto com os comentários que a API associa a essa reabertura.

#### Scenario: Motivo da reabertura
- **WHEN** a tarefa foi reaberta por "Maria" em `2026-11-01T10:00:00` e a API associa ao retrabalho os comentários "O IPI da devolução não somou" e "Print em anexo"
- **THEN** o retrabalho 1 MUST mostrar "Maria", "01/11/2026 10:00" e os dois comentários

#### Scenario: Reabertura sem autor
- **WHEN** o retrabalho não tem quem reabriu (reabertura não encontrada no histórico do Asana)
- **THEN** a página MUST indicar que o autor da reabertura não foi identificado

#### Scenario: Conclusão antes da reabertura
- **WHEN** o retrabalho tem `concluidaEm` `2026-10-30T20:40:00`
- **THEN** o retrabalho MUST mostrar "Concluída em 30/10/2026 20:40" antes da reabertura; sem `concluidaEm`, essa linha MUST ser omitida
