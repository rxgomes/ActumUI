import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'painel', component: () => import('@/pages/PainelPage.vue') },
        { path: 'tarefas/:identifier', name: 'detalheTarefa', component: () => import('@/pages/TarefaDetalhePage.vue') },
        { path: ':caminho(.*)*', name: 'naoEncontrada', component: () => import('@/pages/NaoEncontradaPage.vue') },
      ],
    },
  ],
})
