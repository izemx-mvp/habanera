import { useState } from 'react'
import { FileDown, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { PageHeader, Section, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { PdfPreviewModal } from '@/components/PdfPreviewModal'
import { StatusBadge } from '@/components/StatusBadge'
import { LineItemsEditor, type Line } from '@/components/LineItemsEditor'
import { productById, productsByLocation } from '@/data/catalog'
import { PERSONA_USER_ID } from '@/data/referentials'
import { fmtDate, fmtDateTime, REQ_STATUS_LABEL, requisitionsFor, userName } from '@/data/selectors'
import { createRequisition, confirmRequisition, contestRequisition } from '@/data/actions'
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

  // Contestation modal state (Section 4.3)
  const [contestModalOpen, setContestModalOpen] = useState(false)
  const [contestedItems, setContestedItems] = useState<Record<string, { actualQty: number; reason: string }>>({})

  const pdfPreview = usePdfPreview()

  function submitNew() {
    const res = createRequisition(location, userId, lines.map((l) => ({ productId: l.productId, qty: l.qty })), comment || undefined)
    if (!res.ok) return setError(res.error)
    setNewOpen(false)
    setLines([{ productId: products[0]?.id ?? '', qty: 1 }])
    setComment('')
    setError(null)
  }

  function handleConfirmReception(r: RequisitionOrder) {
    const res = confirmRequisition(r.id, userId)
    if (res.ok) {
      setSelected({ ...r, confirmedByService: true, confirmedAt: new Date().toISOString() })
    }
  }

  function openContestModal(r: RequisitionOrder) {
    const initial: Record<string, { actualQty: number; reason: string }> = {}
    for (const it of r.items) {
      initial[it.productId] = {
        actualQty: it.qtyDelivered,
        reason: 'Cassé pendant le transport',
      }
    }
    setContestedItems(initial)
    setContestModalOpen(true)
  }

  function submitContest() {
    if (!selected) return
    const itemsToContest = Object.entries(contestedItems).map(([productId, val]) => ({
      productId,
      actualQty: val.actualQty,
      reason: val.reason,
    }))
    const res = contestRequisition(selected.id, userId, itemsToContest)
    if (res.ok) {
      setContestModalOpen(false)
      setSelected(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Bons de prélèvement"
        subtitle="Demandes de réapprovisionnement vers l'Économat — Suivi des reliquats et validation terrain."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setNewOpen(true)}>
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
            {
              key: 'reliquat',
              label: 'Suivi livraison',
              render: (r) => {
                const totalReq = r.items.reduce((s, i) => s + i.qtyRequested, 0)
                const totalDel = r.items.reduce((s, i) => s + i.qtyDelivered, 0)
                const reliquat = totalReq - totalDel
                if (reliquat > 0 && r.status !== 'rejete') {
                  return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      <Clock size={11} />
                      Reliquat : {reliquat} restant
                    </span>
                  )
                }
                if (r.confirmedByService) {
                  return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} />
                      Réception validée
                    </span>
                  )
                }
                return <span className="text-xs text-ink-500">{totalDel}/{totalReq} reçu</span>
              },
            },
            { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} label={REQ_STATUS_LABEL[r.status]} /> },
          ]}
        />
      </Section>

      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nouveau bon de prélèvement"
        subtitle={`Demande adressée à l'Économat — ${location === 'bar' ? 'Bar' : 'Cuisine'}`}
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setNewOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submitNew}>Soumettre la demande</button>
          </>
        }
      >
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <LineItemsEditor products={products} lines={lines} onChange={setLines} />
        <div className="mt-5">
          <FieldLabel>Commentaire (facultatif)</FieldLabel>
          <textarea className="input min-h-[80px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Contexte de la demande…" />
        </div>
      </Drawer>

      {/* Détail du bon avec les 3 colonnes et validation/contestation (Section 4.1 & 4.3) */}
      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.id}
          subtitle={`${REQ_STATUS_LABEL[selected.status]} · demandé par ${userName(selected.requestedBy)} le ${fmtDate(selected.date)}`}
          width={600}
        >
          {selected.comment && <p className="text-[13px] text-ink-600 mb-4">« {selected.comment} »</p>}

          {/* Validation Status Banner */}
          {selected.confirmedByService ? (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>
                  Réception physique confirmée le {selected.confirmedAt ? fmtDateTime(selected.confirmedAt) : 'récemment'}
                </span>
              </div>
              {selected.hasContestation && (
                <span className="font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded">
                  Avec contestation
                </span>
              )}
            </div>
          ) : (
            (selected.status === 'livre' || selected.status === 'partiellement_livre') && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>Le matériel a été envoyé par l'Économat. Veuillez vérifier et valider la réception terrain.</span>
              </div>
            )
          )}

          {/* 3 COLUMNS TABLE: Demandé, Livré, Reliquat (Restant) */}
          <div className="card overflow-hidden mb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                  <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Produit</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Demandé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Livré</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Restant (Reliquat)</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it) => {
                  const reliquat = it.qtyRequested - it.qtyDelivered
                  return (
                    <tr key={it.productId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium">{productById(it.productId)?.name}</div>
                        {it.contestedQty && it.contestedQty > 0 && (
                          <div className="text-[11px] text-red-600 dark:text-red-400">
                            Écart signalé : -{it.contestedQty} ({it.contestationReason})
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{it.qtyRequested}</td>
                      <td className="px-3 py-2 text-right font-medium text-ink-900 dark:text-ink-100">{it.qtyDelivered}</td>
                      <td className="px-3 py-2 text-right">
                        {reliquat > 0 ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{reliquat}</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">0 (Soldé)</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Validation & Contestation buttons for Service (Section 4.3) */}
          {!selected.confirmedByService && (selected.status === 'livre' || selected.status === 'partiellement_livre') && (
            <div className="p-4 bg-ink-50 dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 mb-5">
              <div className="text-xs font-semibold text-ink-900 dark:text-ink-100 mb-2">
                Actions de validation terrain :
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-primary btn-sm flex-1 flex items-center justify-center gap-1.5"
                  onClick={() => handleConfirmReception(selected)}
                >
                  <CheckCircle2 size={14} />
                  Confirmer / Valider la réception
                </button>
                <button
                  className="btn-ghost btn-sm text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5"
                  onClick={() => openContestModal(selected)}
                >
                  <AlertTriangle size={14} />
                  Signaler un écart / Contester
                </button>
              </div>
            </div>
          )}

          <div className="mb-5">
            <div className="label mb-2">Historique et traçabilité</div>
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
              Aperçu PDF
            </button>
            <button className="btn-ghost btn-sm" onClick={() => downloadPdf(requisitionPDF(selected), `${selected.id}.pdf`)}>
              <FileDown size={14} />
              Télécharger PDF
            </button>
          </div>
        </Drawer>
      )}

      {/* Modale de Contestation avec motif obligatoire (Section 4.3) */}
      <Drawer
        open={contestModalOpen}
        onClose={() => setContestModalOpen(false)}
        title="Signaler un écart à la réception"
        subtitle="Indiquez la quantité réellement reçue et le motif d'écart (casse transport, manquant, etc.)."
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setContestModalOpen(false)}>
              Annuler
            </button>
            <button className="btn-primary btn-sm !bg-red-600 hover:!bg-red-700" onClick={submitContest}>
              Enregistrer l'écart et contester
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-600 dark:text-ink-400">
            Cette action mettra à jour la quantité livrée effective, recalculera automatiquement le reliquat restant, 
            et émettra une alerte d'anomalie auprès de l'Économat et de l'Administrateur.
          </p>

          {selected?.items.map((it) => {
            const current = contestedItems[it.productId] ?? { actualQty: it.qtyDelivered, reason: '' }
            return (
              <div key={it.productId} className="p-3 bg-ink-50 dark:bg-ink-800/50 rounded-xl border border-ink-200 dark:border-ink-700 space-y-2">
                <div className="font-medium text-xs text-ink-900 dark:text-ink-100">
                  {productById(it.productId)?.name} (Envoyé par l'Économat : {it.qtyDelivered})
                </div>
                <div>
                  <FieldLabel>Quantité réellement constatée</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    max={it.qtyRequested}
                    className="input !py-1 text-xs"
                    value={current.actualQty}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setContestedItems((prev) => ({
                        ...prev,
                        [it.productId]: { ...prev[it.productId], actualQty: val },
                      }))
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Motif obligatoire de l'écart</FieldLabel>
                  <select
                    className="input !py-1 text-xs"
                    value={current.reason}
                    onChange={(e) => {
                      const val = e.target.value
                      setContestedItems((prev) => ({
                        ...prev,
                        [it.productId]: { ...prev[it.productId], reason: val },
                      }))
                    }}
                  >
                    <option value="Cassé pendant le transport">Cassé pendant le transport</option>
                    <option value="Manquant dans le carton / colis">Manquant dans le carton / colis</option>
                    <option value="Produit périmé ou non conforme">Produit périmé ou non conforme</option>
                    <option value="Autre anomalie de livraison">Autre anomalie de livraison</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </Drawer>

      <PdfPreviewModal doc={pdfPreview.doc} filename={pdfPreview.filename} onClose={pdfPreview.close} />
    </>
  )
}
