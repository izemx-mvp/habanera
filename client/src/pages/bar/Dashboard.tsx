import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, Section, Card, Stat, Empty } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { productsByLocation } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import { alertsFor, dailySeries, fmtDateTime, MOVEMENT_TYPE_LABEL, OUTFLOW_STATUS_LABEL, pendingOutflows, REQ_STATUS_LABEL, requisitionsFor } from '@/data/selectors'
import { productById } from '@/data/catalog'
import { useDataVersion } from '@/store/data-version'

export default function BarDashboard() {
  useDataVersion()
  const products = productsByLocation('bar').filter((p) => p.active)
  const alerts = alertsFor('bar')
  const movements = MOVEMENTS.filter((m) => m.location === 'bar').slice(-6).reverse()
  const requisitions = requisitionsFor('bar').filter((r) => r.status !== 'livre' && r.status !== 'rejete')
  const pendingDecl = pendingOutflows().filter((o) => o.location === 'bar')
  const sales = dailySeries('bar', 14)

  return (
    <>
      <PageHeader title="Tableau de bord Bar" subtitle="Vue d'ensemble du catalogue, du stock et des opérations en cours." />
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Produits actifs', value: String(products.length), hint: 'catalogue du Bar', to: '/bar/catalogue' },
            { label: 'Stocks faibles', value: String(alerts.length), tone: alerts.length ? 'error' : 'success', hint: 'sous le seuil minimum', to: '/bar/stock' },
            { label: 'Bons de prélèvement en cours', value: String(requisitions.length), hint: 'hors livrés / rejetés', to: '/bar/prelevements' },
            { label: 'Sorties hors-vente en attente', value: String(pendingDecl.length), tone: pendingDecl.length ? 'warning' : 'success', to: '/bar/sorties-hors-vente' },
          ].map((s, i) => (
            <div key={s.label} className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <Stat {...(s as any)} />
            </div>
          ))}
        </div>

        <Card title="Ventes — 14 derniers jours" className="mb-6">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ left: -20, top: 8 }}>
                <defs>
                  <linearGradient id="barSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B7794B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#B7794B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-100 dark:text-ink-800" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v} unités`, 'Ventes']} />
                <Area type="monotone" dataKey="qty" stroke="#B7794B" strokeWidth={2} fill="url(#barSales)" animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Stocks faibles">
            {alerts.length === 0 ? (
              <Empty>Aucun produit sous le seuil minimum.</Empty>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 6).map((a) => (
                  <Link key={a.id} to={`/produits/${a.productId}`} className="flex items-center justify-between text-[13px] py-1.5 hover:text-copper">
                    <span>{productById(a.productId)?.name}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {a.currentQty} / {a.minStock}
                    </span>
                  </Link>
                ))}
              </div>
            )}
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
          <Card title="Bons de prélèvement en cours" action={<Link to="/bar/prelevements" className="text-[12px] text-copper hover:underline">Voir tout</Link>}>
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
          <Card title="Déclarations hors-vente en attente" action={<Link to="/bar/sorties-hors-vente" className="text-[12px] text-copper hover:underline">Voir tout</Link>}>
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
