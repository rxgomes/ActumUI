# Spec Delta

## MODIFIED Requirements

### Requirement: Lista de empresas
A página Empresas SHALL listar todas as empresas devolvidas pela API, na ordem recebida, com o nome, a cor, se entra na sincronização, a data da carga inicial (ou a indicação de que ainda não houve) e os repositórios de front e de back no GitHub (ou a indicação de que não foram definidos).

#### Scenario: Empresas sincronizadas
- **WHEN** a API devolve a Aureum-ERP com a cor `#388E3C`, sincronização ligada e carga inicial em `2026-11-03T12:37:25`
- **THEN** a página MUST mostrar "Aureum-ERP" com essa cor, a sincronização ligada e "Carga inicial em 03/11/2026 12:37"

#### Scenario: Empresa sem carga inicial
- **WHEN** a empresa ainda não teve a carga inicial
- **THEN** a página MUST indicar que a carga inicial será feita na próxima sincronização

#### Scenario: Repositórios definidos
- **WHEN** a API devolve a empresa com `repositorioFront = "ixact/erp-web"` e `repositorioBack = null`
- **THEN** a página MUST mostrar "Front: ixact/erp-web" e indicar que o repositório de back não foi definido

## ADDED Requirements

### Requirement: Alterar os repositórios
O usuário SHALL poder editar os repositórios de front e de back de cada empresa, no formato `dono/repo`, e salvá-los na API. Campo vazio MUST remover o repositório. A página MUST explicar que esses repositórios recebem as branches criadas ao iniciar uma tarefa, e MUST mostrar junto de cada campo o erro devolvido pela API.

#### Scenario: Salvar os repositórios
- **WHEN** o usuário informa Front `ixact/erp-web` e Back `ixact/erp-api` e salva
- **THEN** o front MUST enviar `repositorioFront = "ixact/erp-web"` e `repositorioBack = "ixact/erp-api"`, e a página MUST mostrar os dois repositórios e confirmar com uma notificação

#### Scenario: Remover um repositório
- **WHEN** o usuário apaga o repositório de back e salva
- **THEN** o front MUST enviar `repositorioBack = ""`, e a página MUST indicar que o repositório de back não foi definido

#### Scenario: Formato recusado
- **WHEN** a API responde `400` com `errors` para `RepositorioFront`
- **THEN** a mensagem MUST aparecer no campo do repositório de front, e a edição MUST continuar aberta
