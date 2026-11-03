<script setup lang="ts">
import { formatarDataHora } from '@/api/datas'
import type { Comentario } from '@/api/tarefas'

defineProps<{
  /** Comentário exibido */
  comentario: Comentario
  /** Se o comentário estava não lido quando a tarefa foi aberta */
  novo: boolean
}>()
</script>

<template>
  <div class="comentario q-pa-sm" :class="{ novo }">
    <div class="row items-center q-gutter-xs text-caption text-grey-7">
      <span class="text-weight-medium text-grey-9">{{ comentario.autor ?? 'Autor não informado' }}</span>
      <span>· {{ formatarDataHora(comentario.criadoEm) }}</span>
      <q-badge v-if="novo" color="secondary" label="novo" class="q-ml-sm" />
    </div>
    <div class="texto text-body2 q-mt-xs">{{ comentario.texto }}</div>
  </div>
</template>

<style scoped>
.comentario {
  border-radius: 6px;
}

.comentario.novo {
  background: #e3f2fd;
}

.texto {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
