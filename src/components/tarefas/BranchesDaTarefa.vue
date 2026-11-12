<script setup lang="ts">
import { formatarDataHora } from '@/api/datas'
import type { Branch } from '@/api/tarefas'

import WorktreeDaBranch from './WorktreeDaBranch.vue'
import { temWorktree } from './worktrees'

const props = defineProps<{
  /** Branches da tarefa */
  branches: Branch[]
  /** Identifier da branch sendo excluída, para o loading */
  excluindo: string | null
  /** Ação de worktree em andamento e a branch dela, para o loading */
  processandoWorktree: { branch: string; acao: 'criar' | 'remover' } | null
}>()

const emit = defineEmits<{
  /** O usuário pediu para excluir uma branch pendente */
  excluir: [branch: Branch]
  /** O usuário pediu para criar ou recriar os worktrees da branch */
  criarWorktree: [branch: Branch]
  /** O usuário pediu para remover os worktrees da branch */
  removerWorktree: [branch: Branch]
}>()

const NomesDasPartes = { front: 'Front', back: 'Back' } as const

function textoDasPartes(branch: Branch): string {
  return branch.partes.map((parte) => NomesDasPartes[parte]).join(' · ')
}

function acaoDoWorktree(branch: Branch): 'criar' | 'remover' | null {
  return props.processandoWorktree?.branch === branch.identifier ? props.processandoWorktree.acao : null
}
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
        <q-item-section style="min-width: 0">
          <q-item-label class="text-weight-medium" style="font-family: monospace">
            {{ branch.nome }}
            <q-tooltip v-if="branch.partes.length > 0">Tag no Asana: {{ branch.tag }}</q-tooltip>
          </q-item-label>
          <q-item-label caption>
            {{ branch.tipo === 'base' ? 'Base' : 'Implementação' }}
            <template v-if="branch.partes.length > 0"> · {{ textoDasPartes(branch) }}</template>
            <template v-if="branch.retrabalhoNumero !== null"> · retrabalho {{ branch.retrabalhoNumero }}</template>
          </q-item-label>
          <WorktreeDaBranch
            v-if="temWorktree(branch)"
            :branch="branch"
            :processando="acaoDoWorktree(branch)"
            @criar="emit('criarWorktree', $event)"
            @remover="emit('removerWorktree', $event)"
          />
        </q-item-section>
        <q-item-section side top>
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
