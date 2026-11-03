<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, onMounted } from 'vue'

import { formatarDataHora } from '@/api/datas'
import type { Sincronizacao } from '@/api/sincronizacoes'
import { useNotificarErro } from '@/composables/useNotificarErro'
import { useConexaoStore } from '@/stores/conexao'
import { useSincronizacaoStore } from '@/stores/sincronizacao'

const emit = defineEmits<{
  /** A sincronização terminou com sucesso; o painel deve ser recarregado */
  sincronizada: []
}>()

const quasar = useQuasar()
const notificarErro = useNotificarErro()
const conexao = useConexaoStore()
const sincronizacao = useSincronizacaoStore()

/** Motivo de o botão estar indisponível; nulo quando pode sincronizar. */
const motivoIndisponivel = computed(() => {
  switch (conexao.situacao) {
    case 'nao_configurado':
      return 'O token do Asana não está configurado.'
    case 'token_invalido':
      return 'O Asana recusou o token configurado.'
    default:
      return null
  }
})

const textoDaUltima = computed(() => {
  if (sincronizacao.carregandoUltima && !sincronizacao.ultimaCarregada) {
    return 'Verificando a última sincronização…'
  }

  if (!sincronizacao.ultimaCarregada) {
    return null
  }

  return sincronizacao.ultima
    ? `Última sincronização: ${formatarDataHora(sincronizacao.ultima.iniciadaEm)}`
    : 'Nenhuma sincronização realizada ainda.'
})

function quantidade(valor: number, singular: string, plural: string): string {
  return `${valor} ${valor === 1 ? singular : plural}`
}

function resumo(resultado: Sincronizacao): string {
  return 'Sincronização concluída: ' + [
    quantidade(resultado.tarefasNovas, 'nova', 'novas'),
    quantidade(resultado.tarefasAtualizadas, 'atualizada', 'atualizadas'),
    quantidade(resultado.tarefasArquivadas, 'arquivada', 'arquivadas'),
    quantidade(resultado.reaberturas, 'reabertura', 'reaberturas'),
  ].join(', ') + '.'
}

async function sincronizar(): Promise<void> {
  try {
    const resultado = await sincronizacao.sincronizar()
    quasar.notify({ type: 'positive', message: resumo(resultado), position: 'top', timeout: 6000 })
    emit('sincronizada')
  } catch (erro) {
    notificarErro(erro)
  }
}

onMounted(() => {
  void sincronizacao.carregarUltima()
})
</script>

<template>
  <div class="row items-center q-gutter-sm">
    <div v-if="textoDaUltima" class="text-caption text-grey-8 row items-center q-gutter-xs">
      <template v-if="sincronizacao.ultima">
        <q-icon v-if="sincronizacao.ultima.sucesso" name="check_circle" color="positive" size="18px">
          <q-tooltip>Sincronização concluída com sucesso</q-tooltip>
        </q-icon>
        <q-icon v-else name="error" color="negative" size="18px">
          <q-tooltip>Falhou: {{ sincronizacao.ultima.erro ?? 'erro não informado' }}</q-tooltip>
        </q-icon>
      </template>
      <span>{{ textoDaUltima }}</span>
      <span v-if="sincronizacao.ultima && !sincronizacao.ultima.sucesso" class="text-negative">(falhou)</span>
    </div>

    <div>
      <q-btn
        unelevated
        color="primary"
        icon="sync"
        label="Sincronizar"
        :loading="sincronizacao.emAndamento"
        :disable="motivoIndisponivel !== null"
        @click="sincronizar"
      />
      <q-tooltip v-if="motivoIndisponivel">{{ motivoIndisponivel }}</q-tooltip>
    </div>
  </div>
</template>
