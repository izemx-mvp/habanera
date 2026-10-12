import { useNavigate } from 'react-router-dom'
import { PageHeader, Section, Stat } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { CATEGORY_LABEL, productsByLocation } from '@/data/catalog'
import { alertsFor, stockAt } from '@/data/selectors'
import clsx from 'clsx'
import { useDataVersion } from '@/store/data-version'

export function StockView({ location }: { location: 'bar' | 'cuisine' }) {
  useDataVersion()
  const navigate = useNavigate()
  const products = productsByLocation(location).filter((p) => p.active)
  const alerts = alertsFor(location)
  const alertIds = new Set(alerts.map((a) => a.productId))
  const totalUnits = products.reduce((s, p) => s + stockAt(location, p.id), 0)

  return (
    <>
      <PageHeader title={location === 'bar' ? 'Stock du Bar' : 'Stock Cuisine'} subtitle="Quantités actuellement détenues par le service, calculées depuis les mouvements enregistrés." />
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Stat label="Références actives" value={String(products.length)} />
          <Stat label="Unités en stock" value={totalUnits.toLocaleString('fr-FR')} />
          <Stat label="Sous le seuil minimum" value={String(alerts.length)} tone={alerts.length ? 'error' : 'success'} />
        </div>
        <DataTable
          rows={products}
          onRowClick={(p) => navigate(`/produits/${p.id}`)}
          searchKeys={(p) => p.name}
          searchPlaceholder="Rechercher un produit…"
          pageSize={14}
          columns={[
            {
              key: 'name',
              label: 'Produit',
              render: (p) => (
                <span className={clsx('font-medium', alertIds.has(p.id) ? 'text-red-600' : 'text-ink-900')}>{p.name}</span>
              ),
              sortValue: (p) => p.name,
            },
            { key: 'cat', label: 'Catégorie', render: (p) => CATEGORY_LABEL[p.categoryId] },
            { key: 'stock', label: 'Stock actuel', render: (p) => `${stockAt(location, p.id)} ${p.storageUnit}`, sortValue: (p) => stockAt(location, p.id) },
            { key: 'min', label: 'Seuil min.', render: (p) => p.minStock },
            { key: 'target', label: 'Stock cible', render: (p) => p.targetStock },
          ]}
        />
      </Section>
    </>
  )
}
