<script setup lang="ts">
import { computed } from 'vue'

import type { ItemDaAnalise } from '@/api/analises'
import { formatarDataHora } from '@/api/datas'

const props = defineProps<{
  /** Item do checklist, teste, dúvida ou regra */
  item: ItemDaAnalise
  /** Se a caixa pode ser usada (versão atual e item fora de gravação) */
  habilitado: boolean
  /** Se o item está sendo gravado na API */
  gravando: boolean
}>()

const emit = defineEmits<{
  /** O usuário marcou ou desmarcou o item */
  marcar: [item: ItemDaAnalise, concluido: boolean]
}>()

/** Rótulo acessível e da dica, conforme o tipo do item. */
const rotuloMarcado = computed(() => {
  switch (props.item.tipo) {
    case 'teste':
      return 'Teste realizado'
    case 'duvida':
      return 'Dúvida resolvida'
    case 'regra':
      return 'Regra atendida'
    default:
      return 'Feito'
  }
})
</script>

<template>
  <q-item dense class="q-px-none items-start">
    <q-item-section side top class="q-pr-sm">
      <q-checkbox
        :model-value="item.concluido"
        :disable="!habilitado || gravando"
        :aria-label="`${rotuloMarcado}: ${item.texto}`"
        dense
        color="positive"
        @update:model-value="(valor: boolean) => emit('marcar', item, valor)"
      />
    </q-item-section>
    <q-item-section>
      <q-item-label :class="{ 'text-strike text-grey-6': item.concluido }" class="text-body2">
        {{ item.texto }}
        <q-spinner v-if="gravando" size="12px" color="primary" class="q-ml-xs" />
        <q-tooltip v-if="item.concluido && item.concluidoEm" anchor="top left" self="bottom left">
          {{ rotuloMarcado }} em {{ formatarDataHora(item.concluidoEm) }}
        </q-tooltip>
      </q-item-label>
      <q-item-label v-if="item.vago" caption class="text-warning row no-wrap items-start q-mt-xs">
        <q-icon name="warning" size="16px" class="q-mr-xs" />
        <span><span class="text-weight-medium">Vago:</span> {{ item.vago }}</span>
      </q-item-label>
      <q-item-label v-if="item.origem" caption class="text-grey-7 row no-wrap items-start q-mt-xs">
        <q-icon name="chat" size="14px" class="q-mr-xs q-mt-xs" />
        <span>{{ item.origem }}</span>
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.text-strike {
  text-decoration: line-through;
}
</style>
