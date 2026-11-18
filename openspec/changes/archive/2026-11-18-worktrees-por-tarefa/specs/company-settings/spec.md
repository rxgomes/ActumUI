# Spec Delta

## ADDED Requirements

### Requirement: Alterar as pastas locais
Cada linha da página Empresas SHALL ter o botão "Pastas locais", que abre um popup com o clone do front, o clone do back, a pasta dos worktrees e os arquivos a copiar de cada parte (um por linha). Só os campos alterados MUST ser enviados à API. Um caminho vazio MUST remover o valor, e uma lista sem linhas MUST limpar os arquivos. Os erros da API MUST aparecer no popup, que MUST permanecer aberto.

#### Scenario: Configurar as pastas
- **WHEN** o usuário preenche o clone do front `E:\src\aureum\erp-web`, a pasta dos worktrees `E:\wt\aureum` e o arquivo `.env.development` e clica em Salvar
- **THEN** o front MUST enviar só esses campos em `PATCH /empresas/{identifier}`, notificar o sucesso, fechar o popup e mostrar a empresa atualizada

#### Scenario: Clone recusado pela API
- **WHEN** a API responde `400` dizendo que o clone aponta para outro repositório
- **THEN** a mensagem MUST aparecer no popup, que MUST continuar aberto com os valores digitados

#### Scenario: Nada alterado
- **WHEN** o usuário clica em Salvar sem mudar nada
- **THEN** o popup MUST fechar sem chamar a API

### Requirement: Situação das pastas locais na lista
A legenda de cada empresa SHALL indicar se as pastas locais estão configuradas ou o que falta (pasta dos worktrees, clone do front, clone do back).

#### Scenario: Configuração incompleta
- **WHEN** a empresa tem a pasta dos worktrees e o clone do front, mas não o do back
- **THEN** a legenda MUST dizer que falta o clone do back
