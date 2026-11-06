# task-detail Specification

## Purpose

Define como o front exibe o detalhe de uma tarefa: dados, branches, histórico de retrabalho com os comentários de cada reabertura e comentários, para o usuário entender a tarefa e o que mudou sem procurar no Asana.

## Requirements

### Requirement: Dados da tarefa
A página de detalhe SHALL exibir o título, a empresa (nome e cor), o status em pt-BR, o prazo interno, o prazo do Asana, a prioridade, os projetos e a descrição da tarefa, além de um link que abre a tarefa no Asana em outra aba.

#### Scenario: Tarefa em andamento
- **WHEN** o usuário abre uma tarefa `em_andamento` da Aureum-ERP com prazo interno `2026-11-10` e prioridade 2
- **THEN** a página MUST mostrar o status "Em andamento", a empresa Aureum-ERP na sua cor, o prazo "10/11/2026" e a prioridade "P2"

#### Scenario: Link para o Asana
- **WHEN** o usuário clica no link do Asana
- **THEN** a tarefa MUST ser aberta no Asana em outra aba

#### Scenario: Descrição com várias linhas
- **WHEN** a descrição da tarefa tem quebras de linha
- **THEN** a página MUST exibi-la como texto, preservando as quebras de linha

### Requirement: Situação de tarefa concluída ou arquivada
A página SHALL informar quando a tarefa está concluída, com a data da conclusão, ou arquivada, com o motivo em pt-BR.

#### Scenario: Tarefa arquivada por reatribuição
- **WHEN** a tarefa está `arquivada` com motivo `reatribuida`
- **THEN** a página MUST informar que a tarefa foi arquivada porque foi atribuída a outra pessoa no Asana

#### Scenario: Tarefa concluída
- **WHEN** a tarefa está `concluida` desde `2026-11-03T16:20:00`
- **THEN** a página MUST informar que a tarefa foi concluída em "03/11/2026 16:20" e aguarda teste

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

### Requirement: Comentários
A página SHALL listar todos os comentários da tarefa com autor, data e texto, do mais antigo para o mais recente, destacando os que ainda não tinham sido lidos quando a página foi aberta.

#### Scenario: Comentários novos
- **WHEN** o usuário abre uma tarefa com dois comentários não lidos
- **THEN** os dois MUST aparecer destacados como novos

### Requirement: Leitura dos comentários
Ao abrir o detalhe de uma tarefa com comentários não lidos, o front SHALL marcá-los como lidos na API, mantendo o destaque de novos até o usuário sair da página.

#### Scenario: Contador zerado no Painel
- **WHEN** o usuário abre uma tarefa com 3 comentários não lidos e volta ao Painel
- **THEN** o cartão dessa tarefa MUST mostrar 0 comentários não lidos

#### Scenario: Sem comentários novos
- **WHEN** o usuário abre uma tarefa sem comentários não lidos
- **THEN** o front MUST NOT chamar a marcação de lidos

### Requirement: Estados da página de detalhe
A página SHALL indicar quando está carregando, MUST informar quando a tarefa não existe (com atalho para o Painel) e MUST mostrar a mensagem de erro em pt-BR com a opção de tentar novamente quando a carga falhar.

#### Scenario: Tarefa inexistente
- **WHEN** o usuário acessa o detalhe de um identificador que a API responde com `404`
- **THEN** a página MUST informar que a tarefa não foi encontrada e oferecer um botão para o Painel

#### Scenario: API indisponível
- **WHEN** a carga do detalhe falha porque a API está desligada
- **THEN** a página MUST mostrar a mensagem de API indisponível e um botão para tentar novamente

### Requirement: Voltar ao Painel
A página SHALL oferecer um atalho de volta ao Painel que preserva os filtros usados antes de abrir a tarefa.

#### Scenario: Voltar com filtros
- **WHEN** o usuário abre uma tarefa a partir do Painel filtrado pela Aureum-ERP e clica em voltar
- **THEN** o Painel MUST abrir com o mesmo filtro da Aureum-ERP
