# Tasks

## 1. Pré-requisitos

- [x] 1.1 Confirmar que a change da API está aplicada no `..\ActumAPI` (corpo `FontesDaAnaliseRequest` no `POST /tarefas/{identifier}/analises`, `fontes` em `AnaliseResponse`, `origem`/`trecho` nos itens do checklist, `legivelNaAnalise`/`motivo` em `AnexoResponse`, conforme design.md §1); verificar em `http://localhost:5180/openapi/v1.json` que esses campos existem
- [x] 1.2 Garantir que o trabalho não commitado da base (trecho das dúvidas, `AnexosDaTarefa.vue`, `src/api/anexos.ts`) está concluído e commitado; verificar com `git status` limpo nesses arquivos e `npm run build` passando
- [x] 1.3 Regenerar os tipos com `npm run api:tipos` (API rodando) e verificar que `src/api/schema.d.ts` tem os novos campos e que `npm run build` aponta só os usos que esta change vai ajustar

## 2. API (src/api)

- [x] 2.1 Em `src/api/anexos.ts`, expor `legivelNaAnalise` e `motivo` no tipo `Anexo` (JSDoc em pt-BR); verificar com teste em `src/api/anexos.spec.ts` que a conversão preserva os campos
- [x] 2.2 Em `src/api/analises.ts`, reexportar os tipos `FontesDaAnalise` (request) e `FontesDaVersao` (response) com JSDoc, incluir `fontes` em `Analise`/`paraAnalise` e fazer `analisarTarefa(identifier, fontes?)` enviar o corpo; verificar com teste em `src/api/analises.spec.ts` que o corpo enviado é o das fontes e que versões com `fontes: null` são convertidas
- [x] 2.3 Criar os helpers `fontesPadrao()`, `fontesParaReanalise(analise)` e `textoDasFontes(fontes)`; verificar com testes os casos: padrão, versão "da tarefa" com anexos, versão por prompt e versão antiga (`null` → "Descrição e comentários")
- [x] 2.4 Em `textoParaExploreDoOpenSpec`, acrescentar `- **Fontes:** ...` após a linha da análise e, no modo prompt, o texto do prompt como citação; verificar com testes que o checklist com trecho sai como `Trecho (<origem>): "<trecho>"`, que a linha de fontes aparece nos dois modos e que os cenários existentes (Locais, Notas, blocos vazios) continuam passando

## 3. Composables e stores

- [x] 3.1 Criar `src/composables/useAnexosDaTarefa.ts` (anexos, carregando, erro, `carregar()`, proteção contra resposta antiga; JSDoc em pt-BR) e migrar `AnexosDaTarefa.vue` para usá-lo; verificar no navegador que o cartão de anexos continua com carregando, vazio, erro e recarregar como antes
- [x] 3.2 Alterar `useAnaliseStore().analisar(fontes)` para repassar as fontes; verificar em `src/stores/analise.spec.ts` que as fontes chegam à API, que um `400` com `errosPorCampo` fica em `erroDaAnalise` e que as versões anteriores são preservadas em falha

## 4. Páginas e componentes

- [x] 4.1 Criar `src/components/tarefas/FontesDaAnaliseDialog.vue` (`v-model:aberto`, props `identifier` e `inicial`, evento `concluido`) com o modo "Da tarefa": caixas Descrição, Comentários e Anexos, lista de anexos com nome/data/tamanho, desabilitados com `motivo`, estados carregando/erro/vazio, e "Analisar" desabilitado com dica quando nada está escolhido; verificar no navegador os cenários "Primeira análise com o padrão", "Só anexos", "Descrição e anexos", "Nenhuma fonte" e "Anexo não legível"
- [x] 4.2 Adicionar ao diálogo o modo "Prompt": `q-input` textarea, menu do `@` filtrado com os anexos legíveis, inserção de `@<nome> `, lista "Arquivos referenciados" que acompanha o texto, e Comentários selecionável; verificar no navegador os cenários "Referenciar um modelo", "Referência apagada" e "Prompt sem arquivos"
- [ ] 4.3 Tratar o envio no diálogo: aviso de chamada paga (com "gera a versão N" na reanálise), botão com `loading` e diálogo persistente durante a análise, erros por campo (`fontes`, `anexos`, `prompt`) mantendo o diálogo aberto, outros erros fechando e indo para o destaque da seção; verificar no navegador com um anexo removido do Asana (erro de campo) e com a API parada (erro de rede)
- [ ] 4.4 Em `AnaliseDaTarefa.vue`, fazer "Analisar com IA" e "Reanalisar" abrirem o diálogo (removendo o `quasar.dialog` de confirmação), com `inicial` = `fontesParaReanalise(atual)` na reanálise e aviso de anexo da versão que não está mais na tarefa; manter a notificação "Análise concluída." e o recarregamento da tarefa no `concluido`; verificar no navegador "Reanalisar", "Cancelar a reanálise" e "Anexo da versão removido"
- [ ] 4.5 No rodapé de `AnaliseDaTarefa.vue`, mostrar "Fontes: …" com `textoDasFontes` e, no modo prompt, "Ver prompt" somente leitura; verificar no navegador uma versão por prompt, uma com anexo e uma versão antiga
- [ ] 4.6 Em `ItemDaAnalise.vue`, garantir que itens do checklist mostrem o trecho com a origem abaixo do aviso de vago (e só a origem quando não houver trecho); verificar no navegador uma análise nova com itens do checklist de origem `descrição` e `anexo <nome>`, e uma versão antiga sem trecho no checklist

## 5. Verificação integrada

- [x] 5.1 Rodar `npm run build` e `npm test` sem erros
- [ ] 5.2 Com a API em `http://localhost:5180` e o front em `npm run dev`, fazer de ponta a ponta numa tarefa com PDF, imagem, `.docx` e `.xlsx` anexados: análise só com a descrição, só com anexos, com descrição + anexos, por prompt referenciando um modelo, e reanálise; conferir fontes no rodapé, trechos no checklist e o texto de "Copiar para o OpenSpec"

## Workflow follow-up

- Arquivar a change (`/opsx:archive`) depois da revisão, atualizando `openspec/specs/task-analysis/spec.md`.
