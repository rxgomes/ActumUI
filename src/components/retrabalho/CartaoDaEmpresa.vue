<script setup lang="ts">
import { computed } from 'vue'

import type { IndicadorDaEmpresa } from '@/api/retrabalhos'

const props = defineProps<{
  /** Indicadores da empresa, ou do Total (sem cor) */
  indicador: IndicadorDaEmpresa
}>()

const FormatoDaTaxa = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const taxa = computed(() => (props.indicador.taxa === null ? '—' : `${FormatoDaTaxa.format(props.indicador.taxa)}%`))
</script>

<template>
  <q-card flat bordered class="cartao full-height" :style="{ borderLeftColor: indicador.cor ?? '#9e9e9e' }">
    <q-card-section class="q-pb-sm">
      <div class="text-subtitle2 text-grey-9 ellipsis">{{ indicador.nome }}</div>
    </q-card-section>
    <q-card-section class="q-pt-none row q-col-gutter-sm">
      <div class="col-6">
        <div class="text-h5 text-weight-medium">{{ indicador.retrabalhos }}</div>
        <div class="text-caption text-grey-7">retrabalhos</div>
      </div>
      <div class="col-6">
        <div class="text-h5 text-weight-medium">
          {{ taxa }}
          <q-tooltip v-if="indicador.taxa === null">Sem tarefas concluídas no período</q-tooltip>
        </div>
        <div class="text-caption text-grey-7">taxa de retrabalho</div>
      </div>
      <div class="col-6">
        <div class="text-subtitle1">{{ indicador.tarefasComRetrabalho }}</div>
        <div class="text-caption text-grey-7">tarefas com retrabalho</div>
      </div>
      <div class="col-6">
        <div class="text-subtitle1">{{ indicador.tarefasConcluidas }}</div>
        <div class="text-caption text-grey-7">tarefas concluídas</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.cartao {
  border-left-width: 4px;
  border-left-style: solid;
}
</style>
