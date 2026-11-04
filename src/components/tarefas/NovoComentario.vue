<script setup lang="ts">
import { type QInput, useQuasar } from 'quasar'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { MaximoDeArquivos, nomeDoPrint, tamanhoLegivel } from '@/api/comentarios'
import { useNovoComentarioStore } from '@/stores/novoComentario'

const props = defineProps<{
  /** Tarefa do detalhe */
  identifier: string
  /** Tarefas arquivadas não recebem comentários */
  arquivada: boolean
}>()

const emit = defineEmits<{
  /** O comentário foi publicado no Asana */
  enviado: []
}>()

const quasar = useQuasar()
const rascunho = useNovoComentarioStore()

const raiz = ref<HTMLElement | null>(null)
const campo = ref<QInput | null>(null)
const seletorDeArquivos = ref<HTMLInputElement | null>(null)
const arrastando = ref(false)

watch(() => props.identifier, (novo) => void rascunho.abrir(novo), { immediate: true })

const podeEnviar = computed(
  () => !props.arquivada && !rascunho.enviando && (rascunho.texto.trim().length > 0 || rascunho.arquivos.length > 0),
)

const opcoesDeMencao = computed(() =>
  rascunho.participantes.map((participante) => ({
    value: participante.gid,
    label: participante.nome,
    caption: participante.sugerido ? 'Sugerido: reabriu ou comentou por último' : undefined,
  })),
)

// Miniaturas das imagens; as URLs são revogadas quando o arquivo sai da caixa ou o componente é desmontado.
const miniaturas = new Map<File, string>()

function miniatura(arquivo: File): string | null {
  if (!arquivo.type.startsWith('image/')) {
    return null
  }

  let url = miniaturas.get(arquivo)
  if (url === undefined) {
    url = URL.createObjectURL(arquivo)
    miniaturas.set(arquivo, url)
  }

  return url
}

watch(
  () => rascunho.arquivos,
  (atuais) => {
    for (const [arquivo, url] of miniaturas) {
      if (!atuais.includes(arquivo)) {
        URL.revokeObjectURL(url)
        miniaturas.delete(arquivo)
      }
    }
  },
)

onBeforeUnmount(() => {
  for (const url of miniaturas.values()) {
    URL.revokeObjectURL(url)
  }
  miniaturas.clear()
})

// "Enviar dúvidas ao Asana" e outros pedidos de foco: rola até a caixa e foca o texto.
watch(
  () => rascunho.pedidoDeFoco,
  () => {
    raiz.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    campo.value?.focus()
  },
)

/** Ctrl+V: imagens da área de transferência viram prints; o texto colado segue para o campo normalmente. */
function aoColar(evento: ClipboardEvent): void {
  const imagens = [...(evento.clipboardData?.files ?? [])].filter((arquivo) => arquivo.type.startsWith('image/'))
  if (imagens.length === 0 || props.arquivada) {
    return
  }

  evento.preventDefault()
  const agora = new Date()
  const prints = imagens.map((imagem, indice) => {
    const nome = indice === 0 ? nomeDoPrint(agora) : nomeDoPrint(agora).replace('.png', `-${indice + 1}.png`)
    return new File([imagem], nome, { type: imagem.type || 'image/png' })
  })
  rascunho.adicionarArquivos(prints)
}

function aoSoltar(evento: DragEvent): void {
  arrastando.value = false
  if (props.arquivada) {
    return
  }

  rascunho.adicionarArquivos([...(evento.dataTransfer?.files ?? [])])
}

function aoEscolherArquivos(evento: Event): void {
  const entrada = evento.target as HTMLInputElement
  rascunho.adicionarArquivos([...(entrada.files ?? [])])
  entrada.value = ''
}

function aoTeclar(evento: KeyboardEvent): void {
  if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
    evento.preventDefault()
    void enviar()
  }
}

async function enviar(): Promise<void> {
  if (!podeEnviar.value) {
    return
  }

  if (await rascunho.enviar()) {
    quasar.notify({ type: 'positive', message: 'Comentário enviado ao Asana.', position: 'top' })
    emit('enviado')
  }
}
</script>

<template>
  <div
    ref="raiz"
    class="novo-comentario q-pa-sm rounded-borders"
    :class="{ 'novo-comentario--arrastando': arrastando }"
    @dragover.prevent="arrastando = !arquivada"
    @dragleave.prevent="arrastando = false"
    @drop.prevent="aoSoltar"
  >
    <div v-if="arquivada" class="text-body2 text-grey-7 row items-center no-wrap q-gutter-sm">
      <q-icon name="block" />
      <span>Tarefas arquivadas não recebem comentários.</span>
    </div>

    <template v-else>
      <q-select
        v-model="rascunho.mencoes"
        :options="opcoesDeMencao"
        :loading="rascunho.carregandoParticipantes"
        :disable="rascunho.enviando"
        multiple
        use-chips
        emit-value
        map-options
        dense
        outlined
        options-dense
        label="Mencionar"
        class="q-mb-sm"
      >
        <template #prepend><q-icon name="alternate_email" size="18px" /></template>
        <template #option="{ itemProps, opt, selected, toggleOption }">
          <q-item v-bind="itemProps">
            <q-item-section side>
              <q-checkbox :model-value="selected" dense @update:model-value="toggleOption(opt)" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ opt.label }}</q-item-label>
              <q-item-label v-if="opt.caption" caption>{{ opt.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item><q-item-section class="text-grey-7">Nenhum participante para mencionar.</q-item-section></q-item>
        </template>
      </q-select>
      <div v-if="rascunho.erroDosParticipantes" class="text-caption text-negative row items-center q-mb-sm">
        <span class="col">{{ rascunho.erroDosParticipantes.message }}</span>
        <q-btn flat dense no-caps size="sm" color="primary" label="Tentar novamente" @click="rascunho.carregarParticipantes()" />
      </div>

      <q-input
        ref="campo"
        v-model="rascunho.texto"
        type="textarea"
        autogrow
        outlined
        dense
        :disable="rascunho.enviando"
        placeholder="Escreva um comentário para o Asana. Cole um print com Ctrl+V ou arraste arquivos para cá."
        input-style="min-height: 64px"
        aria-label="Novo comentário"
        @paste="aoColar"
        @keydown="aoTeclar"
      />

      <q-list v-if="rascunho.arquivos.length > 0" dense class="q-mt-sm">
        <q-item v-for="(arquivo, indice) in rascunho.arquivos" :key="`${arquivo.name}-${indice}`" class="q-px-none">
          <q-item-section avatar>
            <q-img v-if="miniatura(arquivo)" :src="miniatura(arquivo)!" width="40px" height="40px" fit="cover" class="rounded-borders" />
            <q-icon v-else name="description" color="grey-7" size="28px" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="ellipsis">{{ arquivo.name }}</q-item-label>
            <q-item-label caption>{{ tamanhoLegivel(arquivo.size) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense size="sm" icon="close" :aria-label="`Remover ${arquivo.name}`" :disable="rascunho.enviando" @click="rascunho.removerArquivo(indice)" />
          </q-item-section>
        </q-item>
      </q-list>

      <q-banner v-if="rascunho.erroDoEnvio" dense rounded class="bg-red-1 text-grey-10 q-mt-sm" role="alert">
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ rascunho.erroDoEnvio }}
      </q-banner>

      <div class="row items-center q-mt-sm q-gutter-sm">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="attach_file"
          label="Anexar"
          :disable="rascunho.enviando || rascunho.arquivos.length >= MaximoDeArquivos"
          @click="seletorDeArquivos?.click()"
        />
        <input ref="seletorDeArquivos" type="file" multiple class="hidden" aria-hidden="true" @change="aoEscolherArquivos" />
        <div class="col text-caption text-grey-6">Ctrl+Enter envia</div>
        <q-btn unelevated no-caps color="primary" icon="send" label="Enviar ao Asana" :disable="!podeEnviar" :loading="rascunho.enviando" @click="enviar" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.novo-comentario {
  border: 1px dashed transparent;
  transition: border-color 0.15s, background-color 0.15s;
}

.novo-comentario--arrastando {
  border-color: var(--q-primary);
  background-color: rgba(25, 118, 210, 0.06);
}
</style>
