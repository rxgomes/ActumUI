<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, ref, watch } from 'vue'

import type { Anotacao } from '@/api/anotacoes'
import { formatarDataHora } from '@/api/datas'
import { comoErroDaApi } from '@/api/erros'
import { useNotificarErro } from '@/composables/useNotificarErro'
import { useAnotacoesStore } from '@/stores/anotacoes'

const props = defineProps<{
  /** Tarefa do detalhe */
  identifier: string
}>()

const quasar = useQuasar()
const notificarErro = useNotificarErro()
const anotacoes = useAnotacoesStore()

const nova = ref('')
const erroDaNova = ref<string | null>(null)
const editando = ref<string | null>(null)
const textoEditado = ref('')
const erroDaEdicao = ref<string | null>(null)

watch(
  () => props.identifier,
  (novo) => {
    nova.value = ''
    editando.value = null
    void anotacoes.carregar(novo)
  },
  { immediate: true },
)

const podeAdicionar = computed(() => nova.value.trim().length > 0 && anotacoes.salvando !== 'nova')

/** Erro de validação do texto vai para o campo; os demais são notificados, mantendo o texto. */
function tratarErro(erro: unknown): string | null {
  const daApi = comoErroDaApi(erro)
  const doCampo = daApi.errosPorCampo.texto?.[0]
  if (doCampo) {
    return doCampo
  }

  notificarErro(erro)
  return null
}

async function adicionar(): Promise<void> {
  if (!podeAdicionar.value) {
    return
  }

  erroDaNova.value = null
  try {
    await anotacoes.criar(nova.value.trim())
    nova.value = ''
  } catch (erro) {
    erroDaNova.value = tratarErro(erro)
  }
}

function editar(anotacao: Anotacao): void {
  editando.value = anotacao.identifier
  textoEditado.value = anotacao.texto
  erroDaEdicao.value = null
}

async function salvar(anotacao: Anotacao): Promise<void> {
  if (textoEditado.value.trim().length === 0) {
    erroDaEdicao.value = 'Escreva a anotação.'
    return
  }

  erroDaEdicao.value = null
  try {
    await anotacoes.alterar(anotacao.identifier, textoEditado.value.trim())
    editando.value = null
  } catch (erro) {
    erroDaEdicao.value = tratarErro(erro)
  }
}

function excluir(anotacao: Anotacao): void {
  quasar
    .dialog({
      title: 'Excluir anotação',
      message: 'Excluir esta anotação? Ela só existe no Actum e não poderá ser recuperada.',
      cancel: { label: 'Cancelar', flat: true, noCaps: true },
      ok: { label: 'Excluir', color: 'negative', unelevated: true, noCaps: true },
      persistent: true,
    })
    .onOk(async () => {
      try {
        await anotacoes.excluir(anotacao.identifier)
      } catch (erro) {
        notificarErro(erro)
      }
    })
}

function aoTeclar(evento: KeyboardEvent): void {
  if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
    evento.preventDefault()
    void adicionar()
  }
}
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-pb-none">
      <div class="text-subtitle1 text-weight-bold">Anotações privadas</div>
      <div class="text-caption text-grey-7">Só no Actum — não vai para o Asana.</div>
    </q-card-section>

    <q-card-section v-if="anotacoes.carregando && anotacoes.anotacoes.length === 0">
      <q-skeleton type="text" width="70%" />
      <q-skeleton type="text" width="50%" />
    </q-card-section>

    <q-card-section v-else-if="anotacoes.erro" class="row items-center no-wrap q-gutter-md">
      <div class="col text-body2 text-negative">{{ anotacoes.erro.message }}</div>
      <q-btn flat no-caps color="primary" icon="refresh" label="Tentar novamente" @click="anotacoes.carregar(identifier)" />
    </q-card-section>

    <template v-else>
      <q-card-section v-if="anotacoes.anotacoes.length === 0" class="text-body2 text-grey-6 q-pb-none">Nenhuma anotação.</q-card-section>

      <q-list v-else separator class="q-mt-sm">
        <q-item v-for="anotacao in anotacoes.anotacoes" :key="anotacao.identifier">
          <q-item-section v-if="editando === anotacao.identifier">
            <q-input
              v-model="textoEditado"
              type="textarea"
              autogrow
              outlined
              dense
              autofocus
              :error="Boolean(erroDaEdicao)"
              :error-message="erroDaEdicao ?? undefined"
              aria-label="Editar anotação"
            />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat dense no-caps label="Cancelar" :disable="anotacoes.salvando === anotacao.identifier" @click="editando = null" />
              <q-btn unelevated dense no-caps color="primary" label="Salvar" class="q-px-sm" :loading="anotacoes.salvando === anotacao.identifier" @click="salvar(anotacao)" />
            </div>
          </q-item-section>
          <template v-else>
            <q-item-section>
              <q-item-label class="text-body2 texto">{{ anotacao.texto }}</q-item-label>
              <q-item-label caption>
                {{ formatarDataHora(anotacao.criadaEm) }}<template v-if="anotacao.alteradaEm"> · editada em {{ formatarDataHora(anotacao.alteradaEm) }}</template>
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div class="row no-wrap">
                <q-btn flat round dense size="sm" icon="edit" color="grey-7" :aria-label="`Editar a anotação de ${formatarDataHora(anotacao.criadaEm)}`" @click="editar(anotacao)" />
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="delete"
                  color="negative"
                  :aria-label="`Excluir a anotação de ${formatarDataHora(anotacao.criadaEm)}`"
                  :loading="anotacoes.salvando === anotacao.identifier"
                  @click="excluir(anotacao)"
                />
              </div>
            </q-item-section>
          </template>
        </q-item>
      </q-list>

      <q-card-section>
        <q-input
          v-model="nova"
          type="textarea"
          autogrow
          outlined
          dense
          placeholder="Nova anotação: decisões, o que foi testado, lembretes…"
          :error="Boolean(erroDaNova)"
          :error-message="erroDaNova ?? undefined"
          aria-label="Nova anotação"
          @keydown="aoTeclar"
        />
        <div class="row items-center q-mt-xs">
          <div class="col text-caption text-grey-6">Ctrl+Enter adiciona</div>
          <q-btn unelevated no-caps dense color="primary" icon="add" label="Adicionar" class="q-px-sm" :disable="!podeAdicionar" :loading="anotacoes.salvando === 'nova'" @click="adicionar" />
        </div>
      </q-card-section>
    </template>
  </q-card>
</template>

<style scoped>
.texto {
  white-space: pre-line;
}
</style>
