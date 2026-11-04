<script setup lang="ts">
import { formatarDataHora } from '@/api/datas'
import type { TarefaDoRanking } from '@/api/retrabalhos'
import { corDoStatus, rotuloDoStatus } from '@/components/tarefas/textos'

defineProps<{
  /** Até 10 tarefas com mais retrabalhos no período, na ordem da API */
  tarefas: TarefaDoRanking[]
}>()
</script>

<template>
  <q-list separator>
    <q-item v-for="(tarefa, indice) in tarefas" :key="tarefa.identifier" class="q-py-sm">
      <q-item-section avatar class="text-grey-7 text-weight-medium" style="min-width: 28px">{{ indice + 1 }}º</q-item-section>
      <q-item-section>
        <q-item-label>
          <router-link :to="{ name: 'detalheTarefa', params: { identifier: tarefa.identifier } }" class="text-primary text-weight-medium link">
            {{ tarefa.titulo }}
          </router-link>
        </q-item-label>
        <q-item-label caption class="row items-center q-gutter-x-sm">
          <span class="row items-center no-wrap">
            <span class="marca-empresa q-mr-xs" :style="{ backgroundColor: tarefa.empresa.cor }" />{{ tarefa.empresa.nome }}
          </span>
          <q-badge outline :color="corDoStatus(tarefa.status)" :label="rotuloDoStatus(tarefa.status)" />
          <span>última reabertura em {{ formatarDataHora(tarefa.ultimaReaberturaEm) }}</span>
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-chip dense square color="grey-2" text-color="grey-9" class="text-weight-medium">
          {{ tarefa.retrabalhos }} {{ tarefa.retrabalhos === 1 ? 'retrabalho' : 'retrabalhos' }}
        </q-chip>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style scoped>
.marca-empresa {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.link {
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
