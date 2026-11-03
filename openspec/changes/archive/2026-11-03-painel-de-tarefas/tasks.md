# Tasks

## 1. api

- [x] 1.1 Criar `src/api/tarefas.ts` (`obterPainel`, tipos `Painel` e `CartaoTarefa` com inteiros como `number`), `src/api/sincronizacoes.ts` (`sincronizar`, `obterUltimaSincronizacao` com `404` → `null`, tipo `Sincronizacao`) e `src/api/empresas.ts` (`listarEmpresas`, tipo `Empresa`), com testes para a normalização de `number | string` → `number`, o envio dos filtros `empresa` e `busca` (omitindo os vazios) e o `404` da última sincronização. Os tipos de `src/api/schema.d.ts` já cobrem esses endpoints; se a API tiver mudado, rodar `npm run api:tipos` antes. Verificar com `npm test` e `npm run build`.

## 2. stores

- [x] 2.1 Criar `src/stores/painel.ts` (`usePainelStore`: `painel`, `carregando`, `erro`, `filtros`, `empresas`, `carregar`, `recarregar`, `carregarEmpresas`, `contagemPorGrupo`), com testes de carga com sucesso, falha (`erro` preenchido e dados anteriores mantidos) e `recarregar` com os últimos filtros. Verificar com `npm test`.
- [x] 2.2 Criar `src/stores/sincronizacao.ts` (`useSincronizacaoStore`: `ultima`, `emAndamento`, `carregandoUltima`, `carregarUltima`, `sincronizar`), com testes de sucesso (resumo devolvido e `ultima` recarregada), falha (`ErroDaApi` relançado, `ultima` recarregada e `emAndamento` voltando a `false`) e "nunca sincronizado" (`ultima = null`). Verificar com `npm test`.

## 3. Páginas e componentes

- [x] 3.1 Criar `src/components/tarefas/grupos.ts` (metadados dos 7 grupos e fallback para grupo desconhecido) e `src/components/tarefas/prazos.ts` (`prazosDoCartao`), com testes dos cenários de prazo da spec `task-board` (iguais, diferentes, pendente, sem prazo) e do grupo desconhecido. Verificar com `npm test`.
- [x] 3.2 Criar `CartaoTarefa.vue`, `GrupoDoPainel.vue` e `ResumoDosGrupos.vue`. Verificar com `npm run build`.
- [x] 3.3 Criar `FiltrosDoPainel.vue` (empresas e busca com `debounce`, gravando em `route.query`). Verificar com `npm run build`.
- [x] 3.4 Criar `BarraDeSincronizacao.vue` (última sincronização, botão Sincronizar com `loading`, desabilitado sem token válido, notificação de resumo ou de erro). Verificar com `npm run build`.
- [x] 3.5 Reescrever `PainelPage.vue` compondo os componentes, observando `route.query` e tratando os estados da tabela do design (esqueleto, vazio com e sem filtros, erro com "Tentar novamente", recarga mantendo os dados). Verificar no navegador com a API rodando:
  - resumo e seções com as tarefas reais, com as cores dos grupos e das empresas;
  - filtro por empresa e busca "devolucao" refletidos no endereço e mantidos ao recarregar a página;
  - busca sem resultado mostrando "Nenhuma tarefa corresponde aos filtros.";
  - API desligada mostrando o erro com "Tentar novamente";
  - botão Sincronizar desabilitado com a API subida com `-- --Asana:Token=`;
  - sincronização real mostrando o resumo, recarregando o painel e atualizando a última sincronização;
  - console do navegador sem erros.

## 4. Verificação integrada

- [x] 4.1 `npm run build` e `npm test` sem erros, e nenhuma chamada `fetch` fora de `src/api` (`grep -rn "fetch(" src --include=*.vue` sem resultados).

## Workflow follow-up

- Arquivar a change com `/opsx:archive` após revisão.
