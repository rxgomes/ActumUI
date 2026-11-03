<script setup lang="ts">
import { useQuasar } from 'quasar'
import { ref } from 'vue'

import { formatarDataHora } from '@/api/datas'
import { alterarEmpresa, type Empresa } from '@/api/empresas'
import { errosDoDialogo } from '@/components/tarefas/errosDoDialogo'
import { useNotificarErro } from '@/composables/useNotificarErro'

import { PaletaDasEmpresas } from './paleta'

const props = defineProps<{
  /** Empresa exibida na linha */
  empresa: Empresa
}>()

const emit = defineEmits<{
  /** A API confirmou a alteração; traz a empresa atualizada */
  alterada: [empresa: Empresa]
}>()

const quasar = useQuasar()
const notificarErro = useNotificarErro()

const salvandoSincronizacao = ref(false)
const salvandoCor = ref(false)
const popupAberto = ref(false)
const corEscolhida = ref(props.empresa.cor)
const erroDaCor = ref<string | null>(null)

async function alterarSincronizacao(sincronizar: boolean): Promise<void> {
  salvandoSincronizacao.value = true
  try {
    const alterada = await alterarEmpresa(props.empresa.identifier, { sincronizar })
    emit('alterada', alterada)
    quasar.notify({
      type: 'positive',
      position: 'top',
      message: sincronizar
        ? `${alterada.nome} volta a ser sincronizada.`
        : `${alterada.nome} fora da sincronização.`,
    })
  } catch (erro) {
    // O toggle mostra o valor da empresa (prop), que não mudou: a tela continua como estava.
    notificarErro(erro)
  } finally {
    salvandoSincronizacao.value = false
  }
}

function abrirCor(): void {
  corEscolhida.value = props.empresa.cor
  erroDaCor.value = null
}

async function salvarCor(): Promise<void> {
  if (corEscolhida.value.toUpperCase() === props.empresa.cor.toUpperCase()) {
    popupAberto.value = false
    return
  }

  salvandoCor.value = true
  erroDaCor.value = null
  try {
    const alterada = await alterarEmpresa(props.empresa.identifier, { cor: corEscolhida.value })
    emit('alterada', alterada)
    popupAberto.value = false
    quasar.notify({ type: 'positive', position: 'top', message: `Cor de ${alterada.nome} atualizada.` })
  } catch (erro) {
    const erros = errosDoDialogo(erro, ['cor'])
    erroDaCor.value = erros.porCampo.cor ?? erros.geral
  } finally {
    salvandoCor.value = false
  }
}
</script>

<template>
  <q-item class="q-py-md">
    <q-item-section avatar>
      <q-avatar rounded size="40px" :style="{ backgroundColor: empresa.cor }" text-color="white" icon="business" />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-subtitle1 text-weight-medium">{{ empresa.nome }}</q-item-label>
      <q-item-label caption>
        {{ empresa.cargaInicialEm ? `Carga inicial em ${formatarDataHora(empresa.cargaInicialEm)}` : 'Carga inicial na próxima sincronização' }}
      </q-item-label>
      <q-item-label v-if="!empresa.sincronizar" caption class="text-warning">
        Fora da sincronização: não é consultada no Asana.
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="row items-center no-wrap q-gutter-md">
        <q-btn
          outline
          no-caps
          dense
          color="primary"
          icon="palette"
          label="Alterar cor"
          class="q-px-sm"
          :disable="salvandoSincronizacao"
        >
          <q-popup-proxy v-model="popupAberto" @before-show="abrirCor">
            <q-card style="width: 280px">
              <q-card-section class="q-pb-sm">
                <div class="text-caption text-grey-7 q-mb-xs">Prévia no cartão</div>
                <q-chip dense square text-color="white" class="q-ml-none" :style="{ backgroundColor: corEscolhida }" :label="empresa.nome" />
              </q-card-section>
              <q-color
                v-model="corEscolhida"
                format-model="hex"
                default-view="palette"
                no-header-tabs
                :palette="[...PaletaDasEmpresas]"
                flat
              />
              <q-card-section v-if="erroDaCor" class="q-py-sm text-negative text-caption">{{ erroDaCor }}</q-card-section>
              <q-card-actions align="right">
                <q-btn v-close-popup flat no-caps label="Cancelar" :disable="salvandoCor" />
                <q-btn unelevated no-caps color="primary" label="Salvar" :loading="salvandoCor" @click="salvarCor" />
              </q-card-actions>
            </q-card>
          </q-popup-proxy>
        </q-btn>

        <q-toggle
          :model-value="empresa.sincronizar"
          :disable="salvandoSincronizacao || salvandoCor"
          label="Sincronizar"
          left-label
          color="primary"
          @update:model-value="alterarSincronizacao"
        />
        <q-spinner v-if="salvandoSincronizacao" color="primary" size="18px" />
      </div>
    </q-item-section>
  </q-item>
</template>
