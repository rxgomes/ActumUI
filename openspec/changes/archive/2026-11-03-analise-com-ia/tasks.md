# Tasks

## 1. api

- [x] 1.1 Regenerar `src/api/schema.d.ts` a partir da API na versão `309c4b3` (`npm run api:tipos` com a API reiniciada, ou `openapi-typescript` apontando para uma instância auxiliar). Verificar que `GET /claude/situacao` e os três endpoints de `/tarefas/{identifier}/analises` aparecem no arquivo e que `npm run build` passa.
- [x] 1.2 Criar `src/api/analises.ts` com `obterSituacaoClaude`, `listarAnalises`, `analisarTarefa`, `marcarItemDaAnalise`, os tipos de tela (`Analise`, `GrupoDoChecklist`, `ItemDaAnalise`, `SituacaoClaude`) com normalização de números, e as funções puras `progressoDoChecklist` e `textoDasDuvidas`. Verificar com `npm run build`.
- [x] 1.3 Testes Vitest de `paraAnalise` (números como texto, grupos em ordem), `progressoDoChecklist` e `textoDasDuvidas`. Verificar que `npm run test` passa.

## 2. stores

- [x] 2.1 Criar `useAnaliseStore` (`carregar`, `analisar`, `marcar`, versão exibida, getters `atual`/`exibida`/`exibindoAnterior`), limpando o estado na troca de tarefa. Verificar com `npm run build`.
- [x] 2.2 Testes Vitest da store com as funções da API simuladas: carregar, analisar (nova versão no topo e exibida; erro mantém versões), marcar (aplica resposta; erro mantém estado; versão anterior não marca). Verificar que `npm run test` passa.

## 3. páginas e componentes

- [x] 3.1 Criar `ItemDaAnalise.vue` (caixa, texto riscado quando marcado, aviso ⚠️ de trecho vago, data da marcação em tooltip, desabilitado fora da versão atual ou em gravação). Verificar com `npm run build`.
- [x] 3.2 Criar `AnaliseDaTarefa.vue` com todos os estados do design (carregando, erro ao carregar, chave não configurada, sem análise, analisando, erro da análise, com análise, versão anterior), Reanalisar com confirmação, seletor de versão e Copiar dúvidas. Verificar com `npm run build`.
- [x] 3.3 Incluir a seção em `TarefaDetalhePage.vue` (topo da coluna direita, acima de retrabalhos e comentários), com as notificações de sucesso e erro. Verificar com `npm run build`.

## 4. Verificação no navegador (API rodando)

- [x] 4.1 Com a API auxiliar e o Vite auxiliar, na tarefa "Prioridade - IPI devolvido" (versões já gravadas, sem nova chamada paga): versão 2 com grupos, avisos ⚠️, testes, dúvidas e progresso; marcar e desmarcar um item (restaurando o estado original); consultar a versão 1 somente leitura; Copiar dúvidas.
- [x] 4.2 Estados sem custo: tarefa sem análise (botão e aviso de custo), tarefa arquivada (botão desabilitado), chave não configurada (API auxiliar sem `Claude:ApiKey`), erro ao carregar (API fora do ar) e erro da análise exibido na seção. Verificados no navegador: sem análise e chave não configurada; arquivada, erro ao carregar e erro da análise cobertos pelos testes da store (não há tarefa arquivada no banco).
- [x] 4.3 Fluxo real de Analisar/Reanalisar com a chave (chamada paga), somente com autorização do usuário. Executado na tarefa "Tratamento erro envio NF receita" (versão 1) durante a verificação; o usuário aceitou o resultado.

## Workflow follow-up

- Arquivar a change com `/opsx:archive` após revisão e enviar ao GitHub.
