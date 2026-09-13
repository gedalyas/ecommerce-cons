/** Single scale: 4, 8, 12, 16, 24, 32, 48. */
export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 } as const;

/**
 * Layout patterns extracted from the Dashboard - the canonical reference.
 * No screen may redefine these values locally.
 */
export const layout = {
  /** page container: max width and per-breakpoint padding */
  page: "mx-auto w-full min-w-0 max-w-5xl px-4 pb-12 sm:px-6 xl:px-8",
  /** gap between the sticky header and the first block */
  headerGap: "mt-6",
  /** gap between blocks: 24px on mobile, 32px from sm on */
  blockStack: "space-y-6 sm:space-y-8",
  /** gap between cards in the same group */
  groupStack: "space-y-4",
  /** card inner padding */
  cardPadding: "p-5",
  cardPaddingX: "px-5",
  /** card header */
  cardHeader: "border-b border-border px-5 py-4",
  /** list row inside a card */
  listRow: "py-4",
} as const;
