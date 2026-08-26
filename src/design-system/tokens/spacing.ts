/** Escala única: 4, 8, 12, 16, 24, 32, 48. */
export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 } as const;

/**
 * Padrões de layout extraídos do Dashboard — a referência oficial.
 * Nenhuma tela pode redefinir estes valores localmente.
 */
export const layout = {
  /** contêiner de página: largura máxima e paddings por breakpoint */
  page: "mx-auto w-full min-w-0 max-w-5xl px-4 pb-12 sm:px-6 xl:px-8",
  /** distância entre o cabeçalho fixo e o primeiro bloco */
  headerGap: "mt-6",
  /** espaço entre blocos: 24px no mobile, 32px a partir de sm */
  blockStack: "space-y-6 sm:space-y-8",
  /** espaço entre cards de um mesmo grupo */
  groupStack: "space-y-4",
  /** padding interno de card */
  cardPadding: "p-5",
  cardPaddingX: "px-5",
  /** cabeçalho de card */
  cardHeader: "border-b border-border px-5 py-4",
  /** linha de lista dentro de card */
  listRow: "py-4",
} as const;
