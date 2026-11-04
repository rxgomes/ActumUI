## Purpose

Define o card "Anotações privadas" do detalhe da tarefa: notas com data, criadas, editadas e excluídas no Actum, nunca enviadas ao Asana.

## ADDED Requirements

### Requirement: Card de anotações no detalhe
O detalhe da tarefa SHALL ter o card "Anotações privadas", lido de `GET /tarefas/{identifier}/anotacoes`, com as anotações da mais antiga para a mais recente, cada uma com a data de criação e, se alterada, "editada em", e o aviso de que as anotações ficam só no Actum.

#### Scenario: Sem anotações
- **WHEN** a tarefa não tem anotações
- **THEN** o card MUST mostrar "Nenhuma anotação." e o campo para a primeira

#### Scenario: Falha ao carregar
- **WHEN** a leitura das anotações falha
- **THEN** o card MUST mostrar a mensagem da API com "Tentar novamente", sem afetar o resto do detalhe

### Requirement: Criar, editar e excluir
O card SHALL permitir criar uma anotação (botão "Adicionar" ou Ctrl+Enter), editar uma anotação no lugar ("Salvar"/"Cancelar") e excluir com confirmação. Os erros de validação da API MUST aparecer no campo, e as demais falhas MUST ser notificadas mantendo o texto digitado. O card MUST funcionar em qualquer status da tarefa, inclusive arquivada.

#### Scenario: Nova anotação
- **WHEN** o usuário escreve "Testado com a NF 2958, ok" e clica em "Adicionar"
- **THEN** a anotação MUST aparecer no fim da lista, com a data, e o campo MUST ser limpo

#### Scenario: Texto vazio
- **WHEN** o usuário tenta adicionar só espaços
- **THEN** o botão MUST ficar desabilitado e nada MUST ser enviado

#### Scenario: Editar
- **WHEN** o usuário edita uma anotação e salva
- **THEN** o texto novo MUST aparecer com "editada em" e a data da alteração

#### Scenario: Excluir
- **WHEN** o usuário confirma a exclusão
- **THEN** a anotação MUST sair da lista; ao cancelar, nada MUST ser enviado
