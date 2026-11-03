# Proposal

## Why

A API já estrutura a demanda da tarefa com IA (Fase 2 no ActumAPI): objetivo, checklist agrupado por área com aviso nos trechos vagos, testes e dúvidas, gravados em versões e marcáveis. No front, porém, o detalhe da tarefa ainda mostra só o texto do Asana. O usuário quer abrir a tarefa e, com um clique, ver a demanda organizada e acompanhar a execução marcando os itens.

## What Changes

- Nova seção **Análise com IA** no detalhe da tarefa (`TarefaDetalhePage`), no topo da coluna lateral, ao lado da descrição (visível ao abrir a tarefa).
- Sem análise: botão **Analisar com IA**, com o aviso de que a análise é paga e envia o conteúdo da tarefa à Anthropic.
- Durante a análise: indicação de progresso (pode levar até um minuto), sem bloquear o resto da página.
- Com análise:
  - **Objetivo** em destaque.
  - **Checklist por grupo** (ex.: Front, Back: cálculo, Back: integração TecnoSpeed), com caixa de marcação por item e aviso ⚠️ com a explicação nos itens vagos.
  - **Testes** e **Dúvidas para o solicitante**, também marcáveis (teste realizado, dúvida resolvida).
  - Progresso (ex.: 3 de 11 itens do checklist feitos).
  - Botão **Copiar dúvidas**, que copia as perguntas em texto para colar no Asana enquanto o envio direto não existe.
  - Rodapé com versão, data, modelo e tokens.
- **Reanalisar**, com confirmação, gera uma nova versão. Itens iguais aos já marcados chegam marcados (regra da API).
- **Versões anteriores** podem ser consultadas, somente leitura.
- Chave da Claude API não configurada: a seção explica como configurar (comando `dotnet user-secrets`) em vez de mostrar o botão.
- Erros da API (sem créditos, chave recusada, recusa do modelo, indisponível, análise já em andamento) aparecem na própria seção, com a mensagem em pt-BR vinda da API.

## Capabilities

### New Capabilities

- `task-analysis`: exibição, geração, reanálise, versões e marcação da análise com IA no detalhe da tarefa.

### Modified Capabilities

Nenhuma. O detalhe da tarefa (`task-detail`) ganha a seção como um bloco novo, sem mudar os requisitos existentes.

## Impact

- **Telas e componentes afetados:**
  - `TarefaDetalhePage.vue` passa a incluir a seção.
  - Componentes novos em `src/components/tarefas/`: `AnaliseDaTarefa.vue` (seção e estados), `ItemDaAnalise.vue` (item marcável com aviso de trecho vago). A confirmação da reanálise usa `quasar.dialog`, como a exclusão de branch.
  - Funções novas em `src/api/analises.ts` e store nova `useAnaliseStore`.
- **Endpoints da API usados:** `GET /claude/situacao`, `GET /tarefas/{identifier}/analises`, `POST /tarefas/{identifier}/analises` e `PATCH /tarefas/{identifier}/analises/itens/{itemIdentifier}`. Já existem no ActumAPI (commit `309c4b3`); só é preciso regenerar `src/api/schema.d.ts`. Nenhuma alteração na API.
- **Dependências novas:** nenhuma (a cópia usa `copyToClipboard` do Quasar).
- **Custo:** cada clique em Analisar/Reanalisar é uma chamada paga à Anthropic; a tela deixa isso explícito e a reanálise pede confirmação.

### Fora do escopo

- Postar as dúvidas como comentário no Asana (Fase 3).
- Editar o texto do objetivo ou dos itens, incluir itens manuais.
- Mostrar a análise no Painel (cartão) ou indicadores de progresso fora do detalhe.
- Análise automática ao abrir a tarefa.
