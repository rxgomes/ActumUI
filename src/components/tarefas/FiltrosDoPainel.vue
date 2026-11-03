<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useNotificarErro } from '@/composables/useNotificarErro'
import { usePainelStore } from '@/stores/painel'

interface OpcaoDeEmpresa {
  label: string
  value: string | null
  cor: string | null
}

const route = useRoute()
const router = useRouter()
const painel = usePainelStore()
const notificarErro = useNotificarErro()

const opcoes = computed<OpcaoDeEmpresa[]>(() => [
  { label: 'Todas as empresas', value: null, cor: null },
  ...painel.empresas.map((empresa) => ({ label: empresa.nome, value: empresa.identifier, cor: empresa.cor })),
])

/** Os filtros ficam no endereço da página (fonte única): ler da query e gravar nela. */
const empresa = computed({
  get: () => textoDaQuery('empresa'),
  set: (valor: string | null) => atualizarQuery('empresa', valor),
})

const busca = computed({
  get: () => textoDaQuery('busca') ?? '',
  set: (valor: string | number | null) => atualizarQuery('busca', valor === null ? null : String(valor)),
})

function textoDaQuery(chave: string): string | null {
  const valor = route.query[chave]
  return typeof valor === 'string' && valor.length > 0 ? valor : null
}

function atualizarQuery(chave: string, valor: string | null): void {
  const query = { ...route.query }
  const texto = valor?.trim() ?? ''
  if (texto.length > 0) {
    query[chave] = texto
  } else {
    delete query[chave]
  }

  void router.replace({ query })
}

onMounted(async () => {
  try {
    await painel.carregarEmpresas()
  } catch (erro) {
    notificarErro(erro)
  }
})
</script>

<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div class="col-12 col-sm-5 col-md-4">
      <q-select
        v-model="empresa"
        :options="opcoes"
        emit-value
        map-options
        outlined
        dense
        bg-color="white"
        label="Empresa"
        :loading="painel.carregandoEmpresas"
      >
        <template #option="{ itemProps, opt }">
          <q-item v-bind="itemProps">
            <q-item-section avatar>
              <q-icon v-if="opt.cor" name="circle" size="14px" :style="{ color: opt.cor }" />
              <q-icon v-else name="apps" size="14px" color="grey-6" />
            </q-item-section>
            <q-item-section>{{ opt.label }}</q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <div class="col-12 col-sm-7 col-md-5">
      <q-input
        v-model="busca"
        :debounce="400"
        outlined
        dense
        clearable
        bg-color="white"
        label="Buscar no título ou na descrição"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
  </div>
</template>
