<script setup lang="ts">
import { computed } from 'vue'

import type { CartaoTarefa } from '@/api/tarefas'

import { prazosDoCartao } from './prazos'

const props = defineProps<{
  /** Tarefa exibida no cartão */
  cartao: CartaoTarefa
}>()

const prazos = computed(() => prazosDoCartao(props.cartao))
</script>

<template>
  <q-card flat bordered class="cartao-tarefa column">
    <q-card-section class="q-pb-xs">
      <div class="row items-center no-wrap q-gutter-xs q-mb-xs">
        <q-chip
          dense
          square
          size="sm"
          text-color="white"
          class="q-ml-none"
          :style="{ backgroundColor: cartao.empresa.cor }"
          :label="cartao.empresa.nome"
        />
        <q-space />
        <q-badge v-if="cartao.prioridade !== null" outline color="primary" :label="`P${cartao.prioridade}`">
          <q-tooltip>Prioridade {{ cartao.prioridade }}</q-tooltip>
        </q-badge>
        <q-icon v-if="cartao.bloqueada" name="block" color="negative" size="18px">
          <q-tooltip>Bloqueada</q-tooltip>
        </q-icon>
      </div>

      <div class="titulo text-body2 text-weight-medium">{{ cartao.titulo }}</div>
      <div v-if="cartao.projetos" class="text-caption text-grey-7 ellipsis">{{ cartao.projetos }}</div>
    </q-card-section>

    <q-space />

    <q-card-section class="row items-center q-pt-xs q-gutter-x-sm text-caption">
      <span v-if="prazos.pendente" class="text-warning text-weight-medium">
        <q-icon name="schedule" size="16px" /> Definir novo prazo
      </span>
      <span v-else>
        <q-icon name="event" size="16px" class="text-grey-7" /> {{ prazos.interno }}
      </span>
      <span v-if="prazos.asana" class="text-grey-7">
        (Asana: {{ prazos.asana }})
      </span>

      <q-space />

      <span v-if="cartao.quantidadeRetrabalhos > 0" class="text-warning">
        <q-icon name="replay" size="16px" /> {{ cartao.quantidadeRetrabalhos }}
        <q-tooltip>{{ cartao.quantidadeRetrabalhos }} {{ cartao.quantidadeRetrabalhos === 1 ? 'retrabalho' : 'retrabalhos' }}</q-tooltip>
      </span>
      <span v-if="cartao.comentariosNaoLidos > 0" class="text-secondary">
        <q-icon name="mark_chat_unread" size="16px" /> {{ cartao.comentariosNaoLidos }}
        <q-tooltip>
          {{ cartao.comentariosNaoLidos }} {{ cartao.comentariosNaoLidos === 1 ? 'comentário não lido' : 'comentários não lidos' }}
        </q-tooltip>
      </span>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.cartao-tarefa {
  height: 100%;
  border-radius: 8px;
}

.titulo {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
