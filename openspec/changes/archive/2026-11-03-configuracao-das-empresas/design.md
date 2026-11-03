# Design

## Context

O front já tem:
- `listarEmpresas()` em `src/api/empresas.ts`, usada pelo filtro do Painel por meio de `usePainelStore.carregarEmpresas`;
- `ErroDaApi` e `useNotificarErro`;
- o helper `errosDoDialogo` (erros por campo ou mensagem geral);
- o `MainLayout`, com o grupo "Tarefas" no menu.

`PATCH /empresas/{identifier}` recebe `{ cor: string | null, sincronizar: boolean | null }`: nulo mantém o valor atual. Ele valida `cor` no formato `#RRGGBB` (`400` com `errors.Cor`), devolve a empresa atualizada com a cor em maiúsculas e responde `404` para empresa inexistente. Motivação em proposal.md; comportamento em `specs/company-settings`.

## Goals / Non-Goals

**Goals:**
- Uma tela simples, que salva cada alteração na hora, sem botão "Salvar tudo".
- A cor nova aparece no Painel na próxima vez que ele carrega.

**Non-Goals:**
- Estado compartilhado de empresas entre telas. O Painel já recarrega as empresas ao montar o filtro.
- Validar a cor no front além do que o seletor garante: a validação de formato é da API.

## Decisions

### 1. `alterarEmpresa` em `src/api/empresas.ts`

`alterarEmpresa(identifier, { cor?, sincronizar? })` envia só os campos informados (os outros vão como `null`) e devolve a `Empresa` atualizada pela API, usada para atualizar a linha.

- **Alternativa considerada:** recarregar a lista inteira depois de cada alteração. Descartada, porque a resposta do `PATCH` já traz a empresa completa.

### 2. Estado local da página, sem store nova

`EmpresasPage.vue` guarda a lista, o carregamento e o erro em `ref`s locais, porque nenhuma outra tela precisa desse estado. `usePainelStore` não muda: o filtro do Painel recarrega as empresas toda vez que o Painel é aberto, então a cor e a lista chegam atualizadas.

### 3. Linha da empresa: `src/components/empresas/LinhaDaEmpresa.vue`

Cada linha mostra:
- o quadrado com a cor e o nome;
- uma prévia do chip como aparece no cartão do Painel;
- a carga inicial, com `formatarDataHora`, ou "Carga inicial na próxima sincronização";
- o `q-toggle` "Sincronizar".

A linha emite `alterada` com a empresa devolvida pela API.

- **Sincronizar:** ao mudar o `q-toggle`, chama `alterarEmpresa` imediatamente, com `loading` no toggle.
  - Em falha, o toggle volta ao valor anterior e o erro é notificado com `useNotificarErro`.
  - Quando a empresa está desligada, a linha mostra o texto "Fora da sincronização: não é consultada no Asana."
- **Cor:** o botão "Alterar cor" abre um `q-popup-proxy` com `QColor`.
  - O seletor usa `default-view="palette"`, com a paleta da API e `no-header-tabs`, e o formato hex.
  - A prévia do chip acompanha a cor escolhida.
  - "Salvar" envia `cor`; "Cancelar" fecha sem enviar.
  - Em falha, o erro aparece no popup, via `errosDoDialogo` (campo `cor` ou mensagem geral), e a cor anterior é mantida.
  - O `QColor` devolve `#rrggbb` em minúsculas, e a API grava em maiúsculas. A linha usa sempre a cor devolvida pela API.

A paleta oferecida é a mesma que a API usa ao criar empresas (`#1976D2`, `#E64A19`, `#388E3C`, `#7B1FA2`, `#F9A825`, `#00838F`, `#C2185B`, `#5D4037`). Ela fica numa constante em `src/components/empresas/paleta.ts`. O `QColor` ainda permite qualquer cor fora dela.

### 4. Menu e rota

- Nova rota `empresas`: `/empresas`, dentro do `MainLayout`.
- O `MainLayout` ganha o grupo recolhível "Configurações" (ícone `settings`), com o item "Empresas" (ícone `business`), que fica destacado na rota ativa.

### 5. Estados

| Elemento | Carregando | Vazio | Erro | Sucesso |
|---|---|---|---|---|
| Página Empresas | `q-skeleton` no lugar das linhas | "Nenhuma empresa ainda. As empresas são criadas pela sincronização, a partir dos seus workspaces do Asana." e botão para o Painel | cartão com a mensagem e "Tentar novamente" | lista |
| Toggle Sincronizar | `loading` no toggle | — | volta ao valor anterior e notificação | valor da API e notificação `positive` ("Aureum-ERP fora da sincronização." ou "… volta a ser sincronizada.") |
| Troca de cor | `loading` no Salvar do popup | — | mensagem no popup; cor anterior mantida | popup fecha, nova cor na linha e notificação `positive` |

### 6. Stores, rotas e composables

- **Nova rota:** `empresas`.
- **Stores e composables:** nenhum novo. `useNotificarErro` e `errosDoDialogo` são reutilizados.

## Risks / Trade-offs

- **[Desligar uma empresa não esconde as tarefas dela no Painel]** → Comportamento atual da API, registrado como fora do escopo. A página explica que desligar só impede novas consultas.
- **[Duas alterações rápidas na mesma linha]** → Enquanto uma alteração está em andamento, a linha desabilita o toggle e o botão de cor.

## Migration Plan

Não há sistema em uso. Implantação: merge na `main`. Rollback: reverter o commit.
