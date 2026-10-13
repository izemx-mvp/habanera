import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader, Section } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { productById } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import { fmtDateTime, fmtMAD, formatMovementQuantity, formatStockDisplay, MOVEMENT_TYPE_LABEL, userName } from '@/data/selectors'
import type { StockLocationId } from '@/data/types'
import { useDataVersion } from '@/store/data-version'

export function MouvementsView({ location }: { location: StockLocationId }) {
  useDataVersion()
  const navigate = useNavigate()
  const rows = MOVEMENTS.filter((m) => m.location === location).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader title="Historique des mouvements" subtitle="Chaque opération de stock est tracée : produit, quantité, avant/après, utilisateur et document source." />
      <Section>
        <DataTable
          rows={rows}
          onRowClick={(m) => navigate(`/produits/${m.productId}`)}
          searchKeys={(m) => productById(m.productId)?.name ?? ''}
          searchPlaceholder="Rechercher un produit…"
          pageSize={15}
          columns={[
            { key: 'date', label: 'Date', render: (m) => fmtDateTime(m.date), sortValue: (m) => m.date },
            { key: 'product', label: 'Produit', render: (m) => <span className="font-medium text-ink-900">{productById(m.productId)?.name}</span> },
            { key: 'type', label: 'Type', render: (m) => MOVEMENT_TYPE_LABEL[m.type] },
            {
              key: 'qty',
              label: 'Quantité',
              render: (m) => {
                const isPositive = m.quantity > 0
                return (
                  <span
                    className={clsx(
                      'font-semibold text-xs',
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {formatMovementQuantity(m)}
                  </span>
                )
              },
              sortValue: (m) => m.quantity,
            },
            { key: 'before', label: 'Avant → après', render: (m) => `${formatStockDisplay(m.stockBefore, m.productId)} → ${formatStockDisplay(m.stockAfter, m.productId)}` },
            { key: 'user', label: 'Utilisateur', render: (m) => userName(m.userId) },
            { key: 'doc', label: 'Document', render: (m) => m.documentRef ?? '—' },
            { key: 'value', label: 'Valeur', render: (m) => (m.value != null ? fmtMAD(m.value) : '—') },
          ]}
        />
      </Section>
    </>
  )
}
