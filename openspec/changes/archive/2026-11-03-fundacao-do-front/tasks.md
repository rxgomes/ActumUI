# Tasks

## 1. Dependências e ferramentas

- [x] 1.1 Instalar `openapi-fetch` e, como dependências de desenvolvimento, `openapi-typescript` e `vitest`. Se o npm recusar `openapi-typescript` pelo peer `typescript ^5.x`, usar `npx openapi-typescript@7` no script, sem instalá-lo (design, Riscos). Verificar com `npm install` sem erros e `npm run build` passando.
- [x] 1.2 Adicionar os scripts `api:tipos` (gera `src/api/schema.d.ts` a partir de `http://localhost:5180/openapi/v1.json`) e `test` (`vitest run`), e configurar o Vitest (ambiente `node`, `TZ=America/Sao_Paulo`). Verificar com `npm test` (sem testes ainda, sem erro de configuração).

## 2. api

- [x] 2.1 Com a API rodando, executar `npm run api:tipos` e versionar `src/api/schema.d.ts`. Verificar que o arquivo contém os caminhos `/asana/conexao` e `/tarefas/painel` e que `npm run build` passa com a API desligada.
- [x] 2.2 Criar `src/api/cliente.ts` (cliente `openapi-fetch` com `VITE_API_URL`), `ErroDaApi` e o helper que converte `{ data, error, response }` em dado ou `ErroDaApi` (`problema`, `rede`, `inesperado`; `mensagem`; `errosPorCampo` em camelCase), com testes em `*.spec.ts` para Problem Details com `detail`, só com `title`, com `errors` (`PrazoInterno` → `prazoInterno`), falha de rede e erro sem corpo. Verificar com `npm test`.
- [x] 2.3 Criar `src/api/asana.ts` com `obterConexaoAsana()`. Verificar com `npm run build` (tipos de `/asana/conexao` resolvidos).
- [x] 2.4 Criar `src/api/datas.ts` (`formatarData`, `paraDataDaApi`, `formatarDataHora`, `hojePorExtenso`) com testes dos cenários de datas da spec `api-client` (`2026-11-04` → `04/11/2026`; 7/11/2026 → `2026-11-07`; `2026-11-03T14:30:15.123` → `03/11/2026 14:30`; data por extenso de `2026-11-04`), no fuso `America/Sao_Paulo`. Verificar com `npm test`.
- [x] 2.5 Criar o composable `src/composables/useNotificarErro.ts`, que mostra `ErroDaApi.mensagem` (ou a mensagem genérica) com `Notify` do tipo `negative`. Verificar com `npm run build`.

## 3. stores

- [x] 3.1 Criar `src/stores/conexao.ts` (`useConexaoStore`) com `situacao` (`verificando`, `ok`, `nao_configurado`, `token_invalido`, `erro`), `mensagemDeErro` e a ação `verificar()`, com testes da conversão da resposta de `/asana/conexao` em `situacao` (incluindo `ErroDaApi` → `erro`). Verificar com `npm test`.

## 4. Páginas e componentes

- [x] 4.1 Criar `src/components/PaginaCabecalho.vue` (título e `hojePorExtenso()`). Verificar com `npm run build`.
- [x] 4.2 Reescrever `MainLayout.vue`: cabeçalho azul-escuro com "Actum" e botão do menu, aviso do Asana (`q-banner` dentro do `q-header`, conforme a `situacao` da store, com os textos da spec `app-shell`) e menu "Tarefas" → "Painel" com destaque da rota atual; chamar `conexao.verificar()` ao montar. Verificar no navegador com a API rodando: sem aviso quando o token é válido; com aviso de token não configurado ao subir a API com `-- --Asana:Token=`; com aviso de falha de verificação com a API desligada; e o menu ocultando e reaparecendo.
- [x] 4.3 Criar `NaoEncontradaPage.vue` e a rota `naoEncontrada` (`/:caminho(.*)*`) dentro do layout. Verificar no navegador que `/pagina-que-nao-existe` mostra "Página não encontrada" e que o botão leva ao Painel.
- [x] 4.4 Ajustar `PainelPage.vue` (provisória): usar `PaginaCabecalho` e o estado vazio, removendo o `fetch` direto e o cartão de conexões. Verificar no navegador que a página mostra "Painel" e a data por extenso, e que não há `fetch` fora de `src/api` (`grep -r "fetch(" src --include=*.vue` sem resultados).
- [x] 4.5 Atualizar o `README.md` com `npm run api:tipos` (exige a API rodando) e `npm test`. Verificar seguindo os comandos como escritos.

## 5. Verificação integrada

- [x] 5.1 `npm run build` e `npm test` sem erros; no navegador, com a API rodando e o front em `npm run dev`, percorrer Painel, rota inexistente e o aviso do Asana sem erros no console.

## Workflow follow-up

- Arquivar a change com `/opsx:archive` após revisão.
