# Proposal

## Why

A análise com IA organiza a demanda (objetivo, checklist por área, testes, dúvidas e regras), e o passo seguinte costuma ser explorar a mudança no repositório com o `/opsx:explore` do OpenSpec. Hoje é preciso copiar cada bloco à mão. Um botão que copia a análise inteira já no formato do comando poupa esse trabalho e evita esquecer itens vagos, dúvidas ou regras.

## What Changes

- A seção "Análise com IA" do detalhe da tarefa (`AnaliseDaTarefa.vue`) ganha o botão "Copiar para o OpenSpec" no cabeçalho, ao lado de "Reanalisar", disponível sempre que há uma versão exibida (inclusive versões anteriores e tarefas arquivadas).
- O botão copia para a área de transferência um texto em Markdown que começa com `/opsx:explore <título da tarefa>` e traz: dados da tarefa (empresa, projetos, link do Asana, versão e data da análise), objetivo, checklist por área, testes, dúvidas e regras e observações, com `[x]` nos itens marcados, os trechos vagos e a origem das regras. Blocos vazios são omitidos. O texto termina sempre com a seção "Notas": "1. Decisões que eu preciso tomar, com opções e recomendação." e "2. Não altere código, apenas analise."
- Nova função `textoParaExploreDoOpenSpec` em `src/api/analises.ts`, com testes.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `task-analysis`: novo requisito "Copiar para o OpenSpec".

## Impact

- **Telas e componentes:** detalhe da tarefa (`TarefaDetalhePage.vue`), através de `components/tarefas/AnaliseDaTarefa.vue`.
- **API:** nenhum endpoint novo; usa os dados já lidos de `GET /tarefas/{identifier}` e `GET /tarefas/{identifier}/analises`. **Não exige mudança no `..\ActumAPI`.**
- **Stores:** nenhuma mudança; o componente lê `useTarefaStore().detalhe` e `useAnaliseStore().exibida`.

### Fora do escopo

- Executar o `/opsx:explore` ou abrir o Claude Code a partir do Actum.
- Escolher o repositório (API ou UI) em que a exploração será feita.
- Incluir a descrição, os comentários ou os retrabalhos da tarefa no texto (a análise já os resume).
