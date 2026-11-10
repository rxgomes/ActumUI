<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { adicionarBranch, type ParteBranch, type TarefaDetalhe, type TipoBranch } from '@/api/tarefas'

import { sugerirBranchDeImplementacao } from './branches'
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

const Campos = ['tipo', 'nome', 'partes'] as const

const tipo = ref<TipoBranch>('implementacao')
const nome = ref('')
const front = ref(false)
const back = ref(false)
const salvando = ref(false)
const errosPorCampo = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)

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

const explicacaoDoTipo = computed(() =>
  tipo.value === 'implementacao'
    ? 'A branch será criada no GitHub a partir da base da tarefa, nos repositórios das partes marcadas.'
    : 'A branch base precisa já existir no GitHub, nos repositórios das partes marcadas.',
)

// Sugestão vigente para a implementação: trocar o tipo só mexe no nome se o usuário não o alterou.
const sugestao = ref('')

const dicaDoNome = computed(() =>
  tipo.value === 'implementacao' && sugestao.value !== '' && nome.value === sugestao.value
    ? 'Sugestão: data de hoje e título da tarefa. Pode alterar. Vira a tag no Asana, junto com as partes.'
    : 'Vira a tag no Asana, junto com as partes',
)

function sugerirNome(): string {
  return sugerirBranchDeImplementacao(props.detalhe.titulo, new Date())
}

watch(tipo, (novoTipo) => {
  if (novoTipo === 'implementacao') {
    if (nome.value.trim() === '') {
      sugestao.value = sugerirNome()
      nome.value = sugestao.value
    }
  } else if (nome.value === sugestao.value) {
    nome.value = ''
  }
})

function aoAbrir(): void {
  tipo.value = 'implementacao'
  sugestao.value = sugerirNome()
  nome.value = sugestao.value
  front.value = false
  back.value = false
  errosPorCampo.value = {}
  erroGeral.value = null
}

async function confirmar(): Promise<void> {
  if (partes.value.length === 0 || salvando.value) {
    return
  }

  salvando.value = true
  errosPorCampo.value = {}
  erroGeral.value = null

  try {
    await adicionarBranch(props.detalhe.identifier, tipo.value, nome.value, partes.value)
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
            :disable="salvando"
            :options="[
              { label: 'Implementação', value: 'implementacao' },
              { label: 'Base', value: 'base' },
            ]"
          />
          <div v-if="errosPorCampo.tipo" class="text-negative text-caption">{{ errosPorCampo.tipo }}</div>
          <div class="text-grey-7 text-caption">{{ explicacaoDoTipo }}</div>
        </div>

        <q-input
          v-model="nome"
          outlined
          autofocus
          label="Nome da branch"
          :hint="dicaDoNome"
          :error="Boolean(errosPorCampo.nome)"
          :error-message="errosPorCampo.nome"
          :disable="salvando"
          @keyup.enter="confirmar"
        />

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
          icon="add"
          label="Registrar"
          :loading="salvando"
          :disable="partes.length === 0"
          @click="confirmar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
