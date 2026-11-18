<script setup lang="ts">
import { toRef, watch } from 'vue'

import { type Anexo, ehExterno, enderecoDeDownload } from '@/api/anexos'
import { tamanhoLegivel } from '@/api/comentarios'
import { formatarDataHora } from '@/api/datas'
import { useAnexosDaTarefa } from '@/composables/useAnexosDaTarefa'

const props = defineProps<{
  /** Tarefa do detalhe */
  identifier: string
}>()

const { anexos, carregando, erro, carregar, limpar } = useAnexosDaTarefa(toRef(props, 'identifier'))

watch(
  () => props.identifier,
  () => {
    limpar()
    void carregar()
  },
  { immediate: true },
)

function detalhes(anexo: Anexo): string {
  const partes = [formatarDataHora(anexo.criadoEm)]
  if (anexo.tamanho !== null) {
    partes.push(tamanhoLegivel(anexo.tamanho))
  }
  if (ehExterno(anexo)) {
    partes.push(anexo.hospedagem)
  }
  return partes.join(' · ')
}
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="row items-center no-wrap q-pb-none">
      <div class="col">
        <div class="text-subtitle1 text-weight-bold">
          Anexos
          <q-badge v-if="anexos.length > 0" color="grey-6" class="q-ml-xs">{{ anexos.length }}</q-badge>
        </div>
        <div class="text-caption text-grey-7">Arquivos da tarefa e dos comentários no Asana.</div>
      </div>
      <q-btn flat round dense icon="refresh" :loading="carregando" aria-label="Recarregar anexos" @click="carregar">
        <q-tooltip>Recarregar do Asana</q-tooltip>
      </q-btn>
    </q-card-section>

    <q-card-section v-if="carregando && anexos.length === 0">
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </q-card-section>

    <q-card-section v-else-if="erro" class="row items-center no-wrap text-negative">
      <q-icon name="error_outline" size="20px" class="q-mr-sm" />
      <span class="col">{{ erro }}</span>
      <q-btn flat dense no-caps color="primary" label="Tentar novamente" @click="carregar" />
    </q-card-section>

    <q-card-section v-else-if="anexos.length === 0" class="text-grey-7 text-body2">
      Nenhum arquivo anexado.
    </q-card-section>

    <q-list v-else dense class="q-pb-sm">
      <q-item
        v-for="anexo in anexos"
        :key="anexo.gid"
        clickable
        tag="a"
        :href="enderecoDeDownload(identifier, anexo.gid)"
        target="_blank"
        rel="noopener"
      >
        <q-item-section avatar>
          <q-icon :name="ehExterno(anexo) ? 'open_in_new' : 'download'" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-body2 ellipsis">{{ anexo.nome }}</q-item-label>
          <q-item-label caption>{{ detalhes(anexo) }}</q-item-label>
        </q-item-section>
        <q-tooltip>{{ ehExterno(anexo) ? `Abrir no ${anexo.hospedagem}` : 'Baixar' }}</q-tooltip>
      </q-item>
    </q-list>
  </q-card>
</template>
