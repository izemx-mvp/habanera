import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader, Section, Stat } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { CATEGORY_LABEL, PRODUCTS, productById } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import { allAlerts, fmtDateTime, fmtMAD, LOCATION_LABEL, MOVEMENT_TYPE_LABEL, stockAt, userName } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import type { StockLocationId } from '@/data/types'

export default function AdminStocks() {
  useDataVersion()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'stocks' | 'mouvements'>('stocks')
  const [loc, setLoc] = useState<'all' | StockLocationId>('all')
  const alerts = allAlerts()

  const stockRows = PRODUCTS.filter((p) => p.active).flatMap((p) =>
    (['economat', 'bar', 'cuisine'] as StockLocationId[])
      .filter((l) => loc === 'all' || loc === l)
      .filter((l) => l === 'economat' || p.location === l)
      .map((l) => ({ product: p, location: l, qty: stockAt(l, p.id) })),
  )
  const movementRows = MOVEMENTS.filter((m) => loc === 'all' || m.location === loc).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader title="Stocks et mouvements" subtitle="Vue consolidée des trois stocks (Économat, Bar, Cuisine) et de leur historique." />
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Stat label="Références actives" value={String(PRODUCTS.filter((p) => p.active).length)} />
          <Stat label="Stocks critiques" value={String(alerts.length)} tone={alerts.length ? 'error' : 'success'} />
          <Stat label="Mouvements enregistrés" value={String(MOVEMENTS.length)} />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex gap-2">
            <button className={clsx('chip', tab === 'stocks' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setTab('stocks')}>
              Stocks
            </button>
            <button className={clsx('chip', tab === 'mouvements' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setTab('mouvements')}>
              Mouvements
            </button>
          </div>
          <div className="flex gap-2">
            {(['all', 'economat', 'bar', 'cuisine'] as const).map((l) => (
              <button key={l} className={clsx('chip', loc === l && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setLoc(l)}>
                {l === 'all' ? 'Tous' : LOCATION_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        {tab === 'stocks' ? (
          <DataTable
            rows={stockRows}
            onRowClick={(r) => navigate(`/produits/${r.product.id}`)}
            searchKeys={(r) => r.product.name}
            searchPlaceholder="Rechercher un produit…"
            pageSize={15}
            columns={[
              { key: 'name', label: 'Produit', render: (r) => <span className="font-medium text-ink-900">{r.product.name}</span>, sortValue: (r) => r.product.name },
              { key: 'cat', label: 'Catégorie', render: (r) => CATEGORY_LABEL[r.product.categoryId] },
              { key: 'loc', label: 'Service', render: (r) => LOCATION_LABEL[r.location] },
              { key: 'qty', label: 'Stock', render: (r) => `${r.qty} ${r.product.storageUnit}`, sortValue: (r) => r.qty },
              { key: 'min', label: 'Seuil min.', render: (r) => r.product.minStock },
            ]}
          />
        ) : (
          <DataTable
            rows={movementRows}
            onRowClick={(m) => navigate(`/produits/${m.productId}`)}
            searchKeys={(m) => productById(m.productId)?.name ?? ''}
            searchPlaceholder="Rechercher un produit…"
            pageSize={15}
            columns={[
              { key: 'date', label: 'Date', render: (m) => fmtDateTime(m.date), sortValue: (m) => m.date },
              { key: 'product', label: 'Produit', render: (m) => productById(m.productId)?.name },
              { key: 'loc', label: 'Service', render: (m) => LOCATION_LABEL[m.location] },
              { key: 'type', label: 'Type', render: (m) => MOVEMENT_TYPE_LABEL[m.type] },
              { key: 'qty', label: 'Quantité', render: (m) => (m.quantity > 0 ? `+${m.quantity}` : m.quantity) },
              { key: 'user', label: 'Utilisateur', render: (m) => userName(m.userId) },
              { key: 'value', label: 'Valeur', render: (m) => (m.value != null ? fmtMAD(m.value) : '—') },
            ]}
          />
        )}
      </Section>
    </>
  )
}
