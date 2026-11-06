<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { TarefaDetalhe } from '@/api/tarefas'

import { type AcaoDaTarefa, acoesDisponiveis, temAndamento } from './acoes'
import { corDoAndamento, corDoStatus, rotuloDoAndamento, rotuloDoStatus } from './textos'

const props = defineProps<{
  /** Tarefa exibida */
  detalhe: TarefaDetalhe
  /** Destino do botão Voltar (Painel com os filtros de antes) */
  voltarPara: RouteLocationRaw
  /** Ação executada diretamente (iniciar/pausar/bloquear/desbloquear) em andamento, para o loading do botão */
  executando: AcaoDaTarefa | null
}>()

const emit = defineEmits<{
  /** O usuário escolheu uma ação */
  acao: [acao: AcaoDaTarefa]
}>()

const acoes = computed(() => acoesDisponiveis(props.detalhe.status, props.detalhe.emAndamento))
const comAndamento = computed(() => temAndamento(props.detalhe.status))

const botoes: { acao: AcaoDaTarefa; rotulo: string; icone: string; destaque: boolean }[] = [
  { acao: 'iniciar', rotulo: 'Iniciar', icone: 'play_arrow', destaque: true },
  { acao: 'pausar', rotulo: 'Pausar', icone: 'pause', destaque: false },
  { acao: 'concluir', rotulo: 'Concluir', icone: 'task_alt', destaque: true },
  { acao: 'novoPrazo', rotulo: 'Novo prazo', icone: 'event', destaque: false },
  { acao: 'novaBranch', rotulo: 'Nova branch', icone: 'call_split', destaque: false },
  { acao: 'bloquear', rotulo: 'Bloquear', icone: 'block', destaque: false },
  { acao: 'desbloquear', rotulo: 'Desbloquear', icone: 'lock_open', destaque: false },
]

/** Iniciar e Pausar aparecem juntos quando a tarefa tem andamento; o que não se aplica fica desabilitado. */
function visivel(acao: AcaoDaTarefa): boolean {
  return acoes.value.has(acao) || (comAndamento.value && (acao === 'iniciar' || acao === 'pausar'))
}

const botoesVisiveis = computed(() => botoes.filter((botao) => visivel(botao.acao)))
</script>

<template>
  <!-- Dois nós na raiz: o Voltar rola com a página e o bloco seguinte fica fixo abaixo do cabeçalho da aplicação.
       O sticky precisa ser filho direto da página para valer durante toda a rolagem. -->
  <q-btn flat dense no-caps icon="arrow_back" label="Voltar ao Painel" color="primary" :to="voltarPara" class="q-mb-sm" />

  <div class="cabecalho-fixo bg-grey-2 q-mb-md">
    <div class="row items-start q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="row items-center q-gutter-sm q-mb-xs">
          <q-chip dense square text-color="white" class="q-ml-none" :style="{ backgroundColor: detalhe.empresa.cor }" :label="detalhe.empresa.nome" />
          <!-- "Iniciada" é redundante ao lado de Em andamento/Pausada; os demais status continuam visíveis. -->
          <q-badge
            v-if="detalhe.status !== 'em_andamento'"
            :color="corDoStatus(detalhe.status)"
            :label="rotuloDoStatus(detalhe.status)"
            class="text-body2 q-px-sm"
          />
          <q-badge
            v-if="comAndamento"
            :color="corDoAndamento(detalhe.emAndamento)"
            :label="rotuloDoAndamento(detalhe.emAndamento)"
            class="text-body2 q-px-sm"
          />
          <a :href="detalhe.linkAsana" target="_blank" rel="noopener" class="text-secondary text-caption row items-center no-wrap">
            Abrir no Asana <q-icon name="open_in_new" size="14px" class="q-ml-xs" />
          </a>
        </div>
        <h1 class="text-h5 text-weight-bold q-my-none">{{ detalhe.titulo }}</h1>
      </div>

      <div v-if="botoesVisiveis.length > 0" class="col-12 col-md-auto row q-gutter-sm justify-end">
        <q-btn
          v-for="botao in botoesVisiveis"
          :key="botao.acao"
          :unelevated="botao.destaque"
          :outline="!botao.destaque"
          color="primary"
          no-caps
          :icon="botao.icone"
          :label="botao.rotulo"
          :loading="executando === botao.acao"
          :disable="!acoes.has(botao.acao) || (executando !== null && executando !== botao.acao)"
          @click="emit('acao', botao.acao)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ocupa a largura toda da página (anula o padding do q-page) para o conteúdo rolado não aparecer pelas bordas. */
.cabecalho-fixo {
  position: sticky;
  top: var(--altura-do-cabecalho, 50px);
  z-index: 2;
  margin-left: -16px;
  margin-right: -16px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
