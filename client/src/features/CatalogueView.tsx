import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Tag } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { ProductImportModal } from '@/components/ProductImportModal'
import { CATEGORIES, CATEGORY_LABEL, productsByLocation } from '@/data/catalog'
import { fmtMAD, stockAt } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export function CatalogueView({ location }: { location: 'bar' | 'cuisine' }) {
  useDataVersion()
  const navigate = useNavigate()
  const [cat, setCat] = useState<string>('all')
  const [importOpen, setImportOpen] = useState(false)
  const categories = CATEGORIES.filter((c) => c.location === location)
  const products = productsByLocation(location)
  const filtered = useMemo(() => (cat === 'all' ? products : products.filter((p) => p.categoryId === cat)), [cat, products])

  return (
    <>
      <PageHeader
        title={location === 'bar' ? 'Catalogue des boissons' : 'Catalogue produits'}
        subtitle={`${products.length} référence(s) — prix de vente « Non renseigné » lorsqu'ils ne figurent pas sur la carte transmise.`}
        actions={
          <button className="btn-primary btn-sm" onClick={() => setImportOpen(true)}>
            <Upload size={14} />
            Importer Excel
          </button>
        }
      />
      <Section>
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button className={clsx('chip', cat === 'all' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setCat('all')}>
              Toutes ({products.length})
            </button>
            {categories.map((c) => (
              <button key={c.id} className={clsx('chip', cat === c.id && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setCat(c.id)}>
                {c.label} ({products.filter((p) => p.categoryId === c.id).length})
              </button>
            ))}
          </div>
        )}
        <DataTable
          rows={filtered}
          onRowClick={(p) => navigate(`/produits/${p.id}`)}
          searchKeys={(p) => p.name}
          searchPlaceholder="Rechercher un produit…"
          pageSize={12}
          columns={[
            { key: 'name', label: 'Produit', render: (p) => <span className="font-medium text-ink-900">{p.name}</span>, sortValue: (p) => p.name },
            { key: 'cat', label: 'Catégorie', render: (p) => CATEGORY_LABEL[p.categoryId] },
            { key: 'stock', label: 'Stock', render: (p) => `${stockAt(location, p.id)} ${p.storageUnit}`, sortValue: (p) => stockAt(location, p.id) },
            { key: 'price', label: 'Prix de vente', render: (p) => p.priceFormats.map((f) => `${f.label} : ${fmtMAD(f.price)}`).join(' · ') },
            { key: 'status', label: 'Statut', render: (p) => <Tag className={p.active ? '' : 'opacity-50'}>{p.active ? 'Actif' : 'Inactif'}</Tag> },
          ]}
        />
      </Section>

      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        location={location}
      />
    </>
  )
}

