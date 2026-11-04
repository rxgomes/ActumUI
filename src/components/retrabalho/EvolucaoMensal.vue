<script setup lang="ts">
import { computed, ref } from 'vue'

import type { MesDeRetrabalho } from '@/api/retrabalhos'

import {
  type AreaDoGrafico,
  barrasDoGrafico,
  caminhoComTopoArredondado,
  escalaDoEixo,
  mesesComRotulo,
  nomeDoMes,
  type SerieDaEmpresa,
  textoDoMes,
} from './grafico'

const props = defineProps<{
  /** Retrabalhos por mês e empresa, com todos os meses do período */
  evolucao: MesDeRetrabalho[]
  /** Empresas na ordem fixa de empilhamento, cada uma com a sua cor */
  empresas: SerieDaEmpresa[]
}>()

const Altura = 220
const Margem = { esquerda: 32, direita: 8, topo: 18, base: 24 }

const visao = ref<'grafico' | 'tabela'>('grafico')
const largura = ref(600)
const mesAtivo = ref<number | null>(null)

const area = computed<AreaDoGrafico>(() => ({
  esquerda: Margem.esquerda,
  topo: Margem.topo,
  largura: Math.max(0, largura.value - Margem.esquerda - Margem.direita),
  altura: Altura - Margem.topo - Margem.base,
}))

const totais = computed(() => props.evolucao.map((mes) => mes.porEmpresa.reduce((soma, item) => soma + item.quantidade, 0)))
const escala = computed(() => escalaDoEixo(Math.max(0, ...totais.value)))
const barras = computed(() => barrasDoGrafico(props.evolucao, props.empresas, area.value, escala.value.teto))
const comRotulo = computed(() => mesesComRotulo(props.evolucao.length))
const base = computed(() => area.value.topo + area.value.altura)

function yDoValor(valor: number): number {
  return base.value - (valor / escala.value.teto) * area.value.altura
}

const resumo = computed(() => `Retrabalhos por mês, de ${nomeDoMes(props.evolucao[0]?.mes ?? '', false)} a ${nomeDoMes(props.evolucao.at(-1)?.mes ?? '', false)}, por empresa.`)

/** Dica do mês ativo (hover ou foco): mês, cada empresa e o total. */
const dica = computed(() => {
  if (mesAtivo.value === null) {
    return null
  }

  const mes = props.evolucao[mesAtivo.value]
  const barra = barras.value[mesAtivo.value]
  if (!mes || !barra) {
    return null
  }

  const linhas = props.empresas.map((empresa) => ({
    ...empresa,
    quantidade: mes.porEmpresa.find((item) => item.identifier === empresa.identifier)?.quantidade ?? 0,
  }))
  // A dica fica do lado oposto à metade em que está o mês, para não sair do gráfico.
  const naDireita = barra.centro < largura.value / 2

  return {
    titulo: nomeDoMes(mes.mes, false),
    linhas,
    total: totais.value[mesAtivo.value] ?? 0,
    estilo: naDireita ? { left: `${barra.centro + 16}px` } : { right: `${largura.value - barra.centro + 16}px` },
  }
})

function aoRedimensionar(tamanho: { width: number }): void {
  largura.value = tamanho.width
}
</script>

<template>
  <div>
    <div class="row items-center q-mb-sm">
      <div v-if="empresas.length > 1" class="row items-center q-gutter-md col">
        <div v-for="empresa in empresas" :key="empresa.identifier" class="row items-center no-wrap text-caption text-grey-8">
          <span class="legenda-chave q-mr-xs" :style="{ backgroundColor: empresa.cor }" />
          {{ empresa.nome }}
        </div>
      </div>
      <div v-else class="col" />
      <q-btn-toggle
        v-model="visao"
        dense
        no-caps
        unelevated
        toggle-color="primary"
        color="grey-2"
        text-color="grey-9"
        :options="[{ label: 'Gráfico', value: 'grafico' }, { label: 'Tabela', value: 'tabela' }]"
        aria-label="Ver a evolução como gráfico ou tabela"
      />
    </div>

    <div v-show="visao === 'grafico'" class="relative-position">
      <q-resize-observer @resize="aoRedimensionar" />
      <svg :width="largura" :height="Altura" role="img" :aria-label="resumo" class="block">
        <!-- Grade e eixo Y: linhas finas e recessivas -->
        <g>
          <template v-for="marca in escala.marcas" :key="marca">
            <line :x1="area.esquerda" :x2="area.esquerda + area.largura" :y1="yDoValor(marca)" :y2="yDoValor(marca)" stroke="#e0e0e0" stroke-width="1" />
            <text :x="area.esquerda - 6" :y="yDoValor(marca)" text-anchor="end" dominant-baseline="middle" class="texto-eixo">{{ marca }}</text>
          </template>
        </g>

        <g v-for="(barra, indice) in barras" :key="barra.mes">
          <rect
            v-if="mesAtivo === indice"
            :x="barra.faixaX"
            :y="area.topo"
            :width="barra.faixaLargura"
            :height="area.altura"
            fill="#f5f5f5"
          />
          <template v-for="segmento in barra.segmentos" :key="segmento.empresa">
            <path
              v-if="segmento.topo"
              :d="caminhoComTopoArredondado(segmento.x, segmento.y, segmento.largura, segmento.altura)"
              :fill="segmento.cor"
            />
            <rect v-else :x="segmento.x" :y="segmento.y" :width="segmento.largura" :height="segmento.altura" :fill="segmento.cor" />
          </template>
          <text v-if="barra.total > 0" :x="barra.centro" :y="barra.topoY - 5" text-anchor="middle" class="texto-total">{{ barra.total }}</text>
          <text v-if="comRotulo.has(indice)" :x="barra.centro" :y="base + 16" text-anchor="middle" class="texto-eixo">{{ nomeDoMes(barra.mes) }}</text>
          <!-- Alvo do hover e do teclado: a faixa inteira do mês, maior que a barra -->
          <rect
            :x="barra.faixaX"
            :y="area.topo"
            :width="barra.faixaLargura"
            :height="area.altura"
            fill="transparent"
            tabindex="0"
            role="img"
            :aria-label="textoDoMes(evolucao[indice]!, empresas)"
            class="alvo"
            @pointerenter="mesAtivo = indice"
            @pointerleave="mesAtivo = null"
            @focus="mesAtivo = indice"
            @blur="mesAtivo = null"
          />
        </g>

        <line :x1="area.esquerda" :x2="area.esquerda + area.largura" :y1="base" :y2="base" stroke="#bdbdbd" stroke-width="1" />
      </svg>

      <div v-if="dica" class="dica shadow-2 rounded-borders q-pa-sm" :style="dica.estilo" aria-hidden="true">
        <div class="text-caption text-grey-7 q-mb-xs">{{ dica.titulo }}</div>
        <div v-for="linha in dica.linhas" :key="linha.identifier" class="row items-center no-wrap text-body2">
          <span class="dica-chave q-mr-sm" :style="{ backgroundColor: linha.cor }" />
          <span class="text-weight-bold q-mr-xs">{{ linha.quantidade }}</span>
          <span class="text-grey-8">{{ linha.nome }}</span>
        </div>
        <div v-if="dica.linhas.length > 1" class="text-body2 q-mt-xs">
          <span class="text-weight-bold">{{ dica.total }}</span> <span class="text-grey-8">no total</span>
        </div>
      </div>
    </div>

    <q-markup-table v-if="visao === 'tabela'" flat bordered dense separator="cell">
      <thead>
        <tr>
          <th class="text-left">Mês</th>
          <th v-for="empresa in empresas" :key="empresa.identifier" class="text-right">{{ empresa.nome }}</th>
          <th v-if="empresas.length > 1" class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(mes, indice) in evolucao" :key="mes.mes">
          <td>{{ nomeDoMes(mes.mes, false) }}</td>
          <td v-for="empresa in empresas" :key="empresa.identifier" class="text-right">
            {{ mes.porEmpresa.find((item) => item.identifier === empresa.identifier)?.quantidade ?? 0 }}
          </td>
          <td v-if="empresas.length > 1" class="text-right text-weight-medium">{{ totais[indice] }}</td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>

<style scoped>
.legenda-chave {
  display: inline-block;
  width: 14px;
  height: 3px;
  border-radius: 2px;
}

.dica-chave {
  display: inline-block;
  width: 12px;
  height: 3px;
  border-radius: 2px;
}

.texto-eixo {
  font-size: 11px;
  fill: #757575;
}

.texto-total {
  font-size: 12px;
  font-weight: 500;
  fill: #424242;
}

.alvo {
  cursor: default;
  outline: none;
}

.alvo:focus-visible {
  stroke: var(--q-primary);
  stroke-width: 2;
}

.dica {
  position: absolute;
  top: 8px;
  background: #fff;
  min-width: 150px;
  pointer-events: none;
  z-index: 1;
}
</style>
