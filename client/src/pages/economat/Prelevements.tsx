import { useState } from 'react'
import { FileDown, FileText, Clock, CheckCircle2 } from 'lucide-react'
import { PageHeader, Section, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer, ConfirmModal } from '@/components/Drawer'
import { PdfPreviewModal } from '@/components/PdfPreviewModal'
import { StatusBadge } from '@/components/StatusBadge'
import { productById } from '@/data/catalog'
import { REQUISITIONS } from '@/data/generate'
import { fmtDate, fmtDateTime, LOCATION_LABEL, REQ_STATUS_LABEL, stockAt, userName, partialRequisitions } from '@/data/selectors'
import { deliverRequisition, markPreparing, rejectRequisition } from '@/data/actions'
import { downloadPdf, requisitionPDF } from '@/lib/pdf'
import { usePdfPreview } from '@/lib/use-pdf-preview'
import { PERSONA_USER_ID } from '@/data/referentials'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { RequisitionOrder } from '@/data/types'

export default function EconomatPrelevements() {
  useDataVersion()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]
  const rows = [...REQUISITIONS].filter((r) => r.status !== 'brouillon').sort((a, b) => b.date.localeCompare(a.date))
  const reliquats = partialRequisitions()

  const [selected, setSelected] = useState<RequisitionOrder | null>(null)
  const [deliverQty, setDeliverQty] = useState<Record<string, number>>({})
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const pdfPreview = usePdfPreview()

  function openDetail(r: RequisitionOrder) {
    setSelected(r)
    const init: Record<string, number> = {}
    for (const it of r.items) {
      const remaining = it.qtyRequested - it.qtyDelivered
      init[it.productId] = Math.min(remaining, stockAt('economat', it.productId))
    }
    setDeliverQty(init)
    setError(null)
  }

  function submitDeliver() {
    if (!selected) return
    const res = deliverRequisition(
      selected.id,
      userId,
      Object.entries(deliverQty).map(([productId, qty]) => ({ productId, qty })),
    )
    if (!res.ok) return setError(res.error)
    setSelected({ ...selected })
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Bons de prélèvement reçus"
        subtitle="Demandes du Bar et de la Cuisine à préparer et à livrer depuis le stock central de l'Économat."
      />

      <Section>
        {/* RELIQUATS EN ATTENTE - TÂCHES PRIORITAIRES (Section 4.2) */}
        {reliquats.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="text-amber-600" size={18} />
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {reliquats.length} Reliquat(s) en attente de préparation
                </h3>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">À préparer dès réapprovisionnement</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reliquats.map((r) => {
                const totalReq = r.items.reduce((s, i) => s + i.qtyRequested, 0)
                const totalDel = r.items.reduce((s, i) => s + i.qtyDelivered, 0)
                return (
                  <div
                    key={r.id}
                    onClick={() => openDetail(r)}
                    className="p-3 bg-white dark:bg-ink-900 rounded-xl border border-amber-200 dark:border-amber-800/80 hover:shadow-sm cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-ink-900 dark:text-ink-100">{r.id} · {LOCATION_LABEL[r.requestingLocation]}</div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        Reste à livrer : {totalReq - totalDel} unité(s)
                      </div>
                    </div>
                    <button className="btn-secondary btn-xs !text-amber-700">
                      Préparer le reliquat
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <DataTable
          rows={rows}
          onRowClick={openDetail}
          searchKeys={(r) => r.id}
          searchPlaceholder="Rechercher un bon…"
          columns={[
            { key: 'id', label: 'Numéro', render: (r) => <span className="font-medium text-ink-900">{r.id}</span> },
            { key: 'loc', label: 'Service demandeur', render: (r) => LOCATION_LABEL[r.requestingLocation] },
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date), sortValue: (r) => r.date },
            { key: 'requestedBy', label: 'Demandé par', render: (r) => userName(r.requestedBy) },
            {
              key: 'reliquat',
              label: 'Suivi Reliquat',
              render: (r) => {
                const totalReq = r.items.reduce((s, i) => s + i.qtyRequested, 0)
                const totalDel = r.items.reduce((s, i) => s + i.qtyDelivered, 0)
                const reliquat = totalReq - totalDel
                if (reliquat > 0 && r.status !== 'rejete') {
                  return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      <Clock size={11} />
                      Reliquat en attente ({reliquat})
                    </span>
                  )
                }
                if (r.confirmedByService) {
                  return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} />
                      Réception confirmée
                    </span>
                  )
                }
                return <span className="text-xs text-ink-500">Soldé</span>
              },
            },
            { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} label={REQ_STATUS_LABEL[r.status]} /> },
          ]}
        />
      </Section>

      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.id}
          subtitle={`${LOCATION_LABEL[selected.requestingLocation]} · ${REQ_STATUS_LABEL[selected.status]}`}
          width={620}
        >
          {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          {selected.comment && <p className="text-[13px] text-ink-600 mb-4">« {selected.comment} »</p>}

          {/* TABLE: 3 COLUMNS + STOCK CENTRAL + SAISIE */}
          <div className="card overflow-hidden mb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                  <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Produit</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Demandé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Déjà livré</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Reliquat dû</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Dispo. central</th>
                  {(selected.status === 'en_attente' || selected.status === 'en_preparation' || selected.status === 'partiellement_livre') && (
                    <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">À expédier</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => {
                  const remaining = it.qtyRequested - it.qtyDelivered
                  const centralStock = stockAt('economat', it.productId)
                  const canAct = selected.status === 'en_attente' || selected.status === 'en_preparation' || selected.status === 'partiellement_livre'
                  return (
                    <tr key={it.productId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                      <td className="px-3 py-2 font-medium">{productById(it.productId)?.name}</td>
                      <td className="px-3 py-2 text-right">{it.qtyRequested}</td>
                      <td className="px-3 py-2 text-right">{it.qtyDelivered}</td>
                      <td className="px-3 py-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                        {remaining > 0 ? remaining : <span className="text-emerald-600 font-normal">Soldé</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-ink-600 dark:text-ink-400">{centralStock}</td>
                      {canAct && remaining > 0 && (
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={Math.min(remaining, centralStock)}
                            className="input !py-1 !px-2 w-20 text-right"
                            value={deliverQty[it.productId] ?? 0}
                            onChange={(e) => setDeliverQty((q) => ({ ...q, [it.productId]: Math.max(0, Number(e.target.value)) }))}
                          />
                        </td>
                      )}
                      {canAct && remaining <= 0 && <td className="px-3 py-2 text-right text-emerald-600">Complet</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mb-5">
            <div className="label mb-2">Historique</div>
            <div className="space-y-2">
              {selected.history.map((h, i) => (
                <div key={i} className="text-[12.5px] text-ink-600">
                  <span className="font-medium text-ink-900">{fmtDateTime(h.date)}</span> — {REQ_STATUS_LABEL[h.status]} ({userName(h.userId)})
                  {h.comment && <span className="italic"> — {h.comment}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {selected.status === 'en_attente' && (
              <button className="btn-ghost btn-sm" onClick={() => markPreparing(selected.id, userId)}>
                Marquer en préparation
              </button>
            )}
            {(selected.status === 'en_attente' || selected.status === 'en_preparation' || selected.status === 'partiellement_livre') && (
              <>
                <button className="btn-primary btn-sm" onClick={submitDeliver}>
                  {selected.status === 'partiellement_livre' ? 'Préparer et livrer le reliquat' : 'Confirmer la livraison'}
                </button>
                <button className="btn-ghost btn-sm !border-red-300 !text-red-600" onClick={() => setRejectOpen(true)}>
                  Rejeter
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost btn-sm" onClick={() => pdfPreview.open(() => requisitionPDF(selected), `${selected.id}.pdf`)}>
              <FileText size={14} />
              Aperçu PDF
            </button>
            <button className="btn-ghost btn-sm" onClick={() => downloadPdf(requisitionPDF(selected), `${selected.id}.pdf`)}>
              <FileDown size={14} />
              Télécharger PDF
            </button>
          </div>
        </Drawer>
      )}

      <ConfirmModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rejeter ce bon de prélèvement"
        description="Un motif est requis. Aucun mouvement de stock ne sera créé."
        confirmLabel="Rejeter"
        danger
        onConfirm={() => {
          if (!selected) return
          const res = rejectRequisition(selected.id, userId, rejectComment)
          if (!res.ok) setError(res.error)
          else {
            setRejectComment('')
            setSelected(null)
          }
        }}
      >
        <FieldLabel>Motif du rejet</FieldLabel>
        <textarea className="input min-h-[80px]" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} />
      </ConfirmModal>

      <PdfPreviewModal doc={pdfPreview.doc} filename={pdfPreview.filename} onClose={pdfPreview.close} />
    </>
  )
}
