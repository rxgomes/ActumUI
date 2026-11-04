<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useConexaoStore } from '@/stores/conexao'

const ComandoDoToken = 'dotnet user-secrets set "Asana:Token" "<seu-token>" --project src/Actum.Api'

const menuAberto = ref(true)
const conexao = useConexaoStore()

/** Texto do aviso do Asana; nulo quando não há o que avisar (verificando ou conexão válida). */
const aviso = computed(() => {
  switch (conexao.situacao) {
    case 'nao_configurado':
      return {
        titulo: 'O token do Asana não está configurado.',
        texto: 'Na pasta da API, execute o comando abaixo e verifique novamente:',
        comando: ComandoDoToken,
      }
    case 'token_invalido':
      return {
        titulo: 'O Asana recusou o token configurado.',
        texto: 'Gere um novo Personal Access Token no Asana, configure-o na pasta da API e verifique novamente:',
        comando: ComandoDoToken,
      }
    case 'erro':
      return {
        titulo: 'Não foi possível verificar a conexão com o Asana.',
        texto: conexao.mensagemDeErro,
        comando: null,
      }
    default:
      return null
  }
})

onMounted(() => {
  void conexao.verificar()
})
</script>

<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Mostrar ou ocultar o menu" @click="menuAberto = !menuAberto" />
        <q-toolbar-title class="text-weight-bold">Actum</q-toolbar-title>
      </q-toolbar>

      <q-banner v-if="aviso" dense class="bg-orange-1 text-grey-10" role="alert">
        <template #avatar>
          <q-icon name="warning" color="warning" />
        </template>
        <div class="text-weight-medium">{{ aviso.titulo }}</div>
        <div>{{ aviso.texto }}</div>
        <code v-if="aviso.comando" class="q-mt-xs block">{{ aviso.comando }}</code>
        <template #action>
          <q-btn flat dense color="primary" label="Verificar novamente" @click="conexao.verificar()" />
        </template>
      </q-banner>
    </q-header>

    <q-drawer v-model="menuAberto" show-if-above bordered :width="240">
      <q-list padding>
        <q-expansion-item default-opened icon="task_alt" label="Tarefas" header-class="text-weight-medium">
          <q-item clickable :to="{ name: 'painel' }" exact active-class="text-primary bg-blue-1 text-weight-medium">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Painel</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item default-opened icon="insights" label="Indicadores" header-class="text-weight-medium">
          <q-item clickable :to="{ name: 'retrabalho' }" exact active-class="text-primary bg-blue-1 text-weight-medium">
            <q-item-section avatar>
              <q-icon name="replay" />
            </q-item-section>
            <q-item-section>Retrabalho</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item default-opened icon="settings" label="Configurações" header-class="text-weight-medium">
          <q-item clickable :to="{ name: 'empresas' }" exact active-class="text-primary bg-blue-1 text-weight-medium">
            <q-item-section avatar>
              <q-icon name="business" />
            </q-item-section>
            <q-item-section>Empresas</q-item-section>
          </q-item>
        </q-expansion-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>
