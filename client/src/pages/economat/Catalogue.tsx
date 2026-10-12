import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Tag } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { ProductImportModal } from '@/components/ProductImportModal'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { cumpOf, fmtMAD, stockAt } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export default function EconomatCatalogue() {
  useDataVersion()
  const navigate = useNavigate()
  const [loc, setLoc] = useState<'all' | 'bar' | 'cuisine'>('all')
  const [importOpen, setImportOpen] = useState(false)
  const products = loc === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.location === loc)

  return (
    <>
      <PageHeader
        title="Catalogue produits"
        subtitle="Produits autorisés pour le Bar et la Cuisine — gérés depuis le stock central."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setImportOpen(true)}>
            <Upload size={14} />
            Importer Excel
          </button>
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
          onRowClick={(p) => navigate(`/produits/${p.id}`)}
          searchKeys={(p) => p.name}
          searchPlaceholder="Rechercher un produit…"
          pageSize={14}
          columns={[
            { key: 'name', label: 'Produit', render: (p) => <span className="font-medium text-ink-900">{p.name}</span>, sortValue: (p) => p.name },
            { key: 'loc', label: 'Service', render: (p) => (p.location === 'bar' ? 'Bar' : 'Cuisine') },
            { key: 'cat', label: 'Catégorie', render: (p) => CATEGORY_LABEL[p.categoryId] },
            { key: 'eco', label: 'Stock central', render: (p) => `${stockAt('economat', p.id)} ${p.storageUnit}`, sortValue: (p) => stockAt('economat', p.id) },
            { key: 'cost', label: "Coût moyen pondéré", render: (p) => (cumpOf(p.id) != null ? fmtMAD(cumpOf(p.id)) : 'À valoriser') },
            { key: 'status', label: 'Statut', render: (p) => <Tag className={p.active ? '' : 'opacity-50'}>{p.active ? 'Actif' : 'Inactif'}</Tag> },
          ]}
        />
      </Section>

      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </>
  )
}

