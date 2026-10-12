import { useEffect, useState } from 'react'
import { Drawer } from './Drawer'
import { FieldLabel } from './ui'
import { useAppStore } from '@/store/app-store'
import type { Persona } from '@/data/types'

export function AccountSettingsDrawer({ open, onClose, persona }: { open: boolean; onClose: () => void; persona: Persona }) {
  const override = useAppStore((s) => s.accountOverrides[persona.id])
  const updateAccount = useAppStore((s) => s.updateAccount)

  const [name, setName] = useState(override?.name ?? persona.name)
  const [email, setEmail] = useState(override?.email ?? `${persona.id}@habanera.ma`)
  const [password, setPassword] = useState('')
  const [notifyEmail, setNotifyEmail] = useState(override?.notifyEmail ?? true)
  const [notifyPush, setNotifyPush] = useState(override?.notifyPush ?? true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(override?.name ?? persona.name)
    setEmail(override?.email ?? `${persona.id}@habanera.ma`)
    setPassword('')
    setNotifyEmail(override?.notifyEmail ?? true)
    setNotifyPush(override?.notifyPush ?? true)
    setSaved(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function save() {
    updateAccount(persona.id, { name, email, notifyEmail, notifyPush })
    setSaved(true)
    setPassword('')
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Paramètres du compte"
      subtitle={persona.roleLabel}
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={onClose}>
            Fermer
          </button>
          <button className="btn-primary btn-sm" onClick={save}>
            Enregistrer
          </button>
        </>
      }
    >
      {saved && <div className="mb-4 text-[12.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">Modifications enregistrées pour cette session de démonstration.</div>}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Prénom et nom</FieldLabel>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Rôle</FieldLabel>
            <input className="input opacity-60" value={persona.roleLabel} disabled />
          </div>
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Nouveau mot de passe</FieldLabel>
          <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-[11px] text-ink-400">Démonstration : le mot de passe n'est ni stocké ni vérifié (pas d'authentification serveur réelle).</p>
        </div>
        <div className="divider my-2" />
        <div className="label mb-1">Notifications</div>
        <label className="flex items-center justify-between py-1.5 cursor-pointer">
          <span className="text-[13px] text-ink-700 dark:text-ink-200">Recevoir les notifications par e-mail</span>
          <input type="checkbox" className="w-4 h-4 accent-copper" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between py-1.5 cursor-pointer">
          <span className="text-[13px] text-ink-700 dark:text-ink-200">Recevoir les notifications dans l'application</span>
          <input type="checkbox" className="w-4 h-4 accent-copper" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
        </label>
      </div>
    </Drawer>
  )
}
