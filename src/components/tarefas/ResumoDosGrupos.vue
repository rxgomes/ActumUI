<script setup lang="ts">
import type { GrupoDoPainel } from '@/api/tarefas'
import { useGruposRecolhidos } from '@/composables/useGruposRecolhidos'

import { metadadosDoGrupo } from './grupos'

defineProps<{
  /** Grupos do painel, na ordem devolvida pela API */
  grupos: GrupoDoPainel[]
}>()

const gruposRecolhidos = useGruposRecolhidos()

function irParaOGrupo(grupo: string): void {
  // Um grupo recolhido é aberto antes de rolar até ele.
  gruposRecolhidos.abrir(grupo)
  document.getElementById(`grupo-${grupo}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="row q-col-gutter-md q-mb-lg">
    <div v-for="grupo in grupos" :key="grupo.grupo" class="col-6 col-sm-4 col-md">
      <q-card
        flat
        bordered
        class="resumo cursor-pointer"
        role="button"
        :aria-label="`Ir para ${metadadosDoGrupo(grupo.grupo).rotulo}`"
        @click="irParaOGrupo(grupo.grupo)"
      >
        <q-card-section class="row items-center no-wrap q-gutter-sm">
          <q-avatar
            rounded
            size="40px"
            color="grey-2"
            :text-color="metadadosDoGrupo(grupo.grupo).cor"
            :icon="metadadosDoGrupo(grupo.grupo).icone"
          />
          <div>
            <div class="text-caption text-grey-7">{{ metadadosDoGrupo(grupo.grupo).rotulo }}</div>
            <div class="text-h6 text-weight-bold" :class="`text-${metadadosDoGrupo(grupo.grupo).cor}`">
              {{ grupo.tarefas.length }}
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
.resumo {
  border-radius: 8px;
}
</style>
