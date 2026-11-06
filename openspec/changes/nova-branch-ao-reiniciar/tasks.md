# Tasks

## 1. API (cliente e tipos)

- [x] 1.1 Com a API da change `nova-branch-ao-reiniciar` do ActumAPI rodando, rodar `npm run api:tipos` e verificar que `schema.d.ts` tem `RetomarTarefaRequest` como corpo opcional de `/tarefas/{identifier}/retomar` e `novaBranchSugerida` em `TarefaDetalheResponse`
- [x] 1.2 Em `src/api/tarefas.ts`, exportar `DadosParaRetomar` e fazer `retomarTarefa(identifier, dados?)` enviar o corpo só quando houver `dados`, com JSDoc atualizado. Verificar com testes em `tarefa-detalhe.spec.ts`: sem `dados`, o `POST` vai sem corpo; com `dados`, o corpo tem `branchBase`, `branchImplementacao` e `partes`

## 2. Componentes e página

- [x] 2.1 Alterar `IniciarTarefaDialog.vue` com o modo retrabalho:
  - título, texto de ajuda e `q-option-group` "Criar nova branch" / "Continuar na branch atual";
  - campos ocultos ao continuar, e prazo oculto no retrabalho;
  - envio por `retomarTarefa` com ou sem dados;
  - botão desabilitado sem parte só ao criar;
  - `409` no campo `branchImplementacao` nos dois modos.

  Verificar com `npm run build`
- [x] 2.2 Em `TarefaDetalhePage.vue`, abrir o diálogo no Iniciar quando `novaBranchSugerida` for `true` e manter o retomar direto nos demais casos, com a notificação "Tarefa em andamento." no sucesso do modo retrabalho. Verificar com `npm run build`

## 3. Verificação no navegador

- [ ] 3.1 Com a API em `http://localhost:5180` e `npm run dev`, abrir uma tarefa em `retrabalho` reaberta no Asana, clicar em Iniciar e conferir:
  - o diálogo com "Criar nova branch" marcada, as bases recentes e a sugestão `yyMMdd-titulo`;
  - o botão desabilitado sem parte;
  - o erro de base inexistente com o diálogo aberto;
  - o `409` no campo ao repetir o nome de uma branch da tarefa;
  - o sucesso, com a branch criada no GitHub e listada no detalhe como pendente, do retrabalho.
- [ ] 3.2 Pausar a mesma tarefa e iniciar de novo, conferindo que agora ela retoma direto, sem diálogo. Em outra tarefa reaberta, escolher "Continuar na branch atual" e conferir que ela fica em andamento sem branch nova
- [x] 3.3 Iniciar uma tarefa da `entrada` e conferir que o diálogo continua como antes (com prazo e sem as opções). Rodar `npm run build` e `npm test` sem erros

## Workflow follow-up

- Publicar depois da change `nova-branch-ao-reiniciar` do ActumAPI (ou junto com ela).
- Arquivar a `criar-branch-ao-iniciar` antes desta.
- Arquivar a change depois da revisão.
