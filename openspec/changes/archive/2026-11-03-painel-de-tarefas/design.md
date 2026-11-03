# Design

## Context

A fundação já oferece:
- `executar`/`ErroDaApi`, com mensagens em pt-BR;
- `useNotificarErro`;
- os utilitários de `src/api/datas.ts`;
- a store `conexao` (situação do token do Asana);
- o `PaginaCabecalho`;
- os tipos gerados em `src/api/schema.d.ts`.

Os tipos já incluem `/tarefas/painel`, `/sincronizacoes`, `/sincronizacoes/ultima` e `/empresas`. O OpenAPI do .NET 10 publica inteiros como `number | string` (por exemplo, `quantidadeRetrabalhos`, `prioridade` e os totais da sincronização), embora a API sempre envie números. O agrupamento e a ordenação das tarefas são feitos pela API (spec `task-board` do ActumAPI). Motivação em proposal.md; comportamento em `specs/task-board` e `specs/task-sync`.

## Goals / Non-Goals

**Goals:**
- O Painel renderiza exatamente o que a API devolve, sem regra de agrupamento no front.
- Filtros no endereço da página como fonte única de verdade, para recarregar e compartilhar o estado.
- Lógica testável fora dos componentes: metadados dos grupos, prazos do cartão e as stores.

**Non-Goals:**
- Cache do painel entre telas e atualização automática.
- Testes de componentes; os componentes são verificados no navegador.

## Decisions

### 1. Funções de API por recurso, com números normalizados

Arquivos novos em `src/api/`:
- `tarefas.ts`: `obterPainel({ empresa?, busca? })`;
- `sincronizacoes.ts`: `sincronizar()` e `obterUltimaSincronizacao()`, que devolve `null` quando a API responde `404` (nunca houve sincronização);
- `empresas.ts`: `listarEmpresas()`.

As funções devolvem tipos do front (`Painel`, `CartaoTarefa`, `Sincronizacao`, `Empresa`), derivados de `components['schemas']`, mas com os campos inteiros como `number`. A conversão com `Number()` fica num único lugar, em cada função de `src/api`. Assim, componentes e stores não lidam com `number | string`.

- **Alternativa considerada:** usar os tipos gerados diretamente e converter nos componentes. Descartada, porque espalharia `Number()` pelas telas.
- **Alternativa considerada:** ajustar o OpenAPI da API para publicar só `integer`. Fica para uma change futura no ActumAPI, se incomodar; não bloqueia o front.

### 2. Filtros no endereço da página

A rota `painel` (`/`) lê os parâmetros de query `empresa` (identifier) e `busca`. Os componentes de filtro não guardam estado próprio: ao mudar, chamam `router.replace({ query })`, removendo os parâmetros vazios. A página observa `route.query` e chama `painel.carregar(filtros)`. Assim, recarregar a página, voltar no navegador e abrir um link chegam ao mesmo estado.

- A busca usa a propriedade `debounce` do `q-input` (400 ms), sem biblioteca nova.

### 3. Stores

- **`usePainelStore`** (`src/stores/painel.ts`):
  - estado `painel`, `carregando`, `erro` (`ErroDaApi | null`) e `filtros`, os últimos usados;
  - ações `carregar(filtros)` e `recarregar()`, que usa os últimos filtros;
  - getters `total` e `contagemPorGrupo`.
- **`useSincronizacaoStore`** (`src/stores/sincronizacao.ts`):
  - estado `ultima` (`Sincronizacao | null`), `emAndamento` e `carregandoUltima`;
  - ação `carregarUltima()`;
  - ação `sincronizar()`: devolve o resumo ou lança `ErroDaApi`; em qualquer caso, recarrega `ultima`, porque a API registra também as falhas.
- **Empresas:** carregadas uma vez pelo componente de filtro, com `listarEmpresas()`. Ficam em `usePainelStore` (`empresas`), porque só o painel as usa nesta change.

Recarregar o painel depois de sincronizar fica na página (`sincronizar` e depois `painel.recarregar()`), para manter as duas stores independentes.

### 4. Metadados dos grupos e prazos do cartão

- **`src/components/tarefas/grupos.ts`:** a lista ordenada dos grupos conhecidos, com rótulo em pt-BR, ícone Material e cor Quasar:

  | Grupo | Rótulo | Ícone | Cor |
  |---|---|---|---|
  | `retrabalho` | Retrabalho | `replay` | laranja (`warning`) |
  | `entrada` | Entrada | `inbox` | cinza-azulado (`blue-grey`) |
  | `atrasadas` | Atrasadas | `event_busy` | vermelho (`negative`) |
  | `hoje` | Hoje | `today` | azul (`secondary`) |
  | `esta_semana` | Esta semana | `date_range` | azul-claro (`light-blue`) |
  | `proximas` | Próximas | `event` | verde-azulado (`teal`) |
  | `sem_prazo` | Sem prazo | `event_available` | cinza (`grey`) |

  Um grupo desconhecido, que a API venha a acrescentar no futuro, é exibido com o próprio nome e um ícone genérico, sem quebrar a tela.
- **`src/components/tarefas/prazos.ts`:** `prazosDoCartao(cartao)` devolve o que mostrar:
  - `pendente` quando `prazoInternoPendente`;
  - o prazo interno formatado, ou "Sem prazo";
  - o prazo do Asana formatado só quando é diferente do interno.

As duas partes são funções puras, testadas com Vitest.

### 5. Componentes

Todos ficam em `src/components/tarefas/`:
- `ResumoDosGrupos.vue`: um cartão por grupo, com ícone em quadrado de fundo claro, rótulo e contador na cor do grupo. Clicar rola a página até a seção.
- `GrupoDoPainel.vue`: título do grupo com o contador e uma grade de cartões; "Nenhuma tarefa." quando vazio.
- `CartaoTarefa.vue`: título (até duas linhas), chip da empresa na cor dela, projetos, prazos de `prazosDoCartao` e indicadores.
  - Prioridade: `P1`, `P2` ou `P3`.
  - Retrabalhos: ícone `replay` com a quantidade.
  - Comentários não lidos: ícone `mark_chat_unread` com a quantidade.
  - Bloqueada: ícone `block`.
  - Nesta change, o cartão não é clicável.
- `FiltrosDoPainel.vue`: `q-select` de empresas (com a opção "Todas as empresas") e `q-input` de busca com `debounce` e botão de limpar.
- `BarraDeSincronizacao.vue`: texto da última sincronização e botão Sincronizar.
  - Na falha, mostra um ícone de alerta com a mensagem em tooltip.
  - O botão fica com `loading` durante a execução e desabilitado quando `conexao.situacao` é `nao_configurado` ou `token_invalido`, com tooltip explicando o motivo.
  - Em sucesso, uma notificação `positive` traz o resumo: "Sincronização concluída: 3 novas, 1 atualizada, 0 arquivadas, 1 reabertura." (singular e plural corretos).

`PainelPage.vue` compõe tudo: `PaginaCabecalho`, `BarraDeSincronizacao`, `FiltrosDoPainel`, `ResumoDosGrupos` e um `GrupoDoPainel` por grupo.

### 6. Estados

| Elemento | Carregando | Vazio | Erro | Sucesso |
|---|---|---|---|---|
| Painel (primeira carga) | esqueleto (`q-skeleton`) no lugar do resumo e das seções | sem filtros: "Nenhuma tarefa aberta. Clique em Sincronizar para buscar as tarefas do Asana."; com filtros: "Nenhuma tarefa corresponde aos filtros." | cartão com a mensagem do `ErroDaApi` e botão "Tentar novamente" | resumo e seções |
| Painel (recarga com dados na tela) | barra de progresso fina no topo, mantendo os dados atuais | idem | notificação do erro (`useNotificarErro`), mantendo os dados atuais | dados atualizados |
| Última sincronização | "Verificando a última sincronização…" | "Nenhuma sincronização realizada ainda." | texto omitido (o erro de carga não bloqueia o painel) | data e hora, com ícone de sucesso ou de falha |
| Botão Sincronizar | `loading` | — | notificação com a mensagem da API (409, 400, 502 ou rede) | notificação com o resumo e recarga do painel |
| Filtro de empresas | `q-select` com `loading` | só "Todas as empresas" | só "Todas as empresas" e notificação do erro | lista das empresas, com o ponto de cor de cada uma |

### 7. Rotas e composables

- Rota `painel` sem mudanças de caminho; passa a usar os parâmetros de query `empresa` e `busca`.
- Nenhum composable novo. `useNotificarErro` é reutilizado, e a notificação de sucesso usa `useQuasar().notify` direto na barra de sincronização.

## Risks / Trade-offs

- **[A sincronização pode levar vários segundos com muitas tarefas]** → O botão fica em `loading` e o painel continua utilizável. A API responde `409` se outra sincronização for disparada, e o front mostra a mensagem.
- **[Inteiros como `number | string` nos tipos gerados]** → Normalização centralizada em `src/api` (Decisão 1), coberta por teste.
- **[Grupo novo na API sem metadados no front]** → É exibido com o nome devolvido e um ícone genérico (Decisão 4).
- **[Sincronizar na verificação grava no banco local e lê o Asana real]** → É o uso normal do Actum. A sincronização não escreve no Asana.

## Migration Plan

Não há sistema em uso. Implantação: merge na `main`. Rollback: reverter o commit.
