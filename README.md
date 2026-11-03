# Actum UI

Front-end do Actum, organizador pessoal das demandas recebidas pelo Asana. Vue 3 + TypeScript + Vite + Pinia + Quasar.
A API fica no repositório separado `..\ActumAPI` (veja `docs/especificacao-fase1.md` lá).

## Pré-requisitos

- Node.js 24 ou superior
- A Actum API rodando em `http://localhost:5180` (perfil `http` do `launchSettings.json`)

## Executar

```bash
npm install
npm run dev
```

O front sobe em `http://localhost:5173`, a única origem liberada no CORS da API em desenvolvimento. A porta é fixa
(`strictPort`): se estiver ocupada, o Vite não sobe em outra.

O endereço da API fica em `.env.development` (`VITE_API_URL`).

## Tipos da API

Os tipos dos DTOs ficam em `src/api/schema.d.ts`, gerados a partir do OpenAPI da API e versionados (o build não precisa
da API). Não edite esse arquivo à mão. Quando a API mudar, com ela rodando em `Development`:

```bash
npm run api:tipos
```

O gerador (`openapi-typescript`) roda via `npx` e não fica instalado no projeto: a versão 7 declara compatibilidade só
com TypeScript 5, e o npm recusa a instalação junto com o TypeScript 6 do projeto.

## Testes

```bash
npm test
```

Executa os testes do Vitest (`src/**/*.spec.ts`) no fuso `America/Sao_Paulo`, onde erros de conversão de datas
`yyyy-MM-dd` aparecem.

## Build

```bash
npm run build
```

Verifica os tipos (`vue-tsc`) e gera `dist/`.
