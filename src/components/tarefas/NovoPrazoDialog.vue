<script setup lang="ts">
import { computed, ref } from 'vue'

import { formatarData } from '@/api/datas'
import { alterarTarefa, type DadosParaAlterar, type TarefaDetalhe } from '@/api/tarefas'

import CampoDeData from './CampoDeData.vue'
import { errosDoDialogo } from './errosDoDialogo'

const props = defineProps<{
  /** Tarefa cujo prazo e prioridade serão alterados */
  detalhe: TarefaDetalhe
}>()

const emit = defineEmits<{
  /** Prazo e/ou prioridade alterados */
  concluido: []
}>()

const aberto = defineModel<boolean>('aberto', { required: true })

const Campos = ['prazoInterno', 'prioridade'] as const

const prazoInterno = ref<string | null>(null)
const prioridade = ref<number | null>(null)
const salvando = ref(false)
const errosPorCampo = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)

/** Prazo interno antes da reabertura (do último retrabalho), mostrado quando o prazo está pendente. */
const prazoAnterior = computed(() => {
  const ultimo = props.detalhe.retrabalhos.at(-1)
  return ultimo?.prazoInternoAnterior ? formatarData(ultimo.prazoInternoAnterior) : null
})

function aoAbrir(): void {
  prazoInterno.value = props.detalhe.prazoInterno
  prioridade.value = props.detalhe.prioridade
  errosPorCampo.value = {}
  erroGeral.value = null
}

async function confirmar(): Promise<void> {
  const dados: DadosParaAlterar = {}
  if (prazoInterno.value && prazoInterno.value !== props.detalhe.prazoInterno) {
    dados.prazoInterno = prazoInterno.value
  }

  if (prioridade.value !== null && prioridade.value !== props.detalhe.prioridade) {
    dados.prioridade = prioridade.value
  }

  if (dados.prazoInterno === undefined && dados.prioridade === undefined) {
    aberto.value = false
    return
  }

  salvando.value = true
  errosPorCampo.value = {}
  erroGeral.value = null

  try {
    await alterarTarefa(props.detalhe.identifier, dados)
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
    <q-card style="width: 440px; max-width: 95vw">
      <q-card-section class="text-h6">{{ detalhe.prazoInternoPendente ? 'Definir novo prazo' : 'Prazo e prioridade' }}</q-card-section>

      <q-card-section class="q-pt-none column q-gutter-md">
        <q-banner v-if="detalhe.prazoInternoPendente" dense rounded class="bg-orange-1">
          <template #avatar><q-icon name="replay" color="warning" /></template>
          A tarefa foi reaberta. Prazo anterior: {{ prazoAnterior ?? 'não definido' }}.
        </q-banner>
        <q-banner v-if="erroGeral" dense rounded class="bg-red-1 text-negative">{{ erroGeral }}</q-banner>

        <CampoDeData v-model="prazoInterno" label="Prazo interno" :erro="errosPorCampo.prazoInterno" />

        <div>
          <div class="text-caption text-grey-7 q-mb-xs">Prioridade</div>
          <q-btn-toggle
            v-model="prioridade"
            no-caps
            unelevated
            toggle-color="primary"
            :options="[
              { label: 'P1 (alta)', value: 1 },
              { label: 'P2', value: 2 },
              { label: 'P3 (baixa)', value: 3 },
            ]"
          />
          <div v-if="errosPorCampo.prioridade" class="text-negative text-caption q-mt-xs">{{ errosPorCampo.prioridade }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="salvando" />
        <q-btn unelevated no-caps color="primary" icon="save" label="Salvar" :loading="salvando" @click="confirmar" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
