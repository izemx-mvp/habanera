import { useState } from 'react'
import { FileDown, FileText } from 'lucide-react'
import { PageHeader, Section } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { PdfPreviewModal } from '@/components/PdfPreviewModal'
import { StatusBadge } from '@/components/StatusBadge'
import { productById } from '@/data/catalog'
import { REQUISITIONS } from '@/data/generate'
import { fmtDate, fmtDateTime, LOCATION_LABEL, REQ_STATUS_LABEL, userName } from '@/data/selectors'
import { downloadPdf, requisitionPDF } from '@/lib/pdf'
import { usePdfPreview } from '@/lib/use-pdf-preview'
import { useDataVersion } from '@/store/data-version'
import type { RequisitionOrder } from '@/data/types'

export default function AdminPrelevements() {
  useDataVersion()
  const rows = [...REQUISITIONS].sort((a, b) => b.date.localeCompare(a.date))
  const [selected, setSelected] = useState<RequisitionOrder | null>(null)
  const pdfPreview = usePdfPreview()

  return (
    <>
      <PageHeader title="Bons de prélèvement" subtitle="Vue d'ensemble des demandes du Bar et de la Cuisine vers l'Économat." />
      <Section>
        <DataTable
          rows={rows}
          onRowClick={setSelected}
          searchKeys={(r) => r.id}
          searchPlaceholder="Rechercher un bon…"
          columns={[
            { key: 'id', label: 'Numéro', render: (r) => <span className="font-medium text-ink-900">{r.id}</span> },
            { key: 'loc', label: 'Service', render: (r) => LOCATION_LABEL[r.requestingLocation] },
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date), sortValue: (r) => r.date },
            { key: 'requestedBy', label: 'Demandé par', render: (r) => userName(r.requestedBy) },
            { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} label={REQ_STATUS_LABEL[r.status]} /> },
          ]}
        />
      </Section>

      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.id} subtitle={`${LOCATION_LABEL[selected.requestingLocation]} · ${REQ_STATUS_LABEL[selected.status]}`}>
          <div className="card overflow-hidden mb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                  <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Produit</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Demandé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Livré</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => (
                  <tr key={it.productId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                    <td className="px-3 py-2">{productById(it.productId)?.name}</td>
                    <td className="px-3 py-2 text-right">{it.qtyRequested}</td>
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
