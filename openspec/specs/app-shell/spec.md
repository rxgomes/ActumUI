# app-shell Specification

## Purpose

Define a estrutura comum em que todas as telas do Actum são exibidas, no estilo do ERP Aureum: cabeçalho, menu lateral, cabeçalho de página, aviso de conexão com o Asana e tratamento de rotas inexistentes.

## Requirements

### Requirement: Cabeçalho da aplicação
Toda tela SHALL exibir um cabeçalho azul-escuro com o nome "Actum" e um botão que mostra e oculta o menu lateral.

#### Scenario: Ocultar o menu
- **WHEN** o usuário clica no botão do menu no cabeçalho com o menu visível
- **THEN** o menu lateral MUST ser ocultado, e um novo clique MUST exibi-lo de novo

### Requirement: Menu lateral
O menu lateral SHALL listar as telas disponíveis em grupos recolhíveis e MUST destacar a tela atual.

#### Scenario: Tela atual destacada
- **WHEN** o usuário está no Painel
- **THEN** o item "Painel" do grupo "Tarefas" MUST aparecer destacado

### Requirement: Cabeçalho de página
Toda página SHALL exibir o próprio título e, abaixo dele, a data atual por extenso em pt-BR.

#### Scenario: Título e data
- **WHEN** o usuário abre o Painel em `2026-11-04`
- **THEN** a página MUST exibir o título "Painel" e, abaixo, "Quarta-feira, 04 de novembro de 2026"

### Requirement: Aviso de conexão com o Asana
Ao abrir o front, a aplicação SHALL verificar a conexão com o Asana e MUST exibir um aviso permanente, visível em todas as telas, quando o token não estiver configurado ou for inválido, explicando como resolver.

#### Scenario: Token não configurado
- **WHEN** a API informa `configurado = false`
- **THEN** um aviso MUST informar que o token do Asana não está configurado e indicar o comando `dotnet user-secrets set "Asana:Token"`

#### Scenario: Token inválido
- **WHEN** a API informa `configurado = true` e `valido = false`
- **THEN** um aviso MUST informar que o Asana recusou o token e que é preciso gerar e configurar um novo

#### Scenario: Conexão válida
- **WHEN** a API informa `valido = true`
- **THEN** nenhum aviso MUST ser exibido

#### Scenario: Asana fora do ar ou API desligada
- **WHEN** a verificação da conexão falha (Asana indisponível ou API desligada)
- **THEN** o aviso MUST informar que não foi possível verificar a conexão, com a mensagem do erro em pt-BR

### Requirement: Rota inexistente
Ao acessar um endereço que não corresponde a nenhuma tela, a aplicação SHALL exibir, dentro do layout, uma página informando que a página não foi encontrada, com um atalho para o Painel.

#### Scenario: Endereço digitado errado
- **WHEN** o usuário acessa `/pagina-que-nao-existe`
- **THEN** a aplicação MUST exibir "Página não encontrada" e um botão que leva ao Painel
