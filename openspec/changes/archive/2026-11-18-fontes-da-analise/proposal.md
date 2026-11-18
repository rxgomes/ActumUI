# Proposal

## Why

A análise com IA hoje lê sempre a mesma coisa (título, descrição, comentários e retrabalhos), mas em muitas tarefas o contexto real da demanda está em arquivos anexados no Asana (especificações em PDF, prints, planilhas, documentos Word), ou o usuário quer conduzir a análise com instruções próprias e modelos de referência. Além disso, só as dúvidas mostram o trecho que as originou; os itens do checklist não dizem de onde vieram, o que dificulta conferir a análise contra a demanda — e, com várias fontes, isso fica ainda mais necessário.

## What Changes

- Antes de analisar (e de reanalisar), o usuário escolhe as **fontes da análise** num diálogo novo:
  - **Da tarefa**: marca uma ou mais entre **Descrição**, **Comentários** (com o histórico de retrabalhos) e **Anexos** (um ou mais arquivos da tarefa, escolhidos na lista do Asana). Pode usar só a descrição, só arquivos, ou combinações.
  - **Prompt**: escreve um texto próprio no lugar da descrição e dos anexos; dentro dele, digitar `@` abre a lista de anexos e insere `@nome-do-arquivo`, e os arquivos referenciados vão para a IA junto com o prompt (modelos de referência, instruções etc.). Os comentários continuam selecionáveis também nesse modo.
- Tipos de anexo legíveis pela análise: PDF, imagens, arquivos de texto, Word (`.docx`) e Excel (`.xlsx`). Anexos de outros tipos, externos (Google Drive, Dropbox) ou grandes demais aparecem desabilitados, com o motivo informado pela API.
- As fontes usadas ficam **gravadas em cada versão**: o rodapé da análise mostra-as, e "Reanalisar" abre o diálogo já com as fontes da versão atual. Versões antigas (sem fontes gravadas) aparecem como "Descrição e comentários".
- **Trecho e origem nos itens do checklist**: como as dúvidas, cada item do checklist passa a mostrar a origem (`título`, `descrição`, `comentário de <autor> em <data>`, `anexo <nome>` ou `prompt`) e o trecho literal que o gerou. As origens das dúvidas e regras passam a aceitar também `anexo <nome>` e `prompt`.
- "Copiar para o OpenSpec" inclui o trecho/origem dos itens do checklist e uma linha com as fontes da análise.
- **BREAKING (contrato)**: `POST /tarefas/{identifier}/analises` passa a receber um corpo com as fontes; a API mantém o padrão "descrição + comentários" quando o corpo vier vazio, para não quebrar chamadas antigas.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
- `task-analysis`: análise e reanálise passam a abrir o diálogo de fontes; exibição mostra as fontes da versão; itens do checklist (e todos os itens com origem) mostram origem e trecho; o texto do OpenSpec inclui trechos do checklist e as fontes.

## Impact

**Telas, diálogos e componentes**
- `TarefaDetalhePage.vue` (seção "Análise com IA").
- `AnaliseDaTarefa.vue`: botões "Analisar com IA" e "Reanalisar" abrem o novo diálogo; rodapé com as fontes.
- Novo `FontesDaAnaliseDialog.vue` (escolha das fontes, lista de anexos, prompt com `@`).
- `ItemDaAnalise.vue`: trecho e origem para itens do checklist (hoje só dúvidas e regras).
- `src/api/analises.ts` (`analisarTarefa` com fontes, tipos, texto do OpenSpec), `src/api/anexos.ts` (indicação de anexo legível pela análise), `src/stores/analise.ts` (`analisar(fontes)`).

**Endpoints da API usados**
- `POST /tarefas/{identifier}/analises` — **alterado**: corpo com `descricao`, `comentarios`, `anexos` (gids) e `prompt`.
- `GET /tarefas/{identifier}/analises` — **alterado**: cada versão traz `fontes`; itens do checklist trazem `origem` e `trecho`.
- `GET /tarefas/{identifier}/anexos` — **alterado**: cada anexo informa se pode ser lido pela análise e, se não, o motivo.
- `GET /claude/situacao`, `PATCH /tarefas/{identifier}/analises/itens/{itemIdentifier}` — sem mudança.

**Exige change no `..\ActumAPI` antes**: baixar o conteúdo dos anexos escolhidos do Asana e enviá-los à Claude API (PDF e imagens como blocos nativos; texto, `.docx` e `.xlsx` como texto extraído — dependência nova de leitura de OpenXML na API), validar as fontes, gravar as fontes na versão, pedir à IA `origem` e `trecho` nos itens do checklist e ajustar o prompt para os modos "da tarefa" e "prompt". Depois, regenerar `src/api/schema.d.ts`.

**Base em andamento**: esta change parte do trabalho ainda não commitado no front e na API — o trecho que gerou cada dúvida e a lista de anexos da tarefa (`AnexosDaTarefa.vue`, `src/api/anexos.ts`).

**Fora do escopo**
- Enviar ao Asana arquivos locais que não estão anexados à tarefa (só anexos já existentes no Asana podem ser fonte).
- Biblioteca de prompts ou modelos salvos para reutilizar entre tarefas.
- Outros formatos além dos listados (`.doc`/`.xls` antigos, `.pptx`, áudio, vídeo) e arquivos externos (Google Drive, Dropbox).
- Escolher fontes diferentes por seção da análise (objetivo, checklist etc.).
- Exibir o conteúdo dos anexos dentro do Actum (continua o download pelo Asana).
- Mudar como a marcação de itens é herdada entre versões.
