# Spec Delta

## MODIFIED Requirements

### Requirement: Branches da tarefa
A página SHALL listar as branches da tarefa com tipo (base ou implementação), nome, partes (Front e/ou Back, quando houver), o texto da tag no Asana devolvido pela API e indicação de já enviada ao Asana como tag, além do número do retrabalho quando a branch foi registrada durante um retrabalho.

#### Scenario: Branch enviada e branch pendente
- **WHEN** a tarefa tem a branch `main` enviada e a branch `fix/ipi-devolvido-pagamento` não enviada, registrada no retrabalho 1
- **THEN** a página MUST indicar `main` como enviada ao Asana e `fix/ipi-devolvido-pagamento` como pendente, do retrabalho 1

#### Scenario: Branch com partes
- **WHEN** a API devolve a branch `261105-consumidor-final-nf` com `partes = ["front", "back"]` e `tag = "(Front, Back) => 261105-consumidor-final-nf"`
- **THEN** a página MUST mostrar as partes "Front" e "Back" e a tag `(Front, Back) => 261105-consumidor-final-nf`

#### Scenario: Branch sem partes
- **WHEN** a API devolve uma branch antiga com `partes = []`
- **THEN** a página MUST mostrar só o nome e o tipo, sem indicar partes
