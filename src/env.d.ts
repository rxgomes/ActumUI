/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço base da Actum API, sem barra no fim */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
