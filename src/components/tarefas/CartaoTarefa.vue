<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import type { CartaoTarefa } from '@/api/tarefas'

import { temAndamento } from './acoes'
import { fundoDoCartao } from './grupos'
import { prazosDoCartao } from './prazos'
import { corDoAndamento, rotuloDoAndamento, ultimoComentarioDoCartao } from './textos'

const props = defineProps<{
  /** Tarefa exibida no cartão */
  cartao: CartaoTarefa
  /** Grupo do painel a que a tarefa pertence; define o fundo do cartão (concluídas e atrasadas) */
  grupo: string
}>()

const route = useRoute()

const prazos = computed(() => prazosDoCartao(props.cartao))
const comAndamento = computed(() => temAndamento(props.cartao.status))
const ultimoComentario = computed(() => ultimoComentarioDoCartao(props.cartao))
const fundo = computed(() => fundoDoCartao(props.grupo))

/** Abre o detalhe levando os filtros do Painel, para a volta preservá-los. */
const destino = computed(() => ({ name: 'detalheTarefa', params: { identifier: props.cartao.identifier }, query: route.query }))
</script>

<template>
  <router-link :to="destino" class="link-cartao" :aria-label="`Abrir a tarefa ${cartao.titulo}`">
    <q-card flat bordered class="cartao-tarefa column" :class="fundo ? `cartao-tarefa--${fundo}` : undefined">
      <q-card-section class="q-pb-xs">
        <div class="row items-center no-wrap q-gutter-xs q-mb-xs">
          <!-- Mesmo tamanho do badge de andamento ao lado. -->
          <q-badge text-color="white" class="q-ml-none" :style="{ backgroundColor: cartao.empresa.cor }" :label="cartao.empresa.nome" />
          <q-badge
            v-if="comAndamento"
            :outline="!cartao.emAndamento"
            :color="corDoAndamento(cartao.emAndamento)"
            :label="rotuloDoAndamento(cartao.emAndamento)"
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
        <div v-if="ultimoComentario" class="text-caption text-grey-7 ellipsis">
          <q-icon name="chat" size="14px" /> {{ ultimoComentario }}
          <q-tooltip>Último comentário</q-tooltip>
        </div>
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
  </router-link>
</template>

<style scoped>
.link-cartao {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.cartao-tarefa {
  height: 100%;
  border-radius: 8px;
  transition: box-shadow 0.15s;
}

.cartao-tarefa--concluida {
  background-color: var(--fundo-tarefa-concluida);
}

.cartao-tarefa--atrasada {
  background-color: var(--fundo-tarefa-atrasada);
}

.link-cartao:hover .cartao-tarefa,
.link-cartao:focus-visible .cartao-tarefa {
  box-shadow: 0 2px 8px rgba(13, 43, 78, 0.18);
}

.titulo {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
