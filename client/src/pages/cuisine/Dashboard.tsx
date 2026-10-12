import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, Section, Card, Stat, Empty } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { productsByLocation, productById } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import { alertsFor, dailySeries, fmtDateTime, MOVEMENT_TYPE_LABEL, OUTFLOW_STATUS_LABEL, pendingOutflows, REQ_STATUS_LABEL, requisitionsFor, stockAt } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export default function CuisineDashboard() {
  useDataVersion()
  const products = productsByLocation('cuisine').filter((p) => p.active)
  const alerts = alertsFor('cuisine')
  const movements = MOVEMENTS.filter((m) => m.location === 'cuisine').slice(-6).reverse()
  const requisitions = requisitionsFor('cuisine').filter((r) => r.status !== 'livre' && r.status !== 'rejete')
  const pendingDecl = pendingOutflows().filter((o) => o.location === 'cuisine')
  const conso = dailySeries('cuisine', 14)

  return (
    <>
      <PageHeader title="Tableau de bord Cuisine" subtitle="Produits de démonstration, stock et opérations en cours." />
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Produits actifs', value: String(products.length), to: '/cuisine/catalogue' },
            { label: 'Stocks faibles', value: String(alerts.length), tone: alerts.length ? 'error' : 'success', to: '/cuisine/stock' },
            { label: 'Bons en cours', value: String(requisitions.length), to: '/cuisine/prelevements' },
            { label: 'Sorties en attente', value: String(pendingDecl.length), tone: pendingDecl.length ? 'warning' : 'success', to: '/cuisine/sorties-hors-vente' },
          ].map((s, i) => (
            <div key={s.label} className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <Stat {...(s as any)} />
            </div>
          ))}
        </div>

        <Card title="Consommation — 14 derniers jours" className="mb-6">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conso} margin={{ left: -20, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-100 dark:text-ink-800" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v} unités`, 'Sorties']} />
                <Bar dataKey="qty" fill="#5A4536" radius={[4, 4, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Stocks">
            <div className="space-y-2">
              {products.map((p) => (
                <Link key={p.id} to={`/produits/${p.id}`} className="flex items-center justify-between text-[13px] py-1.5 hover:text-copper">
                  <span>{p.name}</span>
                  <span className={alerts.some((a) => a.productId === p.id) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-ink-700 dark:text-ink-300'}>
                    {stockAt('cuisine', p.id)} {p.storageUnit}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
          <Card title="Derniers mouvements">
            {movements.length === 0 ? (
              <Empty>Aucun mouvement récent.</Empty>
            ) : (
              <div className="space-y-2">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[12.5px] py-1.5">
                    <div className="min-w-0">
                      <div className="truncate text-ink-800 dark:text-ink-200">{productById(m.productId)?.name}</div>
                      <div className="text-ink-400 text-[11px]">{MOVEMENT_TYPE_LABEL[m.type]} · {fmtDateTime(m.date)}</div>
                    </div>
                    <span className={m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-700 dark:text-ink-300'}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Card title="Bons de prélèvement en cours" action={<Link to="/cuisine/prelevements" className="text-[12px] text-copper hover:underline">Voir tout</Link>}>
            {requisitions.length === 0 ? (
              <Empty>Aucun bon en cours.</Empty>
            ) : (
              <div className="space-y-2">
                {requisitions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-[13px] py-1.5">
                    <span>{r.id}</span>
                    <StatusBadge status={r.status} label={REQ_STATUS_LABEL[r.status]} />
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card title="Déclarations en attente" action={<Link to="/cuisine/sorties-hors-vente" className="text-[12px] text-copper hover:underline">Voir tout</Link>}>
            {pendingDecl.length === 0 ? (
              <Empty>Aucune déclaration en attente.</Empty>
            ) : (
              <div className="space-y-2">
                {pendingDecl.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-[13px] py-1.5">
                    <span>
                      {o.id} · {productById(o.productId)?.name}
                    </span>
                    <StatusBadge status={o.status} label={OUTFLOW_STATUS_LABEL[o.status]} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </Section>
    </>
  )
}
