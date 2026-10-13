import { useState } from 'react'
import { Sliders, Check, Sparkles, Save, Upload } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat, FieldLabel } from '@/components/ui'
import { Drawer } from '@/components/Drawer'
import { DataTable } from '@/components/DataTable'
import { ProductImportModal } from '@/components/ProductImportModal'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { setProductField } from '@/data/actions'
import { useDataVersion } from '@/store/data-version'
import type { Product } from '@/data/types'

export default function AdminStockConfiguration() {
  useDataVersion()

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filterLoc, setFilterLoc] = useState<'all' | 'bar' | 'cuisine'>('all')

  // Edit fields
  const [minStock, setMinStock] = useState<number>(0)
  const [targetStock, setTargetStock] = useState<number>(0)
  const [dosesPerBottle, setDosesPerBottle] = useState<number>(15)
  const [servingCl, setServingCl] = useState<number>(5)
  const [packSize, setPackSize] = useState<number>(24)
  const [trackingMode, setTrackingMode] = useState<'theorique_et_reel' | 'theorique'>('theorique_et_reel')
  const [countingFrequency, setCountingFrequency] = useState<'quotidien' | 'hebdomadaire'>('hebdomadaire')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const activeProducts = PRODUCTS.filter((p) => p.active)
  const filteredProducts = filterLoc === 'all'
    ? activeProducts
    : activeProducts.filter((p) => p.location === filterLoc)

  function handleOpenConfig(p: Product) {
    setSelectedProduct(p)
    setMinStock(p.minStock)
    setTargetStock(p.targetStock ?? p.minStock * 2)
    setDosesPerBottle(p.dosesPerBottle ?? (p.storageUnit === 'bouteille' ? 15 : 1))
    setServingCl(p.servingCl ?? 5)
    setPackSize(p.packSize ?? (p.categoryId === 'bieres' ? 24 : 1))
    setTrackingMode(p.trackingMode === 'theorique' ? 'theorique' : 'theorique_et_reel')
    setCountingFrequency(p.countingFrequency || 'hebdomadaire')
    setSuccessMsg(null)
    setDrawerOpen(true)
  }

  function handleSaveConfig() {
    if (!selectedProduct) return
    setProductField(selectedProduct.id, 'minStock', minStock)
    setProductField(selectedProduct.id, 'targetStock', targetStock)
    setProductField(selectedProduct.id, 'dosesPerBottle', dosesPerBottle)
    setProductField(selectedProduct.id, 'servingCl', servingCl)
    setProductField(selectedProduct.id, 'packSize', packSize)
    setProductField(selectedProduct.id, 'trackingMode', trackingMode)
    setProductField(selectedProduct.id, 'countingFrequency', countingFrequency)

    setSuccessMsg(`Paramètres enregistrés pour ${selectedProduct.name}`)
    setTimeout(() => {
      setDrawerOpen(false)
      setSuccessMsg(null)
    }, 900)
  }

  return (
    <>
      <PageHeader
        title="Configuration du stock"
        subtitle="Paramétrage centralisé des règles de gestion : seuils Économat, conversions en doses/packs et modes de calcul Théorique vs Réel."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setImportModalOpen(true)}>
            <Upload size={14} />
            Importer la liste des produits
          </button>
        }
      />

      <Section>
        {/* KPI SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Articles configurables" value={String(activeProducts.length)} hint="Catalogue actif" />
          <Stat
            label="Spiritueux avec doses fines"
            value={String(activeProducts.filter((p) => p.dosesPerBottle && p.dosesPerBottle > 1).length)}
            hint="Conversion 1 btl = 15 doses"
          />
          <Stat
            label="Références en packs"
            value={String(activeProducts.filter((p) => p.packSize && p.packSize > 1).length)}
            hint="Conditionnement en lots (ex: 24 u)"
          />
          <Stat
            label="Mode de réconciliation"
            value="Théorique & Réel"
            tone="success"
            hint="Rapprochement en continu"
          />
        </div>

        {/* INFO NOTICE */}
        <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[13px] text-ink-700 dark:text-ink-300 flex items-start gap-3">
          <Sparkles className="text-copper shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-ink-900 dark:text-ink-100">Règles fondamentales de calcul : </span>
            Le <strong>seuil minimum</strong> s'applique au <strong>Stock Central (Économat)</strong> pour déclencher les commandes fournisseurs et alertes IA.
            Au <strong>Bar</strong>, le calcul déduit les portions unitaires (doses de 5 cl) issues des caisses sans forcer une rupture tant que la bouteille entamée contient du liquide.
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 mb-5">
          {(['all', 'bar', 'cuisine'] as const).map((l) => (
            <button
              key={l}
              className={clsx(
                'chip',
                filterLoc === l && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
              )}
              onClick={() => setFilterLoc(l)}
            >
              {l === 'all' ? 'Toutes les catégories' : l === 'bar' ? 'Espace Bar' : 'Espace Cuisine'}
            </button>
          ))}
        </div>

        {/* CONFIG TABLE */}
        <DataTable
          rows={filteredProducts}
          searchKeys={(p) => `${p.name} ${CATEGORY_LABEL[p.categoryId]}`}
          searchPlaceholder="Rechercher un produit à configurer…"
          pageSize={15}
          columns={[
            {
              key: 'name',
              label: 'PRODUIT & SERVICE',
              render: (p) => (
                <div>
                  <div className="font-medium text-ink-900 dark:text-ink-100">{p.name}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400">
                    {CATEGORY_LABEL[p.categoryId]} · {p.location === 'bar' ? 'Bar' : 'Cuisine'}
                  </div>
                </div>
              ),
              sortValue: (p) => p.name,
            },
            {
              key: 'thresholds',
              label: 'SEUILS ÉCONOMAT (STOCK CENTRAL)',
              render: (p) => (
                <div className="text-xs">
                  <div>
                    <span className="text-ink-500">Seuil min. alerte : </span>
                    <strong className="text-red-600 dark:text-red-400 font-mono">{p.minStock} {p.storageUnit}</strong>
                  </div>
                  <div>
                    <span className="text-ink-500">Stock cible idéal : </span>
                    <strong className="text-ink-700 dark:text-ink-300 font-mono">{p.targetStock ?? p.minStock * 2} {p.storageUnit}</strong>
                  </div>
                </div>
              ),
              sortValue: (p) => p.minStock,
            },
            {
              key: 'conversions',
              label: 'RÈGLES DE CONVERSION & DÉCLINAISONS',
              render: (p) => (
                <div className="text-xs space-y-0.5">
                  {p.storageUnit === 'bouteille' && p.dosesPerBottle ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-copper/10 text-copper font-medium">
                      1 btl = {p.dosesPerBottle} doses ({p.servingCl ?? 5} cl)
                    </span>
                  ) : null}
                  {p.packSize && p.packSize > 1 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 font-medium">
                      Pack de {p.packSize} unités
                    </span>
                  ) : null}
                  {!p.dosesPerBottle && (!p.packSize || p.packSize <= 1) ? (
                    <span className="text-ink-400">Unité unitaire ({p.storageUnit})</span>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'trackingMode',
              label: 'CALCUL THÉORIQUE VS RÉEL',
              render: (p) => (
                <span className="text-xs px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-800 dark:text-ink-200 font-medium">
                  {p.trackingMode === 'theorique' ? 'Théorique seul' : 'Théorique + Réel (Rapprochement continu)'}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'ACTION',
              render: (p) => (
                <button
                  className="btn-secondary btn-xs flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenConfig(p)
                  }}
                >
                  <Sliders size={12} />
                  Configurer
                </button>
              ),
            },
          ]}
        />
      </Section>

      {/* DRAWER CONFIGURATION */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedProduct ? `Configuration · ${selectedProduct.name}` : 'Configuration du produit'}
        subtitle="Définition des seuils centraux, facteurs de conversion et suivi d'inventaire."
        width={540}
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setDrawerOpen(false)}>
              Annuler
            </button>
            <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={handleSaveConfig}>
              <Save size={14} />
              Enregistrer les modifications
            </button>
          </>
        }
      >
        {selectedProduct && (
          <div className="space-y-5">
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SECTION 1: SEUILS ECONOMAT */}
            <div className="p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-100">
                1. Seuils Économat (Stock Central)
              </h4>
              <p className="text-[11.5px] text-ink-500">
                Ces seuils déclenchent automatiquement les alertes de réapprovisionnement et les suggestions d'achat IA.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Seuil Minimum Alerte</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    className="input input-sm w-full font-mono"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-ink-400 mt-0.5 block">
                    Unité : {selectedProduct.storageUnit}
                  </span>
                </div>
                <div>
                  <FieldLabel>Stock Cible Idéal</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    className="input input-sm w-full font-mono"
                    value={targetStock}
                    onChange={(e) => setTargetStock(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-ink-400 mt-0.5 block">
                    Objectif après réappro
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: CONVERSION & DECLINAISONS */}
            <div className="p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-100">
                2. Déclinaisons & Règles de conversion
              </h4>
              <p className="text-[11.5px] text-ink-500">
                Paramétrez la déduction en doses pour les spiritueux et le stockage par lots/packs.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Doses par bouteille</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    className="input input-sm w-full font-mono"
                    value={dosesPerBottle}
                    onChange={(e) => setDosesPerBottle(parseInt(e.target.value) || 1)}
                  />
                  <span className="text-[10px] text-ink-400 mt-0.5 block">
                    Ex: 15 doses pour 75 cl
                  </span>
                </div>
                <div>
                  <FieldLabel>Portion unitaire (cl)</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    className="input input-sm w-full font-mono"
                    value={servingCl}
                    onChange={(e) => setServingCl(parseFloat(e.target.value) || 5)}
                  />
                  <span className="text-[10px] text-ink-400 mt-0.5 block">
                    Généralement 5 cl ou 4 cl
                  </span>
                </div>
              </div>

              <div>
                <FieldLabel>Taille Pack / Lot (Unités)</FieldLabel>
                <input
                  type="number"
                  min="1"
                  className="input input-sm w-full font-mono"
                  value={packSize}
                  onChange={(e) => setPackSize(parseInt(e.target.value) || 1)}
                />
                <span className="text-[10px] text-ink-400 mt-0.5 block">
                  Ex: 24 pour les caisses de bières ou canettes
                </span>
              </div>
            </div>

            {/* SECTION 3: MODE DE CALCUL */}
            <div className="p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-100">
                3. Calcul Stock Théorique vs Réel
              </h4>

              <div>
                <FieldLabel>Mode de rapprochement</FieldLabel>
                <select
                  className="input input-sm w-full"
                  value={trackingMode}
                  onChange={(e) => setTrackingMode(e.target.value as any)}
                >
                  <option value="theorique_et_reel">Théorique + Réel (Rapprochement inventaire continu)</option>
                  <option value="theorique">Théorique seul</option>
                </select>
              </div>

              <div>
                <FieldLabel>Fréquence de comptage terrain</FieldLabel>
                <select
                  className="input input-sm w-full"
                  value={countingFrequency}
                  onChange={(e) => setCountingFrequency(e.target.value as any)}
                >
                  <option value="quotidien">Quotidien (clôture de fin de service)</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ProductImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </>
  )
}
