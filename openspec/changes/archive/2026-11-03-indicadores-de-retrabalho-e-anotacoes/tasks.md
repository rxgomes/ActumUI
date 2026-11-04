# Tasks

## 1. api

- [x] 1.1 Regenerar `src/api/schema.d.ts` a partir da API com a change `indicadores-de-retrabalho-e-anotacoes` (instância auxiliar ou API reiniciada). Verificar que `/retrabalhos/*` e `/tarefas/{identifier}/anotacoes*` aparecem e que `npm run build` passa.
- [x] 1.2 Criar `src/api/retrabalhos.ts` (`obterIndicadores`, `reprocessarHistorico`, normalização de números) e `src/api/anotacoes.ts` (listar, criar, alterar, excluir). Testes Vitest das chamadas e da normalização. Verificar que `npm run test` passa.

## 2. stores

- [x] 2.1 Criar `useRetrabalhoStore`:
  - atalhos de período com `hoje` injetável;
  - período personalizado validado (início ≤ fim, até 24 meses);
  - `carregar` e `reprocessar` com o resumo e as falhas.

  Testes Vitest. Verificar que `npm run test` passa.
- [x] 2.2 Criar `useAnotacoesStore` (carregar, criar, alterar, excluir; limpeza na troca de tarefa; erros mantendo o texto). Testes Vitest. Verificar que `npm run test` passa.

## 3. páginas e componentes

- [x] 3.1 Criar as funções do gráfico em `src/components/retrabalho/grafico.ts`:
  - escala "nice";
  - barras e segmentos com intervalo de 2 px e largura máxima de 24 px;
  - rótulos de mês (alternados acima de 12 meses);
  - `aria-label` do mês.

  Testes Vitest. Verificar que `npm run test` passa.
- [x] 3.2 Criar `EvolucaoMensal.vue`:
  - SVG com grade, eixos e barras empilhadas nas cores das empresas;
  - total acima da barra; legenda com 2+ empresas;
  - faixa de hover e foco por teclado com dica;
  - `role="img"` e alternância Gráfico/Tabela.

  Verificar com `npm run build`.
- [x] 3.3 Criar `FiltrosDoRetrabalho.vue` (atalhos, personalizado com `CampoDeData`, empresa), `CartaoDaEmpresa.vue` e `RankingDeRetrabalho.vue`. Verificar com `npm run build`.
- [x] 3.4 Criar `RetrabalhoPage.vue` (filtros na query, estados, aviso de nunca reprocessado, reprocessar com confirmação e resumo), a rota `retrabalho` e o grupo "Indicadores" no `MainLayout`. Verificar com `npm run build`.
- [x] 3.5 Criar `AnotacoesDaTarefa.vue` no detalhe (lista, nova, edição no lugar, exclusão com confirmação, estados) e mostrar `concluidaEm` em `RetrabalhosDaTarefa.vue`. Verificar com `npm run build`.

## 4. Verificação no navegador (API rodando)

- [x] 4.1 Página Retrabalho com os dados reais (4 retrabalhos de novembro na Aureum-ERP):
  - cards, gráfico (hover, foco por teclado e tabela) e ranking com link;
  - filtros e query sobrevivendo ao recarregamento; período inválido;
  - estado sem retrabalho (período antigo).

  Conferir o gráfico visualmente: rótulos sem sobreposição e barras alinhadas.
- [x] 4.2 Reprocessar pela página (só leitura no Asana; resultado idempotente: 4 → 4) e conferir o resumo e a recarga.
- [x] 4.3 Anotações no detalhe da tarefa do IPI: criar, editar e excluir uma anotação de teste (excluída ao fim, para não deixar dado de teste), texto vazio bloqueado, e "Concluída em" no retrabalho.

## Workflow follow-up

- Arquivar esta change e a da API (`indicadores-de-retrabalho-e-anotacoes` no ActumAPI) e enviar os dois repositórios ao GitHub.
