# Tasks

## 1. api

- [x] 1.1 Regenerar `src/api/schema.d.ts` a partir da API com a change `envio-de-comentarios-ao-asana` (instância auxiliar ou API reiniciada). Verificar que `/tarefas/{identifier}/participantes` e `/tarefas/{identifier}/comentarios` aparecem e que `npm run build` passa.
- [x] 1.2 `ErroDaApi.extensoes` em `src/api/erros.ts` (campos não padrão do Problem Details) com testes Vitest (com e sem extensões). Verificar que `npm run test` passa.
- [x] 1.3 Criar `src/api/comentarios.ts`: `listarParticipantes`, `enviarComentario` (FormData com `bodySerializer`), `anexosEnviados`, `nomeDoPrint`, `validarArquivos`, `textoDasDuvidasParaEnviar` e `tamanhoLegivel`. Verificar com `npm run build`.
- [x] 1.4 Testes Vitest de `comentarios.ts`:
  - FormData enviado (texto, menções repetidas, arquivos);
  - `nomeDoPrint`;
  - `validarArquivos` (quantidade, tamanho, total, vazio, com as mensagens da API);
  - `textoDasDuvidasParaEnviar` (só não resolvidas, numeradas);
  - `anexosEnviados`.

  Verificar que `npm run test` passa.

## 2. stores

- [x] 2.1 Criar `useNovoComentarioStore`:
  - `abrir`, `adicionarArquivos`, `removerArquivo`, `acrescentarTexto` e `enviar`;
  - menções iniciais com os sugeridos;
  - limpeza na troca de tarefa e após o sucesso;
  - remoção de `anexosEnviados` no erro.

  Verificar com `npm run build`.
- [x] 2.2 Testes Vitest da store com a API simulada:
  - participantes e sugerido;
  - arquivo recusado;
  - acrescentar texto (vazio e com texto);
  - envio com sucesso (limpa, menção volta à sugerida);
  - erro mantém o rascunho;
  - envio parcial retira os anexos enviados;
  - troca de tarefa limpa.

  Verificar que `npm run test` passa.

## 3. páginas e componentes

- [x] 3.1 Criar `NovoComentario.vue`:
  - texto com Ctrl+Enter; colar print; arrastar e soltar; botão Anexar;
  - lista com miniaturas, revogando as URLs;
  - menções com chips; banner de erro; estado arquivada.

  Verificar com `npm run build`.
- [x] 3.2 Incluir a caixa em `ComentariosDaTarefa.vue` e recarregar o detalhe em `TarefaDetalhePage.vue` após o envio. Verificar com `npm run build`.
- [x] 3.3 Botão "Enviar dúvidas ao Asana" em `AnaliseDaTarefa.vue` (desabilitado quando todas estão resolvidas), com rolagem e foco na caixa. Verificar com `npm run build`.

## 4. Verificação no navegador (API rodando)

- [x] 4.1 Sem enviar nada ao Asana, com a API auxiliar e o Vite auxiliar:
  - participantes e sugestão na tarefa do IPI;
  - colar um print (Ctrl+V), anexar e remover arquivos;
  - arquivo acima do limite recusado;
  - "Enviar dúvidas ao Asana" preenchendo a caixa e rolando até ela;
  - botão desabilitado com a caixa vazia;
  - caixa desabilitada em tarefa arquivada, se houver uma.
  Verificado sem enviar nada (log da API sem POST). Não há tarefa arquivada no banco; o estado arquivada fica coberto pelo código e pela spec.
- [ ] 4.2 Envio real ao Asana (escrita visível a terceiros), somente com autorização do usuário e numa tarefa escolhida por ele: texto + print. Conferir o comentário no Asana e na lista do detalhe. Esta verificação também cumpre a tarefa 3.3 da change da API.

## Workflow follow-up

- Arquivar esta change e a da API (`envio-de-comentarios-ao-asana` no ActumAPI) e enviar os dois repositórios ao GitHub.
