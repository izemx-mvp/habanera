import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, Section } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { ServiceScopeSelector, type ServiceScope } from '@/components/ServiceScopeSelector'
import { productById } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import { fmtDateTime, fmtMAD, MOVEMENT_TYPE_LABEL, userName, LOCATION_LABEL } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export default function ServiceMouvements() {
  useDataVersion()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialService = (searchParams.get('service') as ServiceScope) || 'all'
  const [scope, setScope] = useState<ServiceScope>(initialService)

  function handleScopeChange(newScope: ServiceScope) {
    setScope(newScope)
    setSearchParams(newScope === 'all' ? {} : { service: newScope })
  }

  const rows = MOVEMENTS
    .filter((m) => scope === 'all' ? (m.location === 'bar' || m.location === 'cuisine') : m.location === scope)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader
        title="Historique des mouvements de Service"
        subtitle="Traçabilité complète des flux Bar et Cuisine : ventes Z, réceptions, transferts et sorties hors-vente."
        actions={
          <ServiceScopeSelector value={scope} onChange={handleScopeChange} />
        }
      />

      <Section>
        <DataTable
          rows={rows}
          onRowClick={(m) => navigate(`/produits/${m.productId}`)}
          searchKeys={(m) => `${productById(m.productId)?.name ?? ''} ${LOCATION_LABEL[m.location]} ${m.documentRef ?? ''}`}
          searchPlaceholder="Rechercher par article, ticket Z, document…"
          pageSize={15}
          columns={[
            {
              key: 'date',
              label: 'Date & Heure',
              render: (m) => fmtDateTime(m.date),
              sortValue: (m) => m.date,
            },
            {
              key: 'service',
              label: 'Service',
              render: (m) => (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-ink-100 dark:bg-ink-800">
                  {LOCATION_LABEL[m.location]}
                </span>
              ),
              sortValue: (m) => m.location,
            },
            {
              key: 'product',
              label: 'Produit',
              render: (m) => (
                <div>
                  <span className="font-semibold text-ink-900 dark:text-ink-100">{productById(m.productId)?.name}</span>
                  {m.fineDetail && <div className="text-[11px] text-ink-500">{m.fineDetail}</div>}
                </div>
              ),
              sortValue: (m) => productById(m.productId)?.name ?? '',
            },
            {
              key: 'type',
              label: 'Type d’opération',
              render: (m) => MOVEMENT_TYPE_LABEL[m.type],
            },
            {
              key: 'qty',
              label: 'Quantité',
              render: (m) => (
                <span className={m.quantity > 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                </span>
              ),
              sortValue: (m) => m.quantity,
            },
            {
              key: 'user',
              label: 'Opérateur',
              render: (m) => userName(m.userId),
            },
            {
              key: 'doc',
              label: 'Réf. document',
              render: (m) => m.documentRef ?? '—',
            },
            {
              key: 'val',
              label: 'Valeur',
              render: (m) => (m.value != null ? fmtMAD(m.value) : '—'),
            },
          ]}
        />
      </Section>
    </>
  )
}
