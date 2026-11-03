<script setup lang="ts">
import { ref } from 'vue'

const menuAberto = ref(true)
</script>

<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="menuAberto = !menuAberto" />
        <q-toolbar-title class="text-weight-bold">Actum</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="menuAberto" show-if-above bordered :width="240">
      <q-list padding>
        <q-expansion-item default-opened icon="task_alt" label="Tarefas" header-class="text-weight-medium">
          <q-item clickable :to="{ name: 'painel' }" exact active-class="text-primary bg-blue-1">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Painel</q-item-section>
          </q-item>
        </q-expansion-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>
