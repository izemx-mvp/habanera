import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, Shuffle } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import type { Persona } from '@/data/types'

export function UserMenu({ persona, onOpenSettings }: { persona: Persona; onOpenSettings: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const setPersona = useAppStore((s) => s.setPersona)
  const override = useAppStore((s) => s.accountOverrides[persona.id])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const displayName = override?.name || persona.name
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" onClick={() => setOpen((o) => !o)}>
        <div className="w-8 h-8 rounded-full text-white text-[11px] font-medium flex items-center justify-center" style={{ background: persona.color }}>
          {initials}
        </div>
        <div className="hidden md:block leading-tight text-left">
          <div className="text-[12px] font-medium text-ink-900 dark:text-ink-50">{displayName}</div>
          <div className="text-[10px] text-ink-500 dark:text-ink-400">{persona.roleLabel}</div>
        </div>
        <ChevronDown size={14} className="text-ink-400 hidden md:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-ink-200 bg-white dark:bg-ink-900 dark:border-ink-700 shadow-lift z-50 animate-popIn origin-top-right overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-800">
            <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">{displayName}</div>
            <div className="text-[11px] text-ink-500 dark:text-ink-400">{override?.email || `${persona.id}@habanera.ma`}</div>
          </div>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            onClick={() => {
              setOpen(false)
              onOpenSettings()
            }}
          >
            <Settings size={15} />
            Paramètres du compte
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            onClick={() => {
              setOpen(false)
              navigate('/connexion')
            }}
          >
            <Shuffle size={15} />
            Changer de rôle
          </button>
          <div className="border-t border-ink-100 dark:border-ink-800">
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium"
              onClick={() => {
                setOpen(false)
                setPersona(null)
                navigate('/connexion')
              }}
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
