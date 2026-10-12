import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, Section, Card, Stat, Empty } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { REQUISITIONS } from '@/data/generate'
import { economatReplenishList, openPurchaseOrders, PO_STATUS_LABEL, REQ_STATUS_LABEL, stockByCategory, supplierName } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export default function EconomatDashboard() {
  useDataVersion()
  const pending = REQUISITIONS.filter((r) => r.status === 'en_attente')
  const preparing = REQUISITIONS.filter((r) => r.status === 'en_preparation' || r.status === 'partiellement_livre')
  const openPOs = openPurchaseOrders()
  const toReplenish = economatReplenishList()
  const byCategory = stockByCategory('economat')

  return (
    <>
      <PageHeader title="Tableau de bord Économat" subtitle="Stock central, demandes des services et approvisionnements." />
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Demandes en attente', value: String(pending.length), tone: pending.length ? 'warning' : 'success', to: '/economat/prelevements' },
            { label: 'Préparations en cours', value: String(preparing.length), to: '/economat/prelevements' },
            { label: 'Commandes fournisseurs ouvertes', value: String(openPOs.length), to: '/economat/commandes' },
            { label: 'Produits à réapprovisionner', value: String(toReplenish.length), tone: toReplenish.length ? 'error' : 'success', to: '/economat/stock' },
          ].map((s, i) => (
            <div key={s.label} className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <Stat {...(s as any)} />
            </div>
          ))}
        </div>

        <Card title="Stock central par catégorie" className="mb-6">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ left: 24, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-100 dark:text-ink-800" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} unités`, 'Stock']} />
                <Bar dataKey="value" fill="#D8B878" radius={[0, 4, 4, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Demandes de prélèvement en attente" action={<Link to="/economat/prelevements" className="text-[12px] text-copper hover:underline">Voir tout</Link>}>
            {pending.length === 0 ? (
              <Empty>Aucune demande en attente.</Empty>
            ) : (
              <div className="space-y-2">
                {pending.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-[13px] py-1.5">
                    <span>
                      {r.id} · {r.requestingLocation === 'bar' ? 'Bar' : 'Cuisine'}
                    </span>
                    <StatusBadge status={r.status} label={REQ_STATUS_LABEL[r.status]} />
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card title="Réceptions attendues" action={<Link to="/economat/commandes" className="text-[12px] text-copper hover:underline">Voir tout</Link>}>
            {openPOs.length === 0 ? (
              <Empty>Aucune réception attendue.</Empty>
            ) : (
              <div className="space-y-2">
                {openPOs.map((po) => (
                  <div key={po.id} className="flex items-center justify-between text-[13px] py-1.5">
                    <span>
                      {po.id} · {supplierName(po.supplierId)}
                    </span>
                    <StatusBadge status={po.status} label={PO_STATUS_LABEL[po.status]} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="mt-6">
          <Card title="Produits à réapprovisionner (stock central)">
            {toReplenish.length === 0 ? (
              <Empty>Le stock central couvre les besoins actuels.</Empty>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {toReplenish.map(({ product, qty }) => (
                  <Link key={product.id} to={`/produits/${product.id}`} className="flex items-center justify-between text-[12.5px] px-3 py-2 rounded-lg border border-ink-100 dark:border-ink-700 hover:border-copper">
                    <span className="truncate">{product.name}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">{qty}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Section>
    </>
  )
}
