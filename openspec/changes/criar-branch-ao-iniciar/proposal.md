# Proposal

## Why

Para iniciar uma tarefa, hoje o usuário cria a branch de implementação à mão no GitHub e digita os dois nomes num diálogo de texto livre, sem sugestão de nome nem lembrança das bases usadas. A API passa a criar a branch no GitHub e a marcar na tag se ela é do front, do back ou dos dois (change `criar-branch-ao-iniciar` no ActumAPI). O front precisa oferecer esses dados e simplificar o preenchimento.

## What Changes

- Diálogo **Iniciar**:
  - a branch base vira um seletor com as 3 bases usadas mais recentemente na empresa, que aceita digitar uma base nova;
  - a branch de implementação já vem sugerida como `yyMMdd-titulo-da-tarefa` (data de hoje e título em minúsculas, sem acentos, com hífens);
  - ganha as caixas **Front** e **Back**, que dizem em quais repositórios a branch é criada e entram nas tags;
  - o texto explica que a branch de implementação será criada no GitHub.
- Diálogo **Nova branch**: ganha as caixas Front e Back e explica que uma branch de implementação será criada no GitHub a partir da base, e que uma base precisa existir.
- **Branches da tarefa** (detalhe): mostra as partes de cada branch e o texto da tag.
- Página **Empresas**: cada empresa ganha os campos Repositório Front e Repositório Back (`dono/repo`), salvos na API.
- Prévia da conclusão: sem mudança de código. Ela já lista as tags devolvidas pela API, que passam a vir no formato novo.
- Regeneração dos tipos da API.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `task-actions`: o Iniciar passa a ter o seletor de bases recentes, a sugestão de nome, as partes Front/Back e a criação no GitHub; o Nova branch passa a ter as partes; a prévia da conclusão passa a mostrar as tags com as partes.
- `task-detail`: a lista de branches mostra as partes e a tag de cada branch.
- `company-settings`: cada empresa tem os repositórios de front e de back editáveis.

## Impact

- **Telas e componentes**: `IniciarTarefaDialog.vue`, `NovaBranchDialog.vue`, `BranchesDaTarefa.vue`, `LinhaDaEmpresa.vue` (página `EmpresasPage.vue`).
- **API usada**:
  - `POST /tarefas/{identifier}/iniciar` e `POST /tarefas/{identifier}/branches`, agora com `partes` obrigatório;
  - novo `GET /tarefas/{identifier}/branches-base-recentes`;
  - `GET /empresas` e `PATCH /empresas/{identifier}`, com `repositorioFront` e `repositorioBack`;
  - `BranchResponse`, com `partes` e `tag`.
- **Exige alteração na API**: sim. A change `criar-branch-ao-iniciar` do ActumAPI precisa estar implementada antes, e os tipos regerados a partir do OpenAPI.
- **Código**: `src/api/tarefas.ts`, `src/api/empresas.ts`, `src/api/schema.d.ts` (gerado) e uma função pura para a sugestão de nome.

## Fora do escopo

- Criar a branch, conferir a base ou montar o texto das tags no front. Tudo isso é feito pela API. O front exibe as tags que a API devolve (no detalhe e na prévia da conclusão), sem prévia calculada no diálogo Iniciar.
- Listar ou buscar as branches existentes no GitHub.
- Guardar as bases recentes no navegador. Elas vêm da API.
- Alterar o diálogo Concluir além do que a API já devolve.
- Excluir a branch no GitHub.
