<script setup lang="ts">
import { formatarData, formatarDataHora } from '@/api/datas'
import type { Retrabalho } from '@/api/tarefas'

import ComentarioDaTarefa from './ComentarioDaTarefa.vue'

defineProps<{
  /** Retrabalhos em ordem de número */
  retrabalhos: Retrabalho[]
  /** Comentários que estavam não lidos ao abrir a tarefa */
  comentariosNovos: ReadonlySet<string>
}>()

function prazo(valor: string | null): string {
  return valor ? formatarData(valor) : '—'
}
</script>

<template>
  <q-card v-if="retrabalhos.length > 0" flat bordered class="q-mb-md">
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-bold">Retrabalhos</div>
    </q-card-section>

    <q-card-section>
      <q-timeline color="warning" layout="dense">
        <q-timeline-entry
          v-for="retrabalho in retrabalhos"
          :key="retrabalho.identifier"
          :icon="retrabalho.resolvidoEm ? 'check' : 'replay'"
          :color="retrabalho.resolvidoEm ? 'positive' : 'warning'"
          :title="`Retrabalho ${retrabalho.numero}`"
          :subtitle="`Reaberta em ${formatarDataHora(retrabalho.reabertaEm)}`"
        >
          <div class="text-body2 q-mb-sm">
            <div>Reaberta por: {{ retrabalho.reabertaPor ?? 'não identificado no histórico do Asana' }}</div>
            <div>Prazo anterior: {{ prazo(retrabalho.prazoInternoAnterior) }} · Novo prazo: {{ prazo(retrabalho.prazoInternoNovo) }}</div>
            <div>{{ retrabalho.resolvidoEm ? `Resolvido em ${formatarDataHora(retrabalho.resolvidoEm)}` : 'Em aberto' }}</div>
          </div>

          <div v-if="retrabalho.comentarios.length > 0" class="column q-gutter-xs">
            <ComentarioDaTarefa
              v-for="comentario in retrabalho.comentarios"
              :key="comentario.identifier"
              :comentario="comentario"
              :novo="comentariosNovos.has(comentario.identifier)"
            />
          </div>
          <div v-else class="text-caption text-grey-6">Nenhum comentário nesta reabertura.</div>
        </q-timeline-entry>
      </q-timeline>
    </q-card-section>
  </q-card>
</template>
