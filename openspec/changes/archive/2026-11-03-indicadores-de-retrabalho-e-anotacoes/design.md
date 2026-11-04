# Design

## Context

O front tem o Painel, o detalhe da tarefa (com a análise com IA e a caixa de comentário na coluna direita), a página Empresas e o `MainLayout` com os grupos Tarefas e Configurações. As chamadas passam por `src/api` (openapi-fetch, `executar`, `ErroDaApi`, `paraNumero`, `formatarData`/`formatarDataHora`/`paraDataDaApi`), os filtros do Painel ficam na query (`FiltrosDoPainel`) e os campos de data usam `CampoDeData`.

A API nova (ActumAPI, `indicadores-de-retrabalho-e-anotacoes`) devolve:
- `IndicadoresResponse`: `de`, `ate`, `empresas[]`, `total`, `evolucao[{ mes: "yyyy-MM", porEmpresa[{ identifier, quantidade }] }]`, `ranking[]` e `ultimoReprocessamentoEm`;
- `ReprocessamentoResponse`: `tarefasLidas`, `retrabalhosAntes`, `retrabalhosDepois`, `falhas[]`;
- `AnotacaoResponse`: `identifier`, `texto`, `criadaEm`, `alteradaEm`.

## Goals / Non-Goals

**Goals**
- Ver o retrabalho por empresa e período de relance (cards), a tendência (evolução) e onde ele se concentra (ranking).
- Gráfico legível e acessível sem biblioteca nova.
- Anotações rápidas no detalhe, sem sair da tarefa.

**Non-Goals**
- Exportação, modo escuro, indicadores no Painel.

## Decisions

### 1. Forma de cada bloco (orientação de visualização de dados)

- **Cards (KPI row):** números de destaque são *stat tiles*, não gráfico. Um card por empresa e o Total, com uma marca de cor (barra de 4px na lateral) para a identidade. Valores em cor de texto, nunca na cor da empresa.
- **Evolução mensal:** mudança no tempo de contagens pequenas e discretas por empresa → **barras empilhadas por mês**. A altura da pilha é o total do mês, e os segmentos são as empresas. Uma série só (filtro de uma empresa) vira barras simples, sem legenda. Linha foi descartada porque contagens esparsas (meses zerados) viram serrilhado e confundem.
- **Ranking:** lista/tabela ordenada, não gráfico. A quantidade fica num chip com o número; o título é o link para o detalhe.

### 2. `EvolucaoMensal.vue` (SVG próprio)

- **Escalas e eixos:**
  - eixo Y linear a partir de 0 até o maior total arredondado para cima ("nice": 1, 2, 5 × 10ⁿ), com 3 a 5 linhas de grade recessivas (`grey-3`);
  - eixo X com um rótulo por mês ("nov/26"); acima de 12 meses, rótulo em meses alternados;
  - uma única escala, nunca dois eixos.
- **Marcas:**
  - barra com no máximo 24 px de largura, centrada na faixa do mês;
  - topo do último segmento arredondado em 4 px, base reta;
  - 2 px de intervalo na cor da superfície entre segmentos empilhados e entre barras;
  - mês com zero não desenha nada.
- **Rótulos:**
  - o total do mês acima da barra (texto `grey-8`), só quando > 0;
  - nenhum número dentro dos segmentos.
- **Cores:**
  - a cor de cada empresa é a cor que o usuário escolheu (`empresa.cor`), na ordem fixa das empresas (por nome). A cor segue a empresa, nunca a posição: filtrar não repinta as demais;
  - a validação da paleta atual (#1976D2, #388E3C, #E64A19) passou em todos os critérios, com aviso de separação para daltonismo no par laranja/verde (ΔE 8,0 protan). Como as cores são livres, a identidade **nunca depende só da cor**: legenda sempre visível com 2+ empresas, nome da empresa na dica e a visão em tabela.
- **Interação:**
  - faixa de hover do mês inteiro (alvo maior que a barra), com destaque leve da faixa;
  - dica em HTML posicionada sobre o SVG, com mês por extenso abreviado ("nov/2026"), cada empresa (marca de cor + nome + quantidade) e o total;
  - também por teclado: cada faixa é focável (`tabindex=0`), com `aria-label` "nov/2026: Aureum-ERP 4, aremas.com.br 0".
- **Acessibilidade:** `role="img"` com `aria-label` resumindo o gráfico; botão "Gráfico | Tabela" (`q-btn-toggle`) que mostra a mesma informação em `q-markup-table`.
- **Responsivo:** largura pelo contêiner (`ResizeObserver` via `useResizeObserver` próprio, simples, ou `q-resize-observer`), altura fixa de 220 px.
- Funções puras em `src/components/retrabalho/grafico.ts` (escala "nice", posições das barras e segmentos, rótulos de mês, texto do `aria-label`), testadas com Vitest.

### 3. API e stores

- `src/api/retrabalhos.ts`: `obterIndicadores({ de, ate, empresa })` (datas por `paraDataDaApi`, números normalizados) e `reprocessarHistorico()`.
- `src/api/anotacoes.ts`: `listarAnotacoes`, `criarAnotacao`, `alterarAnotacao` e `excluirAnotacao`.
- `useRetrabalhoStore`: `filtro` (atalho, `de`, `ate`, `empresa`), `indicadores`, `carregando`, `erro`, `reprocessando`, `ultimoResumo`; `carregar()`, `reprocessar()`. Os atalhos calculam `de`/`ate` com a data local (`hoje` injetável para teste):
  - "Últimos N meses" = do 1º dia do mês, N−1 meses atrás, até hoje;
  - "Este ano" = de 1º de janeiro até hoje.
- `useAnotacoesStore`: `identifier`, `anotacoes`, `carregando`, `erro`, `salvando` (por id ou "nova"); `carregar`, `criar`, `alterar`, `excluir`. A troca de tarefa limpa a lista.

### 4. Página, rota e menu

- Rota `retrabalho` (`/retrabalho`), `RetrabalhoPage.vue`. A query (`periodo`, `de`, `ate`, `empresa`) sincroniza com a store, como no Painel.
- `MainLayout`: grupo "Indicadores" (ícone `insights`) com o item "Retrabalho" (ícone `replay`), entre Tarefas e Configurações.
- Layout da página:
  1. cabeçalho com o título e o botão "Reprocessar histórico do Asana";
  2. linha de filtros;
  3. aviso de "nunca reprocessado", quando for o caso;
  4. cards;
  5. evolução;
  6. ranking.
- **Reprocessar:** `quasar.dialog` com a explicação (lê o histórico de todas as tarefas; só leitura no Asana; pode levar alguns segundos por tarefa). Durante a execução, o botão mostra progresso. Em sucesso, notifica o resumo e recarrega. Falhas por tarefa aparecem num `q-banner` dispensável com a lista; `409` ou outros erros via `useNotificarErro`.
- Empresas do filtro: `listarEmpresas()` (já existe).

| Estado | Exibição |
|---|---|
| Carregando (primeira vez) | esqueletos dos cards, do gráfico e do ranking |
| Recarregando | `q-linear-progress` no topo, dados atuais mantidos |
| Erro sem dados | card de erro com "Tentar novamente" |
| Sem retrabalho no período | cards (com concluídas e taxa) + "Nenhum retrabalho no período." no lugar do gráfico e do ranking |
| Nunca reprocessado | `q-banner` informativo com o botão de reprocessar |

### 5. Anotações no detalhe

- `AnotacoesDaTarefa.vue` na coluna esquerda do detalhe, abaixo de Branches. É privado e de consulta ocasional; a coluna direita já concentra análise e comentários.
- Lista com texto (quebras preservadas), "dd/mm/aaaa hh:mm" e "· editada em …".
- Campo `q-input` `autogrow` com "Adicionar" (desabilitado com texto vazio; Ctrl+Enter também adiciona).
- Edição no lugar com "Salvar"/"Cancelar", e exclusão com `quasar.dialog` de confirmação.
- Erros de validação (`errosPorCampo.texto`) aparecem no campo; os outros erros são notificados.
- Legenda fixa: "Só no Actum — não vai para o Asana."

### 6. Retrabalhos no detalhe

`RetrabalhosDaTarefa.vue` mostra "Concluída em …" quando `concluidaEm` vem preenchido.

## Risks / Trade-offs

- **Cores livres das empresas:** uma escolha ruim (duas cores parecidas) pode confundir o gráfico. A legenda, a dica com nome e a tabela garantem a leitura. Não há validação de cor na página Empresas (fora do escopo).
- **SVG próprio:** mais código que uma biblioteca, mas o gráfico é um só e simples, e sem dependência nova. As funções de geometria ficam testadas.
- **Reprocessamento demorado:** cerca de 1 s por tarefa no Asana. A confirmação avisa, e o botão mostra progresso. A chamada é síncrona (sem progresso por tarefa).

## Open Questions

Nenhuma.
