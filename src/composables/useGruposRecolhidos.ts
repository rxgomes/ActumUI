import { ref } from 'vue'

/** Chave do `localStorage` com os grupos do Painel recolhidos pelo usuário. */
export const ChaveDosGruposRecolhidos = 'actum.painel.gruposRecolhidos'

/** Armazenamento mínimo usado (o `localStorage` do navegador, ou um falso nos testes). */
export interface Armazenamento {
  getItem(chave: string): string | null
  setItem(chave: string, valor: string): void
}

function lerRecolhidos(armazenamento: Armazenamento | null): Set<string> {
  try {
    const texto = armazenamento?.getItem(ChaveDosGruposRecolhidos)
    const lidos: unknown = texto ? JSON.parse(texto) : []
    return new Set(Array.isArray(lidos) ? lidos.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set()
  }
}

/** Estado compartilhado entre o resumo e os grupos do Painel (um só por página). */
let estado: ReturnType<typeof criarEstado> | null = null

function criarEstado(armazenamento: Armazenamento | null) {
  const recolhidos = ref<ReadonlySet<string>>(lerRecolhidos(armazenamento))

  function salvar(): void {
    try {
      armazenamento?.setItem(ChaveDosGruposRecolhidos, JSON.stringify([...recolhidos.value]))
    } catch {
      // Sem armazenamento disponível (modo privado, cota): o estado vale só até recarregar.
    }
  }

  /** Se o grupo está aberto (todos começam abertos). */
  function aberto(grupo: string): boolean {
    return !recolhidos.value.has(grupo)
  }

  /** Abre ou recolhe o grupo e lembra a escolha para a próxima visita. */
  function alternar(grupo: string): void {
    const novos = new Set(recolhidos.value)
    if (novos.has(grupo)) {
      novos.delete(grupo)
    } else {
      novos.add(grupo)
    }
    recolhidos.value = novos
    salvar()
  }

  /** Abre o grupo (ex.: ao clicar no contador do resumo). */
  function abrir(grupo: string): void {
    if (recolhidos.value.has(grupo)) {
      alternar(grupo)
    }
  }

  return { recolhidos, aberto, alternar, abrir }
}

/**
 * Grupos do Painel abertos ou recolhidos, lembrados no navegador. `armazenamento` existe para os testes; por padrão
 * é o `localStorage`.
 */
export function useGruposRecolhidos(armazenamento?: Armazenamento | null) {
  if (armazenamento !== undefined) {
    return criarEstado(armazenamento)
  }

  estado ??= criarEstado(typeof localStorage === 'undefined' ? null : localStorage)
  return estado
}
