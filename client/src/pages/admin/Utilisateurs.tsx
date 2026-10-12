import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader, Section, Card, Tag, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer, ConfirmModal } from '@/components/Drawer'
import { NAV_BY_ROLE } from '@/components/Shell'
import { PERSONAS, USERS } from '@/data/referentials'
import { useAppStore } from '@/store/app-store'
import type { Role } from '@/data/types'

const ROLE_LABEL: Record<Role, string> = { admin: 'Administrateur', economat: 'Économat', bar: 'Bar', cuisine: 'Cuisine' }
const ROLES: Role[] = ['admin', 'economat', 'bar', 'cuisine']

export default function AdminUtilisateurs() {
  const customUsers = useAppStore((s) => s.customUsers)
  const addCustomUser = useAppStore((s) => s.addCustomUser)
  const removeCustomUser = useAppStore((s) => s.removeCustomUser)
  const disabledRoutes = useAppStore((s) => s.disabledRoutes)
  const toggleRouteAccess = useAppStore((s) => s.toggleRouteAccess)

  const allUsers = [...USERS, ...customUsers]

  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState({ name: '', role: 'bar' as Role })
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null)
  const [roleOpen, setRoleOpen] = useState<Role | null>(null)

  function submitNew() {
    if (!form.name.trim()) return setError('Le nom est requis.')
    addCustomUser({ name: form.name.trim(), role: form.role })
    setNewOpen(false)
    setForm({ name: '', role: 'bar' })
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs & rôles"
        subtitle="Comptes de démonstration, et périmètre d'accès (écrans visibles) configurable par rôle."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setNewOpen(true)}>
            <Plus size={14} />
            Ajouter un utilisateur
          </button>
        }
      />
      <Section>
        <Card title="Rôles" className="mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PERSONAS.map((p) => (
              <button key={p.id} className="card p-4 text-left hover:border-copper transition-colors" onClick={() => setRoleOpen(p.id)}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full text-white text-[11px] font-medium flex items-center justify-center" style={{ background: p.color }}>
                    {p.initials}
                  </div>
                  <div className="text-[13.5px] font-medium text-ink-900 dark:text-ink-50">{p.roleLabel}</div>
                </div>
                <div className="text-[11.5px] text-ink-500 dark:text-ink-400">
                  {NAV_BY_ROLE[p.id].length - (disabledRoutes[p.id]?.length ?? 0)} / {NAV_BY_ROLE[p.id].length} écrans actifs
                </div>
              </button>
            ))}
          </div>
        </Card>

        <DataTable
          rows={allUsers}
          searchKeys={(u) => u.name}
          searchPlaceholder="Rechercher un utilisateur…"
          columns={[
            {
              key: 'name',
              label: 'Nom',
              render: (u) => (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-ink-900 text-white text-[10.5px] font-medium flex items-center justify-center dark:bg-copper dark:text-ink-950">{u.initials}</div>
                  <span className="font-medium text-ink-900 dark:text-ink-50">{u.name}</span>
                </div>
              ),
              sortValue: (u) => u.name,
            },
            { key: 'role', label: 'Rôle', render: (u) => <Tag>{ROLE_LABEL[u.role]}</Tag> },
            { key: 'scope', label: "Périmètre d'accès", render: (u) => PERSONAS.find((p) => p.id === u.role)?.scope.join(', ') },
            {
              key: 'actions',
              label: '',
              render: (u) =>
                'id' in u && u.id.startsWith('custom-') ? (
                  <button className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setToDelete(u)}>
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                ) : (
                  <span className="text-[11px] text-ink-400">compte de démo</span>
                ),
            },
          ]}
        />
        <p className="mt-5 text-[12px] text-ink-400 max-w-2xl">
          En production, ces comptes seraient créés dans Supabase Auth (ou le fournisseur d'identité retenu) et les droits contrôlés côté serveur. Dans cette démonstration, le rôle est déterminé par la carte de connexion choisie.
        </p>
      </Section>

      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Ajouter un utilisateur"
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setNewOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submitNew}>Créer</button>
          </>
        }
      >
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-4">
          <div>
            <FieldLabel>Nom complet</FieldLabel>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Rôle</FieldLabel>
            <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Drawer>

      {roleOpen && (
        <Drawer open={!!roleOpen} onClose={() => setRoleOpen(null)} title={`Périmètre — ${ROLE_LABEL[roleOpen]}`} subtitle="Désactivez un écran pour le retirer du rôle (accès bloqué même par URL directe).">
          <div className="space-y-1">
            {NAV_BY_ROLE[roleOpen].map((n) => {
              const isDisabled = (disabledRoutes[roleOpen] ?? []).includes(n.to)
              return (
                <label key={n.to} className="flex items-center justify-between py-2 px-1 cursor-pointer border-b border-ink-100 dark:border-ink-800 last:border-0">
                  <span className={`text-[13px] ${isDisabled ? 'text-ink-400 dark:text-ink-500 line-through' : 'text-ink-800 dark:text-ink-200'}`}>{n.label}</span>
                  <input type="checkbox" className="w-4 h-4 accent-copper" checked={!isDisabled} onChange={() => toggleRouteAccess(roleOpen, n.to)} />
                </label>
              )
            })}
          </div>
        </Drawer>
      )}

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={`Supprimer ${toDelete?.name ?? ''} ?`}
        description="Cet utilisateur de démonstration sera retiré de la liste."
        confirmLabel="Supprimer"
        danger
        onConfirm={() => toDelete && removeCustomUser(toDelete.id)}
      />
    </>
  )
}
