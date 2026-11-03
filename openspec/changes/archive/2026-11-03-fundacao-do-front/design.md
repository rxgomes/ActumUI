# Design

## Context

O projeto inicial já tem Vue 3, TypeScript 6, Vite 8, Quasar 2 (Notify e Dialog, pt-BR), Pinia, Vue Router e o alias `@/` para `src/`. Existem `MainLayout.vue`, com cabeçalho e um item de menu, e `PainelPage.vue`, que chama `fetch` diretamente. A API publica `GET /openapi/v1.json` só em `Development`; ela devolve erros em Problem Details, enums em snake_case, datas sem horário como `yyyy-MM-dd` e datas com horário no horário local, sem fuso. O CORS libera apenas `http://localhost:5173`. Motivação em proposal.md; comportamento em `specs/api-client` e `specs/app-shell`.

## Goals / Non-Goals

**Goals:**
- Um único caminho para chamar a API, com tipos derivados do contrato e erros convertidos num formato só.
- Utilitários de data que nunca passam um `yyyy-MM-dd` por `new Date`.
- Layout pronto para receber as telas da Fase 1.

**Non-Goals:**
- Cache de respostas, novas tentativas automáticas ou cancelamento de requisições.
- Biblioteca de formulários. A associação de `errors` aos campos fica pronta, mas os formulários entram com os diálogos.

## Decisions

### 1. Tipos gerados com `openapi-typescript`, versionados

`npm run api:tipos` executa `openapi-typescript http://localhost:5180/openapi/v1.json -o src/api/schema.d.ts`. O arquivo gerado é versionado, para o build e o CI não dependerem da API rodando, e nunca é editado à mão.

- **Alternativa considerada:** escrever as interfaces à mão. Descartada, porque elas divergiriam da API sem nenhum aviso, e o requisito "Contrato derivado do OpenAPI" pede que o build falhe nesse caso.
- **Alternativa considerada:** gerar um cliente completo, com `orval` ou `openapi-generator`. Descartada por gerar muito código e ser mais pesada do que este projeto precisa.

### 2. Cliente HTTP com `openapi-fetch`

`src/api/cliente.ts` cria um único cliente `createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL })`. Caminho, parâmetros e corpo são verificados pelos tipos de `schema.d.ts`. O pacote tem cerca de 6 kB, usa o `fetch` nativo e não tem dependências.

- **Alternativa considerada:** `axios` com tipos à mão. Descartada, porque perde a ligação entre a rota e o tipo e acrescenta uma dependência maior sem ganho real.
- Cada recurso ganha um arquivo de funções em `src/api/`. Nesta change existe só `src/api/asana.ts`, com `obterConexaoAsana()`. As páginas usam essas funções e nunca o cliente diretamente.

### 3. Erros num formato único: `ErroDaApi`

As funções de `src/api` devolvem os dados ou lançam `ErroDaApi`, com:

- `tipo`: `problema` (veio Problem Details), `rede` (`fetch` falhou: API desligada ou CORS) ou `inesperado` (erro sem Problem Details);
- `status`;
- `mensagem`: `detail ?? title` para `problema`, e textos fixos em pt-BR para `rede` ("Não foi possível conectar à Actum API. Verifique se ela está em execução.") e `inesperado`;
- `errosPorCampo`: as chaves de `errors` convertidas de PascalCase para camelCase (`PrazoInterno` → `prazoInterno`), que é como os campos se chamam no front.

Um helper interno converte o resultado `{ data, error, response }` do `openapi-fetch` em dado ou exceção. O composable `useNotificarErro()` mostra `erro.mensagem` com `Notify` (tipo `negative`). Qualquer outra exceção é tratada como `inesperado`.

- **Alternativa considerada:** devolver `{ dados, erro }` em vez de lançar. Descartada: com `async/await` e `try/catch`, o caminho de sucesso fica mais limpo nas páginas e nas stores.

### 4. Datas em `src/api/datas.ts`

- `formatarData('2026-11-04')` → `04/11/2026`, só com manipulação de texto, sem `Date`.
- `paraDataDaApi(date)` → `yyyy-MM-dd` a partir de `getFullYear/getMonth/getDate`, que usam a hora local, e não de `toISOString`, que usa UTC.
- `formatarDataHora('2026-11-03T14:30:15.123')` → `03/11/2026 14:30`. `new Date` com texto sem `Z` é interpretado como hora local.
- `hojePorExtenso()` → "Quarta-feira, 04 de novembro de 2026", com `Intl.DateTimeFormat('pt-BR')` e a primeira letra maiúscula.

O arquivo fica em `src/api` porque trata dos formatos de data do contrato, sem criar uma pasta `utils` nova.

### 5. Estado da conexão: store `conexao`

`useConexaoStore` (`src/stores/conexao.ts`) guarda o resultado de `GET /asana/conexao`: `situacao` (`verificando`, `ok`, `nao_configurado`, `token_invalido` ou `erro`) e, no caso de erro, a mensagem. Tem a ação `verificar()`. Fica numa store porque o layout mostra o aviso e as próximas telas vão consultar o mesmo estado (por exemplo, o botão Sincronizar).

### 6. Layout, rotas e páginas

- `MainLayout.vue`: cabeçalho `bg-primary`; um `q-banner` de aviso logo abaixo da barra, dentro do `q-header`, para ficar visível em todas as telas; menu lateral com `q-expansion-item` "Tarefas" → "Painel". No `onMounted`, chama `conexao.verificar()`.
- `components/PaginaCabecalho.vue`: recebe `titulo` e mostra a data de `hojePorExtenso()` abaixo dele.
- Rotas: `painel` (`/`) e `naoEncontrada` (`/:caminho(.*)*`), as duas dentro do `MainLayout`.
- `NaoEncontradaPage.vue`: mensagem e um botão para `{ name: 'painel' }`.
- `PainelPage.vue` (provisória): usa `PaginaCabecalho` e mostra um estado vazio ("O painel de tarefas será exibido aqui."). O cartão de conexões e o `fetch` direto saem; o estado da conexão passa a ser o aviso do layout.

### 7. Estados

| Tela / elemento | Carregando | Vazio | Erro | Sucesso |
|---|---|---|---|---|
| Aviso do Asana (layout) | nada é exibido enquanto verifica | — | banner com a mensagem: token não configurado, token inválido ou "Não foi possível verificar a conexão com o Asana: <mensagem>" | sem banner |
| Painel (provisória) | — | texto informativo | — | — |
| Página não encontrada | — | — | — | mensagem e botão para o Painel |

Erros de ações do usuário (nas próximas changes) usam `useNotificarErro()`, que mostra uma notificação. Erros de carga de tela aparecem na própria tela.

### 8. Testes com Vitest

`vitest` roda em ambiente `node`, com `TZ=America/Sao_Paulo` definido na configuração, cobrindo `datas.ts` e a conversão de erros (`ErroDaApi`, a partir de respostas simuladas). Os testes ficam junto do código (`*.spec.ts`), e `npm test` executa `vitest run`. Ele foi escolhido por usar a mesma configuração do Vite, sem transpilador extra.

## Risks / Trade-offs

- **[`openapi-typescript` 7 declara `typescript ^5.x` como peer dependency, e o projeto usa TypeScript 6]** → Instalar normalmente e verificar a geração. Se o npm recusar a instalação por conflito de peer, rodar o gerador com `npx openapi-typescript@7`, sem instalá-lo no projeto, e registrar isso no README.
- **[Tipos gerados ficam desatualizados se ninguém rodar `api:tipos`]** → Tarefa explícita nas changes que usam endpoints novos (regra do `config.yaml`) e aviso no README.
- **[O OpenAPI da API só existe em `Development`]** → A geração é feita em desenvolvimento, com a API rodando pelo perfil `http`.
- **[Erro de CORS aparece como falha de rede]** → A mensagem de API indisponível cobre os dois casos; a causa aparece no console do navegador.

## Migration Plan

Não há sistema em uso. Implantação: merge na `main`. Rollback: reverter o commit.
