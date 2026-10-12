import { useState } from 'react'
import { Eye, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Tag, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer, ConfirmModal } from '@/components/Drawer'
import { ProductImportModal } from '@/components/ProductImportModal'
import { CATEGORIES, CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { FREQUENCY_LABEL, productMovementTotals, stockAt } from '@/data/selectors'
import { createProduct, setPriceFormat, setProductField } from '@/data/actions'
import { useDataVersion } from '@/store/data-version'
import type { Product, ProductCategoryId } from '@/data/types'

export default function AdminProduits() {
  useDataVersion()
  const [loc, setLoc] = useState<'all' | 'bar' | 'cuisine'>('all')
  const products = loc === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.location === loc)

  const [selected, setSelected] = useState<Product | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [form, setForm] = useState({ name: '', location: 'bar' as 'bar' | 'cuisine', categoryId: 'bieres' as ProductCategoryId, minStock: 1, targetStock: 4 })
  const [error, setError] = useState<string | null>(null)
  const [toDeactivate, setToDeactivate] = useState<Product | null>(null)

  function submitNew() {
    const res = createProduct({
      name: form.name,
      categoryId: form.categoryId,
      location: form.location,
      storageUnit: form.location === 'bar' ? 'unite' : 'kg',
      saleUnit: form.location === 'bar' ? 'unite' : 'kg',
      priceFormats: [{ label: 'Unité', price: null }],
      minStock: form.minStock,
      targetStock: form.targetStock,
    })
    if (!res.ok) return setError(res.error)
    setNewOpen(false)
    setForm({ name: '', location: 'bar', categoryId: 'bieres', minStock: 1, targetStock: 4 })
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Catalogue produits"
        subtitle="Produits du Bar et de la Cuisine. Désactiver un produit conserve son historique de mouvements."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-primary btn-sm" onClick={() => setImportOpen(true)}>
              <Upload size={14} />
              Importer Excel
            </button>
            <button className="btn-primary btn-sm" onClick={() => setNewOpen(true)}>
              <Plus size={14} />
              Nouveau produit
            </button>
          </div>
        }
      />
      <Section>
        <div className="flex gap-2 mb-5">
          {(['all', 'bar', 'cuisine'] as const).map((l) => (
            <button key={l} className={clsx('chip', loc === l && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setLoc(l)}>
              {l === 'all' ? 'Tous' : l === 'bar' ? 'Bar' : 'Cuisine'}
            </button>
          ))}
        </div>
        <DataTable
          rows={products}
          searchKeys={(p) => p.name}
          searchPlaceholder="Rechercher un produit…"
          pageSize={14}
          columns={[
            { key: 'name', label: 'Produit', render: (p) => <span className="font-medium text-ink-900 dark:text-ink-50">{p.name}</span>, sortValue: (p) => p.name },
            { key: 'loc', label: 'Service', render: (p) => (p.location === 'bar' ? 'Bar' : 'Cuisine') },
            { key: 'freq', label: 'Fréquence', render: (p) => FREQUENCY_LABEL[p.countingFrequency] },
            { key: 'cat', label: 'Catégorie', render: (p) => CATEGORY_LABEL[p.categoryId] },
            { key: 'unit', label: 'Unité', render: (p) => p.storageUnit },
            { key: 'fixe', label: 'Stock fixe', render: (p) => p.targetStock, sortValue: (p) => p.targetStock },
            { key: 'achats', label: 'Achats', render: (p) => productMovementTotals(p.id).achats },
            { key: 'ventes', label: 'Ventes', render: (p) => productMovementTotals(p.id).ventes },
            { key: 'prelev', label: 'Prélèvements', render: (p) => productMovementTotals(p.id).prelevements },
            { key: 'seuil', label: 'Seuil / Cible', render: (p) => `${p.minStock} / ${p.targetStock}` },
            { key: 'stock', label: 'Stock actuel', render: (p) => stockAt(p.location, p.id), sortValue: (p) => stockAt(p.location, p.id) },
            { key: 'status', label: 'Statut', render: (p) => <Tag className={p.active ? '' : 'opacity-50'}>{p.active ? 'Actif' : 'Inactif'}</Tag> },
            {
              key: 'actions',
              label: '',
              render: (p) => (
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-800" title="Aperçu" onClick={() => setSelected(p)}>
                    <Eye size={14} className="text-ink-500 dark:text-ink-400" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-800" title="Modifier" onClick={() => setSelected(p)}>
                    <Pencil size={14} className="text-ink-500 dark:text-ink-400" />
                  </button>
                  {p.active && (
                    <button className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40" title="Désactiver" onClick={() => setToDeactivate(p)}>
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Drawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nouveau produit"
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setNewOpen(false)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submitNew}>Créer le produit</button>
          </>
        }
      >
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="space-y-4">
          <div>
            <FieldLabel>Nom</FieldLabel>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Service</FieldLabel>
            <select className="input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value as 'bar' | 'cuisine', categoryId: e.target.value === 'bar' ? 'bieres' : 'cuisine-demo' }))}>
              <option value="bar">Bar</option>
              <option value="cuisine">Cuisine</option>
            </select>
          </div>
          <div>
            <FieldLabel>Catégorie</FieldLabel>
            <select className="input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value as ProductCategoryId }))}>
              {CATEGORIES.filter((c) => c.location === form.location).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Seuil minimum</FieldLabel>
              <input type="number" min={0} className="input" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))} />
            </div>
            <div>
              <FieldLabel>Stock cible</FieldLabel>
              <input type="number" min={0} className="input" value={form.targetStock} onChange={(e) => setForm((f) => ({ ...f, targetStock: Number(e.target.value) }))} />
            </div>
          </div>
        </div>
      </Drawer>

      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected.name} subtitle={CATEGORY_LABEL[selected.categoryId]}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="card p-3">
                <div className="label mb-1">Stock Bar/Cuisine</div>
                <div className="font-medium">{stockAt(selected.location, selected.id)} {selected.storageUnit}</div>
              </div>
              <div className="card p-3">
                <div className="label mb-1">Stock Économat</div>
                <div className="font-medium">{stockAt('economat', selected.id)} {selected.storageUnit}</div>
              </div>
            </div>
            <div>
              <FieldLabel>Prix de vente par format</FieldLabel>
              <div className="space-y-2">
                {selected.priceFormats.map((f) => (
                  <div key={f.label} className="flex items-center gap-2">
                    <span className="text-[12.5px] text-ink-600 w-28">{f.label}</span>
                    <input
                      type="number"
                      className="input"
                      placeholder="Non renseigné"
                      defaultValue={f.price ?? ''}
                      onBlur={(e) => setPriceFormat(selected.id, f.label, e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <FieldLabel>Statut</FieldLabel>
              <button className="btn-ghost btn-sm" onClick={() => setProductField(selected.id, 'active', !selected.active)}>
                {selected.active ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          </div>
        </Drawer>
      )}

      <ConfirmModal
        open={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        title={`Désactiver ${toDeactivate?.name ?? ''} ?`}
        description="Le produit disparaît du catalogue actif mais son historique de mouvements est conservé. Il peut être réactivé à tout moment."
        confirmLabel="Désactiver"
        danger
        onConfirm={() => toDeactivate && setProductField(toDeactivate.id, 'active', false)}
      />

      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </>
  )
}
