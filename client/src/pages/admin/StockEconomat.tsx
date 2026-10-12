import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Settings, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat, FieldLabel } from '@/components/ui'
import { Drawer } from '@/components/Drawer'
import { DataTable } from '@/components/DataTable'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { stockAt, realStockAt, cumpOf, allAlerts, fmtMAD } from '@/data/selectors'
import { setProductField, createProduct } from '@/data/actions'
import { useDataVersion } from '@/store/data-version'
import type { Product, ProductCategoryId, UnitId } from '@/data/types'

export default function AdminStockEconomat() {
  useDataVersion()
  const navigate = useNavigate()

  const [paramDrawerOpen, setParamDrawerOpen] = useState(false)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'alertes' | 'bar' | 'cuisine'>('all')

  // Stock edit state
  const [minStock, setMinStock] = useState<number>(0)
  const [targetStock, setTargetStock] = useState<number>(0)
  const [dosesPerBottle, setDosesPerBottle] = useState<number>(15)
  const [packSize, setPackSize] = useState<number>(24)
  const [trackingMode, setTrackingMode] = useState<'theorique_et_reel' | 'theorique_seul'>('theorique_et_reel')
  const [isActive, setIsActive] = useState<boolean>(true)

  // Nouveau produit form
  const [newForm, setNewForm] = useState({
    name: '',
    categoryId: 'spiritueux' as ProductCategoryId,
    location: 'bar' as 'bar' | 'cuisine',
    storageUnit: 'bouteille',
    minStock: 2,
    targetStock: 6,
    dosesPerBottle: 15,
  })

  const alerts = allAlerts()

  let displayedProducts = PRODUCTS.filter((p) => p.active)
  if (activeTab === 'alertes') {
    const alertIds = new Set(alerts.map((a) => a.productId))
    displayedProducts = displayedProducts.filter((p) => alertIds.has(p.id))
  } else if (activeTab === 'bar') {
    displayedProducts = displayedProducts.filter((p) => p.location === 'bar')
  } else if (activeTab === 'cuisine') {
    displayedProducts = displayedProducts.filter((p) => p.location === 'cuisine')
  }

  const rows = displayedProducts.map((p) => {
    const qty = stockAt('economat', p.id)
    const real = realStockAt('economat', p.id)
    const isAlert = qty < p.minStock
    const cump = cumpOf(p.id) ?? 0
    const totalValuation = qty * cump

    return {
      product: p,
      qty,
      real,
      isAlert,
      cump,
      totalValuation,
    }
  })

  function handleOpenParams(p: Product) {
    setSelectedProduct(p)
    setMinStock(p.minStock)
    setTargetStock(p.targetStock ?? p.minStock * 2)
    setDosesPerBottle(p.dosesPerBottle ?? 15)
    setPackSize(p.packSize ?? 24)
    setTrackingMode(p.trackingMode === 'theorique' ? 'theorique_seul' : 'theorique_et_reel')
    setIsActive(p.active)
    setParamDrawerOpen(true)
  }

  function handleSaveParams() {
    if (!selectedProduct) return
    setProductField(selectedProduct.id, 'minStock', minStock)
    setProductField(selectedProduct.id, 'targetStock', targetStock)
    setProductField(selectedProduct.id, 'dosesPerBottle', dosesPerBottle)
    setProductField(selectedProduct.id, 'packSize', packSize)
    setProductField(selectedProduct.id, 'trackingMode', trackingMode === 'theorique_seul' ? 'theorique' : 'theorique_et_reel')
    setProductField(selectedProduct.id, 'active', isActive)
    setParamDrawerOpen(false)
  }

  function handleCreateProduct() {
    createProduct({
      name: newForm.name,
      categoryId: newForm.categoryId,
      location: newForm.location,
      storageUnit: newForm.storageUnit as UnitId,
      saleUnit: newForm.storageUnit as UnitId,
      minStock: newForm.minStock,
      targetStock: newForm.targetStock,
      dosesPerBottle: newForm.dosesPerBottle,
    })
    setNewProductOpen(false)
  }

  return (
    <>
      <PageHeader
        title="Stock Economat (Stock Central)"
        subtitle="Gestion centrale du stock de réserve, calcul du seuil minimum déclencheur, CUMP et conversion de conditionnement."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setNewProductOpen(true)}>
            <Plus size={14} />
            Nouveau produit
          </button>
        }
      />

      <Section>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Références en réserve" value={String(PRODUCTS.filter((p) => p.active).length)} />
          <Stat
            label="Stocks sous le seuil critique"
            value={String(alerts.length)}
            tone={alerts.length ? 'error' : 'success'}
            hint={alerts.length ? 'Déclenche des suggestions d’achat' : 'Stocks à niveau'}
          />
          <Stat
            label="Valeur totale stock central"
            value={fmtMAD(
              PRODUCTS.filter((p) => p.active).reduce((sum, p) => sum + stockAt('economat', p.id) * (cumpOf(p.id) ?? 0), 0)
            )}
          />
          <Stat
            label="Mode de suivi"
            value="Théorique & Réel"
            hint="Rapprochement automatique"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex gap-2">
            <button
              className={clsx('chip', activeTab === 'all' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setActiveTab('all')}
            >
              Toutes les références
            </button>
            <button
              className={clsx('chip flex items-center gap-1.5', activeTab === 'alertes' && '!bg-red-600 !text-white !border-red-600')}
              onClick={() => setActiveTab('alertes')}
            >
              <AlertTriangle size={13} />
              Sous le seuil critique ({alerts.length})
            </button>
            <button
              className={clsx('chip', activeTab === 'bar' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setActiveTab('bar')}
            >
              Rayon Bar
            </button>
            <button
              className={clsx('chip', activeTab === 'cuisine' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setActiveTab('cuisine')}
            >
              Rayon Cuisine
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          rows={rows}
          onRowClick={(r) => navigate(`/produits/${r.product.id}`)}
          searchKeys={(r) => r.product.name}
          searchPlaceholder="Rechercher une référence à l'Économat…"
          pageSize={15}
          columns={[
            {
              key: 'name',
              label: 'Produit & Destination',
              render: (r) => (
                <div>
                  <div className="font-medium text-ink-900 dark:text-ink-100 flex items-center gap-2">
                    {r.product.name}
                    {r.isAlert && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 font-semibold uppercase">
                        Alerte seuil
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {CATEGORY_LABEL[r.product.categoryId]} · Destiné au {r.product.location === 'bar' ? 'Bar' : 'Cuisine'}
                  </div>
                </div>
              ),
              sortValue: (r) => r.product.name,
            },
            {
              key: 'qty',
              label: 'Stock Économat',
              render: (r) => (
                <div>
                  <span className={clsx('font-semibold', r.isAlert ? 'text-red-600 dark:text-red-400' : 'text-ink-900 dark:text-ink-100')}>
                    {r.qty} {r.product.storageUnit}
                  </span>
                  <div className="text-[11px] text-ink-400">Physique : {r.real} {r.product.storageUnit}</div>
                </div>
              ),
              sortValue: (r) => r.qty,
            },
            {
              key: 'thresholds',
              label: 'Seuil Min. / Cible',
              render: (r) => (
                <div className="text-xs">
                  <div>
                    <span className="text-ink-500">Min. : </span>
                    <strong className="text-red-600 dark:text-red-400">{r.product.minStock} {r.product.storageUnit}</strong>
                  </div>
                  <div>
                    <span className="text-ink-500">Cible : </span>
                    <strong className="text-ink-700 dark:text-ink-300">{r.product.targetStock ?? r.product.minStock * 2} {r.product.storageUnit}</strong>
                  </div>
                </div>
              ),
              sortValue: (r) => r.product.minStock,
            },
            {
              key: 'cump',
              label: 'CUMP & Valorisation',
              render: (r) => (
                <div>
                  <div className="font-medium text-ink-900 dark:text-ink-100">{fmtMAD(r.cump)} / {r.product.storageUnit}</div>
                  <div className="text-[11px] text-ink-500">Total : {fmtMAD(r.totalValuation)}</div>
                </div>
              ),
              sortValue: (r) => r.totalValuation,
            },
            {
              key: 'conversions',
              label: 'Conditionnement',
              render: (r) => (
                <div className="text-[11px] text-ink-600 dark:text-ink-400">
                  {r.product.dosesPerBottle && <div>{r.product.dosesPerBottle} doses / btl</div>}
                  {r.product.packSize && <div>Pack de {r.product.packSize}</div>}
                  {!r.product.dosesPerBottle && !r.product.packSize && <div>Unité standard</div>}
                </div>
              ),
            },
            {
              key: 'actions',
              label: 'Paramètres',
              render: (r) => (
                <button
                  className="btn-secondary btn-xs flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenParams(r.product)
                  }}
                >
                  <Settings size={12} />
                  Configurer
                </button>
              ),
            },
          ]}
        />
      </Section>

      {/* Drawer Configuration Stock Paramètres (Section 6.1) */}
      <Drawer
        open={paramDrawerOpen}
        onClose={() => setParamDrawerOpen(false)}
        title={selectedProduct ? `Configuration de Stock · ${selectedProduct.name}` : 'Paramètres de stock'}
        subtitle="Ajustement des seuils critiques, facteurs de conversion et mode de suivi."
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setParamDrawerOpen(false)}>
              Annuler
            </button>
            <button className="btn-primary btn-sm" onClick={handleSaveParams}>
              Enregistrer les modifications
            </button>
          </>
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div>
              <FieldLabel>Seuil Minimum Économat (Déclencheur d'alerte et IA)</FieldLabel>
              <input
                type="number"
                min="0"
                className="input"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
              />
              <span className="text-[11px] text-ink-400 mt-1 block">
                Seule limite critique déclenchant les alertes de réapprovisionnement et suggestions IA.
              </span>
            </div>

            <div>
              <FieldLabel>Stock Cible (Objectif idéal en réserve)</FieldLabel>
              <input
                type="number"
                min="0"
                className="input"
                value={targetStock}
                onChange={(e) => setTargetStock(parseInt(e.target.value) || 0)}
              />
              <span className="text-[11px] text-ink-400 mt-1 block">
                Quantité souhaitée pour calculer le volume de réapprovisionnement automatique.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Facteur Doses (si bouteille)</FieldLabel>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={dosesPerBottle}
                  onChange={(e) => setDosesPerBottle(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <FieldLabel>Taille Pack (si lot)</FieldLabel>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={packSize}
                  onChange={(e) => setPackSize(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Mode de Suivi</FieldLabel>
              <select
                className="input"
                value={trackingMode}
                onChange={(e) => setTrackingMode(e.target.value as any)}
              >
                <option value="theorique_et_reel">Théorique et Réel (Rapprochement inventaire)</option>
                <option value="theorique_seul">Théorique seul</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="activeProd"
                className="rounded text-copper"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="activeProd" className="text-sm font-medium text-ink-900 dark:text-ink-100 cursor-pointer">
                Produit Actif dans le catalogue
              </label>
            </div>
          </div>
        )}
      </Drawer>

      {/* Drawer Nouveau Produit */}
      <Drawer
        open={newProductOpen}
        onClose={() => setNewProductOpen(false)}
        title="Créer un nouveau produit"
        subtitle="Ajoutez une nouvelle référence au stock central de l'Économat."
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => setNewProductOpen(false)}>
              Annuler
            </button>
            <button className="btn-primary btn-sm" onClick={handleCreateProduct}>
              Créer le produit
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel>Nom du produit</FieldLabel>
            <input
              type="text"
              className="input"
              placeholder="Ex. Rhum Diplomatico Reserva"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Service destinataire</FieldLabel>
              <select
                className="input"
                value={newForm.location}
                onChange={(e) => setNewForm({ ...newForm, location: e.target.value as any })}
              >
                <option value="bar">Bar</option>
                <option value="cuisine">Cuisine</option>
              </select>
            </div>
            <div>
              <FieldLabel>Catégorie</FieldLabel>
              <select
                className="input"
                value={newForm.categoryId}
                onChange={(e) => setNewForm({ ...newForm, categoryId: e.target.value as any })}
              >
                <option value="spiritueux">Spiritueux</option>
                <option value="bieres">Bières</option>
                <option value="vins">Vins</option>
                <option value="softs">Softs</option>
                <option value="viandes">Viandes</option>
                <option value="legumes">Légumes</option>
                <option value="epicerie">Épicerie</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Seuil min. Économat</FieldLabel>
              <input
                type="number"
                min="0"
                className="input"
                value={newForm.minStock}
                onChange={(e) => setNewForm({ ...newForm, minStock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <FieldLabel>Stock Cible</FieldLabel>
              <input
                type="number"
                min="1"
                className="input"
                value={newForm.targetStock}
                onChange={(e) => setNewForm({ ...newForm, targetStock: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  )
}
