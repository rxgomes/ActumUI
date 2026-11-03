# Design

## Context

O front já tem:
- `executar`/`ErroDaApi`, com `errosPorCampo` em camelCase;
- `useNotificarErro`;
- os utilitários de data;
- as stores `conexao`, `painel` e `sincronizacao`;
- o `CartaoTarefa`, não clicável;
- a conversão de `number | string` em `src/api/numeros.ts`.

Os tipos de `src/api/schema.d.ts` cobrem o detalhe (`TarefaDetalheResponse`), as ações (que devolvem `TarefaCicloResponse`), as branches (`POST` devolve `201` com `BranchResponse`; `409` para nome repetido), a prévia (`ConclusaoPreviaResponse`) e a conclusão (`400`, `404` e `502`). As regras do ciclo de vida são da API (spec `task-lifecycle` do ActumAPI). A API trata `prioridade` nula no `PATCH` como "manter". Motivação em proposal.md; comportamento em `specs/task-detail`, `specs/task-actions` e `specs/task-board`.

## Goals / Non-Goals

**Goals:**
- Uma página de detalhe que reflete sempre o estado da API: depois de cada ação, o detalhe é lido de novo.
- Diálogos com erros por campo e mensagens da API, sem duplicar validações de regra no front.
- Lógica testável fora dos componentes: ações por status, textos de status e motivo, conversões da API e a store do detalhe.

**Non-Goals:**
- Atualização otimista da tela antes da resposta da API.
- Testes de componentes; os diálogos são verificados no navegador.

## Decisions

### 1. Funções de API em `src/api/tarefas.ts`

- `obterTarefa(identifier)`: devolve `null` em `404`.
- `marcarComentariosLidos`, `alterarTarefa`, `iniciarTarefa`, `bloquearTarefa`, `desbloquearTarefa`, `adicionarBranch`, `removerBranch`, `obterPreviaDaConclusao` e `concluirTarefa`.
- Tipos do front (`TarefaDetalhe`, `Branch`, `Retrabalho`, `Comentario`, `PreviaDaConclusao`) com `prioridade`, `numero` e `retrabalhoNumero` convertidos para `number`, como no painel.
- As respostas das ações (`TarefaCicloResponse`) não são usadas para montar a tela; ver Decisão 3.

### 2. Rota e volta ao Painel

- Nova rota `detalheTarefa`: `/tarefas/:identifier`, dentro do `MainLayout`.
- O cartão navega para `{ name: 'detalheTarefa', params: { identifier }, query: route.query }`, levando os filtros do Painel na query do detalhe.
- O botão Voltar do detalhe aponta para `{ name: 'painel', query: route.query }`.
- Com isso, a volta preserva os filtros mesmo depois de recarregar o detalhe ou abrir o link direto.
- **Alternativa considerada:** `router.back()`. Descartada, porque falha quando o detalhe é aberto diretamente pelo endereço.

### 3. Store `useTarefaStore` (`src/stores/tarefa.ts`)

- **Estado:** `detalhe`, `carregando`, `naoEncontrada`, `erro` e `comentariosNovos` (identificadores dos comentários que estavam não lidos quando a tarefa foi aberta).
- **`carregar(identifier)`:**
  - lê o detalhe e guarda os identificadores dos comentários com `lido = false` em `comentariosNovos`;
  - se houver algum, chama `marcarComentariosLidos`;
  - uma falha nessa marcação não impede a exibição: os comentários continuam destacados e serão marcados na próxima abertura.
- **`recarregar()`:**
  - usada depois de cada ação;
  - lê o detalhe de novo e mantém `comentariosNovos`, para o destaque continuar até o usuário sair da página.
- **Alternativa considerada:** aplicar o `TarefaCicloResponse` devolvido pela ação. Descartada, porque ele não traz retrabalhos e comentários. Ler o detalhe completo mantém uma única fonte de verdade, ao custo de mais uma requisição local.

### 4. Ações por status e textos

- `src/components/tarefas/acoes.ts`: `acoesDisponiveis(status)` devolve as ações conforme a spec `task-actions`.
  - `iniciar`: `entrada`.
  - `bloquear`: `em_andamento`, `retrabalho`.
  - `desbloquear`: `bloqueada`.
  - `novaBranch` e `concluir`: `em_andamento`, `bloqueada`, `retrabalho`.
  - `novoPrazo`: tudo, menos `arquivada`.

  Esconder ações que não fazem sentido é conveniência de tela, não regra: a API continua sendo quem valida, e uma recusa é mostrada como erro (Decisão 6).
- `src/components/tarefas/textos.ts`: `rotuloDoStatus` (Entrada, Em andamento, Bloqueada, Concluída, Retrabalho, Arquivada), `corDoStatus` e `textoDoMotivoArquivamento`:
  - concluída diretamente no Asana;
  - atribuída a outra pessoa no Asana;
  - excluída no Asana.

### 5. Componentes da página

`TarefaDetalhePage.vue` compõe os componentes abaixo, todos em `src/components/tarefas/`:
- `CabecalhoDaTarefa.vue`:
  - mostra Voltar, título, chip da empresa e status, e link "Abrir no Asana" (`target="_blank"`, `rel="noopener"`);
  - mostra a barra de ações: os botões da Decisão 4;
  - Bloquear e Desbloquear executam direto, com `loading` no botão;
  - os demais abrem diálogos.
- `DadosDaTarefa.vue`:
  - mostra prazos, prioridade, projetos, situação (concluída ou arquivada) e "volta para <status>" quando bloqueada;
  - mostra a descrição em texto com `white-space: pre-wrap`.
- `BranchesDaTarefa.vue`: lista com tipo, nome e "enviada ao Asana" ou "pendente", e o número do retrabalho. O botão de excluir só aparece nas pendentes e pede confirmação pelo plugin `Dialog` do Quasar (modal da aplicação, não do navegador).
- `RetrabalhosDaTarefa.vue`: linha do tempo (`q-timeline`) dos retrabalhos com os comentários de cada um.
- `ComentariosDaTarefa.vue`: lista de comentários com selo "novo" para os identificadores em `comentariosNovos`.

A descrição usa `descricao` (texto) e não `descricaoHtml`. Exibir HTML vindo do Asana com `v-html` exigiria sanitização, e uma dependência para isso não se justifica na Fase 1.

### 6. Diálogos

Os diálogos `IniciarTarefaDialog`, `NovoPrazoDialog`, `NovaBranchDialog` e `ConcluirTarefaDialog` usam `q-dialog` com `v-model`. Cada um chama a função de `src/api`, emite `concluido` em caso de sucesso (a página recarrega o detalhe e mostra uma notificação `positive`) e trata os erros assim:

- **`ErroDaApi` com `errosPorCampo`:** a mensagem aparece no campo correspondente (`branchBase`, `branchImplementacao`, `prazoInterno`, `prioridade`, `tipo`, `nome`), via `error`/`error-message` do `q-input`.
- **Outros erros:**
  - aparecem num `q-banner` dentro do diálogo, com a mensagem da API;
  - o diálogo continua aberto e os campos não são apagados;
  - o `409` de branch repetida vai para o campo `nome`.

Detalhes de cada diálogo:
- **Datas:** o prazo é escolhido num `q-date` com `mask="YYYY-MM-DD"`, que já devolve o formato da API sem passar por `Date`. O campo mostra o valor com `formatarData`.
- **Novo prazo:** abre com o prazo e a prioridade atuais. Quando `prazoInternoPendente`, mostra um aviso com o `prazoInternoAnterior` do último retrabalho. A prioridade é um `q-btn-toggle` 1/2/3 e só é enviada se mudou; o prazo também só é enviado se mudou.
- **Nova branch:** tipo pré-selecionado como `implementacao`, que é o caso comum no retrabalho.
- **Concluir:**
  - ao abrir, carrega a prévia;
  - se ela não permite concluir, mostra o motivo e desabilita Confirmar;
  - se não há tags, avisa que só a conclusão será feita no Asana;
  - em falha ao concluir, mostra a mensagem e recarrega a prévia, que passa a listar só as tags pendentes, e o botão vira "Tentar novamente".

### 7. Estados

| Elemento | Carregando | Vazio | Erro | Sucesso |
|---|---|---|---|---|
| Página de detalhe | `q-skeleton` no lugar do cabeçalho e das seções | — | `404`: "Tarefa não encontrada." com botão para o Painel; outros: cartão com a mensagem e "Tentar novamente" | dados completos |
| Recarga após ação | barra de progresso fina, mantendo os dados | — | notificação (`useNotificarErro`), mantendo os dados | dados atualizados |
| Branches | — | "Nenhuma branch registrada." | — | lista |
| Retrabalhos | — | seção oculta quando não há retrabalhos | — | linha do tempo |
| Comentários | — | "Nenhum comentário." | — | lista com destaque dos novos |
| Bloquear/Desbloquear | `loading` no botão | — | notificação com a mensagem da API | detalhe recarregado |
| Diálogos | `loading` no botão de confirmar; Concluir também mostra `q-skeleton` enquanto carrega a prévia | Concluir sem tags: aviso informativo | erro no campo ou `q-banner` no diálogo | diálogo fecha, notificação e detalhe recarregado |

### 8. Rotas, stores e composables

- **Nova rota:** `detalheTarefa`. A rota `painel` não muda.
- **Nova store:** `tarefa`. As stores `painel` e `sincronizacao` não mudam; o Painel recarrega ao ser montado, então os contadores voltam atualizados.
- **Composables:** nenhum novo. `useNotificarErro` é reutilizado, e os diálogos tratam os erros por campo diretamente com `ErroDaApi.errosPorCampo`.

## Risks / Trade-offs

- **[Marcar como lidos ao abrir esconde os novos numa segunda visita]** → É o comportamento pedido: os novos ficam destacados até o usuário sair da página, e a volta ao Painel já mostra o contador zerado.
- **[Conclusão parcial: tag enviada e falha antes de concluir no Asana]** → A API grava a tag como enviada. O diálogo recarrega a prévia e permite tentar de novo sem duplicar (spec `task-actions`).
- **[Descrição sem formatação]** → Aceito na Fase 1. Exibir o HTML do Asana exigiria uma dependência de sanitização, numa change própria.
- **[Prioridade não pode ser removida]** → Limitação do contrato atual da API, registrada como fora do escopo.

## Migration Plan

Não há sistema em uso. Implantação: merge na `main`. Rollback: reverter o commit.
