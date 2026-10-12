import { useState } from 'react'
import clsx from 'clsx'
import { PageHeader, Section, Stat, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer, ConfirmModal } from '@/components/Drawer'
import { StatusBadge } from '@/components/StatusBadge'
import { productById } from '@/data/catalog'
import { OUTFLOWS } from '@/data/generate'
import { fmtDateTime, fmtMAD, LOCATION_LABEL, lossesValue, OUTFLOW_REASON_LABEL, OUTFLOW_STATUS_LABEL, stockAt, userName } from '@/data/selectors'
import { acceptOutflow, rejectOutflowAction } from '@/data/actions'
import { PERSONA_USER_ID } from '@/data/referentials'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { NonSalesOutflow } from '@/data/types'

export default function AdminSortiesHorsVente() {
  useDataVersion()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]
  const [tab, setTab] = useState<'attente' | 'historique'>('attente')
  const rows = [...OUTFLOWS].sort((a, b) => b.date.localeCompare(a.date))
  const pending = rows.filter((o) => o.status === 'en_attente')
  const shown = tab === 'attente' ? pending : rows

  const [selected, setSelected] = useState<NonSalesOutflow | null>(null)
  const [confirmAccept, setConfirmAccept] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <PageHeader title="Sorties hors-vente" subtitle="Validez ou rejetez les déclarations du Bar et de la Cuisine. Une déclaration rejetée ne modifie jamais le stock." />
      <Section>
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
          <Stat label="En attente" value={String(pending.length)} tone={pending.length ? 'warning' : 'success'} />
          <Stat label="Acceptées" value={String(rows.filter((o) => o.status === 'acceptee').length)} />
          <Stat label="Valeur des pertes validées" value={fmtMAD(lossesValue())} />
        </div>
        <div className="flex gap-2 mb-5">
          <button className={clsx('chip', tab === 'attente' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setTab('attente')}>
            À valider ({pending.length})
          </button>
          <button className={clsx('chip', tab === 'historique' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setTab('historique')}>
            Historique des validations
          </button>
        </div>
        <DataTable
          rows={shown}
          onRowClick={(o) => {
            setSelected(o)
            setError(null)
          }}
          searchKeys={(o) => `${o.id} ${productById(o.productId)?.name}`}
          searchPlaceholder="Rechercher…"
          emptyLabel="Aucune déclaration."
          columns={[
            { key: 'id', label: 'Référence', render: (o) => <span className="font-medium text-ink-900">{o.id}</span> },
            { key: 'date', label: 'Date', render: (o) => fmtDateTime(o.date), sortValue: (o) => o.date },
            { key: 'loc', label: 'Service', render: (o) => LOCATION_LABEL[o.location] },
            { key: 'product', label: 'Produit', render: (o) => productById(o.productId)?.name },
            { key: 'qty', label: 'Quantité', render: (o) => `${o.quantity} ${o.unit}` },
            { key: 'reason', label: 'Motif', render: (o) => OUTFLOW_REASON_LABEL[o.reason] },
            { key: 'declaredBy', label: 'Déclaré par', render: (o) => userName(o.declaredBy) },
            { key: 'value', label: 'Valeur', render: (o) => (o.status === 'acceptee' ? (o.value != null ? fmtMAD(o.value) : 'À valoriser') : '—') },
            { key: 'status', label: 'Statut', render: (o) => <StatusBadge status={o.status} label={OUTFLOW_STATUS_LABEL[o.status]} /> },
          ]}
        />
      </Section>

      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.id} subtitle={`${productById(selected.productId)?.name} · ${LOCATION_LABEL[selected.location]}`}>
          {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="space-y-3 text-[13px] mb-6">
            <Row label="Quantité" value={`${selected.quantity} ${selected.unit}`} />
            <Row label="Motif" value={OUTFLOW_REASON_LABEL[selected.reason]} />
            <Row label="Déclaré par" value={userName(selected.declaredBy)} />
            <Row label="Date de déclaration" value={fmtDateTime(selected.date)} />
            {selected.comment && <Row label="Commentaire" value={selected.comment} />}
            <Row label="Stock disponible actuellement" value={`${stockAt(selected.location, selected.productId)} ${selected.unit}`} />
            <Row label="Statut" value={<StatusBadge status={selected.status} label={OUTFLOW_STATUS_LABEL[selected.status]} />} />
            {selected.status !== 'en_attente' && (
              <>
                <Row label="Traité par" value={userName(selected.validatedBy!)} />
                <Row label="Date de traitement" value={fmtDateTime(selected.validatedDate!)} />
              </>
            )}
            {selected.status === 'acceptee' && <Row label="Valeur de la perte" value={selected.value != null ? fmtMAD(selected.value) : 'À valoriser'} />}
            {selected.status === 'rejetee' && <Row label="Motif de rejet" value={selected.rejectionReason!} />}
          </div>
          {selected.status === 'en_attente' && (
            <div className="flex gap-2">
              <button className="btn-primary btn-sm" onClick={() => setConfirmAccept(true)}>
                Accepter
              </button>
              <button className="btn-ghost btn-sm !border-red-300 !text-red-600" onClick={() => setConfirmReject(true)}>
                Rejeter
              </button>
            </div>
          )}
        </Drawer>
      )}

      <ConfirmModal
        open={confirmAccept}
        onClose={() => setConfirmAccept(false)}
        title="Accepter cette sortie hors-vente ?"
        description="Le stock du service concerné sera débité une seule fois et la perte sera valorisée au coût moyen pondéré si connu."
        confirmLabel="Accepter"
        onConfirm={() => {
          if (!selected) return
          const res = acceptOutflow(selected.id, userId)
          if (!res.ok) setError(res.error)
          else setSelected(null)
        }}
      />
      <ConfirmModal
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        title="Rejeter cette sortie hors-vente ?"
        description="Un motif de rejet est requis. Aucun mouvement de stock ne sera créé."
        confirmLabel="Rejeter"
        danger
        onConfirm={() => {
          if (!selected) return
          const res = rejectOutflowAction(selected.id, userId, rejectReason)
          if (!res.ok) setError(res.error)
          else {
            setRejectReason('')
            setSelected(null)
          }
        }}
      >
        <FieldLabel>Motif du rejet</FieldLabel>
        <textarea className="input min-h-[80px]" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </ConfirmModal>
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-ink-100 last:border-0">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-900 text-right">{value}</span>
    </div>
  )
}
