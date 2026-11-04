<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { formatarDataHora } from '@/api/datas'
import { type Empresa, listarEmpresas } from '@/api/empresas'
import CartaoDaEmpresa from '@/components/retrabalho/CartaoDaEmpresa.vue'
import EvolucaoMensal from '@/components/retrabalho/EvolucaoMensal.vue'
import FiltrosDoRetrabalho from '@/components/retrabalho/FiltrosDoRetrabalho.vue'
import type { SerieDaEmpresa } from '@/components/retrabalho/grafico'
import RankingDeRetrabalho from '@/components/retrabalho/RankingDeRetrabalho.vue'
import PaginaCabecalho from '@/components/PaginaCabecalho.vue'
import { useNotificarErro } from '@/composables/useNotificarErro'
import { type AtalhoDePeriodo, AtalhoPadrao, useRetrabalhoStore } from '@/stores/retrabalho'

const route = useRoute()
const quasar = useQuasar()
const notificarErro = useNotificarErro()
const retrabalho = useRetrabalhoStore()

const empresas = ref<Empresa[]>([])

const indicadores = computed(() => retrabalho.indicadores)
const primeiraCarga = computed(() => retrabalho.carregando && indicadores.value === null)
const semRetrabalho = computed(() => indicadores.value !== null && indicadores.value.total.retrabalhos === 0)

/** Empresas do gráfico na ordem fixa da API, cada uma com a cor escolhida em Empresas. */
const series = computed<SerieDaEmpresa[]>(() =>
  (indicadores.value?.empresas ?? [])
    .filter((empresa) => empresa.identifier !== null)
    .map((empresa) => ({ identifier: empresa.identifier!, nome: empresa.nome, cor: empresa.cor ?? '#9e9e9e' })),
)

const cartoes = computed(() => {
  if (!indicadores.value) {
    return []
  }

  return indicadores.value.empresas.length > 1 ? [...indicadores.value.empresas, indicadores.value.total] : indicadores.value.empresas
})

/** A query é a fonte única dos filtros: cada mudança no endereço recarrega os indicadores. */
watch(
  () => [route.query.periodo, route.query.de, route.query.ate, route.query.empresa],
  () => {
    const atalho = (typeof route.query.periodo === 'string' ? route.query.periodo : AtalhoPadrao) as AtalhoDePeriodo
    void retrabalho.aplicar({
      atalho,
      de: typeof route.query.de === 'string' ? route.query.de : '',
      ate: typeof route.query.ate === 'string' ? route.query.ate : '',
      empresa: typeof route.query.empresa === 'string' ? route.query.empresa : null,
    })
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    empresas.value = await listarEmpresas()
  } catch (erro) {
    notificarErro(erro)
  }
})

function reprocessar(): void {
  quasar
    .dialog({
      title: 'Reprocessar histórico do Asana',
      message:
        'O Actum vai ler no Asana o histórico de todas as tarefas e recalcular conclusões e retrabalhos, inclusive os anteriores ao Actum. É só leitura no Asana e pode levar alguns segundos por tarefa.',
      cancel: { label: 'Cancelar', flat: true, noCaps: true },
      ok: { label: 'Reprocessar', color: 'primary', unelevated: true, noCaps: true },
      persistent: true,
    })
    .onOk(async () => {
      try {
        const resumo = await retrabalho.reprocessar()
        quasar.notify({
          type: 'positive',
          position: 'top',
          message: `Histórico reprocessado: ${resumo.tarefasLidas} tarefas, retrabalhos ${resumo.retrabalhosAntes} → ${resumo.retrabalhosDepois}.`,
        })
      } catch (erro) {
        notificarErro(erro)
      }
    })
}
</script>

<template>
  <q-page padding>
    <q-linear-progress v-if="retrabalho.carregando && !primeiraCarga" indeterminate color="secondary" class="absolute-top" />

    <div class="row items-center q-mb-sm">
      <PaginaCabecalho titulo="Retrabalho" class="col" />
      <q-btn
        outline
        no-caps
        color="primary"
        icon="history"
        label="Reprocessar histórico do Asana"
        :loading="retrabalho.reprocessando"
        @click="reprocessar"
      />
    </div>
    <div class="text-body2 text-grey-8 q-mb-md" style="max-width: 820px">
      Retrabalho é cada vez que, no histórico do Asana, uma tarefa concluída é marcada como não concluída. O período
      considera a data da reabertura.
    </div>

    <FiltrosDoRetrabalho :empresas="empresas" />

    <q-banner v-if="indicadores && indicadores.ultimoReprocessamentoEm === null" dense rounded class="bg-blue-1 text-grey-10 q-mb-md">
      <template #avatar><q-icon name="info" color="secondary" /></template>
      O histórico do Asana ainda não foi reprocessado: os retrabalhos anteriores ao Actum só entram depois do
      reprocessamento.
      <template #action>
        <q-btn flat dense no-caps color="primary" label="Reprocessar agora" :loading="retrabalho.reprocessando" @click="reprocessar" />
      </template>
    </q-banner>

    <q-banner v-if="retrabalho.ultimoResumo && retrabalho.ultimoResumo.falhas.length > 0" dense rounded class="bg-orange-1 text-grey-10 q-mb-md" role="alert">
      <template #avatar><q-icon name="warning" color="warning" /></template>
      <div class="text-weight-medium">Algumas tarefas não puderam ser lidas no Asana e mantiveram os retrabalhos que tinham:</div>
      <ul class="q-my-xs q-pl-md">
        <li v-for="falha in retrabalho.ultimoResumo.falhas" :key="falha.identifier">{{ falha.titulo }}: {{ falha.erro }}</li>
      </ul>
      <template #action>
        <q-btn flat dense no-caps color="primary" label="Fechar" @click="retrabalho.dispensarResumo()" />
      </template>
    </q-banner>

    <!-- Carregando -->
    <template v-if="primeiraCarga">
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="n in 3" :key="n" class="col-12 col-sm-6 col-md-3"><q-skeleton type="rect" height="130px" class="rounded-borders" /></div>
      </div>
      <q-skeleton type="rect" height="260px" class="rounded-borders q-mb-md" />
      <q-skeleton type="rect" height="160px" class="rounded-borders" />
    </template>

    <!-- Erro sem dados -->
    <q-card v-else-if="retrabalho.erro && !indicadores" flat bordered style="max-width: 560px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="red-1" text-color="negative" icon="cloud_off" />
        <div>
          <div class="text-subtitle1 text-weight-medium">Não foi possível carregar os indicadores.</div>
          <div class="text-body2 text-grey-8">{{ retrabalho.erro.message }}</div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn unelevated no-caps color="primary" icon="refresh" label="Tentar novamente" @click="retrabalho.carregar()" />
      </q-card-actions>
    </q-card>

    <template v-else-if="indicadores">
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="cartao in cartoes" :key="cartao.identifier ?? 'total'" class="col-12 col-sm-6 col-md-3">
          <CartaoDaEmpresa :indicador="cartao" />
        </div>
      </div>

      <q-card flat bordered class="q-mb-md">
        <q-card-section class="q-pb-sm">
          <div class="text-subtitle1 text-weight-bold">Evolução mensal</div>
          <div class="text-caption text-grey-7">Retrabalhos por mês da reabertura</div>
        </q-card-section>
        <q-card-section v-if="semRetrabalho" class="text-body2 text-grey-7">Nenhum retrabalho no período.</q-card-section>
        <q-card-section v-else>
          <EvolucaoMensal :evolucao="indicadores.evolucao" :empresas="series" />
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section class="q-pb-sm">
          <div class="text-subtitle1 text-weight-bold">Tarefas com mais retrabalhos</div>
          <div v-if="indicadores.ultimoReprocessamentoEm" class="text-caption text-grey-7">
            Histórico reprocessado em {{ formatarDataHora(indicadores.ultimoReprocessamentoEm) }}
          </div>
        </q-card-section>
        <q-card-section v-if="semRetrabalho" class="text-body2 text-grey-7">Nenhum retrabalho no período.</q-card-section>
        <RankingDeRetrabalho v-else :tarefas="indicadores.ranking" />
      </q-card>
    </template>
  </q-page>
</template>
