import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, CheckCircle } from 'lucide-react'
import { PageHeader, Section, FieldLabel, Stat } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { StatusBadge } from '@/components/StatusBadge'
import { ServiceScopeSelector, type ServiceScope } from '@/components/ServiceScopeSelector'
import { productById, PRODUCTS } from '@/data/catalog'
import { PERSONA_USER_ID } from '@/data/referentials'
import { fmtDateTime, fmtMAD, OUTFLOW_REASON_LABEL, OUTFLOW_STATUS_LABEL, userName, LOCATION_LABEL } from '@/data/selectors'
import { declareOutflow } from '@/data/actions'
import { OUTFLOWS } from '@/data/generate'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { NonSalesOutflow, OutflowReason } from '@/data/types'

const REASONS: OutflowReason[] = ['casse', 'perte', 'consommation_personnel', 'produit_offert', 'produit_perime', 'autre']

export default function ServiceSortiesHorsVente() {
  useDataVersion()
  const [searchParams, setSearchParams] = useSearchParams()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId] || 'u-service-1'

  const initialService = (searchParams.get('service') as ServiceScope) || 'all'
  const [scope, setScope] = useState<ServiceScope>(initialService)

  function handleScopeChange(newScope: ServiceScope) {
    setScope(newScope)
    setSearchParams(newScope === 'all' ? {} : { service: newScope })
  }

  // Rows filtered by perimeter
  const rows = [...OUTFLOWS]
    .filter((o) => scope === 'all' || o.location === scope)
    .sort((a, b) => b.date.localeCompare(a.date))

  // New declaration form state
  const [open, setOpen] = useState(false)
  const [targetLocation, setTargetLocation] = useState<'bar' | 'cuisine'>(scope === 'cuisine' ? 'cuisine' : 'bar')
  const [productId, setProductId] = useState(PRODUCTS[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState<OutflowReason>('casse')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<NonSalesOutflow | null>(null)

  function submitDeclaration() {
    const res = declareOutflow({
      productId,
      location: targetLocation,
      quantity: qty,
      reason,
      comment: comment || undefined,
      declaredBy: userId,
    })
    if (!res.ok) return setError(res.error)
    setOpen(false)
    setQty(1)
    setComment('')
    setReason('casse')
    setError(null)
  }

  const pending = rows.filter((o) => o.status === 'en_attente').length
  const accepted = rows.filter((o) => o.status === 'acceptee').length
  const rejected = rows.filter((o) => o.status === 'rejetee').length

  const currentProduct = productById(productId)

  return (
    <>
      <PageHeader
        title="Sorties hors-vente (Pertes, Offerts, Staff)"
        subtitle="Formulaire unique de déclaration des sorties pour le Bar et la Cuisine, soumis aux mêmes règles et plafonds de validation."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ServiceScopeSelector value={scope} onChange={handleScopeChange} />
            <button className="btn-primary btn-sm" onClick={() => setOpen(true)}>
              <Plus size={14} />
              Déclarer une sortie
            </button>
          </div>
        }
      />

      <Section>
        {/* KPI SUMMARY */}
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
          <Stat label="En attente Admin" value={String(pending)} tone={pending ? 'warning' : 'success'} />
          <Stat label="Validées" value={String(accepted)} />
          <Stat label="Rejetées" value={String(rejected)} />
        </div>

        {/* TABLE */}
        <DataTable
          rows={rows}
          onRowClick={setSelected}
          searchKeys={(o) => `${productById(o.productId)?.name ?? ''} ${LOCATION_LABEL[o.location]} ${OUTFLOW_REASON_LABEL[o.reason]}`}
          searchPlaceholder="Rechercher une déclaration…"
          pageSize={15}
          columns={[
            {
              key: 'date',
              label: 'Date',
              render: (o) => fmtDateTime(o.date),
              sortValue: (o) => o.date,
            },
            {
              key: 'service',
              label: 'Service',
              render: (o) => (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-ink-100 dark:bg-ink-800">
                  {LOCATION_LABEL[o.location]}
                </span>
              ),
              sortValue: (o) => o.location,
            },
            {
              key: 'product',
              label: 'Produit',
              render: (o) => (
                <span className="font-semibold text-ink-900 dark:text-ink-100">
                  {productById(o.productId)?.name ?? o.productId}
                </span>
              ),
              sortValue: (o) => productById(o.productId)?.name ?? '',
            },
            {
              key: 'qty',
              label: 'Quantité',
              render: (o) => `${o.quantity} ${o.unit}`,
            },
            {
              key: 'reason',
              label: 'Motif',
              render: (o) => (
                <span className="text-xs font-medium text-ink-700 dark:text-ink-300">
                  {OUTFLOW_REASON_LABEL[o.reason]}
                </span>
              ),
            },
            {
              key: 'val',
              label: 'Valeur estimée',
              render: (o) => (o.value != null ? fmtMAD(o.value) : '—'),
            },
            {
              key: 'status',
              label: 'Statut',
              render: (o) => <StatusBadge status={o.status} label={OUTFLOW_STATUS_LABEL[o.status]} />,
            },
          ]}
        />
      </Section>

      {/* DRAWER FORMULAIRE UNIQUE DE DÉCLARATION */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Déclarer une sortie hors-vente"
        subtitle="Sélectionnez le service concerné (Bar ou Cuisine), l'article et le motif."
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submitDeclaration}>Soumettre pour validation</button>
          </>
        }
      >
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="space-y-4">
          <div>
            <FieldLabel>Service concerné</FieldLabel>
            <select
              className="input font-medium"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value as 'bar' | 'cuisine')}
            >
              <option value="bar">Bar (Boissons & portions)</option>
              <option value="cuisine">Cuisine (Ingrédients & préparations)</option>
            </select>
          </div>

          <div>
            <FieldLabel>Produit sorti du stock</FieldLabel>
            <select
              className="input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {PRODUCTS.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.storageUnit}) — {LOCATION_LABEL[p.location]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Quantité sortie ({currentProduct?.storageUnit ?? 'u'})</FieldLabel>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input"
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value) || 1)}
              />
            </div>
            <div>
              <FieldLabel>Motif de la sortie</FieldLabel>
              <select
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value as OutflowReason)}
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {OUTFLOW_REASON_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Commentaire ou justification {reason === 'autre' && '(obligatoire)'}</FieldLabel>
            <textarea
              className="input min-h-[80px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex. Bouteille cassée pendant le service du soir, assiette renversée..."
            />
          </div>
        </div>
      </Drawer>

      {/* DRAWER DÉTAIL DE DÉCLARATION */}
      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Déclaration ${selected.id}`}
          subtitle={`Service : ${LOCATION_LABEL[selected.location]} · ${OUTFLOW_STATUS_LABEL[selected.status]}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-ink-50 dark:bg-ink-800/50 rounded-xl space-y-1.5 border border-ink-200 dark:border-ink-700">
              <div className="flex justify-between">
                <span className="text-ink-500">Produit :</span>
                <strong className="text-ink-900 dark:text-ink-100">{productById(selected.productId)?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Quantité :</span>
                <strong className="text-ink-900 dark:text-ink-100">{selected.quantity} {selected.unit}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Motif :</span>
                <strong className="text-ink-900 dark:text-ink-100">{OUTFLOW_REASON_LABEL[selected.reason]}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Déclaré par :</span>
                <span>{userName(selected.declaredBy)} le {fmtDateTime(selected.date)}</span>
              </div>
            </div>

            {selected.comment && (
              <div>
                <FieldLabel>Justification déclarée</FieldLabel>
                <p className="p-3 bg-ink-50 dark:bg-ink-800 rounded-xl italic text-ink-700 dark:text-ink-300">
                  « {selected.comment} »
                </p>
              </div>
            )}

            {selected.status === 'acceptee' && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Validée par l'Administrateur le {selected.validatedDate ? fmtDateTime(selected.validatedDate) : ''}. Sortie déduite du stock.</span>
              </div>
            )}

            {selected.status === 'rejetee' && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
                <strong>Rejetée par l'Administrateur : </strong>
                {selected.rejectionReason || 'Justification insuffisante.'}
              </div>
            )}
          </div>
        </Drawer>
      )}
    </>
  )
}
