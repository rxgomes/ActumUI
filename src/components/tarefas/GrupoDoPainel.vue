<script setup lang="ts">
import { computed } from 'vue'

import type { GrupoDoPainel } from '@/api/tarefas'
import { useGruposRecolhidos } from '@/composables/useGruposRecolhidos'

import CartaoTarefa from './CartaoTarefa.vue'
import { metadadosDoGrupo } from './grupos'

const props = defineProps<{
  /** Grupo do painel com as tarefas, na ordem devolvida pela API */
  grupo: GrupoDoPainel
}>()

const grupos = useGruposRecolhidos()

const metadados = computed(() => metadadosDoGrupo(props.grupo.grupo))
const aberto = computed(() => grupos.aberto(props.grupo.grupo))
</script>

<template>
  <section :id="`grupo-${grupo.grupo}`" class="q-mb-lg">
    <button
      type="button"
      class="cabecalho row items-center no-wrap q-gutter-sm q-mb-sm"
      :aria-expanded="aberto"
      :aria-controls="`conteudo-${grupo.grupo}`"
      :aria-label="`${aberto ? 'Recolher' : 'Expandir'} ${metadados.rotulo}`"
      @click="grupos.alternar(grupo.grupo)"
    >
      <q-icon name="expand_more" size="22px" color="grey-7" class="seta" :class="{ 'seta--recolhida': !aberto }" />
      <q-icon :name="metadados.icone" :color="metadados.cor" size="22px" />
      <h2 class="text-subtitle1 text-weight-bold q-my-none">{{ metadados.rotulo }}</h2>
      <q-badge rounded :color="metadados.cor" :label="grupo.tarefas.length" />
    </button>

    <q-slide-transition>
      <div v-show="aberto" :id="`conteudo-${grupo.grupo}`">
        <div v-if="grupo.tarefas.length === 0" class="text-caption text-grey-6 q-pl-xs">Nenhuma tarefa.</div>

        <div v-else class="row q-col-gutter-md">
          <div v-for="cartao in grupo.tarefas" :key="cartao.identifier" class="col-12 col-sm-6 col-md-4 col-xl-3">
            <CartaoTarefa :cartao="cartao" :grupo="grupo.grupo" />
          </div>
        </div>
      </div>
    </q-slide-transition>
  </section>
</template>

<style scoped>
.cabecalho {
  background: none;
  border: 0;
  padding: 2px 4px 2px 0;
  margin-left: 0;
  cursor: pointer;
  border-radius: 4px;
  font: inherit;
  color: inherit;
}

.cabecalho:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.cabecalho:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.seta {
  transition: transform 0.2s;
}

.seta--recolhida {
  transform: rotate(-90deg);
}
</style>
