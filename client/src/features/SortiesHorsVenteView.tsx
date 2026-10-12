import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader, Section, FieldLabel, Stat } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { StatusBadge } from '@/components/StatusBadge'
import { productById, productsByLocation } from '@/data/catalog'
import { PERSONA_USER_ID } from '@/data/referentials'
import { fmtDateTime, fmtMAD, outflowsFor, OUTFLOW_REASON_LABEL, OUTFLOW_STATUS_LABEL, userName } from '@/data/selectors'
import { declareOutflow } from '@/data/actions'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { NonSalesOutflow, OutflowReason } from '@/data/types'

const REASONS: OutflowReason[] = ['casse', 'perte', 'consommation_personnel', 'produit_offert', 'produit_perime', 'autre']

export function SortiesHorsVenteView({ location }: { location: 'bar' | 'cuisine' }) {
  useDataVersion()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]
  const products = productsByLocation(location).filter((p) => p.active)
  const rows = outflowsFor(location)

  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState<OutflowReason>('casse')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<NonSalesOutflow | null>(null)

  function submit() {
    const res = declareOutflow({ productId, location, quantity: qty, reason, comment: comment || undefined, declaredBy: userId })
    if (!res.ok) return setError(res.error)
    setOpen(false)
    setQty(1)
    setComment('')
    setReason('casse')
    setError(null)
  }

  const pending = rows.filter((o) => o.status === 'en_attente').length

  return (
    <>
      <PageHeader
        title="Sorties hors-vente"
        subtitle="Déclarez un produit sorti du stock sans vente classique. La déclaration reste sans effet sur le stock tant qu'elle n'est pas validée par l'Administrateur."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setOpen(true)}>
            <Plus size={14} />
            Déclarer une sortie
          </button>
        }
      />
      <Section>
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
          <Stat label="En attente" value={String(pending)} tone={pending ? 'warning' : 'success'} />
          <Stat label="Acceptées" value={String(rows.filter((o) => o.status === 'acceptee').length)} />
          <Stat label="Rejetées" value={String(rows.filter((o) => o.status === 'rejetee').length)} />
        </div>
        <DataTable
          rows={rows}
          onRowClick={setSelected}
          searchKeys={(o) => `${o.id} ${productById(o.productId)?.name}`}
          searchPlaceholder="Rechercher…"
          columns={[
            { key: 'id', label: 'Référence', render: (o) => <span className="font-medium text-ink-900">{o.id}</span> },
            { key: 'date', label: 'Date', render: (o) => fmtDateTime(o.date), sortValue: (o) => o.date },
            { key: 'product', label: 'Produit', render: (o) => productById(o.productId)?.name },
            { key: 'qty', label: 'Quantité', render: (o) => `${o.quantity} ${o.unit}` },
            { key: 'reason', label: 'Motif', render: (o) => OUTFLOW_REASON_LABEL[o.reason] },
            { key: 'value', label: 'Valeur', render: (o) => (o.status === 'acceptee' ? (o.value != null ? fmtMAD(o.value) : 'À valoriser') : '—') },
            { key: 'status', label: 'Statut', render: (o) => <StatusBadge status={o.status} label={OUTFLOW_STATUS_LABEL[o.status]} /> },
          ]}
        />
      </Section>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Déclarer une sortie hors-vente"
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submit}>Soumettre la déclaration</button>
          </>
        }
      >
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-4">
          <div>
            <FieldLabel>Produit</FieldLabel>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Quantité</FieldLabel>
            <input type="number" min={1} className="input" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} />
          </div>
          <div>
            <FieldLabel>Motif</FieldLabel>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value as OutflowReason)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {OUTFLOW_REASON_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Commentaire {reason === 'autre' && <span className="text-red-600">(obligatoire)</span>}</FieldLabel>
            <textarea className="input min-h-[80px]" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
      </Drawer>

      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.id} subtitle={`${productById(selected.productId)?.name} · ${selected.quantity} ${selected.unit}`}>
          <div className="space-y-3 text-[13px]">
            <Row label="Motif" value={OUTFLOW_REASON_LABEL[selected.reason]} />
            <Row label="Déclaré par" value={userName(selected.declaredBy)} />
            <Row label="Date de déclaration" value={fmtDateTime(selected.date)} />
            {selected.comment && <Row label="Commentaire" value={selected.comment} />}
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
        </Drawer>
      )}
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
