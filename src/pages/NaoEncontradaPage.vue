<script setup lang="ts">
import PaginaCabecalho from '@/components/PaginaCabecalho.vue'
</script>

<template>
  <q-page padding>
    <PaginaCabecalho titulo="Página não encontrada" />

    <q-card flat bordered style="max-width: 480px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="blue-1" text-color="secondary" icon="travel_explore" />
        <div>O endereço acessado não corresponde a nenhuma tela do Actum.</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn unelevated color="primary" icon="dashboard" label="Ir para o Painel" :to="{ name: 'painel' }" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>
