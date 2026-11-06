<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { ehStatusDoPainel, type FiltrosDoPainel } from '@/api/tarefas'
import PaginaCabecalho from '@/components/PaginaCabecalho.vue'
import BarraDeSincronizacao from '@/components/tarefas/BarraDeSincronizacao.vue'
import CartaoTarefa from '@/components/tarefas/CartaoTarefa.vue'
import FiltrosDoPainelComponente from '@/components/tarefas/FiltrosDoPainel.vue'
import GrupoDoPainel from '@/components/tarefas/GrupoDoPainel.vue'
import { separarEmAndamento } from '@/components/tarefas/grupos'
import ResumoDosGrupos from '@/components/tarefas/ResumoDosGrupos.vue'
import { useNotificarErro } from '@/composables/useNotificarErro'
import { usePainelStore } from '@/stores/painel'

const route = useRoute()
const painel = usePainelStore()
const notificarErro = useNotificarErro()

/** Filtros lidos do endereço da página (fonte única, gravada por FiltrosDoPainel). */
const filtros = computed<FiltrosDoPainel>(() => ({
  empresa: textoDaQuery('empresa'),
  status: statusDaQuery(),
  busca: textoDaQuery('busca'),
}))

const temFiltros = computed(() => Boolean(filtros.value.empresa || filtros.value.status || filtros.value.busca))

const primeiraCarga = computed(() => painel.painel === null && painel.carregando)
const erroSemDados = computed(() => painel.painel === null && painel.erro !== null && !painel.carregando)
/** Tarefas em andamento vão para o topo, sem cabeçalho de grupo; os grupos exibem as demais. */
const separados = computed(() => separarEmAndamento(painel.painel?.grupos ?? []))

const vazio = computed(() => painel.painel !== null && painel.total === 0)

function textoDaQuery(chave: string): string | undefined {
  const valor = route.query[chave]
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined
}

/** Status do endereço; um valor desconhecido é ignorado. */
function statusDaQuery(): FiltrosDoPainel['status'] {
  const valor = textoDaQuery('status')
  return valor !== undefined && ehStatusDoPainel(valor) ? valor : undefined
}

watch(filtros, (novos) => void painel.carregar(novos), { immediate: true, deep: true })

// Erro numa recarga com dados já na tela: notifica e mantém o que está sendo exibido.
watch(
  () => painel.erro,
  (erro) => {
    if (erro && painel.painel !== null) {
      notificarErro(erro)
    }
  },
)
</script>

<template>
  <q-page padding>
    <q-linear-progress v-if="painel.carregando && painel.painel !== null" indeterminate color="secondary" class="absolute-top" />

    <div class="row items-start justify-between q-col-gutter-md">
      <div class="col-auto">
        <PaginaCabecalho titulo="Painel" />
      </div>
      <div class="col-auto">
        <BarraDeSincronizacao @sincronizada="painel.recarregar()" />
      </div>
    </div>

    <FiltrosDoPainelComponente />

    <template v-if="primeiraCarga">
      <div class="row q-col-gutter-md q-mb-lg">
        <div v-for="n in 8" :key="n" class="col-6 col-sm-4 col-md">
          <q-skeleton type="rect" height="72px" class="rounded-borders" />
        </div>
      </div>
      <q-skeleton v-for="n in 3" :key="`secao-${n}`" type="rect" height="120px" class="q-mb-md rounded-borders" />
    </template>

    <q-card v-else-if="erroSemDados" flat bordered class="q-pa-md" style="max-width: 560px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="red-1" text-color="negative" icon="cloud_off" />
        <div>
          <div class="text-subtitle1 text-weight-medium">Não foi possível carregar o painel.</div>
          <div class="text-body2 text-grey-8">{{ painel.erro?.message }}</div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn unelevated color="primary" icon="refresh" label="Tentar novamente" @click="painel.recarregar()" />
      </q-card-actions>
    </q-card>

    <template v-else-if="painel.painel">
      <ResumoDosGrupos :grupos="separados.grupos" />

      <q-banner v-if="vazio" rounded class="bg-blue-1 text-grey-9 q-mb-lg">
        <template #avatar>
          <q-icon :name="temFiltros ? 'filter_alt_off' : 'sync'" color="secondary" />
        </template>
        <template v-if="temFiltros">Nenhuma tarefa corresponde aos filtros.</template>
        <template v-else>Nenhuma tarefa aberta. Clique em Sincronizar para buscar as tarefas do Asana.</template>
      </q-banner>

      <section v-if="separados.emAndamento.length > 0" class="row q-col-gutter-md q-mb-lg" aria-label="Tarefas em andamento">
        <div v-for="item in separados.emAndamento" :key="item.cartao.identifier" class="col-12 col-sm-6 col-md-4 col-xl-3">
          <CartaoTarefa :cartao="item.cartao" :grupo="item.grupo" />
        </div>
      </section>

      <GrupoDoPainel v-for="grupo in separados.grupos" :key="grupo.grupo" :grupo="grupo" />
    </template>
  </q-page>
</template>
