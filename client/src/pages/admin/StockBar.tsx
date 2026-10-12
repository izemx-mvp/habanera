import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Sparkles, Check, Edit3 } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat, FieldLabel } from '@/components/ui'
import { Drawer } from '@/components/Drawer'
import { DataTable } from '@/components/DataTable'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { stockAt, realStockAt, stockDoseBreakdown, productVolumeLiters } from '@/data/selectors'
import { recordPhysicalStock } from '@/data/actions'
import { useDataVersion } from '@/store/data-version'
import type { Product } from '@/data/types'

export default function AdminStockBar() {
  useDataVersion()
  const navigate = useNavigate()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [inventoryDrawerOpen, setInventoryDrawerOpen] = useState(false)
  const [physicalCount, setPhysicalCount] = useState<number>(0)
  const [inventoryComment, setInventoryComment] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Produits attribués au Bar
  const barProducts = PRODUCTS.filter((p) => p.active && p.location === 'bar')

  // Calculs statistiques
  const totalItems = barProducts.length
  let totalDiscrepancies = 0

  const rows = barProducts.map((p) => {
    const theoretical = stockAt('bar', p.id)
    const real = realStockAt('bar', p.id)
    const variance = real - theoretical
    if (Math.abs(variance) > 0.01) totalDiscrepancies++

    const dosesInfo = stockDoseBreakdown('bar', p.id)

    return {
      product: p,
      theoretical,
      real,
      variance,
      dosesInfo,
    }
  })

  function handleOpenInventory(p: Product, currentReal: number) {
    setSelectedProduct(p)
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
      'usr-admin-1',
      inventoryComment || 'Relevé physique Bar'
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
        title="Stock Bar"
        subtitle="Suivi précis du Bar : Stock Théorique (flux J-1), Stock Réel compté, fonds de bouteilles et conversion en doses."
        actions={
          <button
            className="btn-primary btn-sm"
            onClick={() => {
              if (barProducts[0]) handleOpenInventory(barProducts[0], realStockAt('bar', barProducts[0].id))
            }}
          >
            <Edit3 size={14} />
            Relevé d'inventaire rapide
          </button>
        }
      />

      <Section>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat label="Références au Bar" value={String(totalItems)} />
          <Stat
            label="Écarts constatés (Théorique vs Réel)"
            value={String(totalDiscrepancies)}
            tone={totalDiscrepancies > 0 ? 'warning' : 'success'}
            hint={totalDiscrepancies > 0 ? 'Vérifier les relevés physiques' : 'Aucun écart détecté'}
          />
          <Stat
            label="Gestion des portions fines"
            value="Active"
            hint="Doses & cl déduits en temps réel"
          />
        </div>

        {/* Info Banner Rule 3.1 & 3.2 */}
        <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[13px] text-ink-700 dark:text-ink-300 flex items-start gap-3">
          <Sparkles className="text-copper shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-ink-900 dark:text-ink-100">Règle de gestion du Bar : </span>
            Le stock fixe théorique est calculé automatiquement à partir des flux réels (ouvertures, ventes Z, transferts). 
            Les bouteilles entamées sont décomptées en <strong>unités fines (doses de 5 cl)</strong>. Les alertes de réapprovisionnement d'urgence 
            ne se déclenchent qu'au niveau central de l'Économat dès lors que le cumul global descend sous le seuil critique.
          </div>
        </div>

        {/* Table */}
        <DataTable
          rows={rows}
          onRowClick={(r) => navigate(`/produits/${r.product.id}`)}
          searchKeys={(r) => r.product.name}
          searchPlaceholder="Rechercher une boisson, un spiritueux, un soft…"
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

      {/* Drawer Inventaire Réel */}
      <Drawer
        open={inventoryDrawerOpen}
        onClose={() => setInventoryDrawerOpen(false)}
        title={selectedProduct ? `Relevé physique · ${selectedProduct.name}` : "Relevé d'inventaire"}
        subtitle="Enregistrez la quantité physique réellement constatée au Bar."
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
              <FieldLabel>Produit sélectionné</FieldLabel>
              <div className="font-semibold text-ink-900 dark:text-ink-100">{selectedProduct.name}</div>
              <div className="text-xs text-ink-500">
                Unité de stockage : {selectedProduct.storageUnit} · Déclinaison : {selectedProduct.dosesPerBottle ? `${selectedProduct.dosesPerBottle} doses/btl` : 'Standard'}
              </div>
            </div>

            <div className="p-3 bg-ink-50 dark:bg-ink-800/60 rounded-xl border border-ink-200 dark:border-ink-700 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Stock Théorique actuel :</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">
                  {stockAt('bar', selectedProduct.id)} {selectedProduct.storageUnit}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Détail des portions :</span>
                <span className="text-copper font-medium">
                  {stockDoseBreakdown('bar', selectedProduct.id).display}
                </span>
              </div>
            </div>

            <div>
              <FieldLabel>Quantité physique réellement comptée ({selectedProduct.storageUnit})</FieldLabel>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={physicalCount}
                onChange={(e) => setPhysicalCount(parseFloat(e.target.value) || 0)}
              />
              <span className="text-[11px] text-ink-400 mt-1 block">
                Exemple : 4 bouteilles pleines et 3 doses restantes = {(4 + 3 / (selectedProduct.dosesPerBottle || 15)).toFixed(2)} btl
              </span>
            </div>

            <div>
              <FieldLabel>Commentaire ou motif de l'écart (optionnel)</FieldLabel>
              <textarea
                rows={3}
                className="input"
                placeholder="Ex. Bouteille entamée retrouvée derrière le comptoir, casse non déclarée..."
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
