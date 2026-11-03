<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { type Branch, bloquearTarefa, desbloquearTarefa, removerBranch } from '@/api/tarefas'
import type { AcaoDaTarefa } from '@/components/tarefas/acoes'
import AnaliseDaTarefa from '@/components/tarefas/AnaliseDaTarefa.vue'
import BranchesDaTarefa from '@/components/tarefas/BranchesDaTarefa.vue'
import CabecalhoDaTarefa from '@/components/tarefas/CabecalhoDaTarefa.vue'
import ComentariosDaTarefa from '@/components/tarefas/ComentariosDaTarefa.vue'
import ConcluirTarefaDialog from '@/components/tarefas/ConcluirTarefaDialog.vue'
import DadosDaTarefa from '@/components/tarefas/DadosDaTarefa.vue'
import IniciarTarefaDialog from '@/components/tarefas/IniciarTarefaDialog.vue'
import NovaBranchDialog from '@/components/tarefas/NovaBranchDialog.vue'
import NovoPrazoDialog from '@/components/tarefas/NovoPrazoDialog.vue'
import RetrabalhosDaTarefa from '@/components/tarefas/RetrabalhosDaTarefa.vue'
import { useNotificarErro } from '@/composables/useNotificarErro'
import { useTarefaStore } from '@/stores/tarefa'

const route = useRoute()
const quasar = useQuasar()
const notificarErro = useNotificarErro()
const tarefa = useTarefaStore()

/** A query do detalhe guarda os filtros do Painel; a volta os devolve. */
const voltarPara = computed(() => ({ name: 'painel', query: route.query }))

const identifier = computed(() => String(route.params.identifier))
const primeiraCarga = computed(() => tarefa.carregando && (tarefa.detalhe === null || tarefa.detalhe.identifier !== identifier.value))

const iniciarAberto = ref(false)
const novoPrazoAberto = ref(false)
const novaBranchAberto = ref(false)
const concluirAberto = ref(false)
const executando = ref<AcaoDaTarefa | null>(null)
const excluindoBranch = ref<string | null>(null)

watch(identifier, (novo) => void tarefa.carregar(novo), { immediate: true })

// Erro numa recarga com dados na tela: notifica e mantém o que está sendo exibido.
watch(
  () => tarefa.erro,
  (erro) => {
    if (erro && tarefa.detalhe !== null) {
      notificarErro(erro)
    }
  },
)

async function aposAcao(mensagem: string): Promise<void> {
  quasar.notify({ type: 'positive', message: mensagem, position: 'top' })
  await tarefa.recarregar()
}

async function executarDireto(acao: 'bloquear' | 'desbloquear'): Promise<void> {
  executando.value = acao
  try {
    if (acao === 'bloquear') {
      await bloquearTarefa(identifier.value)
      await aposAcao('Tarefa bloqueada.')
    } else {
      await desbloquearTarefa(identifier.value)
      await aposAcao('Tarefa desbloqueada.')
    }
  } catch (erro) {
    notificarErro(erro)
  } finally {
    executando.value = null
  }
}

function aoEscolherAcao(acao: AcaoDaTarefa): void {
  switch (acao) {
    case 'iniciar':
      iniciarAberto.value = true
      break
    case 'novoPrazo':
      novoPrazoAberto.value = true
      break
    case 'novaBranch':
      novaBranchAberto.value = true
      break
    case 'concluir':
      concluirAberto.value = true
      break
    case 'bloquear':
    case 'desbloquear':
      void executarDireto(acao)
      break
  }
}

function excluirBranch(branch: Branch): void {
  quasar
    .dialog({
      title: 'Excluir branch',
      message: `Excluir a branch "${branch.nome}"? Ela ainda não foi enviada ao Asana.`,
      cancel: { label: 'Cancelar', flat: true, noCaps: true },
      ok: { label: 'Excluir', color: 'negative', unelevated: true, noCaps: true },
      persistent: true,
    })
    .onOk(async () => {
      excluindoBranch.value = branch.identifier
      try {
        await removerBranch(identifier.value, branch.identifier)
        await aposAcao('Branch excluída.')
      } catch (erro) {
        notificarErro(erro)
      } finally {
        excluindoBranch.value = null
      }
    })
}
</script>

<template>
  <q-page padding>
    <q-linear-progress v-if="tarefa.carregando && !primeiraCarga" indeterminate color="secondary" class="absolute-top" />

    <template v-if="primeiraCarga">
      <q-skeleton type="text" width="140px" />
      <q-skeleton type="text" class="text-h5" width="60%" />
      <q-skeleton type="rect" height="160px" class="q-my-md rounded-borders" />
      <q-skeleton type="rect" height="120px" class="rounded-borders" />
    </template>

    <q-card v-else-if="tarefa.naoEncontrada" flat bordered style="max-width: 520px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="blue-1" text-color="secondary" icon="search_off" />
        <div>
          <div class="text-subtitle1 text-weight-medium">Tarefa não encontrada.</div>
          <div class="text-body2 text-grey-8">O endereço não corresponde a nenhuma tarefa do Actum.</div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn unelevated no-caps color="primary" icon="dashboard" label="Ir para o Painel" :to="voltarPara" />
      </q-card-actions>
    </q-card>

    <q-card v-else-if="tarefa.erro && !tarefa.detalhe" flat bordered style="max-width: 560px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="red-1" text-color="negative" icon="cloud_off" />
        <div>
          <div class="text-subtitle1 text-weight-medium">Não foi possível carregar a tarefa.</div>
          <div class="text-body2 text-grey-8">{{ tarefa.erro.message }}</div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat no-caps color="primary" label="Voltar ao Painel" :to="voltarPara" />
        <q-btn unelevated no-caps color="primary" icon="refresh" label="Tentar novamente" @click="tarefa.carregar(identifier)" />
      </q-card-actions>
    </q-card>

    <template v-else-if="tarefa.detalhe">
      <CabecalhoDaTarefa :detalhe="tarefa.detalhe" :voltar-para="voltarPara" :executando="executando" @acao="aoEscolherAcao" />

      <div class="row q-col-gutter-md">
        <div class="col-12 col-lg-7">
          <DadosDaTarefa :detalhe="tarefa.detalhe" />
          <BranchesDaTarefa :branches="tarefa.detalhe.branches" :excluindo="excluindoBranch" @excluir="excluirBranch" />
        </div>
        <div class="col-12 col-lg-5">
          <AnaliseDaTarefa :identifier="tarefa.detalhe.identifier" :arquivada="tarefa.detalhe.status === 'arquivada'" />
          <RetrabalhosDaTarefa :retrabalhos="tarefa.detalhe.retrabalhos" :comentarios-novos="tarefa.comentariosNovos" />
          <ComentariosDaTarefa :comentarios="tarefa.detalhe.comentarios" :comentarios-novos="tarefa.comentariosNovos" />
        </div>
      </div>

      <IniciarTarefaDialog v-model:aberto="iniciarAberto" :detalhe="tarefa.detalhe" @concluido="aposAcao('Tarefa iniciada.')" />
      <NovoPrazoDialog v-model:aberto="novoPrazoAberto" :detalhe="tarefa.detalhe" @concluido="aposAcao('Prazo e prioridade atualizados.')" />
      <NovaBranchDialog v-model:aberto="novaBranchAberto" :detalhe="tarefa.detalhe" @concluido="aposAcao('Branch registrada.')" />
      <ConcluirTarefaDialog v-model:aberto="concluirAberto" :detalhe="tarefa.detalhe" @concluido="aposAcao('Tarefa concluída no Asana.')" />
    </template>
  </q-page>
</template>
