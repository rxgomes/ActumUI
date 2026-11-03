import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Testes de código TypeScript puro (api, stores); não carrega o plugin do Quasar.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Fuso de São Paulo: é onde datas yyyy-MM-dd convertidas como UTC voltariam um dia.
    env: { TZ: 'America/Sao_Paulo' },
  },
})
