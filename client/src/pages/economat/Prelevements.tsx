import { useState } from 'react'
import { FileDown, FileText } from 'lucide-react'
import { PageHeader, Section, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer, ConfirmModal } from '@/components/Drawer'
import { PdfPreviewModal } from '@/components/PdfPreviewModal'
import { StatusBadge } from '@/components/StatusBadge'
import { productById } from '@/data/catalog'
import { REQUISITIONS } from '@/data/generate'
import { fmtDate, fmtDateTime, LOCATION_LABEL, REQ_STATUS_LABEL, stockAt, userName } from '@/data/selectors'
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

  const [selected, setSelected] = useState<RequisitionOrder | null>(null)
  const [deliverQty, setDeliverQty] = useState<Record<string, number>>({})
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const pdfPreview = usePdfPreview()

  function openDetail(r: RequisitionOrder) {
    setSelected(r)
    const init: Record<string, number> = {}
    for (const it of r.items) init[it.productId] = Math.min(it.qtyRequested - it.qtyDelivered, stockAt('economat', it.productId))
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
    setSelected({ ...selected }) // force refresh of drawer subtitle/status via re-render
    setError(null)
  }

  return (
    <>
      <PageHeader title="Bons de prélèvement reçus" subtitle="Demandes du Bar et de la Cuisine à préparer et à livrer depuis le stock central." />
      <Section>
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
          width={560}
        >
          {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          {selected.comment && <p className="text-[13px] text-ink-600 mb-4">« {selected.comment} »</p>}

          <div className="card overflow-hidden mb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                  <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Produit</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Demandé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Livré</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Dispo. central</th>
                  {(selected.status === 'en_attente' || selected.status === 'en_preparation' || selected.status === 'partiellement_livre') && (
                    <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">À livrer</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => {
                  const remaining = it.qtyRequested - it.qtyDelivered
                  const canAct = selected.status === 'en_attente' || selected.status === 'en_preparation' || selected.status === 'partiellement_livre'
                  return (
                    <tr key={it.productId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                      <td className="px-3 py-2">{productById(it.productId)?.name}</td>
                      <td className="px-3 py-2 text-right">{it.qtyRequested}</td>
                      <td className="px-3 py-2 text-right">{it.qtyDelivered}</td>
                      <td className="px-3 py-2 text-right">{stockAt('economat', it.productId)}</td>
                      {canAct && remaining > 0 && (
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            className="input !py-1 !px-2 w-20 text-right"
                            value={deliverQty[it.productId] ?? 0}
                            onChange={(e) => setDeliverQty((q) => ({ ...q, [it.productId]: Math.max(0, Number(e.target.value)) }))}
                          />
                        </td>
                      )}
                      {canAct && remaining <= 0 && <td className="px-3 py-2 text-right text-emerald-600">Soldé</td>}
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
                  Confirmer la livraison
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
              Aperçu
            </button>
            <button className="btn-ghost btn-sm" onClick={() => downloadPdf(requisitionPDF(selected), `${selected.id}.pdf`)}>
              <FileDown size={14} />
              Télécharger
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
