<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { type Empresa, listarEmpresas } from '@/api/empresas'
import { comoErroDaApi, type ErroDaApi } from '@/api/erros'
import LinhaDaEmpresa from '@/components/empresas/LinhaDaEmpresa.vue'
import PaginaCabecalho from '@/components/PaginaCabecalho.vue'

const empresas = ref<Empresa[] | null>(null)
const carregando = ref(false)
const erro = ref<ErroDaApi | null>(null)

async function carregar(): Promise<void> {
  carregando.value = true
  erro.value = null
  try {
    empresas.value = await listarEmpresas()
  } catch (falha) {
    erro.value = comoErroDaApi(falha)
  } finally {
    carregando.value = false
  }
}

function aoAlterar(alterada: Empresa): void {
  empresas.value = (empresas.value ?? []).map((empresa) => (empresa.identifier === alterada.identifier ? alterada : empresa))
}

onMounted(carregar)
</script>

<template>
  <q-page padding>
    <PaginaCabecalho titulo="Empresas" />

    <div class="text-body2 text-grey-8 q-mb-md" style="max-width: 960px">
      Cada empresa é um workspace do Asana. A cor identifica as tarefas dela no Painel. Uma empresa fora da sincronização
      não é consultada no Asana; as tarefas dela já sincronizadas continuam no Actum.
    </div>

    <q-card v-if="carregando && !empresas" flat bordered style="max-width: 960px">
      <q-item v-for="n in 3" :key="n" class="q-py-md">
        <q-item-section avatar><q-skeleton type="QAvatar" size="40px" square /></q-item-section>
        <q-item-section><q-skeleton type="text" width="40%" /><q-skeleton type="text" width="60%" /></q-item-section>
      </q-item>
    </q-card>

    <q-card v-else-if="erro && !empresas" flat bordered style="max-width: 560px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="red-1" text-color="negative" icon="cloud_off" />
        <div>
          <div class="text-subtitle1 text-weight-medium">Não foi possível carregar as empresas.</div>
          <div class="text-body2 text-grey-8">{{ erro.message }}</div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn unelevated no-caps color="primary" icon="refresh" label="Tentar novamente" @click="carregar" />
      </q-card-actions>
    </q-card>

    <q-card v-else-if="empresas && empresas.length === 0" flat bordered style="max-width: 560px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="blue-1" text-color="secondary" icon="business" />
        <div class="text-body2">
          Nenhuma empresa ainda. As empresas são criadas pela sincronização, a partir dos seus workspaces do Asana.
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn unelevated no-caps color="primary" icon="dashboard" label="Ir para o Painel" :to="{ name: 'painel' }" />
      </q-card-actions>
    </q-card>

    <q-card v-else-if="empresas" flat bordered style="max-width: 960px">
      <q-list separator>
        <LinhaDaEmpresa v-for="empresa in empresas" :key="empresa.identifier" :empresa="empresa" @alterada="aoAlterar" />
      </q-list>
    </q-card>
  </q-page>
</template>
