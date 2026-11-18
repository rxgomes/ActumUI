<script setup lang="ts">
import type { QInput } from 'quasar'
import { computed, nextTick, ref, toRef, watch } from 'vue'

import type { FontesDaAnalise, ModoDaAnalise } from '@/api/analises'
import { type Anexo, ehExterno } from '@/api/anexos'
import { tamanhoLegivel } from '@/api/comentarios'
import { formatarDataHora } from '@/api/datas'
import { useAnexosDaTarefa } from '@/composables/useAnexosDaTarefa'
import { useAnaliseStore } from '@/stores/analise'

const props = defineProps<{
  /** Tarefa analisada */
  identifier: string
  /** Fontes com que o diálogo abre: as da versão atual na reanálise, ou o padrão na primeira análise */
  inicial: FontesDaAnalise
  /** Número da versão que a análise vai gerar */
  proximaVersao: number
}>()

const emit = defineEmits<{
  /** A análise terminou e a nova versão já está na store */
  concluido: []
}>()

const aberto = defineModel<boolean>('aberto', { required: true })

/** Campos das fontes que a API valida (chaves de `errors`, em camelCase). */
const Campos = ['fontes', 'anexos', 'prompt'] as const

type Campo = (typeof Campos)[number]

const analise = useAnaliseStore()
const { anexos, carregando, erro: erroDosAnexos, carregar: carregarAnexos } = useAnexosDaTarefa(toRef(props, 'identifier'))

const modo = ref<ModoDaAnalise>('tarefa')
const descricao = ref(true)
const comentarios = ref(true)
const usarAnexos = ref(false)
const escolhidos = ref<string[]>([])
const prompt = ref('')
const referenciados = ref<{ gid: string; nome: string }[]>([])
const removidos = ref<string[]>([])
const errosPorCampo = ref<Partial<Record<Campo, string>>>({})
const enviando = ref(false)

/** Gids da versão anterior ainda não conferidos com a lista do Asana (a lista carrega depois de abrir). */
let pendentesDaVersao: string[] = []

const legiveis = computed(() => anexos.value.filter((anexo) => anexo.legivelNaAnalise))
const semAnexos = computed(() => !carregando.value && !erroDosAnexos.value && anexos.value.length === 0)
const analisando = computed(() => enviando.value || analise.analisando)

function aoAbrir(): void {
  modo.value = props.inicial.modo ?? 'tarefa'
  descricao.value = props.inicial.descricao ?? true
  comentarios.value = props.inicial.comentarios ?? modo.value === 'tarefa'
  pendentesDaVersao = [...(props.inicial.anexos ?? [])]
  usarAnexos.value = modo.value === 'tarefa' && pendentesDaVersao.length > 0
  escolhidos.value = []
  prompt.value = props.inicial.prompt ?? ''
  referenciados.value = []
  removidos.value = []
  errosPorCampo.value = {}
  fecharMenu()
  void carregarAnexos().then(conferirAnexosDaVersao)
}

/** Confere os anexos da versão anterior com os que estão no Asana: os que saíram ficam fora, com aviso. */
function conferirAnexosDaVersao(): void {
  if (pendentesDaVersao.length === 0 || erroDosAnexos.value) {
    return
  }

  const porGid = new Map(anexos.value.map((anexo) => [anexo.gid, anexo]))
  const presentes = pendentesDaVersao.map((gid) => porGid.get(gid)).filter((anexo): anexo is Anexo => anexo?.legivelNaAnalise === true)
  const nomesDaVersao = new Map(analise.atual?.fontes?.anexos.map((anexo) => [anexo.gid, anexo.nome]) ?? [])
  removidos.value = pendentesDaVersao.filter((gid) => !porGid.get(gid)?.legivelNaAnalise).map((gid) => nomesDaVersao.get(gid) ?? gid)

  if (modo.value === 'tarefa') {
    escolhidos.value = presentes.map((anexo) => anexo.gid)
    usarAnexos.value = escolhidos.value.length > 0
  } else {
    referenciados.value = presentes.filter((anexo) => prompt.value.includes(`@${anexo.nome}`)).map(({ gid, nome }) => ({ gid, nome }))
  }

  pendentesDaVersao = []
}

/** O que falta escolher para poder analisar; `null` quando está tudo certo. */
const pendencia = computed<string | null>(() => {
  if (modo.value === 'prompt') {
    return prompt.value.trim() === '' ? 'Escreva o prompt da análise.' : null
  }

  if (!descricao.value && !comentarios.value && !usarAnexos.value) {
    return 'Marque ao menos uma fonte.'
  }

  if (usarAnexos.value && escolhidos.value.length === 0) {
    return 'Escolha ao menos um anexo.'
  }

  return null
})

function fontes(): FontesDaAnalise {
  if (modo.value === 'prompt') {
    return {
      modo: 'prompt',
      descricao: false,
      comentarios: comentarios.value,
      anexos: referenciados.value.map((anexo) => anexo.gid),
      prompt: prompt.value.trim(),
    }
  }

  return {
    modo: 'tarefa',
    descricao: descricao.value,
    comentarios: comentarios.value,
    anexos: usarAnexos.value ? [...escolhidos.value] : [],
    prompt: null,
  }
}

async function analisar(): Promise<void> {
  if (pendencia.value || analisando.value) {
    return
  }

  enviando.value = true
  errosPorCampo.value = {}
  try {
    if (await analise.analisar(fontes())) {
      aberto.value = false
      emit('concluido')
      return
    }

    // Erros das fontes ficam no diálogo, junto dos campos; os demais vão para o destaque da seção.
    const porCampo = analise.erroDaAnalise?.errosPorCampo ?? {}
    const doDialogo = Campos.filter((campo) => porCampo[campo]?.length)
    if (doDialogo.length > 0) {
      errosPorCampo.value = Object.fromEntries(doDialogo.map((campo) => [campo, porCampo[campo]!.join(' ')]))
      analise.dispensarErro()
    } else if (analise.erroDaAnalise) {
      aberto.value = false
    }
  } finally {
    enviando.value = false
  }
}

function detalhes(anexo: Anexo): string {
  const partes = [formatarDataHora(anexo.criadoEm)]
  if (anexo.tamanho !== null) {
    partes.push(tamanhoLegivel(anexo.tamanho))
  }
  if (ehExterno(anexo)) {
    partes.push(anexo.hospedagem)
  }
  return partes.join(' · ')
}

function alternar(anexo: Anexo, marcado: boolean): void {
  escolhidos.value = marcado ? [...escolhidos.value, anexo.gid] : escolhidos.value.filter((gid) => gid !== anexo.gid)
}

// Prompt: digitar @ abre a lista dos anexos legíveis; o escolhido entra como @nome e vai junto com o prompt.
const campoDoPrompt = ref<QInput | null>(null)
const menuAberto = ref(false)
const termo = ref('')
const destacado = ref(0)
let inicioDoTermo = -1

const sugestoes = computed(() => {
  const busca = termo.value.toLocaleLowerCase('pt-BR')
  return legiveis.value.filter((anexo) => anexo.nome.toLocaleLowerCase('pt-BR').includes(busca))
})

function textarea(): HTMLTextAreaElement | null {
  return (campoDoPrompt.value?.getNativeElement() as HTMLTextAreaElement | undefined) ?? null
}

/** Procura um `@` antes do cursor, sem espaço no meio, e abre a lista com o que foi digitado depois dele. */
function acompanharArroba(): void {
  const elemento = textarea()
  if (!elemento) {
    return
  }

  const antes = prompt.value.slice(0, elemento.selectionStart ?? prompt.value.length)
  const encontrado = /(^|\s)@([^\s@]*)$/.exec(antes)
  if (!encontrado) {
    fecharMenu()
    return
  }

  inicioDoTermo = antes.length - encontrado[2]!.length - 1
  termo.value = encontrado[2]!
  destacado.value = 0
  menuAberto.value = true
}

function fecharMenu(): void {
  menuAberto.value = false
  termo.value = ''
  inicioDoTermo = -1
}

function escolherNoMenu(anexo: Anexo): void {
  if (inicioDoTermo < 0) {
    return
  }

  const fimDoTermo = inicioDoTermo + 1 + termo.value.length
  const inserido = `@${anexo.nome} `
  prompt.value = prompt.value.slice(0, inicioDoTermo) + inserido + prompt.value.slice(fimDoTermo)
  if (!referenciados.value.some((referencia) => referencia.gid === anexo.gid)) {
    referenciados.value = [...referenciados.value, { gid: anexo.gid, nome: anexo.nome }]
  }

  const cursor = inicioDoTermo + inserido.length
  fecharMenu()
  void nextTick(() => {
    const elemento = textarea()
    elemento?.focus()
    elemento?.setSelectionRange(cursor, cursor)
  })
}

function aoTeclarNoPrompt(evento: KeyboardEvent): void {
  if (!menuAberto.value || sugestoes.value.length === 0) {
    if (evento.key === 'Escape' && menuAberto.value) {
      evento.preventDefault()
      fecharMenu()
    }
    return
  }

  if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
    evento.preventDefault()
    const passo = evento.key === 'ArrowDown' ? 1 : -1
    destacado.value = (destacado.value + passo + sugestoes.value.length) % sugestoes.value.length
  } else if (evento.key === 'Enter' || evento.key === 'Tab') {
    evento.preventDefault()
    escolherNoMenu(sugestoes.value[destacado.value]!)
  } else if (evento.key === 'Escape') {
    evento.preventDefault()
    fecharMenu()
  }
}

// Apagar o @nome do texto tira o arquivo dos referenciados.
watch(prompt, (texto) => {
  referenciados.value = referenciados.value.filter((referencia) => texto.includes(`@${referencia.nome}`))
})

watch(modo, () => {
  errosPorCampo.value = {}
  fecharMenu()
})
</script>

<template>
  <q-dialog v-model="aberto" persistent @before-show="aoAbrir">
    <q-card style="width: 560px; max-width: 95vw">
      <q-card-section class="text-h6 q-pb-sm">Fontes da análise</q-card-section>

      <q-card-section class="q-pt-none column q-gutter-md">
        <div class="text-caption text-grey-8">
          A análise é uma chamada paga à Claude API, gera a versão {{ proximaVersao }} e envia à Anthropic o título, os
          projetos e as fontes escolhidas, inclusive os anexos. Com anexos, pode levar alguns minutos.
        </div>

        <q-btn-toggle
          v-model="modo"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-2"
          text-color="grey-9"
          :disable="analisando"
          :options="[
            { label: 'Da tarefa', value: 'tarefa', icon: 'assignment' },
            { label: 'Prompt', value: 'prompt', icon: 'edit_note' },
          ]"
        />

        <q-banner v-if="removidos.length > 0" dense rounded class="bg-orange-1 text-grey-10">
          <template #avatar><q-icon name="warning" color="warning" /></template>
          Fora da escolha por não estar mais no Asana (ou não poder ser lido pela análise): {{ removidos.join(', ') }}.
        </q-banner>

        <!-- Modo "Da tarefa" -->
        <div v-if="modo === 'tarefa'" class="column q-gutter-xs">
          <q-checkbox v-model="descricao" label="Descrição" :disable="analisando" />
          <q-checkbox v-model="comentarios" label="Comentários (com o histórico de retrabalhos)" :disable="analisando" />
          <q-checkbox v-model="usarAnexos" label="Anexos" :disable="analisando || semAnexos">
            <q-tooltip v-if="semAnexos">A tarefa não tem anexos no Asana.</q-tooltip>
          </q-checkbox>
          <div v-if="semAnexos" class="text-caption text-grey-7 q-ml-lg">A tarefa não tem anexos no Asana.</div>

          <div v-if="usarAnexos || carregando || erroDosAnexos" class="q-ml-lg">
            <div v-if="carregando && anexos.length === 0">
              <q-skeleton type="text" width="70%" />
              <q-skeleton type="text" width="50%" />
            </div>
            <div v-else-if="erroDosAnexos" class="row items-center q-gutter-sm">
              <div class="col text-caption text-negative">{{ erroDosAnexos }}</div>
              <q-btn flat dense no-caps color="primary" icon="refresh" label="Tentar novamente" @click="carregarAnexos" />
            </div>
            <q-list v-else-if="usarAnexos" dense bordered separator class="rounded-borders lista-de-anexos">
              <q-item v-for="anexo in anexos" :key="anexo.gid" tag="label" :disable="!anexo.legivelNaAnalise || analisando">
                <q-item-section side>
                  <q-checkbox
                    :model-value="escolhidos.includes(anexo.gid)"
                    :disable="!anexo.legivelNaAnalise || analisando"
                    dense
                    @update:model-value="(marcado: boolean) => alternar(anexo, marcado)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="nome-do-anexo">{{ anexo.nome }}</q-item-label>
                  <q-item-label caption>{{ detalhes(anexo) }}</q-item-label>
                  <q-item-label v-if="anexo.motivo" caption class="text-warning">{{ anexo.motivo }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-if="errosPorCampo.anexos" class="text-negative text-caption q-mt-xs">{{ errosPorCampo.anexos }}</div>
          </div>
        </div>

        <!-- Modo "Prompt" -->
        <div v-else class="column q-gutter-sm">
          <q-input
            ref="campoDoPrompt"
            v-model="prompt"
            type="textarea"
            outlined
            autogrow
            autofocus
            label="Prompt"
            input-style="min-height: 120px; max-height: 320px"
            hint="Escreva o que a IA deve analisar. Digite @ para citar um anexo (modelo, instrução, referência)."
            :error="Boolean(errosPorCampo.prompt)"
            :error-message="errosPorCampo.prompt"
            :disable="analisando"
            @update:model-value="() => nextTick(acompanharArroba)"
            @click="acompanharArroba"
            @keydown="aoTeclarNoPrompt"
            @blur="fecharMenu"
          >
            <q-menu v-model="menuAberto" no-parent-event no-focus no-refocus fit anchor="bottom left" self="top left">
              <q-list dense style="min-width: 260px">
                <q-item v-if="carregando && anexos.length === 0">
                  <q-item-section class="text-grey-7">Carregando anexos…</q-item-section>
                </q-item>
                <q-item v-else-if="erroDosAnexos">
                  <q-item-section class="text-negative">{{ erroDosAnexos }}</q-item-section>
                </q-item>
                <q-item v-else-if="anexos.length === 0">
                  <q-item-section class="text-grey-7">A tarefa não tem anexos no Asana.</q-item-section>
                </q-item>
                <q-item v-else-if="sugestoes.length === 0">
                  <q-item-section class="text-grey-7">Nenhum anexo legível com esse nome.</q-item-section>
                </q-item>
                <q-item
                  v-for="(anexo, indice) in sugestoes"
                  :key="anexo.gid"
                  clickable
                  :active="indice === destacado"
                  active-class="bg-blue-1"
                  @mousedown.prevent
                  @click="escolherNoMenu(anexo)"
                >
                  <q-item-section avatar><q-icon name="attach_file" size="18px" /></q-item-section>
                  <q-item-section>
                    <q-item-label class="nome-do-anexo">{{ anexo.nome }}</q-item-label>
                    <q-item-label caption>{{ detalhes(anexo) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-input>

          <div>
            <div class="text-caption text-grey-8">Arquivos referenciados</div>
            <div v-if="referenciados.length === 0" class="text-caption text-grey-7">Nenhum. Digite @ no prompt para citar um anexo.</div>
            <div v-else class="row q-gutter-xs q-mt-none">
              <q-chip v-for="referencia in referenciados" :key="referencia.gid" dense icon="attach_file" color="grey-2">
                {{ referencia.nome }}
              </q-chip>
            </div>
            <div v-if="errosPorCampo.anexos" class="text-negative text-caption">{{ errosPorCampo.anexos }}</div>
          </div>

          <q-checkbox v-model="comentarios" label="Incluir os comentários (com o histórico de retrabalhos)" :disable="analisando" />
        </div>

        <q-banner v-if="errosPorCampo.fontes" dense rounded class="bg-red-1 text-negative">{{ errosPorCampo.fontes }}</q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <div v-if="pendencia" class="text-caption text-grey-7 q-mr-sm">{{ pendencia }}</div>
        <q-btn v-close-popup flat no-caps label="Cancelar" :disable="analisando" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="auto_awesome"
          label="Analisar"
          :loading="analisando"
          :disable="Boolean(pendencia)"
          @click="analisar"
        >
          <q-tooltip v-if="pendencia">{{ pendencia }}</q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.lista-de-anexos {
  max-height: 260px;
  overflow-y: auto;
}

.nome-do-anexo {
  word-break: break-all;
}
</style>
