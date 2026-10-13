import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Sparkles, Check, Edit3 } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat, FieldLabel } from '@/components/ui'
import { Drawer } from '@/components/Drawer'
import { DataTable } from '@/components/DataTable'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { realStockAt, theoreticalStockAt, stockDoseBreakdown, productVolumeLiters } from '@/data/selectors'
import { setTheoreticalStock } from '@/data/actions'
import { useDataVersion } from '@/store/data-version'
import type { Product } from '@/data/types'

export default function ServiceStock() {
  useDataVersion()
  const navigate = useNavigate()

  // Drawer state for theoretical stock adjustment
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [theoreticalDrawerOpen, setTheoreticalDrawerOpen] = useState(false)
  const [theoInput, setTheoInput] = useState<number>(0)
  const [theoComment, setTheoComment] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Dans la configuration actuelle, on utilise la carte des boissons du Bar (partagée Bar / Cuisine)
  const displayedProducts = PRODUCTS.filter((p) => p.active && p.location === 'bar')

  // Lignes de stock pour les produits Bar / Cuisine
  const rows = displayedProducts.map((p) => {
    // Stock Théorique (Fixe de référence, modifiable par l'Administrateur / Manager)
    const theoretical = theoreticalStockAt('bar', p.id)
    // Stock Réel (Physique) : Recalculé automatiquement selon les flux réels (ventes Z, réceptions)
    const real = realStockAt('bar', p.id)
    const variance = real - theoretical

    const dosesInfo = stockDoseBreakdown('bar', p.id, real)
    const theoDosesInfo = stockDoseBreakdown('bar', p.id, theoretical)

    return {
      product: p,
      location: 'bar' as const,
      theoretical,
      real,
      variance,
      dosesInfo,
      theoDosesInfo,
    }
  })

  function handleOpenTheoretical(p: Product, currentTheo: number) {
    setSelectedProduct(p)
    setTheoInput(currentTheo)
    setTheoComment('')
    setTheoreticalDrawerOpen(true)
    setSuccessMsg(null)
  }

  function handleSaveTheoretical() {
    if (!selectedProduct) return
    const res = setTheoreticalStock(
      'bar',
      selectedProduct.id,
      theoInput,
      'usr-service-1',
      theoComment || 'Réajustement stock théorique de référence'
    )
    if (res.ok) {
      setSuccessMsg(`Stock Théorique de référence enregistré pour ${selectedProduct.name}`)
      setTimeout(() => {
        setTheoreticalDrawerOpen(false)
        setSuccessMsg(null)
      }, 900)
    }
  }

  return (
    <>
      <PageHeader
        title="Stock (Bar / Cuisine)"
        subtitle="Gestion unifiée des stocks de service : Stock Théorique fixe de référence et Stock Réel recalculé en continu selon les ventes Z."
      />

      <Section>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat label="Articles en service" value={String(displayedProducts.length)} />
          <Stat
            label="Écarts constatés (Réel vs Référence)"
            value={String(rows.filter((r) => Math.abs(r.variance) > 0.01).length)}
            tone={rows.some((r) => Math.abs(r.variance) > 0.01) ? 'warning' : 'success'}
            hint="Rapprochement avec le stock théorique de référence"
          />
          <Stat
            label="Calcul continu des portions"
            value="Actif"
            hint="Doses & cl déduits en continu"
          />
        </div>

        {/* Explainability notice */}
        <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[13px] text-ink-700 dark:text-ink-300 flex items-start gap-3">
          <Sparkles className="text-copper shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-ink-900 dark:text-ink-100">Logique d'inventaire opérationnel : </span>
            Le <strong>Stock Réel (Physique)</strong> est calculé et actualisé en continu par le système selon les flux réels (clôtures de caisse Ticket Z et livraisons de bons de prélèvement).
            Le <strong>Stock Théorique (Fixe)</strong> constitue la dotation de référence ajustable via l'icône de crayon.
          </div>
        </div>

        {/* Tableau du stock avec colonnes séparées Produit et Déclinaison */}
        <DataTable
          rows={rows}
          onRowClick={(r) => navigate(`/produits/${r.product.id}`)}
          searchKeys={(r) => r.product.name}
          searchPlaceholder="Rechercher une référence au service…"
          pageSize={15}
          columns={[
            {
              key: 'name',
              label: 'PRODUIT',
              render: (r) => (
                <div>
                  <div className="font-medium text-ink-900 dark:text-ink-100">{r.product.name}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400">
                    {CATEGORY_LABEL[r.product.categoryId]}
                  </div>
                </div>
              ),
              sortValue: (r) => r.product.name,
            },
            {
              key: 'declinaison',
              label: 'DÉCLINAISON',
              render: (r) => {
                if (r.product.dosesPerBottle && r.product.storageUnit === 'bouteille') {
                  return (
                    <span className="inline-block px-2 py-0.5 rounded bg-copper/10 text-copper font-medium text-xs">
                      Bouteille / {r.product.dosesPerBottle} doses ({r.product.servingCl ?? 5} cl)
                    </span>
                  )
                }
                if (r.product.packSize) {
                  return (
                    <span className="inline-block px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 font-medium text-xs">
                      Bouteille / Pack de {r.product.packSize} u
                    </span>
                  )
                }
                return (
                  <span className="text-xs text-ink-500 font-medium">
                    {r.product.storageUnit === 'bouteille' ? 'Bouteille scellée' : `Unité (${r.product.storageUnit})`}
                  </span>
                )
              },
            },
            {
              key: 'theoretical',
              label: 'STOCK THÉORIQUE (FIXE)',
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink-900 dark:text-ink-100">
                    {r.theoDosesInfo.display}
                  </span>
                  <button
                    className="p-1 text-ink-400 hover:text-copper transition rounded hover:bg-ink-100 dark:hover:bg-ink-800"
                    title="Ajuster la référence théorique"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenTheoretical(r.product, r.theoretical)
                    }}
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              ),
              sortValue: (r) => r.theoretical,
            },
            {
              key: 'real',
              label: 'STOCK RÉEL (PHYSIQUE)',
              render: (r) => (
                <div>
                  <div className="font-medium text-ink-800 dark:text-ink-200">
                    {r.dosesInfo.display}
                  </div>
                  {r.dosesInfo.openBottleDetail && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                      {r.dosesInfo.openBottleDetail}
                    </div>
                  )}
                </div>
              ),
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
                    {varianceDetail} (Écart constaté)
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
                    handleOpenTheoretical(r.product, r.theoretical)
                  }}
                >
                  Ajuster réf.
                </button>
              ),
            },
          ]}
        />
      </Section>

      {/* DRAWER AJUSTEMENT STOCK THÉORIQUE DE RÉFÉRENCE */}
      <Drawer
        open={theoreticalDrawerOpen}
        onClose={() => setTheoreticalDrawerOpen(false)}
        title={selectedProduct ? `Stock Théorique (Fixe) · ${selectedProduct.name}` : "Ajuster la référence théorique"}
        subtitle="Ajustement de la dotation ou référence théorique au Bar / Cuisine."
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setTheoreticalDrawerOpen(false)}>
              Annuler
            </button>
            <button className="btn-primary btn-sm" onClick={handleSaveTheoretical}>
              Enregistrer la référence
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
                Catégorie : {CATEGORY_LABEL[selectedProduct.categoryId]} · Unité : {selectedProduct.storageUnit}
                {selectedProduct.dosesPerBottle ? ` · Conditionnement : 1 btl = ${selectedProduct.dosesPerBottle} doses (${selectedProduct.servingCl ?? 5} cl)` : ''}
              </div>
            </div>

            <div className="p-3 bg-ink-50 dark:bg-ink-800/60 rounded-xl border border-ink-200 dark:border-ink-700 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Stock Réel calculé en continu :</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100">
                  {stockDoseBreakdown('bar', selectedProduct.id, realStockAt('bar', selectedProduct.id)).display}
                </span>
              </div>
              <div className="text-[11px] text-ink-400">
                (Mis à jour automatiquement par le système via les ventes Z et réceptions)
              </div>
            </div>

            <div>
              <FieldLabel>Nouvelle valeur théorique de référence ({selectedProduct.storageUnit})</FieldLabel>
              <input
                type="number"
                step={selectedProduct.dosesPerBottle ? '0.01' : '1'}
                min="0"
                className="input"
                value={theoInput}
                onChange={(e) => setTheoInput(parseFloat(e.target.value) || 0)}
              />
              {selectedProduct.dosesPerBottle && (
                <span className="text-[11px] text-copper mt-1 block">
                  Équivalence : {theoInput} bouteille(s) = {Math.round(theoInput * selectedProduct.dosesPerBottle)} doses de {selectedProduct.servingCl ?? 5} cl
                </span>
              )}
            </div>

            <div>
              <FieldLabel>Commentaire ou motif du réajustement (facultatif)</FieldLabel>
              <textarea
                rows={3}
                className="input"
                placeholder="Ex. Réajustement de dotation théorique de référence Bar..."
                value={theoComment}
                onChange={(e) => setTheoComment(e.target.value)}
              />
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
