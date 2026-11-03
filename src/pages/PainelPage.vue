<script setup lang="ts">
import PaginaCabecalho from '@/components/PaginaCabecalho.vue'
</script>

<template>
  <q-page padding>
    <PaginaCabecalho titulo="Painel" />

    <!-- Provisório: o painel agrupado (retrabalho, entrada, atrasadas...) vem na change do painel. -->
    <q-card flat bordered style="max-width: 480px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="blue-1" text-color="secondary" icon="dashboard" />
        <div class="text-grey-8">O painel de tarefas será exibido aqui.</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>
