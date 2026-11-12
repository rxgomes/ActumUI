<script setup lang="ts">
import { useQuasar } from 'quasar'
import { ref } from 'vue'

import { alterarEmpresa, type DadosDaEmpresa, type Empresa } from '@/api/empresas'
import { errosDoDialogo } from '@/components/tarefas/errosDoDialogo'
import { arquivosDoTexto } from '@/components/tarefas/worktrees'

const props = defineProps<{
  /** Empresa cujas pastas locais são alteradas */
  empresa: Empresa
  /** Desabilita o botão (outra alteração da linha em andamento) */
  desabilitado?: boolean
}>()

const emit = defineEmits<{
  /** A API confirmou a alteração; traz a empresa atualizada */
  alterada: [empresa: Empresa]
}>()

const Campos = ['cloneFront', 'cloneBack', 'pastaWorktrees', 'arquivosFront', 'arquivosBack'] as const

const quasar = useQuasar()

const aberto = ref(false)
const salvando = ref(false)
const cloneFront = ref('')
const cloneBack = ref('')
const pastaWorktrees = ref('')
const arquivosFront = ref('')
const arquivosBack = ref('')
const errosPorCampo = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)

function abrir(): void {
  cloneFront.value = props.empresa.cloneFront ?? ''
  cloneBack.value = props.empresa.cloneBack ?? ''
  pastaWorktrees.value = props.empresa.pastaWorktrees ?? ''
  arquivosFront.value = props.empresa.arquivosFront.join('\n')
  arquivosBack.value = props.empresa.arquivosBack.join('\n')
  errosPorCampo.value = {}
  erroGeral.value = null
}

function caminhoAlterado(digitado: string, atual: string | null): string | undefined {
  const valor = digitado.trim()
  return valor !== (atual ?? '') ? valor : undefined
}

function listaAlterada(digitado: string, atual: readonly string[]): string[] | undefined {
  const lista = arquivosDoTexto(digitado)
  return lista.length === atual.length && lista.every((arquivo, indice) => arquivo === atual[indice]) ? undefined : lista
}

async function salvar(): Promise<void> {
  // Só os campos alterados vão para a API; o resto é mantido.
  const alteracao: DadosDaEmpresa = {
    cloneFront: caminhoAlterado(cloneFront.value, props.empresa.cloneFront),
    cloneBack: caminhoAlterado(cloneBack.value, props.empresa.cloneBack),
    pastaWorktrees: caminhoAlterado(pastaWorktrees.value, props.empresa.pastaWorktrees),
    arquivosFront: listaAlterada(arquivosFront.value, props.empresa.arquivosFront),
    arquivosBack: listaAlterada(arquivosBack.value, props.empresa.arquivosBack),
  }

  if (Object.values(alteracao).every((valor) => valor === undefined)) {
    aberto.value = false
    return
  }

  salvando.value = true
  errosPorCampo.value = {}
  erroGeral.value = null
  try {
    const alterada = await alterarEmpresa(props.empresa.identifier, alteracao)
    emit('alterada', alterada)
    aberto.value = false
    quasar.notify({ type: 'positive', position: 'top', message: `Pastas locais de ${alterada.nome} atualizadas.` })
  } catch (erro) {
    // Regras da API (clone de outro repositório, caminho relativo) vêm no detail e vão para o aviso geral.
    const erros = errosDoDialogo(erro, Campos)
    errosPorCampo.value = erros.porCampo
    erroGeral.value = erros.geral
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <q-btn outline no-caps dense color="primary" icon="folder_open" label="Pastas locais" class="q-px-sm" :disable="desabilitado">
    <q-popup-proxy v-model="aberto" @before-show="abrir">
      <q-card style="width: 460px">
        <q-card-section class="q-pb-sm text-caption text-grey-7">
          Pastas no PC usadas para criar, a cada branch de implementação, um worktree do front e um do back em
          <span style="font-family: monospace">&lt;pasta dos worktrees&gt;\&lt;branch&gt;</span>. Os clones são os
          repositórios já clonados no PC. Deixe um caminho vazio para removê-lo.
        </q-card-section>
        <q-card-section class="q-pt-none column q-gutter-sm">
          <q-input
            v-model="cloneFront"
            outlined
            dense
            label="Clone do front"
            hint="Ex.: E:\src\aureum\erp-web"
            :disable="salvando"
            :error="Boolean(errosPorCampo.cloneFront)"
            :error-message="errosPorCampo.cloneFront"
          />
          <q-input
            v-model="cloneBack"
            outlined
            dense
            label="Clone do back"
            hint="Ex.: E:\src\aureum\erp-api"
            :disable="salvando"
            :error="Boolean(errosPorCampo.cloneBack)"
            :error-message="errosPorCampo.cloneBack"
          />
          <q-input
            v-model="pastaWorktrees"
            outlined
            dense
            label="Pasta dos worktrees"
            hint="Ex.: E:\wt\aureum (caminho curto; criada quando necessário)"
            :disable="salvando"
            :error="Boolean(errosPorCampo.pastaWorktrees)"
            :error-message="errosPorCampo.pastaWorktrees"
          />
          <q-input
            v-model="arquivosFront"
            outlined
            dense
            autogrow
            type="textarea"
            label="Arquivos a copiar do front"
            hint="Um por linha, fora do git. Ex.: .env.development"
            :disable="salvando"
            :error="Boolean(errosPorCampo.arquivosFront)"
            :error-message="errosPorCampo.arquivosFront"
          />
          <q-input
            v-model="arquivosBack"
            outlined
            dense
            autogrow
            type="textarea"
            label="Arquivos a copiar do back"
            hint="Um por linha, fora do git. Ex.: src\Api\appsettings.Development.json"
            :disable="salvando"
            :error="Boolean(errosPorCampo.arquivosBack)"
            :error-message="errosPorCampo.arquivosBack"
          />
        </q-card-section>
        <q-card-section v-if="erroGeral" class="q-py-sm text-negative text-caption">{{ erroGeral }}</q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat no-caps label="Cancelar" :disable="salvando" />
          <q-btn unelevated no-caps color="primary" label="Salvar" :loading="salvando" @click="salvar" />
        </q-card-actions>
      </q-card>
    </q-popup-proxy>
  </q-btn>
</template>
