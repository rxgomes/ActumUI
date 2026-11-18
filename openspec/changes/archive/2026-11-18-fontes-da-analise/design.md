# Design

## Context

- A análise é disparada por `AnaliseDaTarefa.vue` → `useAnaliseStore().analisar()` → `analisarTarefa(identifier)` (`src/api/analises.ts`), sem corpo. "Reanalisar" só pede confirmação com `quasar.dialog`.
- A lista de anexos já existe (trabalho não commitado): `listarAnexos` em `src/api/anexos.ts` e o cartão `AnexosDaTarefa.vue`, que lê os anexos do Asana na hora, com carregando/erro próprios.
- O trecho das dúvidas também já existe (não commitado): `AnaliseItemResponse` tem `origem` e `trecho`, e `ItemDaAnalise.vue` mostra o trecho com a origem. A API só preenche `trecho` para dúvidas e `origem` para dúvidas e regras.
- Os diálogos do detalhe seguem o padrão `v-model:aberto` + `@concluido`, com erros por campo via `errosDoDialogo` (ex.: `NovaBranchDialog.vue`).
- Tudo que envolve baixar anexos, extrair texto de Word/Excel e montar o prompt fica na API (ver proposal.md, Impact). O front só escolhe e envia as fontes e exibe o que volta.

## Goals / Non-Goals

**Goals:**
- Um único diálogo de fontes usado por "Analisar com IA" e "Reanalisar".
- Nenhuma regra de legibilidade de arquivo no front: a API diz o que pode ser lido e por quê.
- Mesma exibição de origem/trecho para checklist, dúvidas e regras.

**Non-Goals:**
- Editor rico para o prompt (Markdown, realce dos `@`): é uma `q-input` de texto com autocompletar.
- Pré-visualizar o conteúdo dos anexos.

## Decisions

### 1. Contrato esperado da API (change no ActumAPI primeiro)

O front assume, e a change da API deve entregar, os nomes abaixo; os tipos vêm do `schema.d.ts` regenerado.

- `POST /tarefas/{identifier}/analises`, corpo `FontesDaAnaliseRequest` (opcional; vazio = descrição + comentários):
  - `modo`: `tarefa` | `prompt`
  - `descricao`: bool (só no modo `tarefa`)
  - `comentarios`: bool (com os retrabalhos)
  - `anexos`: `string[]` (gids) — no modo `tarefa`, os escolhidos; no modo `prompt`, os referenciados no texto
  - `prompt`: `string | null` (obrigatório no modo `prompt`)
  - Validação `400` com `errors` em `Fontes` (nenhuma fonte), `Anexos` (gid fora da tarefa, tipo não legível, tamanho/total acima do limite) e `Prompt` (vazio ou longo demais).
- `AnaliseResponse.fontes`: `{ modo, descricao, comentarios, anexos: { gid, nome }[], prompt } | null` (`null` em versões antigas).
- `AnaliseItemResponse.origem` e `.trecho` passam a vir também nos itens do checklist; origens novas: `anexo <nome>` e `prompt`.
- `AnexoResponse` ganha `legivelNaAnalise: bool` e `motivo: string | null` (ex.: "Arquivos externos não podem ser lidos pela análise.", "Tipo de arquivo não suportado pela análise.", "Arquivo maior que 20 MB.").

Alternativa considerada: o front decidir a legibilidade pela extensão. Rejeitada — é regra que depende do que a API sabe extrair e dos limites da Claude API, e o CLAUDE.md proíbe reimplementar regras da API.

### 2. Referências `@` no prompt

- O diálogo guarda `referenciados: { gid, nome }[]`, preenchido quando o usuário escolhe um anexo no menu do `@`. A cada mudança do texto, ficam só os referenciados cujo `@<nome>` ainda aparece no texto; esses gids vão em `anexos`.
- O `@` abre um `q-menu` ancorado na `q-input` (`type="textarea"`), filtrado pelo que foi digitado depois do `@`, só com anexos legíveis; Enter/clique insere `@<nome> ` no lugar do termo; Esc fecha.
- O texto do prompt é enviado como o usuário escreveu, com os `@nome`; a API identifica cada anexo pelo nome no conteúdo enviado à IA, então o prompt faz sentido para o modelo.

Alternativa considerada: o usuário digitar `@nome` livremente e o front resolver por nome só no envio. Rejeitada — erros de digitação passariam calados; com a escolha pelo menu o vínculo nome→gid é certo.

### 3. Diálogo `FontesDaAnaliseDialog.vue`

- Padrão do projeto: `v-model:aberto`, props `identifier` e `inicial` (fontes da versão atual, ou `null` para o padrão), evento `@concluido`.
- O diálogo chama `useAnaliseStore().analisar(fontes)` e fica aberto (persistente, botão "Analisar" com `loading`) até a resposta:
  - sucesso → fecha e emite `concluido` (a seção notifica "Análise concluída." e recarrega a tarefa, como hoje);
  - `400` com `errosPorCampo` (`fontes`, `anexos`, `prompt`) → continua aberto, mensagens junto dos campos, escolhas preservadas;
  - qualquer outro erro → fecha; a seção mostra `erroDaAnalise` em destaque, como hoje.
- Motivo de ficar aberto: validação volta rápido e o usuário corrige sem refazer a escolha; a espera longa já existia e o progresso fica visível no próprio botão.
- O aviso de chamada paga (e de que anexos vão para a Anthropic) fica no topo do diálogo; para a reanálise, inclui "gera a versão N" — substitui o `quasar.dialog` de confirmação atual.

**Estados do diálogo**

| Estado | Exibição |
|---|---|
| Anexos carregando | `q-skeleton` na lista; Descrição/Comentários/Prompt utilizáveis |
| Anexos com erro | mensagem da API + "Tentar novamente"; demais fontes utilizáveis |
| Sem anexos | opção Anexos desabilitada com "A tarefa não tem anexos no Asana."; no prompt, o menu do `@` mostra a mesma frase |
| Anexo não legível | item desabilitado com o `motivo` da API |
| Anexo da versão atual removido | aviso "`<nome>` não está mais no Asana e foi retirado da escolha." |
| Nada escolhido | "Analisar" desabilitado com a dica do que falta |
| Analisando | botão com `loading`, campos desabilitados, diálogo não fecha |
| Erro de validação | mensagens por campo (`q-input :error`, `q-field` da lista) |

### 4. Leitura dos anexos compartilhada

Novo composable `useAnexosDaTarefa(identifier: Ref<string>)` com `anexos`, `carregando`, `erro`, `carregar()` e a proteção contra resposta antiga que já existe em `AnexosDaTarefa.vue`. O cartão de anexos e o diálogo passam a usá-lo. Cada um mantém a sua instância: o diálogo relê ao abrir, para refletir anexos novos no Asana.

Alternativa considerada: uma store Pinia de anexos. Desnecessária — não há estado que precise sobreviver entre telas, e reler ao abrir é o comportamento desejado.

### 5. Store e API

- `analisarTarefa(identifier, fontes?: FontesDaAnalise)` envia o corpo; `FontesDaAnalise` é o tipo do request gerado, reexportado com JSDoc.
- `Analise` ganha `fontes: FontesDaVersao | null` (do response). Helpers puros em `src/api/analises.ts`:
  - `fontesPadrao()` — modo `tarefa`, descrição e comentários;
  - `fontesParaReanalise(analise)` — converte `fontes` da versão no request (ou o padrão);
  - `textoDasFontes(fontes)` — "Descrição, Comentários, layout.pdf", "Prompt" ou "Descrição e comentários" para `null`.
  São formatações de exibição, não regras de negócio.
- `useAnaliseStore().analisar(fontes)` passa a receber as fontes. Erros de validação também ficam em `erroDaAnalise`, e o diálogo lê `errosPorCampo` dali; a seção só mostra o destaque quando o diálogo está fechado.
- `textoParaExploreDoOpenSpec` acrescenta `- **Fontes:** ...` após a linha da análise e, no modo prompt, o texto como citação (`> `). `linhasDoItem` já trata trecho/origem de forma genérica e passa a valer para o checklist sem mudança.

### 6. Exibição

- `ItemDaAnalise.vue` já mostra trecho e origem para qualquer item que os tenha; a mudança é garantir que o checklist use o mesmo bloco (hoje o checklist não recebe esses campos da API) e que o aviso de vago venha antes do trecho.
- Rodapé de `AnaliseDaTarefa.vue`: linha "Fontes: …"; no modo prompt, um `q-expansion-item` "Ver prompt" com o texto somente leitura.

### Stores, rotas e composables

- Alterada: `useAnaliseStore` (`analisar(fontes)`).
- Novo composable: `useAnexosDaTarefa`.
- Rotas: nenhuma.
- Dependências npm novas: nenhuma (autocompletar com `q-input` + `q-menu` do Quasar).

## Risks / Trade-offs

- [Dois anexos com o mesmo nome no prompt] → o menu mostra data e tamanho para distinguir e o vínculo é pelo gid escolhido; no texto ambos aparecem como `@nome`. Aceito por ser raro; a API pode numerar os documentos no envio.
- [Análises com anexos ficam mais lentas e mais caras] → o aviso do diálogo menciona anexos; o progresso já indica "pode levar alguns minutos com anexos". Limites de tamanho ficam na API.
- [Contrato da API ainda não existe] → as tarefas começam pela regeneração dos tipos depois da change no ActumAPI; se os nomes mudarem lá, só `src/api/analises.ts`/`anexos.ts` absorvem a diferença.
- [Base não commitada (trecho das dúvidas, anexos)] → commitar ou concluir esse trabalho antes de aplicar esta change, para o diff ficar legível.

## Migration Plan

1. Change no ActumAPI (fontes no POST, `fontes` na versão, origem/trecho no checklist, legibilidade dos anexos), com migração do banco.
2. Regenerar `src/api/schema.d.ts` com a API rodando.
3. Implementar o front. Versões antigas continuam exibidas (`fontes = null`, checklist sem trecho).
4. Rollback: o corpo do POST é opcional na API, então reverter o front volta ao comportamento atual sem quebrar.
