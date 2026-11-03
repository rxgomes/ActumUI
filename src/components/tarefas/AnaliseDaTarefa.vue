<script setup lang="ts">
import { copyToClipboard, useQuasar } from 'quasar'
import { computed, watch } from 'vue'

import { type ItemDaAnalise as Item, progressoDoChecklist, textoDasDuvidas } from '@/api/analises'
import { formatarDataHora } from '@/api/datas'
import { useNotificarErro } from '@/composables/useNotificarErro'
import { useAnaliseStore } from '@/stores/analise'

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

async function executarAnalise(): Promise<void> {
  if (await analise.analisar()) {
    quasar.notify({ type: 'positive', message: 'Análise concluída.', position: 'top' })
  }
}

function reanalisar(): void {
  const proxima = (analise.atual?.versao ?? 0) + 1
  quasar
    .dialog({
      title: 'Reanalisar com IA',
      message: `A reanálise é uma nova chamada paga à Claude API e gera a versão ${proxima}. Itens iguais aos já marcados continuam marcados.`,
      cancel: { label: 'Cancelar', flat: true, noCaps: true },
      ok: { label: 'Reanalisar', color: 'primary', unelevated: true, noCaps: true },
      persistent: true,
    })
    .onOk(() => void executarAnalise())
}

async function marcar(item: Item, concluido: boolean): Promise<void> {
  try {
    await analise.marcar(item, concluido)
  } catch (erro) {
    notificarErro(erro)
  }
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
        Analisando a demanda… pode levar até um minuto.
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
          A IA lê a descrição, os comentários e os retrabalhos da tarefa e organiza a demanda em objetivo, checklist por
          área, testes e dúvidas para quem pediu.
          <div class="text-caption text-grey-7 q-mt-xs">
            Cada análise é uma chamada paga à Claude API e envia o conteúdo da tarefa à Anthropic.
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
          @click="executarAnalise"
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

        <q-separator />
        <q-card-section class="text-caption text-grey-7 q-py-sm">
          Versão {{ exibida.versao }} · {{ formatarDataHora(exibida.analisadaEm) }} · {{ exibida.modelo }} ·
          {{ exibida.tokensEntrada.toLocaleString('pt-BR') }} tokens de entrada, {{ exibida.tokensSaida.toLocaleString('pt-BR') }} de saída
        </q-card-section>
      </template>
    </template>
  </q-card>
</template>

<style scoped>
.objetivo {
  white-space: pre-line;
}
</style>
