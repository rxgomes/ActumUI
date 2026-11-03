# company-settings Specification

## Purpose

Define como o usuário consulta e ajusta pelo front as empresas (workspaces do Asana): a cor que as identifica e se entram na sincronização.

## Requirements

### Requirement: Lista de empresas
A página Empresas SHALL listar todas as empresas devolvidas pela API, na ordem recebida, com o nome, a cor, se entra na sincronização e a data da carga inicial (ou a indicação de que ainda não houve).

#### Scenario: Empresas sincronizadas
- **WHEN** a API devolve a Aureum-ERP com a cor `#388E3C`, sincronização ligada e carga inicial em `2026-11-03T12:37:25`
- **THEN** a página MUST mostrar "Aureum-ERP" com essa cor, a sincronização ligada e "Carga inicial em 03/11/2026 12:37"

#### Scenario: Empresa sem carga inicial
- **WHEN** a empresa ainda não teve a carga inicial
- **THEN** a página MUST indicar que a carga inicial será feita na próxima sincronização

### Requirement: Acesso pelo menu
O menu lateral SHALL oferecer a página Empresas no grupo "Configurações".

#### Scenario: Abrir pelo menu
- **WHEN** o usuário clica em "Empresas" no grupo "Configurações"
- **THEN** a página Empresas MUST ser aberta, com o item destacado no menu

### Requirement: Ligar e desligar a sincronização
O usuário SHALL poder ligar ou desligar a sincronização de cada empresa. A alteração MUST ser enviada à API na hora, e a página MUST explicar que uma empresa desligada não é consultada no Asana nas próximas sincronizações.

#### Scenario: Desligar o workspace pessoal
- **WHEN** o usuário desliga a sincronização de "Meu espaço de trabalho"
- **THEN** o front MUST enviar `sincronizar = false` para essa empresa, e a página MUST mostrá-la como fora da sincronização

#### Scenario: Falha ao salvar
- **WHEN** o usuário desliga uma empresa e a API não responde
- **THEN** a página MUST mostrar a mensagem de API indisponível e MUST manter a sincronização como estava

### Requirement: Trocar a cor
O usuário SHALL poder escolher uma nova cor para a empresa num seletor de cores, vendo uma prévia antes de salvar. Ao salvar, a cor MUST ser enviada à API no formato `#RRGGBB` e passar a identificar a empresa nos cartões do Painel.

#### Scenario: Nova cor
- **WHEN** o usuário escolhe `#7B1FA2` para a aremas.com.br e salva
- **THEN** o front MUST enviar `cor = #7B1FA2`, e a aremas.com.br MUST aparecer com essa cor na página e nos cartões do Painel

#### Scenario: Cancelar a troca
- **WHEN** o usuário escolhe uma cor e cancela
- **THEN** nada MUST ser enviado à API, e a empresa MUST manter a cor anterior

#### Scenario: Cor recusada pela API
- **WHEN** a API responde `400` com erro no campo `Cor`
- **THEN** a mensagem da API MUST ser exibida, e a empresa MUST manter a cor anterior

### Requirement: Estados da página Empresas
A página SHALL indicar quando está carregando, MUST mostrar a mensagem de erro em pt-BR com a opção de tentar novamente quando a carga falhar, e MUST orientar o usuário a sincronizar quando ainda não houver empresas.

#### Scenario: Nenhuma empresa
- **WHEN** a API devolve a lista vazia
- **THEN** a página MUST informar que as empresas são criadas pela sincronização com o Asana, a partir dos workspaces do usuário

#### Scenario: API indisponível
- **WHEN** a carga das empresas falha porque a API está desligada
- **THEN** a página MUST mostrar a mensagem de API indisponível e um botão para tentar novamente
