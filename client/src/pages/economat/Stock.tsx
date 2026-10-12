import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
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
            { key: 'stock', label: 'Stock central', render: (p) => `${stockAt('economat', p.id)} ${p.storageUnit}`, sortValue: (p) => stockAt('economat', p.id) },
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
        subtitle={`Stock central actuel : ${adjust ? stockAt('economat', adjust.id) : 0} ${adjust?.storageUnit ?? ''}`}
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
