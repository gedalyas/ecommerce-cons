export type ReadSlots = { tryAcquire: () => boolean; release: () => void };

export function readSlots(limit: number): ReadSlots {
  let busy = 0;
  return {
    tryAcquire: () => {
      if (busy >= limit) return false;
      busy += 1;
      return true;
    },
    release: () => {
      busy = Math.max(0, busy - 1);
    },
  };
}
