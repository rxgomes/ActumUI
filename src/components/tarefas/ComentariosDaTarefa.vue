<script setup lang="ts">
import type { Comentario } from '@/api/tarefas'

import ComentarioDaTarefa from './ComentarioDaTarefa.vue'

defineProps<{
  /** Todos os comentários, do mais antigo para o mais recente */
  comentarios: Comentario[]
  /** Comentários que estavam não lidos ao abrir a tarefa */
  comentariosNovos: ReadonlySet<string>
}>()
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pb-none row items-center q-gutter-sm">
      <div class="text-subtitle1 text-weight-bold">Comentários</div>
      <q-badge v-if="comentariosNovos.size > 0" color="secondary" :label="`${comentariosNovos.size} ${comentariosNovos.size === 1 ? 'novo' : 'novos'}`" />
    </q-card-section>

    <q-card-section v-if="comentarios.length === 0" class="text-body2 text-grey-6">Nenhum comentário.</q-card-section>

    <q-card-section v-else class="column q-gutter-xs">
      <ComentarioDaTarefa
        v-for="comentario in comentarios"
        :key="comentario.identifier"
        :comentario="comentario"
        :novo="comentariosNovos.has(comentario.identifier)"
      />
    </q-card-section>
  </q-card>
</template>
