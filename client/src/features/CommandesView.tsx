import { useState } from 'react'
import { FileDown, FileText, Plus } from 'lucide-react'
import { PageHeader, Section, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { PdfPreviewModal } from '@/components/PdfPreviewModal'
import { StatusBadge } from '@/components/StatusBadge'
import { LineItemsEditor, type Line } from '@/components/LineItemsEditor'
import { PRODUCTS, productById } from '@/data/catalog'
import { PURCHASE_ORDERS } from '@/data/generate'
import { fmtDate, fmtMAD, PO_STATUS_LABEL, receiptsFor, supplierName } from '@/data/selectors'
import { createPurchaseOrder, receivePurchaseOrder } from '@/data/actions'
import { downloadPdf, purchaseOrderPDF } from '@/lib/pdf'
import { usePdfPreview } from '@/lib/use-pdf-preview'
import { PERSONA_USER_ID, SUPPLIERS } from '@/data/referentials'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { PurchaseOrder } from '@/data/types'

export function CommandesView() {
  useDataVersion()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]
  const rows = [...PURCHASE_ORDERS].sort((a, b) => b.date.localeCompare(a.date))

  const [newOpen, setNewOpen] = useState(false)
  const [supplierId, setSupplierId] = useState(SUPPLIERS[0].id)
  const [lines, setLines] = useState<Line[]>([{ productId: PRODUCTS[0].id, qty: 1 }])
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<PurchaseOrder | null>(null)
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({})
  const pdfPreview = usePdfPreview()

  function submitNew() {
    const res = createPurchaseOrder(
      supplierId,
      userId,
      lines.map((l) => ({ productId: l.productId, qty: l.qty, unitCost: null })),
    )
    if (!res.ok) return setError(res.error)
    setNewOpen(false)
    setLines([{ productId: PRODUCTS[0].id, qty: 1 }])
    setError(null)
  }

  function openDetail(po: PurchaseOrder) {
    setSelected(po)
    const init: Record<string, number> = {}
    for (const it of po.items) init[it.productId] = it.qtyOrdered - it.qtyReceived
    setReceiveQty(init)
    setError(null)
  }

  function submitReceive() {
    if (!selected) return
    const res = receivePurchaseOrder(
      selected.id,
      userId,
      Object.entries(receiveQty).map(([productId, qty]) => ({ productId, qty })),
    )
    if (!res.ok) return setError(res.error)
    setSelected({ ...selected })
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Fournisseurs & commandes"
        subtitle="Le stock n'augmente qu'à la réception effective des produits, jamais à la création de la commande."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setNewOpen(true)}>
            <Plus size={14} />
            Nouvelle commande
          </button>
        }
      />
      <Section>
        <DataTable
          rows={rows}
          onRowClick={openDetail}
          searchKeys={(po) => `${po.id} ${supplierName(po.supplierId)}`}
          searchPlaceholder="Rechercher une commande…"
          columns={[
            { key: 'id', label: 'Numéro', render: (po) => <span className="font-medium text-ink-900">{po.id}</span> },
            { key: 'supplier', label: 'Fournisseur', render: (po) => supplierName(po.supplierId) },
            { key: 'date', label: 'Date', render: (po) => fmtDate(po.date), sortValue: (po) => po.date },
            { key: 'items', label: 'Lignes', render: (po) => po.items.length },
            { key: 'status', label: 'Statut', render: (po) => <StatusBadge status={po.status} label={PO_STATUS_LABEL[po.status]} /> },
          ]}
        />
      </Section>

      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nouvelle commande fournisseur"
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setNewOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submitNew}>Créer la commande</button>
          </>
        }
      >
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <FieldLabel>Fournisseur</FieldLabel>
        <select className="input mb-4" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          {SUPPLIERS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <LineItemsEditor products={PRODUCTS.filter((p) => p.active)} lines={lines} onChange={setLines} />
      </Drawer>

      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.id} subtitle={`${supplierName(selected.supplierId)} · ${PO_STATUS_LABEL[selected.status]}`} width={560}>
          {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="card overflow-hidden mb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                  <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Produit</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Commandé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Reçu</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Coût unitaire</th>
                  {selected.status !== 'receptionnee' && selected.status !== 'annulee' && <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">À réceptionner</th>}
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => {
                  const remaining = it.qtyOrdered - it.qtyReceived
                  return (
                    <tr key={it.productId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                      <td className="px-3 py-2">{productById(it.productId)?.name}</td>
                      <td className="px-3 py-2 text-right">{it.qtyOrdered}</td>
                      <td className="px-3 py-2 text-right">{it.qtyReceived}</td>
                      <td className="px-3 py-2 text-right">{fmtMAD(it.unitCost)}</td>
                      {selected.status !== 'receptionnee' && selected.status !== 'annulee' && (
                        <td className="px-3 py-2 text-right">
                          {remaining > 0 ? (
                            <input
                              type="number"
                              min={0}
                              max={remaining}
                              className="input !py-1 !px-2 w-20 text-right"
                              value={receiveQty[it.productId] ?? 0}
                              onChange={(e) => setReceiveQty((q) => ({ ...q, [it.productId]: Math.max(0, Number(e.target.value)) }))}
                            />
                          ) : (
                            <span className="text-emerald-600">Soldé</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {receiptsFor(selected.id).length > 0 && (
            <div className="mb-5">
              <div className="label mb-2">Réceptions enregistrées</div>
              <div className="space-y-1">
                {receiptsFor(selected.id).map((r) => (
                  <div key={r.id} className="text-[12.5px] text-ink-600">
                    {r.id} — {fmtDate(r.date)} — {r.items.reduce((s, i) => s + i.qtyReceived, 0)} unité(s)
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.status !== 'receptionnee' && selected.status !== 'annulee' && (
            <button className="btn-primary btn-sm mb-5" onClick={submitReceive}>
              Confirmer la réception
            </button>
          )}

          <div className="flex gap-2">
            <button className="btn-ghost btn-sm" onClick={() => pdfPreview.open(() => purchaseOrderPDF(selected), `${selected.id}.pdf`)}>
              <FileText size={14} />
              Aperçu
            </button>
            <button className="btn-ghost btn-sm" onClick={() => downloadPdf(purchaseOrderPDF(selected), `${selected.id}.pdf`)}>
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
