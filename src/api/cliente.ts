import createClient from 'openapi-fetch'

import type { paths } from './schema'

/**
 * Cliente HTTP da Actum API, tipado pelo contrato OpenAPI (`schema.d.ts`). Use-o só dentro de `src/api`;
 * páginas e componentes chamam as funções de cada recurso (ex.: `obterConexaoAsana`).
 */
export const cliente = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL })
