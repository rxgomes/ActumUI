# Actum UI

Front-end em Vue 3 + TypeScript + Vite + Quasar + Pinia, que consome a Actum API (`..\ActumAPI`). Visão geral do projeto e regras de especificação em `openspec/config.yaml`.

## Code style

**TypeScript e componentes**
- Componentes em `<script setup lang="ts">` com Composition API. Não usar Options API.
- Tipar props com `defineProps<{ ... }>()` e eventos com `defineEmits<{ ... }>()`.
- Evitar `any`. Quando o tipo vier da API, usar os tipos gerados do OpenAPI (ver "Acesso à API").
- Sempre usar chaves `{ }` em `if`, `else`, `for`, `while`, mesmo com corpo de uma linha.

**Nomenclatura**

| Elemento | Convenção | Exemplo |
|---|---|---|
| Componentes (arquivo e uso) | PascalCase | `CartaoTarefa.vue`, `<CartaoTarefa />` |
| Páginas | PascalCase com sufixo `Page` | `PainelPage.vue` |
| Layouts | PascalCase com sufixo `Layout` | `MainLayout.vue` |
| Diálogos | PascalCase com sufixo `Dialog` | `IniciarTarefaDialog.vue` |
| Stores Pinia | `use<Nome>Store`, arquivo em camelCase | `useTarefasStore` em `stores/tarefas.ts` |
| Composables | `use<Nome>` | `useProblemDetails` |
| Variáveis, funções, props | camelCase | `prazoInterno`, `carregarPainel()` |
| Constantes de módulo | PascalCase | `TamanhoDaPagina` |
| Nomes de rota | camelCase | `painel`, `detalheTarefa` |

- Termos do domínio em pt-BR, iguais aos da API (`tarefa`, `empresa`, `retrabalho`, `prazoInterno`). Termos técnicos do framework podem ficar em inglês (`props`, `store`).
- Manter consistência com o que já existe no arquivo; não misturar idiomas no mesmo nome.
- Evitar abreviações não óbvias.

**Documentação**
- Funções e tipos exportados de `src/api`, `src/stores` e `src/composables` têm um comentário JSDoc curto, em pt-BR, descrevendo o que fazem para quem usa.

## Estrutura

```
src/
  api/          # cliente HTTP, tipos gerados do OpenAPI e funções por recurso
  stores/       # stores Pinia (estado compartilhado entre telas)
  composables/  # lógica reutilizável de componentes
  layouts/      # MainLayout (cabeçalho, menu lateral)
  pages/        # uma página por rota
  components/   # componentes, agrupados por área (ex.: components/tarefas/)
  router/       # rotas
  css/          # variáveis do Quasar (cores da marca)
```

## Acesso à API

- Toda chamada à API passa por `src/api`; componentes e páginas não chamam `fetch` diretamente. (A `PainelPage.vue` atual é provisória e será substituída.)
- O endereço base vem de `import.meta.env.VITE_API_URL`.
- Os tipos dos DTOs são gerados a partir de `http://localhost:5180/openapi/v1.json` e não são editados à mão. Quando a API mudar, regenere os tipos.
- Respostas de erro vêm em Problem Details: mostre `detail` (ou `title`) ao usuário com `Notify`, e associe `errors` aos campos do formulário (as chaves vêm em PascalCase, ex.: `PrazoInterno`).
- Não reimplemente regras da API (agrupamento do painel, transições, validação de branches); exiba o que a API devolve.
- Se a tela precisa de algo que a API não oferece, a mudança começa no `..\ActumAPI`.

## Datas

- Datas sem horário chegam como `yyyy-MM-dd` (ex.: `prazoInterno`). **Não** converta com `new Date('2026-11-04')`: o JavaScript interpreta como UTC e a data pode voltar um dia. Trate como texto ou monte a data com os componentes (ano, mês, dia).
- Datas com horário chegam no horário local, sem fuso (ex.: `2026-11-03T14:30:00`); `new Date(valor)` as interpreta corretamente como hora local.
- Exiba datas com `Intl.DateTimeFormat('pt-BR', ...)` ou com `date` do Quasar, em formato brasileiro.
- Ao enviar uma data sem horário, envie `yyyy-MM-dd`.

## Interface

- Use os componentes do Quasar; não adicione outra biblioteca de UI.
- Cores da marca por variável (`primary`, `secondary`, `accent`, `negative`, `warning`...) definidas em `src/css/quasar-variables.sass`, não por valor fixo nos componentes. A cor de cada empresa vem da API.
- Todo texto exibido ao usuário em pt-BR, incluindo mensagens de erro, rótulos e estados vazios.
- Toda tela que carrega dados trata os estados carregando, vazio e erro.

## Verificação

- `npm run build` (inclui `vue-tsc`) deve passar sem erros.
- Telas novas são verificadas no navegador com a API rodando (`http://localhost:5180`) e o front em `npm run dev` (`http://localhost:5173`).
