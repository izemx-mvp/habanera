import { useState } from 'react'
import { FileDown, FileText, Plus } from 'lucide-react'
import { PageHeader, Section, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { PdfPreviewModal } from '@/components/PdfPreviewModal'
import { StatusBadge } from '@/components/StatusBadge'
import { LineItemsEditor, type Line } from '@/components/LineItemsEditor'
import { productById, productsByLocation } from '@/data/catalog'
import { PERSONA_USER_ID } from '@/data/referentials'
import { fmtDate, fmtDateTime, REQ_STATUS_LABEL, requisitionsFor, userName } from '@/data/selectors'
import { createRequisition } from '@/data/actions'
import { downloadPdf, requisitionPDF } from '@/lib/pdf'
import { usePdfPreview } from '@/lib/use-pdf-preview'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { RequisitionOrder } from '@/data/types'

export function PrelevementsView({ location }: { location: 'bar' | 'cuisine' }) {
  useDataVersion()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]
  const products = productsByLocation(location).filter((p) => p.active)
  const rows = requisitionsFor(location)

  const [newOpen, setNewOpen] = useState(false)
  const [lines, setLines] = useState<Line[]>([{ productId: products[0]?.id ?? '', qty: 1 }])
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<RequisitionOrder | null>(null)
  const pdfPreview = usePdfPreview()

  function submitNew() {
    const res = createRequisition(location, userId, lines.map((l) => ({ productId: l.productId, qty: l.qty })), comment || undefined)
    if (!res.ok) return setError(res.error)
    setNewOpen(false)
    setLines([{ productId: products[0]?.id ?? '', qty: 1 }])
    setComment('')
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Bons de prélèvement"
        subtitle="Demandes adressées à l'Économat pour réapprovisionner ce service depuis le stock central."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setNewOpen(true)}>
            <Plus size={14} />
            Nouveau bon
          </button>
        }
      />
      <Section>
        <DataTable
          rows={rows}
          onRowClick={setSelected}
          searchKeys={(r) => r.id}
          searchPlaceholder="Rechercher un bon…"
          columns={[
            { key: 'id', label: 'Numéro', render: (r) => <span className="font-medium text-ink-900">{r.id}</span> },
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date), sortValue: (r) => r.date },
            { key: 'items', label: 'Lignes', render: (r) => r.items.length },
            { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} label={REQ_STATUS_LABEL[r.status]} /> },
          ]}
        />
      </Section>

      <Drawer open={newOpen} onClose={() => setNewOpen(false)} title="Nouveau bon de prélèvement" subtitle={`Demande adressée à l'Économat — ${location === 'bar' ? 'Bar' : 'Cuisine'}`} actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => setNewOpen(false)}>Annuler</button>
          <button className="btn-primary btn-sm" onClick={submitNew}>Soumettre la demande</button>
        </>
      }>
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <LineItemsEditor products={products} lines={lines} onChange={setLines} />
        <div className="mt-5">
          <FieldLabel>Commentaire (facultatif)</FieldLabel>
          <textarea className="input min-h-[80px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Contexte de la demande…" />
        </div>
      </Drawer>

      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.id} subtitle={`${REQ_STATUS_LABEL[selected.status]} · demandé par ${userName(selected.requestedBy)} le ${fmtDate(selected.date)}`}>
          {selected.comment && <p className="text-[13px] text-ink-600 mb-4">« {selected.comment} »</p>}
          <div className="card overflow-hidden mb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                  <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Produit</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Demandé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Préparé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Livré</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => (
                  <tr key={it.productId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                    <td className="px-3 py-2">{productById(it.productId)?.name}</td>
                    <td className="px-3 py-2 text-right">{it.qtyRequested}</td>
                    <td className="px-3 py-2 text-right">{it.qtyPrepared}</td>
                    <td className="px-3 py-2 text-right">{it.qtyDelivered}</td>
                  </tr>
                ))}
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
      <PdfPreviewModal doc={pdfPreview.doc} filename={pdfPreview.filename} onClose={pdfPreview.close} />
    </>
  )
}
