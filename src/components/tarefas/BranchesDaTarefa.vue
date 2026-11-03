<script setup lang="ts">
import { formatarDataHora } from '@/api/datas'
import type { Branch } from '@/api/tarefas'

defineProps<{
  /** Branches da tarefa */
  branches: Branch[]
  /** Identifier da branch sendo excluída, para o loading */
  excluindo: string | null
}>()

const emit = defineEmits<{
  /** O usuário pediu para excluir uma branch pendente */
  excluir: [branch: Branch]
}>()
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-bold">Branches</div>
    </q-card-section>

    <q-card-section v-if="branches.length === 0" class="text-body2 text-grey-6">Nenhuma branch registrada.</q-card-section>

    <q-list v-else separator>
      <q-item v-for="branch in branches" :key="branch.identifier">
        <q-item-section avatar>
          <q-icon :name="branch.tipo === 'base' ? 'account_tree' : 'call_split'" color="grey-7" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium" style="font-family: monospace">{{ branch.nome }}</q-item-label>
          <q-item-label caption>
            {{ branch.tipo === 'base' ? 'Base' : 'Implementação' }}
            <template v-if="branch.retrabalhoNumero !== null"> · retrabalho {{ branch.retrabalhoNumero }}</template>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge v-if="branch.enviada" color="positive" outline>
            Enviada ao Asana
            <q-tooltip v-if="branch.enviadaAsanaEm">Tag adicionada em {{ formatarDataHora(branch.enviadaAsanaEm) }}</q-tooltip>
          </q-badge>
          <div v-else class="row items-center q-gutter-sm">
            <q-badge color="grey-6" outline label="Pendente" />
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="delete"
              color="negative"
              :aria-label="`Excluir a branch ${branch.nome}`"
              :loading="excluindo === branch.identifier"
              @click="emit('excluir', branch)"
            >
              <q-tooltip>Excluir branch (ainda não enviada ao Asana)</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>
