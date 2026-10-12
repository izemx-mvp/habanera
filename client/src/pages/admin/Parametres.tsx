import { useState } from 'react'
import { PageHeader, Section, Tag } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { setProductField } from '@/data/actions'
import { useDataVersion } from '@/store/data-version'
import type { Product } from '@/data/types'

function ThresholdCell({ product, field, editing, setEditing }: { product: Product; field: 'minStock' | 'targetStock'; editing: string | null; setEditing: (k: string | null) => void }) {
  const key = `${product.id}-${field}`
  const [value, setValue] = useState(product[field])
  if (editing !== key) {
    return (
      <button className="hover:text-copper" onClick={() => setEditing(key)}>
        {product[field]}
      </button>
    )
  }
  return (
    <input
      autoFocus
      type="number"
      min={0}
      className="input !py-1 !px-2 w-20"
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
      onBlur={() => {
        setProductField(product.id, field, Math.max(0, value))
        setEditing(null)
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  )
}

export default function AdminParametres() {
  useDataVersion()
  const [editing, setEditing] = useState<string | null>(null)
  const [loc, setLoc] = useState<'all' | 'bar' | 'cuisine'>('all')
  const rows = PRODUCTS.filter((p) => loc === 'all' || p.location === loc)

  return (
    <>
      <PageHeader title="Configuration du stock" subtitle="Catégorie, unité, seuil minimum Économat, stock cible et statut par référence. Cliquez une valeur pour la modifier." />
      <Section>
        <div className="flex gap-2 mb-5">
          {(['all', 'bar', 'cuisine'] as const).map((l) => (
            <button
              key={l}
              className={`chip ${loc === l ? '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper' : ''}`}
              onClick={() => setLoc(l)}
            >
              {l === 'all' ? 'Tous' : l === 'bar' ? 'Bar' : 'Cuisine'}
            </button>
          ))}
        </div>
        <DataTable
          rows={rows}
          searchKeys={(p) => p.name}
          searchPlaceholder="Rechercher un produit…"
          pageSize={16}
          columns={[
            { key: 'name', label: 'Produit', render: (p) => <span className="font-medium text-ink-900 dark:text-ink-50">{p.name}</span>, sortValue: (p) => p.name },
            { key: 'service', label: 'Service', render: (p) => (p.location === 'bar' ? 'Bar' : 'Cuisine') },
            { key: 'cat', label: 'Catégorie', render: (p) => CATEGORY_LABEL[p.categoryId] },
            { key: 'unit', label: 'Unité', render: (p) => p.storageUnit },
            { key: 'min', label: 'Seuil minimum Économat', render: (p) => <ThresholdCell product={p} field="minStock" editing={editing} setEditing={setEditing} /> },
            { key: 'target', label: 'Stock cible', render: (p) => <ThresholdCell product={p} field="targetStock" editing={editing} setEditing={setEditing} /> },
            {
              key: 'active',
              label: 'Actif',
              render: (p) => (
                <button onClick={() => setProductField(p.id, 'active', !p.active)}>
                  <Tag className={p.active ? 'badge-success' : 'opacity-50'}>{p.active ? 'Actif' : 'Inactif'}</Tag>
                </button>
              ),
            },
          ]}
        />
      </Section>
    </>
  )
}
