<script setup lang="ts">
import { computed } from 'vue'

import { formatarData } from '@/api/datas'

defineProps<{
  /** Rótulo do campo */
  label: string
  /** Mensagem de erro vinda da API, se houver */
  erro?: string | null
}>()

/** Data no formato da API (`yyyy-MM-dd`); o `q-date` com esta máscara não passa por `Date`. */
const data = defineModel<string | null>({ required: true })

const exibida = computed(() => (data.value ? formatarData(data.value) : ''))
</script>

<template>
  <q-input
    :model-value="exibida"
    :label="label"
    outlined
    readonly
    :error="Boolean(erro)"
    :error-message="erro ?? undefined"
  >
    <template #append>
      <q-icon name="event" class="cursor-pointer" />
    </template>
    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
      <q-date v-model="data" mask="YYYY-MM-DD" today-btn>
        <div class="row justify-end">
          <q-btn v-close-popup flat color="primary" label="OK" />
        </div>
      </q-date>
    </q-popup-proxy>
  </q-input>
</template>
