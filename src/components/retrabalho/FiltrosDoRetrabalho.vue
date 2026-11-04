<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Empresa } from '@/api/empresas'
import CampoDeData from '@/components/tarefas/CampoDeData.vue'
import { type AtalhoDePeriodo, AtalhoPadrao, erroDoPeriodo } from '@/stores/retrabalho'

defineProps<{
  /** Empresas para o filtro, na ordem da API */
  empresas: Empresa[]
}>()

const route = useRoute()
const router = useRouter()

const OpcoesDePeriodo: { label: string; value: AtalhoDePeriodo }[] = [
  { label: 'Últimos 3 meses', value: 'ultimos3' },
  { label: 'Últimos 6 meses', value: 'ultimos6' },
  { label: 'Últimos 12 meses', value: 'ultimos12' },
  { label: 'Este ano', value: 'esteAno' },
  { label: 'Personalizado', value: 'personalizado' },
]

/** Os filtros ficam no endereço da página (fonte única): ler da query e gravar nela. */
const periodo = computed({
  get: () => (OpcoesDePeriodo.some((opcao) => opcao.value === route.query.periodo) ? (route.query.periodo as AtalhoDePeriodo) : AtalhoPadrao),
  set: (valor: AtalhoDePeriodo) => atualizar({ periodo: valor === AtalhoPadrao ? undefined : valor, ...(valor === 'personalizado' ? {} : { de: undefined, ate: undefined }) }),
})

const empresa = computed({
  get: () => (typeof route.query.empresa === 'string' ? route.query.empresa : null),
  set: (valor: string | null) => atualizar({ empresa: valor ?? undefined }),
})

// O período personalizado é editado localmente e só vai para o endereço quando é válido.
const de = ref<string | null>(typeof route.query.de === 'string' ? route.query.de : null)
const ate = ref<string | null>(typeof route.query.ate === 'string' ? route.query.ate : null)
const erroDoPersonalizado = computed(() => (periodo.value === 'personalizado' && (de.value || ate.value) ? erroDoPeriodo(de.value ?? '', ate.value ?? '') : null))

watch([de, ate], ([novoDe, novoAte]) => {
  if (periodo.value === 'personalizado' && novoDe && novoAte && erroDoPeriodo(novoDe, novoAte) === null) {
    atualizar({ de: novoDe, ate: novoAte })
  }
})

const opcoesDeEmpresa = computed(() => [
  { label: 'Todas as empresas', value: null as string | null },
])

function atualizar(mudancas: Record<string, string | undefined>): void {
  const query = { ...route.query, ...mudancas }
  for (const chave of Object.keys(query)) {
    if (query[chave] === undefined) {
      delete query[chave]
    }
  }

  void router.replace({ query })
}
</script>

<template>
  <div class="row items-start q-col-gutter-md q-mb-md">
    <div class="col-12 col-sm-auto" style="min-width: 200px">
      <q-select v-model="periodo" :options="OpcoesDePeriodo" emit-value map-options outlined dense label="Período" />
    </div>
    <template v-if="periodo === 'personalizado'">
      <div class="col-6 col-sm-auto" style="min-width: 170px">
        <CampoDeData v-model="de" label="Início" dense />
      </div>
      <div class="col-6 col-sm-auto" style="min-width: 170px">
        <CampoDeData v-model="ate" label="Fim" :erro="erroDoPersonalizado" dense />
      </div>
    </template>
    <div class="col-12 col-sm-auto" style="min-width: 220px">
      <q-select
        v-model="empresa"
        :options="[...opcoesDeEmpresa, ...empresas.map((item) => ({ label: item.nome, value: item.identifier, cor: item.cor }))]"
        emit-value
        map-options
        outlined
        dense
        label="Empresa"
      >
        <template #option="{ itemProps, opt }">
          <q-item v-bind="itemProps">
            <q-item-section v-if="opt.cor" side>
              <span class="marca-empresa" :style="{ backgroundColor: opt.cor }" />
            </q-item-section>
            <q-item-section>{{ opt.label }}</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
  </div>
</template>

<style scoped>
.marca-empresa {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
</style>
