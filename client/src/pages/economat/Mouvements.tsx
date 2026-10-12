import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader, Section } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { productById } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import { fmtDateTime, fmtMAD, LOCATION_LABEL, MOVEMENT_TYPE_LABEL, userName } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import type { StockLocationId } from '@/data/types'

export default function EconomatMouvements() {
  useDataVersion()
  const navigate = useNavigate()
  const [loc, setLoc] = useState<'all' | StockLocationId>('all')
  const rows = MOVEMENTS.filter((m) => loc === 'all' || m.location === loc).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader title="Mouvements de stock" subtitle="Tous les mouvements du magasin central et des services, dans l'ordre chronologique." />
      <Section>
        <div className="flex gap-2 mb-5">
          {(['all', 'economat', 'bar', 'cuisine'] as const).map((l) => (
            <button key={l} className={clsx('chip', loc === l && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setLoc(l)}>
              {l === 'all' ? 'Tous' : LOCATION_LABEL[l]}
            </button>
          ))}
        </div>
        <DataTable
          rows={rows}
          onRowClick={(m) => navigate(`/produits/${m.productId}`)}
          searchKeys={(m) => productById(m.productId)?.name ?? ''}
          searchPlaceholder="Rechercher un produit…"
          pageSize={15}
          columns={[
            { key: 'date', label: 'Date', render: (m) => fmtDateTime(m.date), sortValue: (m) => m.date },
            { key: 'product', label: 'Produit', render: (m) => <span className="font-medium text-ink-900">{productById(m.productId)?.name}</span> },
            { key: 'loc', label: 'Service', render: (m) => LOCATION_LABEL[m.location] },
            { key: 'type', label: 'Type', render: (m) => MOVEMENT_TYPE_LABEL[m.type] },
            { key: 'qty', label: 'Quantité', render: (m) => (m.quantity > 0 ? `+${m.quantity}` : m.quantity) },
            { key: 'user', label: 'Utilisateur', render: (m) => userName(m.userId) },
            { key: 'value', label: 'Valeur', render: (m) => (m.value != null ? fmtMAD(m.value) : '—') },
          ]}
        />
      </Section>
    </>
  )
}
