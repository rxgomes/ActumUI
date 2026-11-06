<script setup lang="ts">
import { computed, ref } from 'vue'

import { iniciarTarefa, listarBasesRecentes, type ParteBranch, type TarefaDetalhe } from '@/api/tarefas'

import { sugerirBranchDeImplementacao } from './branches'
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

const Campos = ['branchBase', 'branchImplementacao', 'prazoInterno', 'partes'] as const

const branchBase = ref('')
const branchImplementacao = ref('')
const prazoInterno = ref<string | null>(null)
const front = ref(false)
const back = ref(false)
const salvando = ref(false)
const errosPorCampo = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)

const basesRecentes = ref<string[]>([])
const carregandoBases = ref(false)
const erroAoCarregarBases = ref(false)
// Cada abertura conta uma vez: a resposta de uma abertura anterior é descartada.
let abertura = 0

const partes = computed<ParteBranch[]>(() => {
  const selecionadas: ParteBranch[] = []
  if (front.value) {
    selecionadas.push('front')
  }

  if (back.value) {
    selecionadas.push('back')
  }

  return selecionadas
})

const dicaDaBase = computed(() => {
  if (carregandoBases.value) {
    return 'Carregando as bases recentes...'
  }

  if (erroAoCarregarBases.value) {
    return 'Não foi possível carregar as bases recentes. Digite o nome da branch base.'
  }

  if (basesRecentes.value.length === 0) {
    return 'Nenhuma base usada nesta empresa. Digite o nome da branch base.'
  }

  return 'Escolha uma base recente ou digite outra.'
})

function aoAbrir(): void {
  branchBase.value = ''
  branchImplementacao.value = sugerirBranchDeImplementacao(props.detalhe.titulo, new Date())
  // Sugestão: começar pelo prazo do Asana, que o usuário pode trocar.
  prazoInterno.value = props.detalhe.prazoAsana
  front.value = false
  back.value = false
  errosPorCampo.value = {}
  erroGeral.value = null
  void carregarBases()
}

async function carregarBases(): Promise<void> {
  const estaAbertura = ++abertura
  basesRecentes.value = []
  erroAoCarregarBases.value = false
  carregandoBases.value = true

  try {
    const bases = await listarBasesRecentes(props.detalhe.identifier)
    if (estaAbertura !== abertura) {
      return
    }

    basesRecentes.value = bases
    // Só preenche se o usuário ainda não digitou nada.
    if (branchBase.value === '' && bases.length > 0) {
      branchBase.value = bases[0]
    }
  } catch {
    if (estaAbertura === abertura) {
      erroAoCarregarBases.value = true
    }
  } finally {
    if (estaAbertura === abertura) {
      carregandoBases.value = false
    }
  }
}

/** O texto digitado vira o valor da base mesmo sem Enter, para não se perder ao confirmar. */
function aoDigitarBase(valor: string): void {
  branchBase.value = valor
}

async function confirmar(): Promise<void> {
  salvando.value = true
  errosPorCampo.value = {}
  erroGeral.value = null

  try {
    await iniciarTarefa(props.detalhe.identifier, {
      branchBase: branchBase.value.trim(),
      branchImplementacao: branchImplementacao.value,
      prazoInterno: prazoInterno.value ?? '',
      partes: partes.value,
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
    <q-card style="width: 520px; max-width: 95vw">
      <q-card-section class="text-h6">Iniciar tarefa</q-card-section>

      <q-card-section class="q-pt-none column q-gutter-md">
        <div class="text-body2 text-grey-8">
          A branch de implementação será criada no GitHub a partir da base, nos repositórios das partes marcadas. As
          branches são enviadas ao Asana como tags na conclusão.
        </div>

        <q-banner v-if="erroGeral" dense rounded class="bg-red-1 text-negative">{{ erroGeral }}</q-banner>

        <q-select
          :model-value="branchBase"
          outlined
          autofocus
          use-input
          hide-selected
          fill-input
          input-debounce="0"
          new-value-mode="add-unique"
          label="Branch base"
          :options="basesRecentes"
          :loading="carregandoBases"
          :hint="dicaDaBase"
          :error="Boolean(errosPorCampo.branchBase)"
          :error-message="errosPorCampo.branchBase"
          :disable="salvando"
          @update:model-value="(valor: string | null) => (branchBase = valor ?? '')"
          @input-value="aoDigitarBase"
        />
        <q-input
          v-model="branchImplementacao"
          outlined
          label="Branch de implementação"
          hint="Sugestão: data de hoje e título da tarefa. Pode alterar."
          :error="Boolean(errosPorCampo.branchImplementacao)"
          :error-message="errosPorCampo.branchImplementacao"
          :disable="salvando"
        />
        <CampoDeData v-model="prazoInterno" label="Prazo interno" :erro="errosPorCampo.prazoInterno" />

        <div>
          <div class="text-body2 text-grey-8">Partes</div>
          <div class="row q-gutter-md">
            <q-checkbox v-model="front" label="Front" :disable="salvando" />
            <q-checkbox v-model="back" label="Back" :disable="salvando" />
          </div>
          <div v-if="errosPorCampo.partes" class="text-negative text-caption">{{ errosPorCampo.partes }}</div>
          <div v-else-if="partes.length === 0" class="text-grey-7 text-caption">Marque ao menos uma parte.</div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="salvando" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="play_arrow"
          label="Iniciar"
          :loading="salvando"
          :disable="partes.length === 0"
          @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
