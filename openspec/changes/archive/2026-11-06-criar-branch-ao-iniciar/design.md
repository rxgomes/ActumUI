# Design

## Context

- `IniciarTarefaDialog.vue` e `NovaBranchDialog.vue` usam `q-input` livres e tratam os erros com `errosDoDialogo(erro, Campos, campoDoConflito)`. Esse helper associa as chaves de `errors`, já normalizadas para camelCase (`partes`), aos campos do diálogo e manda o resto para o banner geral.
- `src/api/tarefas.ts` expõe `iniciarTarefa(identifier, DadosParaIniciar)` e `adicionarBranch(identifier, tipo, nome)`, e reaproveita os tipos de `schema.d.ts` (gerado pelo `npm run api:tipos`).
- `LinhaDaEmpresa.vue` edita a cor num `q-popup-proxy` com salvar e cancelar, e a sincronização num toggle.
- `BranchesDaTarefa.vue` lista nome, tipo, retrabalho e enviada/pendente.
- O contrato novo vem da change `criar-branch-ao-iniciar` do ActumAPI (`partes`, `tag`, `repositorioFront`/`repositorioBack`, `GET /tarefas/{identifier}/branches-base-recentes`).

## Goals / Non-Goals

**Goals:**
- Reduzir o Iniciar a conferir os valores sugeridos e marcar as partes.
- Seguir os padrões existentes de diálogo e de edição por popup, sem componente genérico novo.

**Non-Goals:**
- Montar o texto da tag ou validar o nome da branch no front, porque essas são regras da API.
- Estado global para as bases recentes. A lista é carregada a cada abertura do diálogo.

## Decisions

### Camada `src/api`
- `tarefas.ts`:
  - `ParteBranch = components['schemas']['ParteBranch']`;
  - `DadosParaIniciar` ganha `partes: ParteBranch[]`;
  - `adicionarBranch(identifier, tipo, nome, partes)`;
  - nova `listarBasesRecentes(identifier): Promise<string[]>`;
  - `Branch` herda `partes` e `tag` de `BranchResponse` sem conversão.
- `empresas.ts`: `DadosDaEmpresa` ganha `repositorioFront?: string` e `repositorioBack?: string`, enviados como `null` quando não informados (mantém) e como texto, inclusive `""`, quando informados.
- Cada função exportada nova ou alterada tem JSDoc curto em pt-BR.

### Sugestão do nome: função pura em `components/tarefas/branches.ts`
`sugerirBranchDeImplementacao(titulo: string, hoje: Date): string`:
- o prefixo `yyMMdd` vem de `getFullYear`/`getMonth`/`getDate` (hora local, sem `toISOString`, para não voltar um dia);
- o título é normalizado com `normalize('NFD')`, as marcas diacríticas são removidas, o texto vai para minúsculas, `/[^a-z0-9]+/g` vira `-` e os hífens das pontas são retirados;
- o resultado é cortado em 60 caracteres, e um hífen que sobrar no fim é retirado.

Fica no front porque é só uma sugestão editável. A API continua validando o nome, e o front não repete essa validação. O arquivo fica junto de `prazos.ts` e `textos.ts`, que já guardam funções puras da área de tarefas. A função recebe `hoje` como parâmetro para ser testável.

Alternativa considerada: um endpoint de sugestão na API. Foi descartada porque é uma chamada a mais para um texto que o usuário edita livremente.

### Branch base: `q-select` com valor novo
`q-select` com `use-input`, `hide-selected`, `fill-input`, `new-value-mode="add-unique"` e `input-debounce="0"`, com `options` vindas de `listarBasesRecentes`. O valor digitado entra ao confirmar (Enter ou blur, com `@input-value` atualizando o modelo), para que uma base digitada sem Enter não se perca. Ao abrir:
- **carregando**: `:loading="true"` no select, com o campo já editável;
- **sucesso com itens**: seleciona o primeiro;
- **vazio**: campo vazio, com o hint "Nenhuma base usada nesta empresa. Digite o nome da branch base.";
- **erro**: campo editável, com o hint em `text-warning` "Não foi possível carregar as bases recentes. Digite o nome da branch base." O erro não vai para o banner do diálogo, porque não impede o início.

Uma resposta que chegue depois de o diálogo ser fechado e aberto de novo é descartada por um contador de abertura.

### Partes: duas `q-checkbox` (Front, Back)
Começam desmarcadas, para o usuário decidir de propósito onde a branch é criada. O botão de confirmação fica `:disable` enquanto nenhuma estiver marcada. As partes são enviadas na ordem front, back. O erro de campo `partes` aparece num texto `text-negative text-caption` abaixo das caixas, porque `q-checkbox` não tem `error-message`.

O mesmo trecho é usado no `NovaBranchDialog`. Por serem só duas caixas, ele é repetido nos dois diálogos em vez de virar um componente.

### Estados dos diálogos
| Estado | Iniciar | Nova branch |
|---|---|---|
| Abrindo | campos sugeridos e bases carregando | campos vazios e partes desmarcadas |
| Enviando | botão com `loading`, Cancelar desabilitado e `persistent` (já existe) | igual |
| Erro `400`/`502` | banner com `detail` e o diálogo aberto com os dados | banner, ou campo `nome` no `409` |
| Erro de campo | `branchBase`, `branchImplementacao`, `prazoInterno` e `partes` no campo | `tipo`, `nome` e `partes` no campo |
| Sucesso | fecha e emite `concluido` (a página recarrega) | igual |

O texto de ajuda do Iniciar passa a ser: "A branch de implementação será criada no GitHub a partir da base, nos repositórios das partes marcadas. As branches são enviadas ao Asana como tags na conclusão."

### Branches da tarefa
`BranchesDaTarefa.vue` mostra, quando `partes.length > 0`:
- na legenda, "Front · Back" (ou só uma parte);
- num `q-tooltip` sobre o nome, "Tag no Asana: {tag}".

Sem partes, a branch aparece como hoje. A confirmação de exclusão em `TarefaDetalhePage.vue` ganha "A branch não é excluída no GitHub."

### Empresas: popup "Repositórios"
Em `LinhaDaEmpresa.vue`, um botão "Repositórios" ao lado de "Alterar cor" abre um `q-popup-proxy` com dois `q-input` (Front, Back, hint `dono/repo`), no mesmo padrão do popup da cor:
- **salvar**: envia só os campos alterados e notifica "Repositórios de {nome} atualizados.";
- **erros**: `repositorioFront`/`repositorioBack` vão para o campo correspondente e o restante para um texto de erro no popup;
- **cancelar**: descarta.

A legenda da linha mostra "Front: ixact/erp-web · Back: não definido". Os estados carregando, vazio e erro da página não mudam.

### Stores, rotas e composables
Não há store, rota nem composable novos. A tarefa é recarregada pelo `concluido`, como hoje.

### Dependências npm
Nenhuma.

## Risks / Trade-offs

- [O Iniciar fica mais lento porque a API chama o GitHub] → O botão mostra `loading` e o diálogo fica bloqueado até a resposta.
- [Usuário marca uma parte cuja empresa não tem repositório] → A API responde `400` com a mensagem, e o banner orienta a cadastrar o repositório em Empresas. O front não bloqueia antes, porque o detalhe da tarefa não traz os repositórios da empresa.
- [Sugestão de nome cortada no meio de uma palavra] → É aceitável, porque é editável.
- [Front publicado sem a API nova] → `partes` não existe no tipo regerado e o build falha antes. As duas changes são publicadas juntas.
