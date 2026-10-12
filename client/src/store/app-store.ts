import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/data/types'

export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: string
}

export type Theme = 'light' | 'dark'

export interface AccountOverride {
  name?: string
  email?: string
  notifyEmail?: boolean
  notifyPush?: boolean
}

interface AppState {
  personaId: Role | null
  setPersona: (id: Role | null) => void
  aiOpen: boolean
  setAiOpen: (open: boolean) => void
  aiWidth: number
  setAiWidth: (w: number) => void
  aiMessages: AiMessage[]
  pushAiMessage: (m: AiMessage) => void
  clearAi: () => void
  reducedMotion: boolean
  setReducedMotion: (v: boolean) => void

  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void

  accountOverrides: Partial<Record<Role, AccountOverride>>
  updateAccount: (role: Role, patch: AccountOverride) => void

  notifReadIds: string[]
  notifDeletedIds: string[]
  markNotifRead: (id: string) => void
  markAllNotifRead: (ids: string[]) => void
  deleteNotif: (id: string) => void

  resolvedAnomalyIds: string[]
  resolveAnomaly: (id: string) => void
  reopenAnomaly: (id: string) => void

  disabledRoutes: Partial<Record<Role, string[]>>
  toggleRouteAccess: (role: Role, path: string) => void

  customUsers: { id: string; name: string; role: Role; initials: string }[]
  addCustomUser: (u: { name: string; role: Role }) => void
  removeCustomUser: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      personaId: null,
      setPersona: (id) => set({ personaId: id }),
      aiOpen: false,
      setAiOpen: (open) => set({ aiOpen: open }),
      aiWidth: 440,
      setAiWidth: (w) => set({ aiWidth: Math.min(680, Math.max(380, w)) }),
      aiMessages: [],
      pushAiMessage: (m) => set((s) => ({ aiMessages: [...s.aiMessages, m].slice(-60) })),
      clearAi: () => set({ aiMessages: [] }),
      reducedMotion: false,
      setReducedMotion: (v) => set({ reducedMotion: v }),

      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      accountOverrides: {},
      updateAccount: (role, patch) =>
        set((s) => ({ accountOverrides: { ...s.accountOverrides, [role]: { ...s.accountOverrides[role], ...patch } } })),

      notifReadIds: [],
      notifDeletedIds: [],
      markNotifRead: (id) => set((s) => ({ notifReadIds: s.notifReadIds.includes(id) ? s.notifReadIds : [...s.notifReadIds, id] })),
      markAllNotifRead: (ids) => set((s) => ({ notifReadIds: Array.from(new Set([...s.notifReadIds, ...ids])) })),
      deleteNotif: (id) => set((s) => ({ notifDeletedIds: s.notifDeletedIds.includes(id) ? s.notifDeletedIds : [...s.notifDeletedIds, id] })),

      resolvedAnomalyIds: [],
      resolveAnomaly: (id) => set((s) => ({ resolvedAnomalyIds: s.resolvedAnomalyIds.includes(id) ? s.resolvedAnomalyIds : [...s.resolvedAnomalyIds, id] })),
      reopenAnomaly: (id) => set((s) => ({ resolvedAnomalyIds: s.resolvedAnomalyIds.filter((x) => x !== id) })),

      disabledRoutes: {},
      toggleRouteAccess: (role, path) =>
        set((s) => {
          const current = s.disabledRoutes[role] ?? []
          const next = current.includes(path) ? current.filter((p) => p !== path) : [...current, path]
          return { disabledRoutes: { ...s.disabledRoutes, [role]: next } }
        }),

      customUsers: [],
      addCustomUser: (u) =>
        set((s) => ({
          customUsers: [
            ...s.customUsers,
            { id: `custom-${Date.now()}`, name: u.name, role: u.role, initials: u.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() },
          ],
        })),
      removeCustomUser: (id) => set((s) => ({ customUsers: s.customUsers.filter((u) => u.id !== id) })),
    }),
    { name: 'habanera-mvp' },
  ),
)
