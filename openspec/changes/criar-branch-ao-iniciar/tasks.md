# Tasks

## 1. API (cliente e tipos)

- [x] 1.1 Com a API da change `criar-branch-ao-iniciar` do ActumAPI rodando, rodar `npm run api:tipos` e verificar que `schema.d.ts` tem `ParteBranch`, `partes` e `tag` em `BranchResponse`, `repositorioFront`/`repositorioBack` em `EmpresaResponse` e a rota `/tarefas/{identifier}/branches-base-recentes`
- [x] 1.2 Em `src/api/tarefas.ts`, exportar `ParteBranch`, incluir `partes` em `DadosParaIniciar` e no `iniciarTarefa`, incluir `partes` em `adicionarBranch` e criar `listarBasesRecentes`, com JSDoc em pt-BR. Verificar com testes em `tarefas.spec.ts` / `tarefa-detalhe.spec.ts` (corpo enviado com `partes` e lista de bases devolvida)
- [x] 1.3 Em `src/api/empresas.ts`, incluir `repositorioFront` e `repositorioBack` em `DadosDaEmpresa` e no `alterarEmpresa` (`null` quando não informado, texto, inclusive `""`, quando informado). Verificar com teste em `empresas.spec.ts`

## 2. Componentes de tarefas

- [x] 2.1 Criar `sugerirBranchDeImplementacao` em `src/components/tarefas/branches.ts` e testes em `branches.spec.ts` cobrindo os cenários da spec: título com acentos e pontuação, título longo cortado sem hífen no fim, e data montada pela hora local (ex.: 05/11/2026 23:30 → `261105`)
- [x] 2.2 Alterar `IniciarTarefaDialog.vue`:
  - seletor de base com as bases recentes e valor novo, com os estados carregando, vazio e erro, descartando respostas antigas;
  - sugestão do nome da implementação;
  - caixas Front/Back, com Iniciar desabilitado sem parte;
  - erro de `partes` abaixo das caixas e texto de ajuda novo.

  Verificar com `npm run build`
- [x] 2.3 Alterar `NovaBranchDialog.vue` com as caixas Front/Back (botão desabilitado sem parte, erro de `partes`) e o texto sobre a criação ou conferência no GitHub, e verificar com `npm run build`
- [x] 2.4 Alterar `BranchesDaTarefa.vue` para mostrar as partes e o tooltip com a tag quando houver partes, e a confirmação de exclusão em `TarefaDetalhePage.vue` para avisar que a branch não é excluída no GitHub. Verificar com `npm run build`

## 3. Empresas

- [x] 3.1 Em `LinhaDaEmpresa.vue`, mostrar os repositórios na legenda e criar o popup "Repositórios" (campos Front/Back, salvar só o alterado, erros por campo, notificação de sucesso, texto explicando o uso). Verificar com `npm run build`

## 4. Verificação no navegador

- [ ] 4.1 Com a API em `http://localhost:5180` e `npm run dev`, cadastrar os repositórios de uma empresa em Empresas, incluindo um valor inválido para ver o erro no campo e a remoção com campo vazio
- [ ] 4.2 Iniciar uma tarefa da entrada e conferir:
  - as bases recentes, com a primeira selecionada;
  - digitar uma base nova;
  - a sugestão `yyMMdd-titulo`;
  - o botão desabilitado sem parte;
  - o erro de base inexistente com o diálogo aberto;
  - o início com sucesso, com a branch criada no GitHub e as partes visíveis no detalhe.
- [ ] 4.3 Registrar uma nova branch de implementação com uma parte, abrir o Concluir e conferir que a prévia lista as tags no formato `(Front, Back) => ...` e `(Front) => ...`
- [ ] 4.4 Rodar `npm run build` e `npm test` sem erros

## Workflow follow-up

- Publicar junto com a change `criar-branch-ao-iniciar` do ActumAPI.
- Arquivar a change depois da revisão.
