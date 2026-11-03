<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface AsanaConexao {
  configurado: boolean
  valido: boolean
  usuario: string | null
}

const apiUrl = import.meta.env.VITE_API_URL

const hoje = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
)

const apiNoAr = ref<boolean | null>(null)
const asana = ref<AsanaConexao | null>(null)

const situacaoDoAsana = computed(() => {
  if (!asana.value) {
    return 'Não verificado'
  }

  if (!asana.value.configurado) {
    return 'Token não configurado'
  }

  return asana.value.valido ? `Conectado como ${asana.value.usuario}` : 'Token inválido'
})

// Verificação provisória da ligação com a API (CORS e endereço); o painel de verdade vem na change do painel.
onMounted(async () => {
  try {
    apiNoAr.value = (await fetch(`${apiUrl}/health/live`)).ok
    const resposta = await fetch(`${apiUrl}/asana/conexao`)
    asana.value = resposta.ok ? ((await resposta.json()) as AsanaConexao) : null
  } catch {
    apiNoAr.value = false
  }
})
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold">Painel</div>
    <div class="text-caption text-grey-7 q-mb-lg first-letter-upper">{{ hoje }}</div>

    <q-card flat bordered class="rounded-borders" style="max-width: 420px">
      <q-card-section class="row items-center no-wrap q-gutter-md">
        <q-avatar rounded color="blue-1" text-color="secondary" icon="hub" />
        <div>
          <div class="text-subtitle1 text-weight-medium">Conexões</div>
          <div class="text-body2">
            API ({{ apiUrl }}):
            <q-badge :color="apiNoAr === null ? 'grey' : apiNoAr ? 'positive' : 'negative'">
              {{ apiNoAr === null ? 'verificando' : apiNoAr ? 'no ar' : 'indisponível' }}
            </q-badge>
          </div>
          <div class="text-body2">Asana: {{ situacaoDoAsana }}</div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
.first-letter-upper::first-letter {
  text-transform: uppercase;
}
</style>
