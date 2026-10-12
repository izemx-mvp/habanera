import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  Truck,
  AlertTriangle,
  Users,
  Menu,
  X,
  ListTree,
  ShieldAlert,
  Building2,
  Bot,
  Sliders,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '@/store/app-store'
import { PERSONAS } from '@/data/referentials'
import { BRAND, IZEMX } from '@/data/brand'
import { AiSidebar } from './AiSidebar'
import { ThemeToggle } from './ThemeToggle'
import { NotificationsBell } from './NotificationsBell'
import { UserMenu } from './UserMenu'
import { AccountSettingsDrawer } from './AccountSettingsDrawer'
import type { Role } from '@/data/types'

const EMPTY_ROUTES: string[] = []

export const NAV_BY_ROLE: Record<Role, { to: string; label: string; icon: any; end?: boolean }[]> = {
  admin: [
    { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/admin/stock-bar', label: 'Stock Bar', icon: Boxes },
    { to: '/admin/z-mouvements', label: 'Z et mouvements', icon: ListTree },
    { to: '/admin/prelevements', label: 'Bons de prélèvement', icon: ClipboardList },
    { to: '/admin/stock-economat', label: 'Stock Economat', icon: Package },
    { to: '/admin/configuration-stock', label: 'Configuration du stock', icon: Sliders },
    { to: '/admin/commandes', label: 'Commandes fournisseurs', icon: Truck },
    { to: '/admin/sorties-hors-vente', label: 'Sorties hors-vente', icon: AlertTriangle },
    { to: '/admin/alertes', label: 'Alertes & anomalies', icon: ShieldAlert },
    { to: '/admin/utilisateurs', label: 'Utilisateurs & rôles', icon: Users },
    { to: '/admin/agent-ia', label: 'Agent IA', icon: Bot },
  ],
  economat: [
    { to: '/economat', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/economat/produits', label: 'Catalogue produits', icon: Package },
    { to: '/economat/stock', label: 'Stock central', icon: Boxes },
    { to: '/economat/prelevements', label: 'Bons de prélèvement reçus', icon: ClipboardList },
    { to: '/economat/commandes', label: 'Fournisseurs & commandes', icon: Truck },
    { to: '/economat/fournisseurs', label: 'Recommandations IA', icon: Building2 },
    { to: '/economat/mouvements', label: 'Mouvements de stock', icon: ListTree },
  ],
  service: [
    { to: '/service', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/service/stock', label: 'Stock', icon: Boxes },
    { to: '/service/z-mouvements', label: 'Z et mouvements', icon: ListTree },
    { to: '/service/prelevements', label: 'Bons de prélèvement', icon: ClipboardList },
    { to: '/service/sorties-hors-vente', label: 'Sorties hors-vente', icon: AlertTriangle },
  ],
  bar: [
    { to: '/service', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/service/stock', label: 'Stock', icon: Boxes },
    { to: '/service/z-mouvements', label: 'Z et mouvements', icon: ListTree },
    { to: '/service/prelevements', label: 'Bons de prélèvement', icon: ClipboardList },
    { to: '/service/sorties-hors-vente', label: 'Sorties hors-vente', icon: AlertTriangle },
  ],
  cuisine: [
    { to: '/service', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/service/stock', label: 'Stock', icon: Boxes },
    { to: '/service/z-mouvements', label: 'Z et mouvements', icon: ListTree },
    { to: '/service/prelevements', label: 'Bons de prélèvement', icon: ClipboardList },
    { to: '/service/sorties-hors-vente', label: 'Sorties hors-vente', icon: AlertTriangle },
  ],
}

export default function Shell() {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const loc = useLocation()
  const personaId = useAppStore((s) => s.personaId)
  const aiOpen = useAppStore((s) => s.aiOpen)
  const aiWidth = useAppStore((s) => s.aiWidth)
  const persona = PERSONAS.find((p) => p.id === personaId)
  const disabledRoutes = useAppStore((s) => (personaId ? (s.disabledRoutes[personaId] ?? EMPTY_ROUTES) : EMPTY_ROUTES))
  const nav = (personaId ? NAV_BY_ROLE[personaId] : []).filter((n) => !disabledRoutes.includes(n.to))
  const current = nav.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))

  useEffect(() => setOpen(false), [loc.pathname])

  return (
    <div className="min-h-full flex bg-white dark:bg-ink-950 transition-colors">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-[264px] border-r border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-ink-200 dark:border-ink-800">
          <NavLink to={persona?.home ?? '/'} className="flex items-center gap-2.5">
            <img src={BRAND.logoLight} alt={BRAND.name} className="h-9 w-9 rounded-full object-cover" />
            <span className="font-medium text-ink-900 dark:text-ink-50 tracking-tight">{BRAND.name}</span>
          </NavLink>
          <button className="lg:hidden p-1" onClick={() => setOpen(false)} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-6 pb-2">
          <div className="label">{BRAND.platformName}</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors',
                  isActive ? 'bg-ink-900 text-white dark:bg-copper dark:text-ink-950' : 'text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon size={16} className={clsx(isActive ? 'text-white dark:text-ink-950' : 'text-ink-500 dark:text-ink-400 group-hover:text-ink-900 dark:group-hover:text-ink-100')} />
                  <span className="flex-1 truncate">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-200 dark:border-ink-800 p-5">
          <a href="https://izemx.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 group">
            <img src={IZEMX.logo} alt="IZEMX" className="h-6 w-auto grayscale group-hover:grayscale-0 transition" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-label text-ink-500 dark:text-ink-400">MVP conçu et développé par</div>
              <div className="text-[12px] font-medium text-ink-900 dark:text-ink-100">IZEMX</div>
            </div>
          </a>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0 flex flex-col transition-[margin] duration-300" style={{ marginRight: aiOpen ? aiWidth : 0 }}>
        <div className="bg-ink-900 dark:bg-ink-950 text-white text-center text-[11px] py-1.5 px-4 border-b border-ink-800/50">Environnement de démonstration — données simulées</div>
        <header className="h-[72px] border-b border-ink-200 dark:border-ink-800 flex items-center justify-between px-5 lg:px-8 bg-white/90 dark:bg-ink-900/90 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1 -ml-1" onClick={() => setOpen(true)} aria-label="Menu">
              <Menu size={20} className="dark:text-ink-100" />
            </button>
            <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-ink-400 dark:text-ink-500 min-w-0">
              <span className="truncate">{BRAND.platformName}</span>
              {current && (
                <>
                  <span>/</span>
                  <span className="text-ink-700 dark:text-ink-200 font-medium truncate">{current.label}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {personaId && <NotificationsBell role={personaId} />}
            <ThemeToggle />
            {persona && <UserMenu persona={persona} onOpenSettings={() => setSettingsOpen(true)} />}
          </div>
        </header>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        <footer className="border-t border-ink-200 dark:border-ink-800 px-5 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] text-ink-500 dark:text-ink-500">
          <div>
            © {new Date().getFullYear()} {BRAND.name} — {BRAND.tagline} · Données de démonstration
          </div>
          <div className="flex items-center gap-2">
            <span>{IZEMX.signature}</span>
            <img src={IZEMX.logo} alt="IZEMX" className="h-4 w-auto" />
          </div>
        </footer>
      </div>
      <AiSidebar />
      {persona && <AccountSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} persona={persona} />}
    </div>
  )
}
