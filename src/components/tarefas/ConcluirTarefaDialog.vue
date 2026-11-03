<script setup lang="ts">
import { ref } from 'vue'

import { comoErroDaApi } from '@/api/erros'
import { concluirTarefa, obterPreviaDaConclusao, type PreviaDaConclusao, type TarefaDetalhe } from '@/api/tarefas'

const props = defineProps<{
  /** Tarefa a concluir */
  detalhe: TarefaDetalhe
}>()

const emit = defineEmits<{
  /** A tarefa foi concluída no Asana e no Actum */
  concluido: []
}>()

const aberto = defineModel<boolean>('aberto', { required: true })

const previa = ref<PreviaDaConclusao | null>(null)
const carregandoPrevia = ref(false)
const concluindo = ref(false)
const erro = ref<string | null>(null)
/** Houve uma tentativa que falhou: o botão vira "Tentar novamente". */
const falhou = ref(false)

async function carregarPrevia(): Promise<void> {
  carregandoPrevia.value = true
  try {
    previa.value = await obterPreviaDaConclusao(props.detalhe.identifier)
  } catch (falha) {
    previa.value = null
    erro.value = comoErroDaApi(falha).message
  } finally {
    carregandoPrevia.value = false
  }
}

function aoAbrir(): void {
  previa.value = null
  erro.value = null
  falhou.value = false
  void carregarPrevia()
}

async function confirmar(): Promise<void> {
  concluindo.value = true
  erro.value = null

  try {
    await concluirTarefa(props.detalhe.identifier)
    aberto.value = false
    emit('concluido')
  } catch (falha) {
    erro.value = comoErroDaApi(falha).message
    falhou.value = true
    // As tags enviadas antes da falha ficam registradas: a prévia passa a listar só as que faltam.
    await carregarPrevia()
  } finally {
    concluindo.value = false
  }
}
</script>

<template>
  <q-dialog v-model="aberto" persistent @before-show="aoAbrir">
    <q-card style="width: 480px; max-width: 95vw">
      <q-card-section class="text-h6">Concluir tarefa</q-card-section>

      <q-card-section class="q-pt-none column q-gutter-md">
        <q-banner v-if="erro" dense rounded class="bg-red-1 text-negative">{{ erro }}</q-banner>

        <template v-if="carregandoPrevia && !previa">
          <q-skeleton type="text" />
          <q-skeleton type="text" width="60%" />
        </template>

        <template v-else-if="previa">
          <q-banner v-if="!previa.permitida" dense rounded class="bg-orange-1">
            <template #avatar><q-icon name="info" color="warning" /></template>
            {{ previa.motivo }}
          </q-banner>

          <template v-else>
            <div v-if="previa.tags.length > 0" class="text-body2">
              Estas tags serão adicionadas à tarefa no Asana, e a tarefa será marcada como concluída:
              <div class="q-mt-sm row q-gutter-xs">
                <q-chip v-for="tag in previa.tags" :key="tag" dense icon="sell" color="blue-1" text-color="primary" :label="tag" style="font-family: monospace" />
              </div>
            </div>
            <div v-else class="text-body2">
              Todas as branches já estão no Asana como tags. Nenhuma tag será adicionada: a tarefa só será marcada como concluída no Asana.
            </div>
          </template>
        </template>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="concluindo" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :icon="falhou ? 'refresh' : 'task_alt'"
          :label="falhou ? 'Tentar novamente' : 'Concluir no Asana'"
          :loading="concluindo"
          :disable="!previa || !previa.permitida || carregandoPrevia"
          @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
