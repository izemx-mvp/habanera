// Les données générées (data/generate.ts) sont mutées en mémoire par data/actions.ts.
// Ce compteur force les écrans qui l'utilisent à se re-rendre après chaque action.
import { create } from 'zustand'

export const useDataVersion = create<{ v: number; bump: () => void }>((set) => ({
  v: 0,
  bump: () => set((s) => ({ v: s.v + 1 })),
}))
