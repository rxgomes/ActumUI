# Design

## Context

- `TarefaDetalhePage.aoEscolherAcao('iniciar')` abre o `IniciarTarefaDialog` quando a tarefa está na `entrada` e, nos demais casos, chama `retomarTarefa` direto.
- O `IniciarTarefaDialog` (da `criar-branch-ao-iniciar`) tem:
  - o seletor de bases recentes, com os estados carregando, vazio e erro e o contador de abertura;
  - a sugestão `sugerirBranchDeImplementacao` e as caixas Front/Back;
  - o tratamento de erros por `errosDoDialogo(erro, Campos)`, sem `campoDoConflito`.
- `retomarTarefa(identifier)` em `src/api/tarefas.ts` envia o `POST` sem corpo.
- O contrato novo vem da change `nova-branch-ao-reiniciar` do ActumAPI: corpo opcional `RetomarTarefaRequest` em `retomar`, `novaBranchSugerida` no detalhe e `409` no `iniciar` para uma implementação repetida.

## Goals / Non-Goals

**Goals:**
- Reaproveitar o diálogo e os campos do primeiro início, sem duplicar o seletor de bases.
- Deixar a escolha explícita (nova branch ou continuar), com a nova branch marcada ao abrir.

**Non-Goals:**
- Componente genérico de "campos de branch". O diálogo atual só ganha um modo.
- Store ou estado global novo.

## Decisions

### Camada `src/api`
- `retomarTarefa(identifier, dados?: DadosParaRetomar)`, com `DadosParaRetomar = { branchBase, branchImplementacao, partes }`. Sem `dados`, o `POST` vai sem corpo, como hoje, e os chamadores atuais não mudam. Com `dados`, eles vão no corpo.
- O JSDoc é atualizado e cita os erros `400`/`409`/`502` do caminho com branch.
- `TarefaDetalhe` herda `novaBranchSugerida` do tipo gerado, sem conversão.

### Modo do diálogo pelo status
O `IniciarTarefaDialog` calcula `retrabalho = detalhe.status !== 'entrada'`. Não há prop nova, porque o modo decorre da tarefa recebida.

| | Entrada | Retrabalho |
|---|---|---|
| Título | "Iniciar tarefa" | "Iniciar retrabalho" |
| Opções | — | `q-option-group` (radio): "Criar nova branch" (padrão) / "Continuar na branch atual" |
| Campos | base, implementação, prazo, partes | base, implementação, partes (só com "Criar nova branch") |
| Envio | `iniciarTarefa` | `retomarTarefa(id, dados)` ou `retomarTarefa(id)` |
| Botão desabilitado | sem parte | sem parte, só com "Criar nova branch" |

Com "Continuar na branch atual", os campos ficam ocultos e as bases recentes não são carregadas de novo. Ao voltar para "Criar nova branch", os valores digitados continuam. As bases são carregadas ao abrir em qualquer modo, porque a opção padrão é criar.

O texto de ajuda no retrabalho fica assim: "A tarefa foi reaberta. Crie uma nova branch de implementação no GitHub a partir da base, nos repositórios das partes marcadas, ou continue na branch atual. A nova branch fica vinculada ao retrabalho e é enviada ao Asana como tag na conclusão."

Alternativa considerada: um `RetomarTarefaDialog` separado. Foi descartada porque repetiria o seletor de bases com os quatro estados e o contador de abertura.

### Quando abrir o diálogo
```
aoEscolherAcao('iniciar'):
  status == 'entrada'                -> abre o diálogo (modo entrada)
  detalhe.novaBranchSugerida         -> abre o diálogo (modo retrabalho)
  senão                              -> retomarTarefa direto (como hoje)
```
Quem decide é a API, pelo `novaBranchSugerida`. O front não deduz o retrabalho a partir de `retrabalhos` e `branches`.

### Estados do diálogo (modo retrabalho)
| Estado | Comportamento |
|---|---|
| Abrindo | "Criar nova branch" marcada; implementação sugerida; partes desmarcadas; bases carregando (mesmos estados vazio/erro do início) |
| Enviando | botão com `loading`, Cancelar desabilitado e `persistent` |
| Erro `400`/`502` | banner com `detail`, diálogo aberto com os dados |
| Erro `409` | mensagem no campo `branchImplementacao` |
| Erro de campo | `branchBase`, `branchImplementacao` e `partes` no campo |
| Sucesso | fecha e emite `concluido`; a página notifica "Tarefa em andamento." e recarrega |

O `409` passa a ir para o campo nos dois modos: `errosDoDialogo(erro, Campos, 'branchImplementacao')`. Isso cobre também o `409` novo do `iniciar` numa tarefa desarquivada.

### Sugestão do nome
A mesma `sugerirBranchDeImplementacao(titulo, hoje)`. No mesmo dia do início original, o nome sugerido é igual ao da branch anterior e a API responde `409`, que aparece no campo para o usuário ajustar. Não foi criado um sufixo automático porque ele dependeria de conhecer as branches existentes no GitHub.

### Stores, rotas e composables
Não há nenhum novo. O `useTarefaStore` recarrega o detalhe pelo `concluido`, como hoje.

### Dependências npm
Nenhuma.

## Risks / Trade-offs

- [A base selecionada ao abrir é a mais recente da empresa, e não necessariamente a da tarefa] → O usuário troca no seletor. Na prática a base da tarefa costuma estar entre as recentes. Destacar a base da tarefa ficaria para uma change futura, se a API passar a devolvê-la.
- [Usuário escolhe "Continuar" e quer a nova branch depois] → A API mantém `novaBranchSugerida = true`, então o próximo Iniciar volta a oferecer a opção. "Nova branch" também continua disponível.
- [Front publicado antes da API] → O tipo regerado não teria `novaBranchSugerida` e o build falharia. As changes são publicadas na ordem API, depois front.
