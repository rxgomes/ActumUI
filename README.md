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

## Build

```bash
npm run build
```

Verifica os tipos (`vue-tsc`) e gera `dist/`.
