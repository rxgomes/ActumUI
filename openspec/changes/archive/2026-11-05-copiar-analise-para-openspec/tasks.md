# Tasks

## 1. api

- [x] 1.1 Em `src/api/analises.ts`, criar `textoParaExploreDoOpenSpec(analise, tarefa)` que monta o texto em Markdown do `/opsx:explore` (dados da tarefa, objetivo, checklist por grupo, testes, dúvidas e regras, com `[x]`/`[ ]`, "Vago:" e "Origem:", omitindo blocos vazios e terminando sempre com a seção "Notas"). Cobrir em `src/api/analises.spec.ts`. Verificar que `npm run test` e `npm run build` passam.

## 2. componentes

- [x] 2.1 Em `components/tarefas/AnaliseDaTarefa.vue`, adicionar o botão "Copiar para o OpenSpec" no cabeçalho, ao lado de "Reanalisar", que copia a versão exibida com `copyToClipboard` e notifica o sucesso ou a falha. Verificar com `npm run build`.

## 3. Verificação

- [x] 3.1 Com a API rodando e o front em `npm run dev`, numa tarefa analisada, clicar em "Copiar para o OpenSpec" e conferir o texto colado (inclusive numa versão anterior).
