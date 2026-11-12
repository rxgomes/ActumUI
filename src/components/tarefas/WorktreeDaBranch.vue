<script setup lang="ts">
import { copyToClipboard, useQuasar } from 'quasar'
import { computed } from 'vue'

import { formatarDataHora } from '@/api/datas'
import type { Branch } from '@/api/tarefas'

import { acoesDoWorktree, CoresDaSituacao, TextosDaSituacao } from './worktrees'

const props = defineProps<{
  /** Branch de implementação, com o worktree devolvido pela API (`null` quando nunca teve) */
  branch: Branch
  /** Ação em andamento nesta branch, para o loading */
  processando: 'criar' | 'remover' | null
}>()

const emit = defineEmits<{
  /** Criar (ou recriar) os worktrees da branch */
  criar: [branch: Branch]
  /** Remover os worktrees da branch */
  remover: [branch: Branch]
}>()

const quasar = useQuasar()

const NomesDasPartes = { front: 'Front', back: 'Back' } as const

const worktree = computed(() => props.branch.worktree ?? null)
const acoes = computed(() => acoesDoWorktree(worktree.value))
const ocupado = computed(() => props.processando !== null)

async function copiarComando(): Promise<void> {
  const comando = worktree.value?.comandoClaude
  if (!comando) {
    return
  }

  try {
    await copyToClipboard(comando)
    quasar.notify({ type: 'positive', position: 'top', message: 'Comando copiado.', caption: comando })
  } catch {
    // Fora de localhost o navegador pode negar a área de transferência: o comando fica visível para copiar à mão.
    quasar.notify({ type: 'warning', position: 'top', timeout: 0, message: 'Copie o comando:', caption: comando, actions: [{ label: 'Fechar', color: 'white' }] })
  }
}
</script>

<template>
  <div class="q-mt-xs q-pa-sm rounded-borders bg-grey-1" style="width: 100%; min-width: 0; overflow: hidden">
    <div v-if="worktree === null" class="row items-center no-wrap q-gutter-sm">
      <q-icon name="folder_off" color="grey-6" size="18px" />
      <div class="col text-caption text-grey-7">Sem worktree no PC.</div>
      <q-btn
        flat
        dense
        no-caps
        size="sm"
        color="primary"
        icon="create_new_folder"
        label="Criar worktree"
        :loading="processando === 'criar'"
        :disable="ocupado"
        @click="emit('criar', branch)"
      />
    </div>

    <template v-else>
      <div class="row items-center no-wrap q-gutter-sm">
        <q-icon name="folder" color="grey-7" size="18px" />
        <div class="col text-caption ellipsis" style="font-family: monospace; min-width: 0">
          {{ worktree.pasta }}
          <q-tooltip>{{ worktree.pasta }}</q-tooltip>
        </div>
        <q-badge :color="CoresDaSituacao[worktree.situacao]" outline :label="TextosDaSituacao[worktree.situacao]" />
      </div>

      <div v-if="worktree.situacao !== 'removido'" class="q-mt-xs">
        <div v-for="parte in worktree.partes" :key="parte.parte" class="row items-start no-wrap q-gutter-sm q-pl-lg">
          <div class="text-caption text-weight-medium" style="min-width: 40px">{{ NomesDasPartes[parte.parte] }}</div>
          <div class="col" style="min-width: 0">
            <div class="text-caption text-grey-8 ellipsis" style="font-family: monospace">
              {{ parte.caminho }}
              <q-tooltip>{{ parte.criadoEm ? `Criado em ${formatarDataHora(parte.criadoEm)}` : parte.caminho }}</q-tooltip>
            </div>
            <div v-if="parte.erro" class="text-caption text-negative" style="white-space: pre-wrap">{{ parte.erro }}</div>
          </div>
          <q-badge :color="CoresDaSituacao[parte.situacao]" outline :label="TextosDaSituacao[parte.situacao]" />
        </div>
      </div>

      <div class="row justify-end q-gutter-xs q-mt-xs">
        <q-btn
          v-if="acoes.copiar"
          flat
          dense
          no-caps
          size="sm"
          color="primary"
          icon="content_copy"
          label="Copiar comando do Claude"
          :disable="ocupado"
          @click="copiarComando"
        >
          <q-tooltip>{{ worktree.comandoClaude }}</q-tooltip>
        </q-btn>
        <q-btn
          v-if="acoes.recriar"
          flat
          dense
          no-caps
          size="sm"
          color="primary"
          icon="refresh"
          label="Recriar worktree"
          :loading="processando === 'criar'"
          :disable="ocupado"
          @click="emit('criar', branch)"
        />
        <q-btn
          v-if="acoes.remover"
          flat
          dense
          no-caps
          size="sm"
          color="negative"
          icon="folder_delete"
          label="Remover worktree"
          :loading="processando === 'remover'"
          :disable="ocupado"
          @click="emit('remover', branch)"
        />
      </div>
    </template>
  </div>
</template>
