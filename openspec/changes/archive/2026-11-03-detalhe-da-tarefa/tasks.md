# Tasks

## 1. api

- [x] 1.1 Acrescentar a `src/api/tarefas.ts`:
  - `obterTarefa` (`404` → `null`), `marcarComentariosLidos`, `alterarTarefa`, `iniciarTarefa`, `bloquearTarefa`, `desbloquearTarefa`, `adicionarBranch`, `removerBranch`, `obterPreviaDaConclusao` e `concluirTarefa`;
  - os tipos `TarefaDetalhe`, `Branch`, `Retrabalho`, `Comentario` e `PreviaDaConclusao`, com `prioridade`, `numero` e `retrabalhoNumero` como `number`.

  Testes:
  - conversão do detalhe;
  - `404` do detalhe → `null`;
  - corpo de iniciar e de alterar (só os campos informados);
  - `409` de branch repetida como `ErroDaApi` com `status = 409`;
  - `502` da conclusão com a mensagem da API.

  Os tipos de `src/api/schema.d.ts` já cobrem esses endpoints; se a API tiver mudado, rodar `npm run api:tipos` antes. Verificar com `npm test` e `npm run build`.

## 2. stores

- [x] 2.1 Criar `src/stores/tarefa.ts` (`useTarefaStore`: `detalhe`, `carregando`, `naoEncontrada`, `erro`, `comentariosNovos`, `carregar`, `recarregar`). Testes:
  - carga com comentários não lidos: guarda `comentariosNovos` e chama `marcarComentariosLidos` uma vez;
  - carga sem não lidos: não chama a marcação;
  - falha na marcação: o detalhe continua exibido;
  - `404` → `naoEncontrada`;
  - falha de rede → `erro`;
  - `recarregar` mantém `comentariosNovos`.

  Verificar com `npm test`.

## 3. Páginas e componentes

- [x] 3.1 Criar `src/components/tarefas/acoes.ts` (`acoesDisponiveis`) e `src/components/tarefas/textos.ts` (`rotuloDoStatus`, `corDoStatus`, `textoDoMotivoArquivamento`), com testes das ações de cada status da spec `task-actions` e dos textos de status e motivo. Verificar com `npm test`.
- [x] 3.2 Criar a rota `detalheTarefa` (`/tarefas/:identifier`), `TarefaDetalhePage.vue` e os componentes `CabecalhoDaTarefa`, `DadosDaTarefa`, `BranchesDaTarefa`, `RetrabalhosDaTarefa` e `ComentariosDaTarefa`, com os estados da tabela do design. Tornar `CartaoTarefa` clicável, levando a query do Painel. Verificar no navegador com a API rodando:
  - abrir uma tarefa real pelo Painel filtrado e voltar mantendo o filtro;
  - dados, status, link do Asana em outra aba e descrição com quebras de linha;
  - `/tarefas/<identificador inexistente>` mostrando "Tarefa não encontrada.";
  - API desligada mostrando o erro com "Tentar novamente".
- [x] 3.3 Criar `NovoPrazoDialog.vue` e as ações Bloquear e Desbloquear no cabeçalho. Verificar no navegador numa tarefa real:
  - alterar só a prioridade;
  - alterar o prazo, conferindo o formato `dd/MM/yyyy` na tela e no cartão do Painel;
  - bloquear mostrando "volta para Em andamento";
  - desbloquear voltando ao status anterior.

  Ao final, restaurar o prazo e a prioridade originais da tarefa.
- [x] 3.4 Criar `IniciarTarefaDialog.vue`, `NovaBranchDialog.vue` e a exclusão de branch pendente, com erros por campo e mensagem da API no diálogo. Verificar no navegador:
  - se houver uma tarefa em `entrada`, iniciá-la; senão, registrar as branches numa tarefa da carga inicial;
  - branches iguais mostrando a mensagem da API;
  - nome repetido mostrando o `409` no campo do nome;
  - excluir uma branch pendente após confirmação;
  - branches enviadas sem opção de exclusão.
- [x] 3.5 Criar `ConcluirTarefaDialog.vue` (prévia com tags, motivo de bloqueio, aviso de "nenhuma tag", falha com "Tentar novamente" recarregando a prévia). Verificar no navegador:
  - numa tarefa sem branch de implementação, a prévia mostra o motivo e não permite confirmar;
  - com a API desligada, o diálogo mostra a mensagem e permanece aberto;
  - a conclusão real só deve ser executada com a autorização do usuário, porque escreve tags e conclui a tarefa no Asana.

## 4. Verificação integrada

- [x] 4.1 `npm run build` e `npm test` sem erros, nenhuma chamada `fetch` fora de `src/api` (`grep -rn "fetch(" src --include=*.vue` sem resultados) e console do navegador sem erros no Painel e no Detalhe.

## Workflow follow-up

- Arquivar a change com `/opsx:archive` após revisão.
