import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Tag } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { ProductImportModal } from '@/components/ProductImportModal'
import { ServiceScopeSelector, type ServiceScope } from '@/components/ServiceScopeSelector'
import { CATEGORIES, CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { fmtMAD, stockAt, LOCATION_LABEL } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export default function ServiceCatalogue() {
  useDataVersion()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialService = (searchParams.get('service') as ServiceScope) || 'all'
  const [scope, setScope] = useState<ServiceScope>(initialService)
  const [cat, setCat] = useState<string>('all')
  const [importOpen, setImportOpen] = useState(false)

  function handleScopeChange(newScope: ServiceScope) {
    setScope(newScope)
    setCat('all')
    setSearchParams(newScope === 'all' ? {} : { service: newScope })
  }

  // Categories & Products matching scope
  const categories = useMemo(() => {
    if (scope === 'all') return CATEGORIES
    return CATEGORIES.filter((c) => c.location === scope)
  }, [scope])

  const products = useMemo(() => {
    if (scope === 'all') return PRODUCTS.filter((p) => p.active)
    return PRODUCTS.filter((p) => p.active && p.location === scope)
  }, [scope])

  const filtered = useMemo(() => {
    if (cat === 'all') return products
    return products.filter((p) => p.categoryId === cat)
  }, [cat, products])

  return (
    <>
      <PageHeader
        title="Catalogue Produits & Boissons"
        subtitle="Catalogue unifié Bar & Cuisine. Les articles sont partagés et accessibles aux deux services."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ServiceScopeSelector value={scope} onChange={handleScopeChange} />
            <button className="btn-primary btn-sm" onClick={() => setImportOpen(true)}>
              <Upload size={14} />
              Importer Excel
            </button>
          </div>
        }
      />

      <Section>
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            className={clsx('chip', cat === 'all' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
            onClick={() => setCat('all')}
          >
            Toutes les catégories ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length
            if (count === 0) return null
            return (
              <button
                key={c.id}
                className={clsx('chip', cat === c.id && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
                onClick={() => setCat(c.id)}
              >
                {c.label} ({count})
              </button>
            )
          })}
        </div>

        <DataTable
          rows={filtered}
          onRowClick={(p) => navigate(`/produits/${p.id}`)}
          searchKeys={(p) => p.name}
          searchPlaceholder="Rechercher une référence…"
          pageSize={14}
          columns={[
            {
              key: 'name',
              label: 'Produit',
              render: (p) => (
                <div>
                  <span className="font-medium text-ink-900 dark:text-ink-100">{p.name}</span>
                  <div className="text-[11px] text-ink-500">
                    Unité : {p.storageUnit}
                    {p.dosesPerBottle && ` · ${p.dosesPerBottle} doses/btl`}
                    {p.packSize && ` · pack ${p.packSize}`}
                  </div>
                </div>
              ),
              sortValue: (p) => p.name,
            },
            {
              key: 'location',
              label: 'Service par défaut',
              render: (p) => (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-ink-100 dark:bg-ink-800">
                  {LOCATION_LABEL[p.location]}
                </span>
              ),
              sortValue: (p) => p.location,
            },
            {
              key: 'cat',
              label: 'Catégorie',
              render: (p) => CATEGORY_LABEL[p.categoryId],
            },
            {
              key: 'stock',
              label: 'Stock actuel (Bar / Cuisine)',
              render: (p) => {
                const stockBar = stockAt('bar', p.id)
                const stockCuisine = stockAt('cuisine', p.id)
                return (
                  <div className="text-xs">
                    <div><strong className="text-ink-900 dark:text-ink-100">{stockBar}</strong> <span className="text-ink-400">Bar</span></div>
                    <div><strong className="text-ink-900 dark:text-ink-100">{stockCuisine}</strong> <span className="text-ink-400">Cuisine</span></div>
                  </div>
                )
              },
            },
            {
              key: 'price',
              label: 'Prix de vente',
              render: (p) => p.priceFormats.map((f) => `${f.label} : ${fmtMAD(f.price)}`).join(' · '),
            },
            {
              key: 'status',
              label: 'Statut',
              render: (p) => <Tag className={p.active ? '' : 'opacity-50'}>{p.active ? 'Actif' : 'Inactif'}</Tag>,
            },
          ]}
        />
      </Section>

      <ProductImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
