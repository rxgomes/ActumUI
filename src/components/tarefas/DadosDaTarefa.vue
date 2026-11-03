<script setup lang="ts">
import { computed } from 'vue'

import { formatarData, formatarDataHora } from '@/api/datas'
import type { TarefaDetalhe } from '@/api/tarefas'

import { rotuloDoStatus, textoDoMotivoArquivamento } from './textos'

const props = defineProps<{
  /** Tarefa exibida */
  detalhe: TarefaDetalhe
}>()

const prazoInterno = computed(() => (props.detalhe.prazoInterno ? formatarData(props.detalhe.prazoInterno) : 'Sem prazo'))
const prazoAsana = computed(() => (props.detalhe.prazoAsana ? formatarData(props.detalhe.prazoAsana) : 'Sem prazo'))
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <q-banner v-if="detalhe.status === 'concluida' && detalhe.concluidaEm" dense rounded class="bg-green-1 q-mb-md">
        <template #avatar><q-icon name="task_alt" color="positive" /></template>
        Concluída em {{ formatarDataHora(detalhe.concluidaEm) }}. Aguardando teste no Asana.
      </q-banner>
      <q-banner v-if="detalhe.status === 'arquivada'" dense rounded class="bg-grey-3 q-mb-md">
        <template #avatar><q-icon name="inventory_2" color="grey-8" /></template>
        Arquivada{{ detalhe.arquivadaEm ? ` em ${formatarDataHora(detalhe.arquivadaEm)}` : '' }}.
        {{ detalhe.motivoArquivamento ? textoDoMotivoArquivamento(detalhe.motivoArquivamento) : '' }}
      </q-banner>
      <q-banner v-if="detalhe.status === 'bloqueada' && detalhe.statusAnterior" dense rounded class="bg-red-1 q-mb-md">
        <template #avatar><q-icon name="block" color="negative" /></template>
        Bloqueada. Ao desbloquear, volta para {{ rotuloDoStatus(detalhe.statusAnterior) }}.
      </q-banner>
      <q-banner v-if="detalhe.prazoInternoPendente" dense rounded class="bg-orange-1 q-mb-md">
        <template #avatar><q-icon name="schedule" color="warning" /></template>
        A tarefa foi reaberta: defina o novo prazo interno.
      </q-banner>

      <div class="row q-col-gutter-md">
        <div class="col-6 col-sm-3">
          <div class="text-caption text-grey-7">Prazo interno</div>
          <div class="text-body1 text-weight-medium">{{ prazoInterno }}</div>
        </div>
        <div class="col-6 col-sm-3">
          <div class="text-caption text-grey-7">Prazo no Asana</div>
          <div class="text-body1">{{ prazoAsana }}</div>
        </div>
        <div class="col-6 col-sm-3">
          <div class="text-caption text-grey-7">Prioridade</div>
          <div class="text-body1">{{ detalhe.prioridade !== null ? `P${detalhe.prioridade}` : 'Não definida' }}</div>
        </div>
        <div class="col-6 col-sm-3">
          <div class="text-caption text-grey-7">Projetos</div>
          <div class="text-body1">{{ detalhe.projetos || '—' }}</div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-caption text-grey-7 q-mb-xs">Descrição</div>
      <div v-if="detalhe.descricao" class="descricao text-body2">{{ detalhe.descricao }}</div>
      <div v-else class="text-body2 text-grey-6">Sem descrição.</div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.descricao {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
