import { useState } from 'react'
import {
  FileDown,
  FileText,
  Plus,
  Truck,
  Building2,
  Sparkles,
  Star,
  Clock,
  Check,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, FieldLabel, Card, Empty } from '@/components/ui'
import { Drawer } from '@/components/Drawer'
import { DataTable } from '@/components/DataTable'
import { PdfPreviewModal } from '@/components/PdfPreviewModal'
import { StatusBadge } from '@/components/StatusBadge'
import { LineItemsEditor, type Line } from '@/components/LineItemsEditor'
import { PRODUCTS, productById } from '@/data/catalog'
import { PURCHASE_ORDERS } from '@/data/generate'
import { fmtDate, fmtMAD, PO_STATUS_LABEL, receiptsFor, supplierName, productsToReplenishWithQuotes } from '@/data/selectors'
import {
  createPurchaseOrder,
  receivePurchaseOrder,
  createGroupedPurchaseOrder,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '@/data/actions'
import { downloadPdf, purchaseOrderPDF } from '@/lib/pdf'
import { usePdfPreview } from '@/lib/use-pdf-preview'
import { PERSONA_USER_ID, SUPPLIERS } from '@/data/referentials'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { PurchaseOrder, Supplier } from '@/data/types'

export function CommandesView() {
  useDataVersion()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]

  // Unified tabs (Section 5)
  const [activeTab, setActiveTab] = useState<'commandes' | 'fournisseurs' | 'recommandations'>('commandes')

  // Orders state
  const rows = [...PURCHASE_ORDERS].sort((a, b) => b.date.localeCompare(a.date))
  const [newOpen, setNewOpen] = useState(false)
  const [supplierId, setSupplierId] = useState(SUPPLIERS[0]?.id ?? '')
  const [lines, setLines] = useState<Line[]>([{ productId: PRODUCTS[0].id, qty: 1 }])
  const [expectedDate, setExpectedDate] = useState('')
  const [orderError, setOrderError] = useState<string | null>(null)

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({})

  // Supplier CRUD state
  const [supplierDrawerOpen, setSupplierDrawerOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    address: '',
    ratingQuality: 4.8,
    deliveryDelayDays: 2,
    priceIndex: 'Moyen' as 'Économique' | 'Moyen' | 'Premium',
  })

  // AI Grouped Recommendations state
  const replenishItems = productsToReplenishWithQuotes()
  const [groupedSuccess, setGroupedSuccess] = useState<string | null>(null)

  const pdfPreview = usePdfPreview()

  function submitNewOrder() {
    const res = createPurchaseOrder(
      supplierId,
      userId,
      lines.map((l) => ({ productId: l.productId, qty: l.qty, unitCost: null })),
      expectedDate || undefined
    )
    if (!res.ok) return setOrderError(res.error)
    setNewOpen(false)
    setLines([{ productId: PRODUCTS[0].id, qty: 1 }])
    setExpectedDate('')
    setOrderError(null)
  }

  function openDetail(po: PurchaseOrder) {
    setSelectedPO(po)
    const init: Record<string, number> = {}
    for (const it of po.items) init[it.productId] = it.qtyOrdered - it.qtyReceived
    setReceiveQty(init)
    setOrderError(null)
  }

  function submitReceive() {
    if (!selectedPO) return
    const res = receivePurchaseOrder(
      selectedPO.id,
      userId,
      Object.entries(receiveQty).map(([productId, qty]) => ({ productId, qty })),
    )
    if (!res.ok) return setOrderError(res.error)
    setSelectedPO({ ...selectedPO })
    setOrderError(null)
  }

  function handleSaveSupplier() {
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm)
    } else {
      createSupplier({
        name: supplierForm.name,
        contact: 'Direction commerciale',
        email: 'contact@fournisseur.ma',
        city: 'Casablanca',
        phone: supplierForm.phone,
        address: supplierForm.address,
        ratingQuality: supplierForm.ratingQuality,
        deliveryDelayDays: supplierForm.deliveryDelayDays,
        priceIndex: supplierForm.priceIndex,
        paymentTerms: '30 jours fin de mois',
      })
    }
    setSupplierDrawerOpen(false)
    setEditingSupplier(null)
  }

  function handleOpenCreateSupplier() {
    setEditingSupplier(null)
    setSupplierForm({
      name: '',
      phone: '+212 5 22 00 00 00',
      address: 'Zone Industrielle Ain Sebaa, Casablanca',
      ratingQuality: 4.8,
      deliveryDelayDays: 2,
      priceIndex: 'Moyen',
    })
    setSupplierDrawerOpen(true)
  }

  function handleOpenEditSupplier(s: Supplier) {
    setEditingSupplier(s)
    setSupplierForm({
      name: s.name,
      phone: s.phone,
      address: s.address ?? 'Casablanca, Maroc',
      ratingQuality: s.ratingQuality ?? 4.5,
      deliveryDelayDays: s.deliveryDelayDays ?? 2,
      priceIndex: (s.priceIndex === 'économique' || s.priceIndex === 'Économique') ? 'Économique' : (s.priceIndex === 'premium' || s.priceIndex === 'Premium') ? 'Premium' : 'Moyen',
    })
    setSupplierDrawerOpen(true)
  }

  // Handle Grouped AI Order (Section 5.3)
  function handleGenerateGroupedOrder(supplierIdToGroup: string, itemsToGroup: { productId: string; qty: number }[], reason: string) {
    const res = createGroupedPurchaseOrder(supplierIdToGroup, userId, itemsToGroup, reason)
    if (res.ok) {
      setGroupedSuccess(`Bon de commande groupé généré avec succès (${res.orderId}) auprès de ${supplierName(supplierIdToGroup)} !`)
      setTimeout(() => setGroupedSuccess(null), 4000)
    }
  }

  return (
    <>
      <PageHeader
        title="Fournisseurs, Commandes & Recommandations IA"
        subtitle="Espace unifié de gestion des approvisionnements : catalogue fournisseurs, suivi des BDC et anticipation intelligente des besoins."
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'commandes' && (
              <button className="btn-primary btn-sm" onClick={() => setNewOpen(true)}>
                <Plus size={14} />
                Nouvelle commande
              </button>
            )}
            {activeTab === 'fournisseurs' && (
              <button className="btn-primary btn-sm" onClick={handleOpenCreateSupplier}>
                <Plus size={14} />
                Nouveau fournisseur
              </button>
            )}
          </div>
        }
      />

      <Section>
        {/* Navigation Tabs (Section 5) */}
        <div className="flex gap-2 mb-6 border-b border-ink-200 dark:border-ink-800 pb-3">
          <button
            className={clsx(
              'chip flex items-center gap-2',
              activeTab === 'commandes' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
            )}
            onClick={() => setActiveTab('commandes')}
          >
            <Truck size={14} />
            Commandes fournisseurs ({rows.length})
          </button>
          <button
            className={clsx(
              'chip flex items-center gap-2',
              activeTab === 'fournisseurs' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
            )}
            onClick={() => setActiveTab('fournisseurs')}
          >
            <Building2 size={14} />
            Annuaire Fournisseurs ({SUPPLIERS.length})
          </button>
          <button
            className={clsx(
              'chip flex items-center gap-2',
              activeTab === 'recommandations' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
            )}
            onClick={() => setActiveTab('recommandations')}
          >
            <Sparkles size={14} className="text-copper" />
            Recommandations & Achats groupés IA
          </button>
        </div>

        {groupedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <Check size={16} />
            {groupedSuccess}
          </div>
        )}

        {/* TAB 1: COMMANDES FOURNISSEURS */}
        {activeTab === 'commandes' && (
          <DataTable
            rows={rows}
            onRowClick={openDetail}
            searchKeys={(po) => `${po.id} ${supplierName(po.supplierId)}`}
            searchPlaceholder="Rechercher une commande, un fournisseur…"
            columns={[
              {
                key: 'id',
                label: 'Numéro BDC',
                render: (po) => (
                  <div>
                    <span className="font-semibold text-ink-900 dark:text-ink-100">{po.id}</span>
                    {po.isGroupedOrder && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-copper/10 text-copper font-medium">
                        Groupée IA
                      </span>
                    )}
                  </div>
                ),
              },
              { key: 'supplier', label: 'Fournisseur', render: (po) => supplierName(po.supplierId) },
              { key: 'date', label: 'Date émission', render: (po) => fmtDate(po.date), sortValue: (po) => po.date },
              {
                key: 'eta',
                label: 'Date estimée (ETA)',
                render: (po) => (
                  <span className="text-xs text-ink-600 dark:text-ink-400">
                    {po.expectedDeliveryDate ? fmtDate(po.expectedDeliveryDate) : 'Sous 48h'}
                  </span>
                ),
              },
              { key: 'items', label: 'Articles', render: (po) => `${po.items.length} réf.` },
              { key: 'status', label: 'Statut', render: (po) => <StatusBadge status={po.status} label={PO_STATUS_LABEL[po.status]} /> },
            ]}
          />
        )}

        {/* TAB 2: GESTION DES FOURNISSEURS (CRUD + Détails) */}
        {activeTab === 'fournisseurs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPLIERS.map((s) => (
              <Card key={s.id} className="relative group hover:border-copper/40 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-[14px] text-ink-900 dark:text-ink-50">{s.name}</h3>
                    <div className="text-xs text-ink-500">{s.phone}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 text-ink-400 hover:text-ink-800 transition"
                      onClick={() => handleOpenEditSupplier(s)}
                      title="Modifier"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="p-1 text-ink-400 hover:text-red-600 transition"
                      onClick={() => deleteSupplier(s.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-ink-600 dark:text-ink-400 my-3">
                  <div><strong>Adresse : </strong>{s.address ?? 'Zone Industrielle, Casablanca'}</div>
                  <div className="flex items-center gap-1.5">
                    <strong>Qualité : </strong>
                    <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                      <Star size={12} fill="currentColor" /> {s.ratingQuality ?? 4.8} / 5
                    </span>
                  </div>
                  <div><strong>Délai moyen de livraison : </strong>{s.deliveryDelayDays ?? 2} jours</div>
                  <div><strong>Indice de prix : </strong><span className="font-medium text-ink-800 dark:text-ink-200">{s.priceIndex ?? 'Moyen'}</span></div>
                  <div><strong>Modalités : </strong>{s.paymentTerms}</div>
                </div>

                <div className="pt-2 border-t border-ink-100 dark:border-ink-800 flex justify-between items-center text-[11px] text-ink-400">
                  <span>Fournisseur certifié</span>
                  <button
                    className="text-copper hover:underline font-medium"
                    onClick={() => {
                      setSupplierId(s.id)
                      setActiveTab('commandes')
                      setNewOpen(true)
                    }}
                  >
                    Passer commande &rarr;
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: RECOMMANDATIONS IA & ACHATS GROUPÉS (Section 5.3) */}
        {activeTab === 'recommandations' && (
          <div className="space-y-6">
            {/* Banner IA Grouped Purchasing */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-copper/10 via-amber-500/10 to-transparent border border-copper/30">
              <div className="flex items-start gap-3">
                <Sparkles className="text-copper shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-ink-900 dark:text-ink-100">
                    Anticipation des ruptures à 5 jours & Regroupement intelligent des achats
                  </h4>
                  <p className="text-xs text-ink-600 dark:text-ink-300 mt-1 leading-relaxed">
                    L'IA analyse le rythme de consommation et les délais de livraison. Plutôt que de multiplier les commandes isolées, elle regroupe les produits d'un même fournisseur afin de minimiser les frais de transport et sécuriser les stocks avant rupture.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Grouping Proposal Box */}
            <Card title="Suggestion d'Achat Groupé Intelligent" className="border-copper/40">
              <div className="p-3 bg-ink-50 dark:bg-ink-800/40 rounded-xl mb-4 text-xs">
                <span className="font-semibold text-ink-900 dark:text-ink-100">Opportunité détectée : </span>
                Le fournisseur <strong>Brasseries du Maroc</strong> livre actuellement la Bière Heineken (stock bas). L'IA suggère d'inclure dès aujourd'hui la bière Casablanca et le Mortlach prévus en rupture dans 5 jours pour optimiser le franco de port.
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-ink-500">Articles groupés : </span>
                    <strong className="text-ink-900 dark:text-ink-100">Heineken (70 u) + Casablanca (48 u)</strong>
                  </div>
                  <div>
                    <span className="text-ink-500">Fournisseur commun : </span>
                    <strong className="text-copper">Brasseries du Maroc</strong>
                  </div>
                </div>
                <button
                  className="btn-primary btn-sm flex items-center gap-1.5"
                  onClick={() =>
                    handleGenerateGroupedOrder(
                      'sup-brasseries-maroc',
                      [
                        { productId: 'prod-heineken', qty: 70 },
                        { productId: 'prod-casablanca', qty: 48 },
                      ],
                      'Anticipation de rupture à 5 jours et optimisation de livraison groupée'
                    )
                  }
                >
                  <Layers size={14} />
                  Générer la commande groupée
                </button>
              </div>
            </Card>

            {/* Detailed Items to replenish */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-ink-900 dark:text-ink-100">
                Besoins unitaires & devis comparatifs IA
              </h3>
              {replenishItems.length === 0 ? (
                <Empty>Tous les stocks couvrent largement les besoins des 5 prochains jours.</Empty>
              ) : (
                replenishItems.map(({ product, currentQty, urgent, quotes }) => (
                  <Card key={product.id}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-sm text-ink-900 dark:text-ink-100">{product.name}</div>
                        <div className="text-xs text-ink-500">
                          Stock actuel : {currentQty} {product.storageUnit} · Seuil Économat : {product.minStock}
                        </div>
                      </div>
                      {urgent && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400">
                          Rupture imminente
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-ink-100 dark:border-ink-800 text-ink-400 font-medium">
                            <th className="text-left py-1.5">Fournisseur</th>
                            <th className="text-right py-1.5">Prix unitaire</th>
                            <th className="text-right py-1.5">Délai</th>
                            <th className="text-right py-1.5">Qualité</th>
                            <th className="text-left py-1.5 pl-3">Recommandation IA</th>
                            <th className="text-right py-1.5">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotes.map((q) => (
                            <tr key={q.supplierId} className="border-b border-ink-50 dark:border-ink-900 last:border-0">
                              <td className="py-2 font-medium">{q.supplierName}</td>
                              <td className="py-2 text-right">{fmtMAD(q.unitPrice)}</td>
                              <td className="py-2 text-right">{q.delayDays} j</td>
                              <td className="py-2 text-right text-amber-600 font-semibold">{q.qualityRating}/5</td>
                              <td className="py-2 pl-3">
                                <span className={clsx('px-1.5 py-0.5 rounded text-[11px] font-medium', q.decision.includes('Recommandé') ? 'bg-copper/15 text-copper' : 'text-ink-400')}>
                                  {q.decision}
                                </span>
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  className="btn-secondary btn-xs"
                                  onClick={() => {
                                    createPurchaseOrder(q.supplierId, userId, [{ productId: product.id, qty: product.targetStock ?? product.minStock * 2, unitCost: q.unitPrice }])
                                    setGroupedSuccess(`Commande créée pour ${product.name} auprès de ${q.supplierName}`)
                                  }}
                                >
                                  Commander
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </Section>

      {/* DRAWER NOUVELLE COMMANDE */}
      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Créer un bon de commande fournisseur"
        subtitle="Le stock central ne sera incrémenté qu'à la validation de réception physique."
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setNewOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submitNewOrder}>Émettre la commande</button>
          </>
        }
      >
        {orderError && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{orderError}</div>}
        <div className="space-y-4">
          <div>
            <FieldLabel>Fournisseur</FieldLabel>
            <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              {SUPPLIERS.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Date estimée d'arrivée (ETA)</FieldLabel>
            <input
              type="date"
              className="input text-xs"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Articles commandés</FieldLabel>
            <LineItemsEditor products={PRODUCTS.filter((p) => p.active)} lines={lines} onChange={setLines} />
          </div>
        </div>
      </Drawer>

      {/* DRAWER GESTION FOURNISSEUR CRUD */}
      <Drawer
        open={supplierDrawerOpen}
        onClose={() => setSupplierDrawerOpen(false)}
        title={editingSupplier ? `Modifier ${editingSupplier.name}` : 'Nouveau fournisseur'}
        subtitle="Coordonnées, tarifs et notation de qualité de service."
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setSupplierDrawerOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={handleSaveSupplier}>
              {editingSupplier ? 'Mettre à jour' : 'Ajouter le fournisseur'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel>Nom du fournisseur</FieldLabel>
            <input
              type="text"
              className="input"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="Ex. Brasseries du Maroc"
            />
          </div>
          <div>
            <FieldLabel>Téléphone de contact</FieldLabel>
            <input
              type="text"
              className="input"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Adresse physique</FieldLabel>
            <input
              type="text"
              className="input"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Délai moyen (jours)</FieldLabel>
              <input
                type="number"
                min="1"
                className="input"
                value={supplierForm.deliveryDelayDays}
                onChange={(e) => setSupplierForm({ ...supplierForm, deliveryDelayDays: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <FieldLabel>Note Qualité (sur 5)</FieldLabel>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                className="input"
                value={supplierForm.ratingQuality}
                onChange={(e) => setSupplierForm({ ...supplierForm, ratingQuality: parseFloat(e.target.value) || 5 })}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Indice de prix</FieldLabel>
            <select
              className="input"
              value={supplierForm.priceIndex}
              onChange={(e) => setSupplierForm({ ...supplierForm, priceIndex: e.target.value as any })}
            >
              <option value="Économique">Économique (Moins cher)</option>
              <option value="Moyen">Moyen (Rapport qualité/prix)</option>
              <option value="Premium">Premium (Qualité supérieure)</option>
            </select>
          </div>
        </div>
      </Drawer>

      {/* DRAWER DÉTAIL COMMANDE BDC */}
      {selectedPO && (
        <Drawer
          open={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          title={selectedPO.id}
          subtitle={`${supplierName(selectedPO.supplierId)} · ${PO_STATUS_LABEL[selectedPO.status]}`}
          width={600}
        >
          {orderError && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{orderError}</div>}

          {/* ETA Banner */}
          <div className="p-3 bg-ink-50 dark:bg-ink-800/50 rounded-xl border border-ink-200 dark:border-ink-700 text-xs text-ink-600 dark:text-ink-400 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-copper" />
              <span>Date d'arrivée prévue : <strong>{selectedPO.expectedDeliveryDate ? fmtDate(selectedPO.expectedDeliveryDate) : 'Sous 48h'}</strong></span>
            </div>
            {selectedPO.isGroupedOrder && (
              <span className="font-semibold text-copper">Groupement IA</span>
            )}
          </div>

          <div className="card overflow-hidden mb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                  <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Produit</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Commandé</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Reçu</th>
                  <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Coût unitaire</th>
                  {selectedPO.status !== 'receptionnee' && selectedPO.status !== 'annulee' && (
                    <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">À réceptionner</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {selectedPO.items.map((it) => {
                  const remaining = it.qtyOrdered - it.qtyReceived
                  return (
                    <tr key={it.productId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                      <td className="px-3 py-2">{productById(it.productId)?.name}</td>
                      <td className="px-3 py-2 text-right">{it.qtyOrdered}</td>
                      <td className="px-3 py-2 text-right font-medium">{it.qtyReceived}</td>
                      <td className="px-3 py-2 text-right">{fmtMAD(it.unitCost)}</td>
                      {selectedPO.status !== 'receptionnee' && selectedPO.status !== 'annulee' && (
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

          {receiptsFor(selectedPO.id).length > 0 && (
            <div className="mb-5">
              <div className="label mb-2">Historique des réceptions terrain</div>
              <div className="space-y-1">
                {receiptsFor(selectedPO.id).map((r) => (
                  <div key={r.id} className="text-[12.5px] text-ink-600">
                    {r.id} — {fmtDate(r.date)} — {r.items.reduce((s, i) => s + i.qtyReceived, 0)} unité(s) réceptionnée(s)
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPO.status !== 'receptionnee' && selectedPO.status !== 'annulee' && (
            <button className="btn-primary btn-sm mb-5 w-full" onClick={submitReceive}>
              Confirmer la réception physique (Incrémente le stock)
            </button>
          )}

          <div className="flex gap-2">
            <button className="btn-ghost btn-sm" onClick={() => pdfPreview.open(() => purchaseOrderPDF(selectedPO), `${selectedPO.id}.pdf`)}>
              <FileText size={14} />
              Aperçu PDF (BDC)
            </button>
            <button className="btn-ghost btn-sm" onClick={() => downloadPdf(purchaseOrderPDF(selectedPO), `${selectedPO.id}.pdf`)}>
              <FileDown size={14} />
              Télécharger PDF (BDC)
            </button>
          </div>
        </Drawer>
      )}

      <PdfPreviewModal doc={pdfPreview.doc} filename={pdfPreview.filename} onClose={pdfPreview.close} />
    </>
  )
}
