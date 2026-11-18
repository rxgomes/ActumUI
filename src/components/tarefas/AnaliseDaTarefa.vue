<script setup lang="ts">
import { copyToClipboard, useQuasar } from 'quasar'
import { computed, ref, watch } from 'vue'

import {
  type FontesDaAnalise,
  fontesPadrao,
  fontesParaReanalise,
  type ItemDaAnalise as Item,
  progressoDoChecklist,
  textoDasDuvidas,
  textoDasFontes,
  textoParaExploreDoOpenSpec,
} from '@/api/analises'
import { textoDasDuvidasParaEnviar } from '@/api/comentarios'
import { formatarDataHora } from '@/api/datas'
import { useNotificarErro } from '@/composables/useNotificarErro'
import { useAnaliseStore } from '@/stores/analise'
import { useNovoComentarioStore } from '@/stores/novoComentario'
import { useTarefaStore } from '@/stores/tarefa'

import FontesDaAnaliseDialog from './FontesDaAnaliseDialog.vue'
import ItemDaAnalise from './ItemDaAnalise.vue'

const ComandoDaChave = 'dotnet user-secrets set "Claude:ApiKey" "<sua-chave>" --project src/Actum.Api'

const props = defineProps<{
  /** Tarefa do detalhe */
  identifier: string
  /** Tarefas arquivadas não podem ser analisadas (as análises existentes continuam visíveis) */
  arquivada: boolean
}>()

const quasar = useQuasar()
const notificarErro = useNotificarErro()
const analise = useAnaliseStore()
const novoComentario = useNovoComentarioStore()
const tarefa = useTarefaStore()

watch(() => props.identifier, (novo) => void analise.carregar(novo), { immediate: true })

const exibida = computed(() => analise.exibida)
const progresso = computed(() => (exibida.value ? progressoDoChecklist(exibida.value) : { feitos: 0, total: 0 }))
const primeiraCarga = computed(() => analise.carregando && analise.situacao === null)
const naoConfigurada = computed(() => analise.situacao !== null && !analise.situacao.configurado)
const podeAnalisar = computed(() => !props.arquivada && !naoConfigurada.value && !analise.analisando)

const opcoesDeVersao = computed(() =>
  analise.versoes.map((versao) => ({
    value: versao.versao,
    label: `Versão ${versao.versao}${versao.atual ? ' (atual)' : ''} · ${formatarDataHora(versao.analisadaEm)}`,
  })),
)

const versaoSelecionada = computed({
  get: () => exibida.value?.versao ?? null,
  set: (versao: number | null) => analise.exibir(versao),
})

const dialogoAberto = ref(false)
const fontesIniciais = ref<FontesDaAnalise>(fontesPadrao())
const proximaVersao = computed(() => (analise.atual?.versao ?? 0) + 1)

/** Primeira análise: o diálogo de fontes abre com descrição e comentários. */
function analisar(): void {
  fontesIniciais.value = fontesPadrao()
  dialogoAberto.value = true
}

/** Reanálise: o diálogo abre com as fontes da versão atual (itens iguais aos marcados continuam marcados). */
function reanalisar(): void {
  fontesIniciais.value = fontesParaReanalise(analise.atual)
  dialogoAberto.value = true
}

function aposAnalise(): void {
  quasar.notify({ type: 'positive', message: 'Análise concluída.', position: 'top' })
  // A análise grava os comentários que estavam só no Asana: recarrega o detalhe para exibi-los.
  void tarefa.recarregar()
}

async function marcar(item: Item, concluido: boolean): Promise<void> {
  try {
    await analise.marcar(item, concluido)
  } catch (erro) {
    notificarErro(erro)
  }
}

/** Dúvidas ainda não resolvidas da versão exibida, prontas para o comentário. */
const duvidasParaEnviar = computed(() => (exibida.value ? textoDasDuvidasParaEnviar(exibida.value) : ''))

/** Preenche a caixa de comentário com as dúvidas para revisão; nada é enviado aqui. */
function enviarDuvidas(): void {
  novoComentario.acrescentarTexto(duvidasParaEnviar.value)
}

async function copiarDuvidas(): Promise<void> {
  if (!exibida.value) {
    return
  }

  try {
    await copyToClipboard(textoDasDuvidas(exibida.value))
    quasar.notify({ type: 'positive', message: 'Dúvidas copiadas.', position: 'top' })
  } catch {
    quasar.notify({ type: 'negative', message: 'Não foi possível copiar as dúvidas.', position: 'top' })
  }
}

/** Copia a versão exibida no formato do `/opsx:explore`, para explorar a mudança no Claude Code. */
async function copiarParaOpenSpec(): Promise<void> {
  const detalhe = tarefa.detalhe
  if (!exibida.value || !detalhe) {
    return
  }

  try {
    await copyToClipboard(textoParaExploreDoOpenSpec(exibida.value, detalhe))
    quasar.notify({ type: 'positive', message: 'Análise copiada para o OpenSpec.', position: 'top' })
  } catch {
    quasar.notify({ type: 'negative', message: 'Não foi possível copiar a análise.', position: 'top' })
  }
}

function habilitado(item: Item): boolean {
  return !analise.exibindoAnterior && !analise.marcando.has(item.identifier)
}
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="row items-center q-gutter-sm q-pb-sm">
      <q-icon name="auto_awesome" color="primary" size="22px" />
      <div class="text-subtitle1 text-weight-bold col">Análise com IA</div>
      <template v-if="exibida">
        <q-select
          v-if="analise.versoes.length > 1"
          v-model="versaoSelecionada"
          :options="opcoesDeVersao"
          emit-value
          map-options
          dense
          outlined
          options-dense
          aria-label="Versão da análise"
          style="min-width: 250px"
        />
        <q-btn
          flat
          no-caps
          dense
          color="primary"
          icon="content_copy"
          label="Copiar para o OpenSpec"
          class="q-px-sm"
          :disable="!tarefa.detalhe"
          @click="copiarParaOpenSpec"
        >
          <q-tooltip>Copia a análise exibida no formato do /opsx:explore, para colar no Claude Code.</q-tooltip>
        </q-btn>
        <q-btn
          outline
          no-caps
          dense
          color="primary"
          icon="refresh"
          label="Reanalisar"
          class="q-px-sm"
          :disable="!podeAnalisar"
          :loading="analise.analisando"
          @click="reanalisar"
        >
          <q-tooltip v-if="arquivada">Tarefas arquivadas não podem ser analisadas.</q-tooltip>
        </q-btn>
      </template>
    </q-card-section>

    <q-linear-progress v-if="analise.analisando" indeterminate color="primary" />

    <!-- Carregando -->
    <q-card-section v-if="primeiraCarga">
      <q-skeleton type="text" width="80%" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="rect" height="90px" class="q-mt-sm rounded-borders" />
    </q-card-section>

    <!-- Erro ao carregar -->
    <q-card-section v-else-if="analise.erroAoCarregar && !exibida" class="row items-center no-wrap q-gutter-md">
      <q-avatar rounded color="red-1" text-color="negative" icon="cloud_off" />
      <div class="col">
        <div class="text-body2 text-weight-medium">Não foi possível carregar a análise.</div>
        <div class="text-body2 text-grey-8">{{ analise.erroAoCarregar.message }}</div>
      </div>
      <q-btn flat no-caps color="primary" icon="refresh" label="Tentar novamente" @click="analise.carregar(identifier)" />
    </q-card-section>

    <template v-else>
      <q-card-section v-if="analise.analisando" class="text-body2 text-grey-8 q-py-sm">
        Analisando a demanda… pode levar até um minuto, ou mais com anexos.
      </q-card-section>

      <q-card-section v-if="analise.erroDaAnalise" class="q-py-sm">
        <q-banner dense rounded class="bg-red-1 text-grey-10" role="alert">
          <template #avatar><q-icon name="error_outline" color="negative" /></template>
          {{ analise.erroDaAnalise.message }}
          <template #action>
            <q-btn flat dense no-caps color="primary" label="Fechar" @click="analise.dispensarErro()" />
          </template>
        </q-banner>
      </q-card-section>

      <!-- Chave não configurada -->
      <q-card-section v-if="naoConfigurada && !exibida">
        <q-banner dense rounded class="bg-orange-1 text-grey-10">
          <template #avatar><q-icon name="key_off" color="warning" /></template>
          <div class="text-weight-medium">A chave da Claude API não está configurada.</div>
          <div>Na pasta da API, execute o comando abaixo e reinicie a API:</div>
          <code class="q-mt-xs block">{{ ComandoDaChave }}</code>
        </q-banner>
      </q-card-section>

      <!-- Sem análise -->
      <q-card-section v-else-if="!exibida" class="row items-center q-gutter-md">
        <div class="col text-body2 text-grey-8">
          A IA lê as fontes que você escolher (a descrição, os comentários atualizados pelo Asana na hora, os anexos da
          tarefa ou um prompt seu) e organiza a demanda em objetivo, checklist por área, testes, dúvidas para quem pediu e
          regras e observações, mostrando de onde veio cada item.
          <div class="text-caption text-grey-7 q-mt-xs">
            Cada análise é uma chamada paga à Claude API e envia o conteúdo escolhido, inclusive os anexos, à Anthropic.
          </div>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="auto_awesome"
          label="Analisar com IA"
          :disable="!podeAnalisar"
          :loading="analise.analisando"
          @click="analisar"
        >
          <q-tooltip v-if="arquivada">Tarefas arquivadas não podem ser analisadas.</q-tooltip>
        </q-btn>
      </q-card-section>

      <!-- Com análise -->
      <template v-else>
        <q-card-section v-if="analise.exibindoAnterior" class="q-py-sm">
          <q-banner dense rounded class="bg-blue-1 text-grey-10">
            <template #avatar><q-icon name="history" color="secondary" /></template>
            Você está vendo a versão {{ exibida.versao }} (anterior). Os itens não podem ser marcados.
            <template #action>
              <q-btn flat dense no-caps color="primary" label="Ver versão atual" @click="analise.exibir(null)" />
            </template>
          </q-banner>
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <div class="text-caption text-grey-7">Objetivo</div>
          <div class="text-body1 objetivo">{{ exibida.objetivo }}</div>
        </q-card-section>

        <q-card-section v-if="progresso.total > 0" class="q-pt-none">
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2 col">Checklist</div>
            <div class="text-caption text-grey-8">{{ progresso.feitos }} de {{ progresso.total }} itens feitos</div>
          </div>
          <q-linear-progress :value="progresso.feitos / progresso.total" color="positive" track-color="grey-3" rounded size="6px" class="q-mb-sm" />

          <div v-for="grupo in exibida.checklist" :key="grupo.nome" class="q-mb-sm">
            <div class="text-caption text-weight-bold text-primary text-uppercase q-mt-sm">{{ grupo.nome }}</div>
            <q-list dense>
              <ItemDaAnalise
                v-for="item in grupo.itens"
                :key="item.identifier"
                :item="item"
                :habilitado="habilitado(item)"
                :gravando="analise.marcando.has(item.identifier)"
                @marcar="marcar"
              />
            </q-list>
          </div>
        </q-card-section>

        <q-card-section v-if="exibida.testes.length > 0" class="q-pt-none">
          <div class="text-subtitle2 q-mb-xs"><q-icon name="science" class="q-mr-xs" />Testes</div>
          <q-list dense>
            <ItemDaAnalise
              v-for="item in exibida.testes"
              :key="item.identifier"
              :item="item"
              :habilitado="habilitado(item)"
              :gravando="analise.marcando.has(item.identifier)"
              @marcar="marcar"
            />
          </q-list>
        </q-card-section>

        <q-card-section v-if="exibida.duvidas.length > 0" class="q-pt-none">
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2 col"><q-icon name="help_outline" class="q-mr-xs" />Dúvidas para o solicitante</div>
            <q-btn flat dense no-caps color="primary" icon="content_copy" label="Copiar dúvidas" @click="copiarDuvidas" />
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="forum"
              label="Enviar dúvidas ao Asana"
              :disable="duvidasParaEnviar === '' || arquivada"
              @click="enviarDuvidas"
            >
              <q-tooltip v-if="duvidasParaEnviar === ''">Todas as dúvidas estão resolvidas.</q-tooltip>
              <q-tooltip v-else>Preenche a caixa de comentário para você revisar antes de enviar.</q-tooltip>
            </q-btn>
          </div>
          <q-list dense>
            <ItemDaAnalise
              v-for="item in exibida.duvidas"
              :key="item.identifier"
              :item="item"
              :habilitado="habilitado(item)"
              :gravando="analise.marcando.has(item.identifier)"
              @marcar="marcar"
            />
          </q-list>
        </q-card-section>

        <q-card-section v-if="exibida.regras.length > 0" class="q-pt-none">
          <div class="text-subtitle2 q-mb-xs"><q-icon name="rule" class="q-mr-xs" />Regras e observações</div>
          <q-list dense>
            <ItemDaAnalise
              v-for="item in exibida.regras"
              :key="item.identifier"
              :item="item"
              :habilitado="habilitado(item)"
              :gravando="analise.marcando.has(item.identifier)"
              @marcar="marcar"
            />
          </q-list>
        </q-card-section>

        <q-separator />
        <q-card-section class="text-caption text-grey-7 q-py-sm">
          Versão {{ exibida.versao }} · {{ formatarDataHora(exibida.analisadaEm) }} · {{ exibida.modelo }} ·
          {{ exibida.tokensEntrada.toLocaleString('pt-BR') }} tokens de entrada, {{ exibida.tokensSaida.toLocaleString('pt-BR') }} de saída
          <div class="fontes">Fontes: {{ textoDasFontes(exibida.fontes) }}</div>
        </q-card-section>
        <q-expansion-item
          v-if="exibida.fontes?.modo === 'prompt' && exibida.fontes.prompt"
          dense
          dense-toggle
          icon="edit_note"
          label="Ver prompt"
          header-class="text-caption text-grey-8"
        >
          <q-card-section class="q-pt-none text-body2 text-grey-9 prompt">{{ exibida.fontes.prompt }}</q-card-section>
        </q-expansion-item>
      </template>
    </template>

    <FontesDaAnaliseDialog
      v-model:aberto="dialogoAberto"
      :identifier="identifier"
      :inicial="fontesIniciais"
      :proxima-versao="proximaVersao"
      @concluido="aposAnalise"
    />
  </q-card>
</template>

<style scoped>
.objetivo {
  white-space: pre-line;
}

.fontes {
  word-break: break-word;
}

.prompt {
  white-space: pre-line;
}
</style>
