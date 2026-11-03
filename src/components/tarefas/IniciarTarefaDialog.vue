<script setup lang="ts">
import { ref } from 'vue'

import { iniciarTarefa, type TarefaDetalhe } from '@/api/tarefas'

import CampoDeData from './CampoDeData.vue'
import { errosDoDialogo } from './errosDoDialogo'

const props = defineProps<{
  /** Tarefa a iniciar (status entrada) */
  detalhe: TarefaDetalhe
}>()

const emit = defineEmits<{
  /** A tarefa foi iniciada */
  concluido: []
}>()

const aberto = defineModel<boolean>('aberto', { required: true })

const Campos = ['branchBase', 'branchImplementacao', 'prazoInterno'] as const

const branchBase = ref('')
const branchImplementacao = ref('')
const prazoInterno = ref<string | null>(null)
const salvando = ref(false)
const errosPorCampo = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)

function aoAbrir(): void {
  branchBase.value = ''
  branchImplementacao.value = ''
  // Sugestão: começar pelo prazo do Asana, que o usuário pode trocar.
  prazoInterno.value = props.detalhe.prazoAsana
  errosPorCampo.value = {}
  erroGeral.value = null
}

async function confirmar(): Promise<void> {
  salvando.value = true
  errosPorCampo.value = {}
  erroGeral.value = null

  try {
    await iniciarTarefa(props.detalhe.identifier, {
      branchBase: branchBase.value,
      branchImplementacao: branchImplementacao.value,
      prazoInterno: prazoInterno.value ?? '',
    })
    aberto.value = false
    emit('concluido')
  } catch (erro) {
    const erros = errosDoDialogo(erro, Campos)
    errosPorCampo.value = erros.porCampo
    erroGeral.value = erros.geral
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <q-dialog v-model="aberto" persistent @before-show="aoAbrir">
    <q-card style="width: 480px; max-width: 95vw">
      <q-card-section class="text-h6">Iniciar tarefa</q-card-section>

      <q-card-section class="q-pt-none column q-gutter-md">
        <div class="text-body2 text-grey-8">
          Informe as branches e o prazo interno. As branches só são enviadas ao Asana como tags na conclusão.
        </div>

        <q-banner v-if="erroGeral" dense rounded class="bg-red-1 text-negative">{{ erroGeral }}</q-banner>

        <q-input
          v-model="branchBase"
          outlined
          autofocus
          label="Branch base"
          hint="Ex.: main"
          :error="Boolean(errosPorCampo.branchBase)"
          :error-message="errosPorCampo.branchBase"
        />
        <q-input
          v-model="branchImplementacao"
          outlined
          label="Branch de implementação"
          hint="Ex.: feature/ipi-devolvido"
          :error="Boolean(errosPorCampo.branchImplementacao)"
          :error-message="errosPorCampo.branchImplementacao"
        />
        <CampoDeData v-model="prazoInterno" label="Prazo interno" :erro="errosPorCampo.prazoInterno" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="salvando" />
        <q-btn unelevated no-caps color="primary" icon="play_arrow" label="Iniciar" :loading="salvando" @click="confirmar" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
