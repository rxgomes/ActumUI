# Design

## Context

- A API devolve na empresa `cloneFront`, `cloneBack`, `pastaWorktrees`, `arquivosFront` e `arquivosBack`, e aceita os mesmos campos no `PATCH`. Para caminhos, `null` mantém e `""` remove. Para listas, `null` mantém e uma lista vazia limpa. As regras (caminho absoluto, `origin` do clone igual ao repositório da parte, arquivos relativos) são validadas pela API e chegam como `detail` (`DomainException`) ou em `errors` (limite de 20 arquivos).
- Cada `BranchResponse` tem `worktree` (`null` quando a branch nunca teve um), com `pasta`, `situacao`, `partes[]` (`parte`, `caminho`, `situacao`, `erro`, `criadoEm`) e `comandoClaude`.
- `POST .../worktree` é idempotente e devolve a branch (`200`). Uma falha numa parte vem dentro do corpo, não no status. Configuração incompleta ou branch base resultam em `400`.
- `DELETE .../worktree` devolve a branch (`200`). Responde `409` com as pendências em `detail`, `404` sem worktree ativo e `400` quando há arquivo em uso.
- A `LinhaDaEmpresa` já tem o padrão de popup com `q-popup-proxy` (Repositórios, Cor) e usa `errosDoDialogo` para separar os erros por campo. O detalhe usa `useNotificarErro` e `tarefa.recarregar()` depois das ações.

## Goals / Non-Goals

**Goals:**
- Configurar a parte local da empresa sem sair da página Empresas.
- Ver no detalhe, sem abrir o terminal, se os worktrees da tarefa existem, onde estão e por que falharam.

**Non-Goals:**
- Reimplementar as regras da API (validação de caminhos, decisão de quando criar). O front só mostra o que a API devolve.

## Decisions

### Popup "Pastas locais" (`PastasLocaisDaEmpresa.vue`)
- Componente próprio com o botão e o `q-popup-proxy`, para não inchar a `LinhaDaEmpresa`. Emite `alterada` como os outros popups.
- Campos: "Clone do front", "Clone do back", "Pasta dos worktrees" (`q-input`) e "Arquivos do front" / "Arquivos do back" (`q-input type="textarea"`, um arquivo por linha).
- Só os campos alterados vão para a API, como no popup de repositórios. Os caminhos são comparados sem espaços nas pontas. As listas são comparadas depois de dividir por linha, tirar os espaços e descartar as linhas vazias.
- Erros: `errosDoDialogo(erro, ['cloneFront', 'cloneBack', 'pastaWorktrees', 'arquivosFront', 'arquivosBack'])`. As mensagens de regra de negócio (`detail`) vão para o aviso geral do popup, que fica aberto.
- Texto de ajuda: os clones são as pastas dos repositórios já clonados no PC, a pasta dos worktrees é onde o Actum cria `<branch>\front` e `<branch>\back`, e os arquivos precisam estar fora do git (ex.: `.env.development`).
- A legenda da linha mostra "Pastas locais: configuradas", ou a lista do que falta (ex.: "Pastas locais: falta o clone do back").

### Worktree no detalhe (`WorktreeDaBranch.vue` e `worktrees.ts`)
- `BranchesDaTarefa` renderiza `WorktreeDaBranch` abaixo de cada branch de implementação com partes.
- Funções puras em `components/tarefas/worktrees.ts`, testadas com Vitest:
  - `acoesDoWorktree(branch)` → `{ copiar, criar, recriar, remover }`:
    - `criar` quando `worktree === null`;
    - `recriar` quando a situação é `falhou` ou `removido`;
    - `remover` e `copiar` quando a situação não é `removido`;
  - `TextosDaSituacao` (`criado` → "Criado", `falhou` → "Falhou", `removido` → "Removido") e a cor do badge (`positive`, `negative`, `grey-6`).
- Sem worktree, mostra uma linha discreta "Sem worktree no PC" com "Criar worktree". Se a empresa não estiver configurada, a API responde `400` com a orientação, e a mensagem aparece numa notificação.
- "Copiar comando do Claude" usa `copyToClipboard` do Quasar. Notifica "Comando copiado." ou, em falha (navegador sem permissão), mostra o comando numa notificação para cópia manual.
- Eventos para a página: `criarWorktree` e `removerWorktree` (com a branch). A página controla o loading (`processandoWorktree: string | null`, identifier da branch), confirma a remoção com `quasar.dialog` e, depois do sucesso, notifica e chama `tarefa.recarregar()`.
- Criar ou recriar com uma parte que falhou: a resposta é `200`. Por isso a página lê a branch devolvida e notifica com `warning`, "O worktree não foi criado em todas as partes. Veja o erro na branch.", em vez de "Worktree criado.".

### Estados
- **Empresas, popup**: salvando (botão Salvar com loading, campos desabilitados), erro (aviso geral ou por campo, popup aberto), sucesso (notificação e popup fechado).
- **Detalhe, worktree**: processando (botões da branch desabilitados e loading no botão clicado), erro (notificação com o `detail` da API: `409` lista as pendências, `400` arquivo em uso ou configuração incompleta, `502` git ou remoto), sucesso (notificação e recarga). Os estados carregando, vazio e erro da página não mudam.

### Stores, rotas e composables
Nenhum novo. A página usa a `useTarefaStore` existente (`recarregar`).

## Risks / Trade-offs

- [Caminho digitado errado] → A API recusa clone inexistente ou de outro repositório e a pasta relativa. A mensagem aparece no popup.
- [A área de transferência exige contexto seguro] → `localhost` é seguro. Pelo note (`http://<pc>:porta`) a cópia pode falhar, e por isso há a notificação com o comando.
