<script setup lang="ts">
import { hojePorExtenso } from '@/api/datas'

defineProps<{
  /** Título da página */
  titulo: string
}>()

const hoje = hojePorExtenso()
</script>

<template>
  <div class="q-mb-lg">
    <h1 class="text-h5 text-weight-bold q-my-none">{{ titulo }}</h1>
    <div class="text-caption text-grey-7">{{ hoje }}</div>
  </div>
</template>
