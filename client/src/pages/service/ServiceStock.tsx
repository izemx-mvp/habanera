import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, AlertCircle, Sparkles, Check } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat, FieldLabel } from '@/components/ui'
import { Drawer } from '@/components/Drawer'
import { DataTable } from '@/components/DataTable'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { stockAt, realStockAt, stockDoseBreakdown, productVolumeLiters, LOCATION_LABEL } from '@/data/selectors'
import { recordPhysicalStock } from '@/data/actions'
import { useDataVersion } from '@/store/data-version'
import type { Product } from '@/data/types'

export default function ServiceStock() {
  useDataVersion()
  const navigate = useNavigate()

  // Drawer state for physical count
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [inventoryTargetLocation, setInventoryTargetLocation] = useState<'bar' | 'cuisine'>('bar')
  const [inventoryDrawerOpen, setInventoryDrawerOpen] = useState(false)
  const [physicalCount, setPhysicalCount] = useState<number>(0)
  const [inventoryComment, setInventoryComment] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Dans la configuration actuelle, on utilise uniquement la carte des boissons du Bar
  // comme produits partagés Bar / Cuisine
  const displayedProducts = PRODUCTS.filter((p) => p.active && p.location === 'bar')

  // Lignes de stock pour les produits Bar / Cuisine
  const rows = displayedProducts.map((p) => {
    const theoretical = stockAt('bar', p.id)
    const real = realStockAt('bar', p.id)
    const variance = real - theoretical
    const dosesInfo = stockDoseBreakdown('bar', p.id)

    return {
      product: p,
      location: 'bar' as const,
      theoretical,
      real,
      variance,
      dosesInfo,
    }
  })

  function handleOpenInventory(p: Product, currentReal: number) {
    setSelectedProduct(p)
    setInventoryTargetLocation('bar')
    setPhysicalCount(currentReal)
    setInventoryComment('')
    setInventoryDrawerOpen(true)
    setSuccessMsg(null)
  }

  function handleSaveInventory() {
    if (!selectedProduct) return
    const res = recordPhysicalStock(
      'bar',
      selectedProduct.id,
      physicalCount,
      'u-service-1',
      inventoryComment || `Inventaire physique terrain Bar / Cuisine`
    )
    if (res.ok) {
      setSuccessMsg(`Inventaire physique enregistré pour ${selectedProduct.name}`)
      setTimeout(() => {
        setInventoryDrawerOpen(false)
        setSuccessMsg(null)
      }, 1000)
    }
  }

  return (
    <>
      <PageHeader
        title="Stock Bar / Cuisine"
        subtitle="Suivi des stocks fixes, fiches produits, inventaires physiques et gestion fine des portions (doses & cl)."
      />

      <Section>
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Articles en stock" value={String(displayedProducts.length)} hint="Boissons & spiritueux" />
          <Stat
            label="Écarts constatés (Physique)"
            value={String(rows.filter((r) => Math.abs(r.variance) > 0.01).length)}
            tone={rows.some((r) => Math.abs(r.variance) > 0.01) ? 'warning' : 'success'}
            hint="Différences de comptage"
          />
          <Stat label="Suivi doses & cl" value="Actif" hint="Spiritueux déduits en portions (5 cl)" />
          <Stat label="Statut inventaire" value="À jour" tone="success" hint="Stock théorique calculé en continu" />
        </div>

        {/* INFO NOTICE */}
        <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[13px] text-ink-700 dark:text-ink-300 flex items-start gap-3">
          <Sparkles className="text-copper shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-ink-900 dark:text-ink-100">Stock opérationnel unifié Bar / Cuisine : </span>
            Toutes les références sont suivies avec leur stock théorique et leur stock physique réel. Les spiritueux décomptent mathématiquement les doses servies (5 cl) issues des caisses pour maintenir les bouteilles entamées sans rupture artificielle.
          </div>
        </div>

        {/* TABLE */}
        <DataTable
          rows={rows}
          onRowClick={(r) => navigate(`/produits/${r.product.id}`)}
          searchKeys={(r) => `${r.product.name} ${LOCATION_LABEL[r.location]}`}
          searchPlaceholder="Rechercher une boisson, un ingrédient, une référence…"
          pageSize={15}
          columns={[
            {
              key: 'name',
              label: 'PRODUIT & DÉCLINAISONS',
              render: (r) => (
                <div>
                  <div className="font-medium text-ink-900 dark:text-ink-100">{r.product.name}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400">
                    {CATEGORY_LABEL[r.product.categoryId]}
                    {r.product.dosesPerBottle && (
                      <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-copper/10 text-copper font-medium">
                        Bouteille / Dose : 1 btl = {r.product.dosesPerBottle} doses ({r.product.servingCl ?? 5} cl)
                      </span>
                    )}
                    {r.product.packSize && (
                      <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-ink-200 dark:bg-ink-800 text-ink-600 dark:text-ink-300 font-medium">
                        Bouteille / Pack de {r.product.packSize} u
                      </span>
                    )}
                  </div>
                </div>
              ),
              sortValue: (r) => r.product.name,
            },
            {
              key: 'theoretical',
              label: 'STOCK THÉORIQUE',
              render: (r) => (
                <div>
                  <div className="font-semibold text-ink-900 dark:text-ink-100">
                    {r.dosesInfo.display}
                  </div>
                  {r.dosesInfo.openBottleDetail && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                      {r.dosesInfo.openBottleDetail}
                    </div>
                  )}
                </div>
              ),
              sortValue: (r) => r.theoretical,
            },
            {
              key: 'real',
              label: 'STOCK RÉEL (PHYSIQUE)',
              render: (r) => {
                const isSpirit = r.product.storageUnit === 'bouteille' && r.product.dosesPerBottle && r.product.dosesPerBottle > 1
                const realFull = Math.floor(r.real)
                const realOpen = Math.round((r.real - realFull) * (r.product.dosesPerBottle || 1))
                const realDisplay = isSpirit && realOpen > 0
                  ? (realFull === 0 ? `0 btl + ${realOpen} doses (${r.real.toFixed(2)} btl)` : `${realFull} btl & ${realOpen} doses (${r.real.toFixed(2)} btl)`)
                  : `${r.real} ${r.product.storageUnit}`

                return (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-800 dark:text-ink-200">
                      {realDisplay}
                    </span>
                    <button
                      className="p-1 text-ink-400 hover:text-copper transition"
                      title="Ajuster le relevé physique"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenInventory(r.product, r.real)
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                )
              },
              sortValue: (r) => r.real,
            },
            {
              key: 'volume',
              label: 'VOLUME EN LITRES',
              render: (r) => {
                const volLiters = productVolumeLiters(r.product, r.real)
                if (volLiters <= 0 && r.real <= 0) {
                  return <span className="text-ink-400 text-xs">—</span>
                }
                return (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-800 dark:text-ink-200">
                    {volLiters.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L
                  </span>
                )
              },
              sortValue: (r) => productVolumeLiters(r.product, r.real),
            },
            {
              key: 'variance',
              label: 'ÉCART ET STATUT DE CONFORMITÉ',
              render: (r) => {
                const diff = r.variance
                if (Math.abs(diff) < 0.01) {
                  return (
                    <span className="inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Check size={12} />
                      0 (Conforme)
                    </span>
                  )
                }

                // Pour les spiritueux, conversion de l'écart en doses si applicable
                const isNegative = diff < 0
                let varianceDetail = `${diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} ${r.product.storageUnit}`
                if (r.product.storageUnit === 'bouteille' && r.product.dosesPerBottle) {
                  const dosesDiff = Math.round(diff * r.product.dosesPerBottle)
                  varianceDetail = `${dosesDiff > 0 ? `+${dosesDiff}` : dosesDiff} doses (${diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} btl)`
                }

                return (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full',
                      isNegative
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    )}
                  >
                    <AlertCircle size={12} />
                    {varianceDetail} (Non conforme - Écart inventaire)
                  </span>
                )
              },
              sortValue: (r) => r.variance,
            },
            {
              key: 'actions',
              label: 'Action',
              render: (r) => (
                <button
                  className="btn-secondary btn-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenInventory(r.product, r.real)
                  }}
                >
                  Compter
                </button>
              ),
            },
          ]}
        />
      </Section>

      {/* DRAWER INVENTAIRE PHYSIQUE */}
      <Drawer
        open={inventoryDrawerOpen}
        onClose={() => setInventoryDrawerOpen(false)}
        title={selectedProduct ? `Relevé physique · ${selectedProduct.name}` : "Relevé d'inventaire"}
        subtitle={`Service : ${LOCATION_LABEL[inventoryTargetLocation]}`}
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setInventoryDrawerOpen(false)}>
              Annuler
            </button>
            <button className="btn-primary btn-sm" onClick={handleSaveInventory}>
              Enregistrer l'inventaire
            </button>
          </>
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <Check size={14} />
                {successMsg}
              </div>
            )}

            <div>
              <FieldLabel>Service concerné</FieldLabel>
              <select
                className="input"
                value={inventoryTargetLocation}
                onChange={(e) => setInventoryTargetLocation(e.target.value as 'bar' | 'cuisine')}
              >
                <option value="bar">Bar</option>
                <option value="cuisine">Cuisine</option>
              </select>
            </div>

            <div className="p-3 bg-ink-50 dark:bg-ink-800/60 rounded-xl border border-ink-200 dark:border-ink-700 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Stock Théorique actuel :</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">
                  {stockAt(inventoryTargetLocation, selectedProduct.id)} {selectedProduct.storageUnit}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Détail des portions :</span>
                <span className="text-copper font-medium">
                  {stockDoseBreakdown(inventoryTargetLocation, selectedProduct.id).display}
                </span>
              </div>
            </div>

            <div>
              <FieldLabel>Quantité physique réellement constatée ({selectedProduct.storageUnit})</FieldLabel>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={physicalCount}
                onChange={(e) => setPhysicalCount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <FieldLabel>Commentaire ou motif de l'écart (optionnel)</FieldLabel>
              <textarea
                rows={3}
                className="input"
                placeholder="Ex. Bouteille entamée comptée, perte constatée lors du rush..."
                value={inventoryComment}
                onChange={(e) => setInventoryComment(e.target.value)}
              />
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
