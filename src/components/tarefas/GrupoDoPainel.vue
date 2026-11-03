<script setup lang="ts">
import { computed } from 'vue'

import type { GrupoDoPainel } from '@/api/tarefas'

import CartaoTarefa from './CartaoTarefa.vue'
import { metadadosDoGrupo } from './grupos'

const props = defineProps<{
  /** Grupo do painel com as tarefas, na ordem devolvida pela API */
  grupo: GrupoDoPainel
}>()

const metadados = computed(() => metadadosDoGrupo(props.grupo.grupo))
</script>

<template>
  <section :id="`grupo-${grupo.grupo}`" class="q-mb-lg">
    <div class="row items-center q-gutter-sm q-mb-sm">
      <q-icon :name="metadados.icone" :color="metadados.cor" size="22px" />
      <h2 class="text-subtitle1 text-weight-bold q-my-none">{{ metadados.rotulo }}</h2>
      <q-badge rounded :color="metadados.cor" :label="grupo.tarefas.length" />
    </div>

    <div v-if="grupo.tarefas.length === 0" class="text-caption text-grey-6 q-pl-xs">Nenhuma tarefa.</div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="cartao in grupo.tarefas" :key="cartao.identifier" class="col-12 col-sm-6 col-md-4 col-xl-3">
        <CartaoTarefa :cartao="cartao" />
      </div>
    </div>
  </section>
</template>
