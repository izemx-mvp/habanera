import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat, FieldLabel } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { economatReplenishList, stockAt } from '@/data/selectors'
import { adjustInventory } from '@/data/actions'
import { PERSONA_USER_ID } from '@/data/referentials'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { Product } from '@/data/types'

export default function EconomatStock() {
  useDataVersion()
  const navigate = useNavigate()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]
  const toReplenish = new Set(economatReplenishList().map((r) => r.product.id))
  const products = PRODUCTS.filter((p) => p.active)

  const [adjust, setAdjust] = useState<Product | null>(null)
  const [delta, setDelta] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submitAdjust() {
    if (!adjust) return
    const res = adjustInventory('economat', adjust.id, delta, userId, comment)
    if (!res.ok) return setError(res.error)
    setAdjust(null)
    setDelta(0)
    setComment('')
    setError(null)
  }

  return (
    <>
      <PageHeader title="Stock central" subtitle="Quantités détenues au magasin central, disponibles pour les transferts vers le Bar et la Cuisine." />
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Stat label="Références actives" value={String(products.length)} />
          <Stat label="À réapprovisionner" value={String(toReplenish.size)} tone={toReplenish.size ? 'error' : 'success'} />
        </div>
        <DataTable
          rows={products}
          searchKeys={(p) => p.name}
          searchPlaceholder="Rechercher un produit…"
          pageSize={14}
          columns={[
            {
              key: 'name',
              label: 'Produit',
              render: (p) => (
                <button className="font-medium text-ink-900 hover:text-copper" onClick={() => navigate(`/produits/${p.id}`)}>
                  {p.name}
                </button>
              ),
              sortValue: (p) => p.name,
            },
            { key: 'cat', label: 'Catégorie', render: (p) => CATEGORY_LABEL[p.categoryId] },
            { key: 'loc', label: 'Service', render: (p) => (p.location === 'bar' ? 'Bar' : 'Cuisine') },
            {
              key: 'stock',
              label: 'Stock central',
              render: (p) => {
                const qty = stockAt('economat', p.id)
                const isUnder = p.minStock > 0 && qty < p.minStock
                const displayQty = Number.isInteger(qty) ? qty : Number(qty.toFixed(2))
                return (
                  <span className={clsx('font-semibold', isUnder ? 'text-red-600 dark:text-red-400' : 'text-ink-900 dark:text-ink-100')}>
                    {displayQty} {p.storageUnit}
                  </span>
                )
              },
              sortValue: (p) => stockAt('economat', p.id),
            },
            {
              key: 'minStock',
              label: 'Seuil minimum',
              render: (p) => {
                const qty = stockAt('economat', p.id)
                const isUnder = p.minStock > 0 && qty < p.minStock
                return (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-700 dark:text-ink-300">
                      {p.minStock} {p.storageUnit}
                    </span>
                    {isUnder && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                        <AlertCircle size={11} />
                        Sous le seuil
                      </span>
                    )}
                  </div>
                )
              },
              sortValue: (p) => p.minStock,
            },
            {
              key: 'action',
              label: '',
              render: (p) => (
                <button className="btn-ghost btn-sm" onClick={() => setAdjust(p)}>
                  <SlidersHorizontal size={13} />
                  Ajuster
                </button>
              ),
            },
          ]}
        />
      </Section>

      <Drawer
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title={`Ajuster le stock — ${adjust?.name ?? ''}`}
        subtitle={`Stock central actuel : ${adjust ? Number(stockAt('economat', adjust.id).toFixed(2)) : 0} ${adjust?.storageUnit ?? ''} · Seuil minimum : ${adjust?.minStock ?? 0} ${adjust?.storageUnit ?? ''}`}
        actions={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setAdjust(null)}>Annuler</button>
            <button className="btn-primary btn-sm" onClick={submitAdjust}>Enregistrer l'ajustement</button>
          </>
        }
      >
        {error && <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <FieldLabel>Variation (négatif pour retirer, positif pour ajouter)</FieldLabel>
        <input type="number" className="input" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
        <div className="mt-4">
          <FieldLabel>Commentaire</FieldLabel>
          <textarea className="input min-h-[80px]" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ex. inventaire initial, écart de comptage…" />
        </div>
      </Drawer>
    </>
  )
}
