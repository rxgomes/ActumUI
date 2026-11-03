# Design

## Context

O detalhe da tarefa (`TarefaDetalhePage`) usa a store `useTarefaStore`, lê tudo da API e mostra em duas colunas: dados e branches à esquerda, retrabalhos e comentários à direita. As chamadas passam por `src/api` (`cliente`, `executar`, `ErroDaApi`), os números do OpenAPI são normalizados com `paraNumero`, as datas são formatadas por `src/api/datas.ts` e os erros de ação são notificados por `useNotificarErro`.

A API (ActumAPI `309c4b3`) devolve as análises com `checklist` como lista de grupos (`nome`, `itens`), `testes` e `duvidas` como listas de itens (`identifier`, `tipo`, `ordem`, `texto`, `grupo`, `vago`, `concluido`, `concluidoEm`), além de `versao`, `atual`, `modelo`, `tokensEntrada`, `tokensSaida` e `analisadaEm`.

## Goals / Non-Goals

**Goals**
- Ver a demanda organizada com um clique, sem sair do detalhe.
- Marcar o andamento item a item, com o progresso visível.
- Deixar claro que a análise é paga e pedir confirmação na reanálise.

**Non-Goals**
- Envio de dúvidas ao Asana, edição de itens, análise no Painel.

## Decisions

### 1. API (`src/api/analises.ts`)

- `obterSituacaoClaude(): Promise<SituacaoClaude>` → `GET /claude/situacao`.
- `listarAnalises(identifier): Promise<Analise[]>` → `GET /tarefas/{identifier}/analises`.
- `analisarTarefa(identifier): Promise<Analise>` → `POST /tarefas/{identifier}/analises`.
- `marcarItemDaAnalise(identifier, itemIdentifier, concluido): Promise<ItemDaAnalise>` → `PATCH .../itens/{itemIdentifier}`.
- Tipos de tela (`Analise`, `GrupoDoChecklist`, `ItemDaAnalise`) derivados de `schema.d.ts` por funções `paraAnalise`/`paraItem`, que normalizam `versao`, `ordem` e tokens com `paraNumero`.
- Funções puras no mesmo módulo: `progressoDoChecklist(analise)` → `{ feitos, total }` e `textoDasDuvidas(analise)` → perguntas numeradas, uma por linha.

### 2. Store `useAnaliseStore` (`src/stores/analise.ts`)

Estado da tarefa aberta, separado de `useTarefaStore` para não atrasar o detalhe nem misturar recargas:
- `identifier`, `situacao` (`SituacaoClaude | null`), `versoes` (`Analise[]`, mais recente primeiro), `versaoExibida` (número; padrão a atual), `carregando`, `erroAoCarregar`, `analisando`, `erroDaAnalise`, `marcando` (`Set` de itens em gravação).
- `carregar(identifier)`: lê situação e versões em paralelo; troca de tarefa limpa o estado.
- `analisar()`: `analisando=true`, limpa `erroDaAnalise`, chama a API, insere a nova versão no topo e a exibe. Em erro, guarda `erroDaAnalise` (`ErroDaApi`) e mantém as versões.
- `marcar(item, concluido)`: só na versão atual; adiciona ao `marcando`, aplica a resposta da API no item; em erro, mantém o estado anterior e repassa o erro para a página notificar.
- Getters: `atual`, `exibida`, `exibindoAnterior`.

### 3. Componentes

- `AnaliseDaTarefa.vue` (card "Análise com IA", recebe `identifier` e `arquivada`), com os estados:
  | Estado | Exibição |
  |---|---|
  | Carregando | `q-skeleton` no card |
  | Erro ao carregar | mensagem da API + "Tentar novamente" |
  | Chave não configurada | `q-banner` com o comando `dotnet user-secrets` (mesmo estilo do aviso do Asana) |
  | Sem análise | texto curto do que a IA faz, aviso de custo/privacidade e botão "Analisar com IA" (desabilitado em tarefa arquivada, com tooltip) |
  | Analisando | `q-linear-progress` indeterminado + "Analisando a demanda… pode levar até um minuto"; botões desabilitados |
  | Erro da análise | `q-banner` vermelho com `erro.message` (dispensável), acima do conteúdo atual |
  | Com análise | objetivo, checklist por grupo, testes, dúvidas, progresso, rodapé e ações |
- Ações no topo do card: "Reanalisar" (confirmação via `quasar.dialog`: "A reanálise é uma nova chamada paga à Claude API e gera a versão N+1. Itens iguais aos já marcados continuam marcados."), seletor de versão (`q-select` "Versão 2 (atual) · 03/11/2026 17:44") e "Copiar dúvidas" (`copyToClipboard` do Quasar).
- `ItemDaAnalise.vue`: `q-checkbox` + texto (riscado e cinza quando marcado), aviso ⚠️ (`q-icon` `warning` cor `warning`) com a explicação de `vago` em texto pequeno abaixo do item, data da marcação em tooltip. Desabilitado quando a versão não é a atual ou o item está em gravação.
- Versão anterior exibida: `q-banner` informativo "Você está vendo a versão 1 (anterior). Itens não podem ser marcados." com "Ver versão atual".
- `TarefaDetalhePage.vue`: inclui `<AnaliseDaTarefa>` no topo da coluna direita, acima de retrabalhos e comentários (na verificação, abaixo de uma descrição longa ela ficava fora da tela). As notificações de sucesso ("Análise concluída.", "Dúvidas copiadas.") e de erro de marcação ficam no próprio componente.

Nenhuma rota nova, nenhum composable novo e nenhuma dependência npm nova.

### 4. Tipos da API

`npm run api:tipos` lê `http://localhost:5180/openapi/v1.json`. A API em execução precisa estar na versão `309c4b3` (reiniciada) para os endpoints novos aparecerem; alternativa sem reiniciar: gerar a partir de uma instância auxiliar (`npx -y openapi-typescript@7 http://localhost:5181/openapi/v1.json -o src/api/schema.d.ts`). O arquivo gerado não é editado à mão.

## Risks / Trade-offs

- **Custo na verificação:** a verificação no navegador usa as análises já gravadas da tarefa do IPI (versões 1 e 2), sem nova chamada paga; o fluxo "Reanalisar" real só é executado com autorização do usuário. Estados de erro são verificados com a API auxiliar sem chave/sem rede.
- **Tempo da análise (10–60 s):** o progresso fica só na seção; a página continua utilizável. Sair da página durante a análise não cancela a chamada na API (a versão é gravada mesmo assim e aparece ao voltar).
- **Versão 1 sem grupos:** análises anteriores ao formato agrupado aparecem num único grupo "Geral" (a API já faz isso).

## Open Questions

Nenhuma.
