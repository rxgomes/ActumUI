# Proposal

## Why

A sincronização cria uma empresa para cada workspace do Asana a que o usuário tem acesso, com uma cor automática. Hoje, além da Aureum-ERP e da aremas.com.br, também é sincronizado "Meu espaço de trabalho", o workspace pessoal do Asana. Não há como, pelo front, desligar um workspace que não interessa nem trocar a cor que identifica cada empresa nos cartões. A API já oferece essa configuração (`GET /empresas` e `PATCH /empresas/{identifier}`). Falta a tela, que fecha a Fase 1.

## What Changes

- Nova página Empresas (`/empresas`), acessível por um novo grupo "Configurações" no menu lateral. Ela lista cada empresa com o nome, a cor, se entra na sincronização e quando foi feita a carga inicial.
- Ligar e desligar a sincronização de uma empresa direto na lista, com o efeito explicado: uma empresa desligada não é consultada no Asana nas próximas sincronizações.
- Trocar a cor de uma empresa com um seletor de cores, mostrando uma prévia de como ela aparece no cartão.
- Erros da API em pt-BR. Em falha, a alteração não é aplicada na tela.
- Estados de carregando, vazio (orientando a sincronizar) e erro com "Tentar novamente".

## Capabilities

### New Capabilities

- `company-settings`: consulta e ajuste das empresas pelo front (cor e participação na sincronização).

### Modified Capabilities

Nenhuma. O menu lateral (`app-shell`) ganha um grupo e um item, o que já é coberto pelo requisito existente de listar as telas em grupos recolhíveis.

## Impact

- **Telas e componentes afetados:**
  - Nova `EmpresasPage.vue` e nova rota `empresas`.
  - Componente novo para a linha da empresa, em `src/components/empresas/`.
  - Novo item "Empresas" no grupo "Configurações" do `MainLayout.vue`.
  - Função nova `alterarEmpresa` em `src/api/empresas.ts`.
- **Endpoints da API usados:** `GET /empresas` e `PATCH /empresas/{identifier}`. Os dois já existem e estão em `src/api/schema.d.ts`, então nenhuma alteração na API é necessária.
- **Dependências novas:** nenhuma; o seletor de cores é o `QColor` do Quasar.

### Fora do escopo

- Criar, renomear ou excluir empresas. Elas vêm dos workspaces do Asana pela sincronização, e o nome acompanha o do workspace.
- Esconder do Painel as tarefas já sincronizadas de uma empresa desligada. Desligar só impede novas consultas; as tarefas existentes continuam como estão.
- Disparar uma sincronização a partir desta tela (o botão continua no Painel).
