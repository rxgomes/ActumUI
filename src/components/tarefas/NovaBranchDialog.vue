<script setup lang="ts">
import { ref } from 'vue'

import { adicionarBranch, type TarefaDetalhe, type TipoBranch } from '@/api/tarefas'

import { errosDoDialogo } from './errosDoDialogo'

const props = defineProps<{
  /** Tarefa que recebe a branch */
  detalhe: TarefaDetalhe
}>()

const emit = defineEmits<{
  /** A branch foi registrada */
  concluido: []
}>()

const aberto = defineModel<boolean>('aberto', { required: true })

const Campos = ['tipo', 'nome'] as const

const tipo = ref<TipoBranch>('implementacao')
const nome = ref('')
const salvando = ref(false)
const errosPorCampo = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)

function aoAbrir(): void {
  tipo.value = 'implementacao'
  nome.value = ''
  errosPorCampo.value = {}
  erroGeral.value = null
}

async function confirmar(): Promise<void> {
  salvando.value = true
  errosPorCampo.value = {}
  erroGeral.value = null

  try {
    await adicionarBranch(props.detalhe.identifier, tipo.value, nome.value)
    aberto.value = false
    emit('concluido')
  } catch (erro) {
    const erros = errosDoDialogo(erro, Campos, 'nome')
    errosPorCampo.value = erros.porCampo
    erroGeral.value = erros.geral
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <q-dialog v-model="aberto" persistent @before-show="aoAbrir">
    <q-card style="width: 440px; max-width: 95vw">
      <q-card-section class="text-h6">Nova branch</q-card-section>

      <q-card-section class="q-pt-none column q-gutter-md">
        <div v-if="detalhe.status === 'retrabalho'" class="text-body2 text-grey-8">
          A branch ficará vinculada ao retrabalho em aberto, e as branches anteriores são mantidas.
        </div>
        <q-banner v-if="erroGeral" dense rounded class="bg-red-1 text-negative">{{ erroGeral }}</q-banner>

        <div>
          <q-option-group
            v-model="tipo"
            inline
            :options="[
              { label: 'Implementação', value: 'implementacao' },
              { label: 'Base', value: 'base' },
            ]"
          />
          <div v-if="errosPorCampo.tipo" class="text-negative text-caption">{{ errosPorCampo.tipo }}</div>
        </div>

        <q-input
          v-model="nome"
          outlined
          autofocus
          label="Nome da branch"
          hint="Vira a tag no Asana, com o mesmo nome"
          :error="Boolean(errosPorCampo.nome)"
          :error-message="errosPorCampo.nome"
          @keyup.enter="confirmar"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="salvando" />
        <q-btn unelevated no-caps color="primary" icon="add" label="Registrar" :loading="salvando" @click="confirmar" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
