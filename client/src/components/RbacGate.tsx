import { Navigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { PERSONAS } from '@/data/referentials'
import { Empty } from './ui'

export function RbacGate({ children, allow }: { children: React.ReactNode; allow: ('admin' | 'economat' | 'bar' | 'cuisine')[] }) {
  const personaId = useAppStore((s) => s.personaId)
  const loc = useLocation()
  const blockedByOverride = useAppStore((s) => !!personaId && (s.disabledRoutes[personaId] ?? []).includes(loc.pathname))
  if (!personaId) return <Navigate to="/connexion" replace state={{ from: loc.pathname }} />
  const persona = PERSONAS.find((p) => p.id === personaId)
  const blockedByRole = !allow.includes(personaId)
  if (blockedByRole || blockedByOverride) {
    return (
      <div className="px-5 lg:px-8 py-16 max-w-lg mx-auto">
        <Empty>
          <div className="flex flex-col items-center gap-3">
            <Lock size={22} className="text-ink-400" />
            <div className="font-medium text-ink-900 dark:text-ink-50">Accès restreint par rôle</div>
            <p className="text-ink-500 dark:text-ink-400">
              {blockedByOverride
                ? `L'accès à cet écran a été désactivé par l'Administrateur pour le rôle « ${persona?.roleLabel} ».`
                : `Cet écran n'est pas accessible au rôle « ${persona?.roleLabel} ». Changez de rôle depuis l'en-tête pour y accéder avec le bon profil de démonstration.`}
            </p>
          </div>
        </Empty>
      </div>
    )
  }
  return <>{children}</>
}
