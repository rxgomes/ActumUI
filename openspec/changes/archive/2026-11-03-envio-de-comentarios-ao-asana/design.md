# Design

## Context

O detalhe da tarefa tem, na coluna direita, a seção "Análise com IA" (`AnaliseDaTarefa`, store `useAnaliseStore`), os retrabalhos e o card Comentários (`ComentariosDaTarefa`, só leitura). A store `useTarefaStore` lê o detalhe e tem `recarregar()`. As chamadas passam por `src/api` (`cliente` openapi-fetch, `executar`, `ErroDaApi`), e os erros de ação são notificados por `useNotificarErro`.

A API nova (ActumAPI, `envio-de-comentarios-ao-asana`) expõe:
- `GET /tarefas/{identifier}/participantes` → `[{ gid, nome, sugerido }]`;
- `POST /tarefas/{identifier}/comentarios` (`multipart/form-data`: `texto`, `mencoes` repetido, `arquivos` repetido) → `201 { comentario, anexos }`, ou Problem Details com `anexosEnviados` na falha parcial.

## Goals / Non-Goals

**Goals**
- Responder no Asana sem sair do Actum: texto, print colado, arquivos e menção a quem pediu.
- Postar as dúvidas da IA depois de revisá-las.
- Não reenviar anexos que já subiram quando o comentário falha.

**Non-Goals**
- Editar/excluir comentários, formatação rica, rascunho persistente.

## Decisions

### 1. API (`src/api/comentarios.ts`)

- `listarParticipantes(identifier): Promise<Participante[]>`.
- `enviarComentario(identifier, { texto, mencoes, arquivos }): Promise<ComentarioEnviado>`:
  - monta um `FormData` (`texto`, cada `mencoes`, cada `arquivos` com o nome do `File`);
  - chama `cliente.POST` com `bodySerializer: (corpo) => corpo`, para o navegador definir o `Content-Type` com o boundary.
- Funções puras:
  - `nomeDoPrint(data)` → `print-AAAAMMDD-HHMMSS.png`;
  - `validarArquivos(atuais, novos)` → `{ aceitos, erro }`, com os limites e as mensagens da API (até 10, 25 MB cada, 50 MB no total, sem vazio);
  - `textoDasDuvidasParaEnviar(analise)` → "Dúvidas sobre a tarefa:" e as não resolvidas, numeradas;
  - `tamanhoLegivel(bytes)` → "1,2 MB".

### 2. `ErroDaApi.extensoes`

`erroDaResposta` passa a copiar para `extensoes` (`Readonly<Record<string, unknown>>`) os campos do Problem Details que não são os padrões. Um getter de conveniência em `comentarios.ts`, `anexosEnviados(erro): string[]`, lê `extensoes.anexosEnviados` com validação de tipo.

### 3. Store `useNovoComentarioStore` (`src/stores/novoComentario.ts`)

É o rascunho da tarefa aberta, compartilhado entre a análise (que preenche) e a caixa (que edita e envia):
- `identifier`, `texto`, `arquivos` (`File[]`), `mencoes` (`string[]`), `participantes`, `carregandoParticipantes`, `erroDosParticipantes`, `enviando`, `erroDoEnvio`, `pedidoDeFoco` (contador que a caixa observa para rolar e focar).
- `abrir(identifier)`: troca de tarefa limpa o rascunho e carrega os participantes; as menções começam com os sugeridos.
- `adicionarArquivos(files)`: aplica `validarArquivos`; o erro vai para `erroDoEnvio`, que aparece na caixa.
- `removerArquivo(indice)`.
- `acrescentarTexto(texto)`: acrescenta depois de uma linha em branco quando já há texto e incrementa `pedidoDeFoco`.
- `enviar()`: chama a API; em sucesso limpa o rascunho e volta as menções aos sugeridos; em erro guarda `erroDoEnvio` e retira dos arquivos os nomes em `anexosEnviados`. Devolve se enviou.

### 4. Componentes

- `NovoComentario.vue` (props `identifier`, `arquivada`), no topo de `ComentariosDaTarefa`:
  - `q-input` `type=textarea` `autogrow` com `@paste`: as imagens da área de transferência viram `File` com `nomeDoPrint(new Date())`; o texto colado continua no comportamento padrão;
  - Ctrl+Enter envia;
  - arrastar e soltar: `@dragover.prevent`/`@drop.prevent` no card, com destaque visual enquanto arrasta;
  - botão "Anexar" (`input type=file multiple` oculto);
  - lista de arquivos com miniatura (`URL.createObjectURL`, revogada ao remover ou desmontar), nome, tamanho e botão remover;
  - menções em `q-select` `multiple` `use-chips` com os participantes; erro de participantes como texto pequeno com "Tentar novamente";
  - `q-banner` vermelho com `erroDoEnvio.message`;
  - botão "Enviar ao Asana" (`:loading="enviando"`);
  - estado desabilitado para tarefa arquivada.

  Em sucesso, notifica "Comentário enviado ao Asana." e emite `enviado`.
- `ComentariosDaTarefa.vue` recebe `identifier`/`arquivada`, inclui a caixa e repassa `enviado`.
- `TarefaDetalhePage.vue` chama `tarefa.recarregar()` em `enviado`.
- `AnaliseDaTarefa.vue`: botão "Enviar dúvidas ao Asana" ao lado de "Copiar dúvidas" (desabilitado sem dúvidas não resolvidas, com tooltip), que chama `novoComentario.acrescentarTexto(textoDasDuvidasParaEnviar(exibida))`. A caixa observa `pedidoDeFoco` para `scrollIntoView({ behavior: 'smooth', block: 'center' })` e focar o campo.

| Estado da caixa | Exibição |
|---|---|
| Carregando participantes | `q-select` com `loading` |
| Participantes com erro | mensagem + "Tentar novamente"; envio sem menção possível |
| Vazia | botão "Enviar ao Asana" desabilitado |
| Enviando | botão com progresso; campos desabilitados |
| Erro do envio / arquivo recusado | `q-banner` vermelho com a mensagem; rascunho mantido |
| Sucesso | notificação; caixa limpa; comentário na lista |
| Arquivada | caixa desabilitada com a explicação |

Nenhuma rota nova, nenhum composable novo e nenhuma dependência npm nova.

### 5. Tipos da API

Regenerar `src/api/schema.d.ts` a partir de uma API com a change `envio-de-comentarios-ao-asana` (instância auxiliar ou a API reiniciada). Se o tipo gerado para o corpo multipart não aceitar `FormData`, a chamada usa `body: formData as never` com `bodySerializer`, comentado no código.

## Risks / Trade-offs

- **Envio real na verificação:** publica no Asana e notifica pessoas. A verificação no navegador cobre a caixa, os arquivos, o Ctrl+V, as menções e as dúvidas **sem** clicar em enviar. O envio real é feito uma vez, com autorização do usuário, numa tarefa escolhida por ele, de preferência sem menção a terceiros. O fluxo de envio e de falha parcial é coberto por testes da store com a API simulada (sem interceptar o `fetch` no navegador, que já mostrou não funcionar com o `openapi-fetch`).
- **Clipboard:** o Ctrl+V de imagem depende do navegador expor `clipboardData.files`/`items` (Chrome e Edge expõem).
- **Arquivos em memória:** até 50 MB por envio no navegador é aceitável.

## Open Questions

Nenhuma.
