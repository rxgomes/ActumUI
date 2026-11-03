# Tasks

## 1. api

- [x] 1.1 Acrescentar `alterarEmpresa(identifier, { cor?, sincronizar? })` a `src/api/empresas.ts`, devolvendo a empresa atualizada. Testes:
  - envio só de `sincronizar` (com `cor = null`);
  - envio só de `cor` (com `sincronizar = null`);
  - `400` com `errors.Cor` como `ErroDaApi` com `errosPorCampo.cor`.

  Os tipos de `src/api/schema.d.ts` já cobrem o endpoint. Verificar com `npm test` e `npm run build`.

## 2. Páginas e componentes

- [x] 2.1 Criar `src/components/empresas/paleta.ts` e `LinhaDaEmpresa.vue` (cor, prévia do chip, carga inicial, toggle Sincronizar com reversão em falha, popup de cor com `QColor`, Salvar e Cancelar, erro no popup). Verificar com `npm run build`.
- [x] 2.2 Criar a rota `empresas`, `EmpresasPage.vue` (estados da tabela do design) e o grupo "Configurações" → "Empresas" no `MainLayout`. Verificar no navegador com a API rodando:
  - a página lista as três empresas reais com cor, sincronização e carga inicial;
  - o item do menu fica destacado;
  - desligar e religar a sincronização de "Meu espaço de trabalho";
  - trocar a cor da aremas.com.br, conferir a nova cor no filtro e nos cartões do Painel, e depois restaurar `#1976D2`;
  - cancelar uma troca de cor sem enviar nada;
  - API desligada (Vite auxiliar apontando para uma porta sem API) mostrando o erro com "Tentar novamente";
  - console do navegador sem erros.

  Ao final, deixar a sincronização das empresas como o usuário preferir (perguntar se "Meu espaço de trabalho" deve ficar desligado).

## 3. Verificação integrada

- [x] 3.1 `npm run build` e `npm test` sem erros, e nenhuma chamada `fetch` fora de `src/api` (`grep -rn "fetch(" src --include=*.vue` sem resultados).

## Workflow follow-up

- Arquivar a change com `/opsx:archive` após revisão.
