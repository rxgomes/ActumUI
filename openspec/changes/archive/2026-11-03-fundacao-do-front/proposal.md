# Proposal

## Why

O ActumUI tem só o projeto inicial: Quasar configurado, um layout simples e uma página provisória que chama a API com `fetch` direto, sem tipos e sem tratamento de erro. Antes das telas da Fase 1 (Painel, Detalhe e diálogos), o front precisa de uma base comum para falar com a API de forma tipada, mostrar os erros dela de um jeito único em pt-BR, lidar com as datas sem fuso e oferecer o layout em que as telas serão encaixadas. Sem isso, cada tela resolveria esses pontos de um jeito diferente.

## What Changes

- Tipos TypeScript dos DTOs gerados a partir do documento OpenAPI da API (`/openapi/v1.json`), com um script npm para regenerá-los.
- Cliente HTTP tipado em `src/api`, com o endereço base vindo de `VITE_API_URL`. Componentes e páginas deixam de chamar `fetch` diretamente.
- Tratamento padrão de erros da API: Problem Details vira uma mensagem em pt-BR para o usuário, erros de validação viram erros por campo e falha de rede vira o aviso de API indisponível.
- Utilitários de data para os campos sem horário (`yyyy-MM-dd`) e com horário local, sem deslocamento de fuso, com formatação em pt-BR.
- Layout base no estilo do ERP Aureum: cabeçalho azul-escuro, menu lateral recolhível, cabeçalho de página com título e data e aviso permanente quando o token do Asana não está configurado ou é inválido.
- Página de rota inexistente.
- A página Painel provisória passa a usar a base nova; o painel de verdade fica para a change seguinte.
- Testes unitários com Vitest para os utilitários de data e o tratamento de erros.

## Capabilities

### New Capabilities

- `api-client`: acesso do front à Actum API (endereço, tipos do contrato, interpretação de erros e de falhas de conexão, conversão de datas).
- `app-shell`: estrutura comum das telas (cabeçalho, menu, cabeçalho de página, aviso de conexão com o Asana, rota inexistente).

### Modified Capabilities

Nenhuma (não há specs no ActumUI ainda).

## Impact

- **Telas e componentes afetados:** `MainLayout.vue` (reescrito com menu, aviso do Asana e área de página), `PainelPage.vue` (provisória, passa a usar o cliente e o cabeçalho de página), novos `PaginaCabecalho.vue` e `NaoEncontradaPage.vue`, novo `src/api/`.
- **Endpoints da API usados:** `GET /asana/conexao` (aviso do Asana) e o documento `GET /openapi/v1.json` (geração dos tipos, só em desenvolvimento). Nenhuma alteração na API é necessária.
- **Dependências novas:** `openapi-fetch` (cliente tipado), `openapi-typescript` (geração dos tipos, desenvolvimento) e `vitest` (testes, desenvolvimento).
- **Fluxo de desenvolvimento:** gerar os tipos exige a API rodando em `Development` (`http://localhost:5180`). Os tipos gerados são versionados, para o build funcionar sem a API.

### Fora do escopo

- Painel agrupado, sincronização, detalhe da tarefa e diálogos (changes seguintes).
- Configuração das empresas.
- Tema escuro, responsividade fina para celular e internacionalização além do pt-BR.
- Testes de componentes e testes ponta a ponta no navegador.
- Autenticação (uso local, sem login).
