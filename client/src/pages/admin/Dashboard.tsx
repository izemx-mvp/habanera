import { useState } from 'react'
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, Section, Card, Stat, Empty } from '@/components/ui'
import { productById, PRODUCTS } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import { allAlerts, fmtDateTime, fmtMAD, hiddenStories, lossesValue, monthlyActivity, MOVEMENT_TYPE_LABEL, openPurchaseOrders, pendingOutflows, pendingRequisitions, partialRequisitions, requisitionStatusBreakdown } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import { BRAND } from '@/data/brand'

const PIE_COLORS = ['#B7794B', '#D8B878', '#9C9087', '#5A4536', '#DC2626']
const RANGE_OPTIONS = [3, 6, 12]

export default function AdminDashboard() {
  useDataVersion()
  const activeProducts = PRODUCTS.filter((p) => p.active)
  const alerts = allAlerts()
  const pendingReq = pendingRequisitions()
  const partialPOs = openPurchaseOrders().filter((po) => po.status === 'partiellement_recue')
  const pendingDecl = pendingOutflows()
  const recent = [...MOVEMENTS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  const stories = hiddenStories()
  const reqBreakdown = requisitionStatusBreakdown().filter((r) => r.value > 0)
  const [range, setRange] = useState(3)
  const activity = monthlyActivity(range)

  const kpis = [
    { label: 'Produits actifs', value: String(activeProducts.length), to: '/admin/produits' },
    { label: 'Stocks critiques', value: String(alerts.length), tone: alerts.length ? 'error' : 'success', to: '/admin/alertes' },
    { label: 'Bons de prélèvement en attente', value: String(pendingReq.length + partialRequisitions().length), to: '/admin/prelevements' },
    { label: 'Commandes en cours', value: String(openPurchaseOrders().length), to: '/admin/commandes' },
  ] as const
  const kpis2 = [
    { label: 'Réceptions partielles', value: String(partialPOs.length), to: '/admin/commandes' },
    { label: 'Sorties hors-vente à valider', value: String(pendingDecl.length), tone: pendingDecl.length ? 'warning' : 'success', to: '/admin/sorties-hors-vente' },
    { label: 'Valeur des pertes validées', value: fmtMAD(lossesValue()), to: '/admin/rapports' },
    { label: 'Alertes actives', value: String(alerts.length), tone: alerts.length ? 'error' : 'success', hint: 'voir le détail', to: '/admin/alertes' },
  ] as const

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de l'activité HABANERA — Bar, Cuisine et Économat." />
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {kpis.map((s, i) => (
            <div key={s.label} className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <Stat {...(s as any)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis2.map((s, i) => (
            <div key={s.label} className="animate-fadeUp" style={{ animationDelay: `${(i + 4) * 60}ms` }}>
              <Stat {...(s as any)} />
            </div>
          ))}
        </div>

        <Card
          title="Activité HABANERA — par mois"
          className="mb-6"
          action={
            <div className="flex gap-1">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  className={`chip !py-1 ${range === r ? '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper' : ''}`}
                  onClick={() => setRange(r)}
                >
                  {r} mois
                </button>
              ))}
            </div>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activity} margin={{ left: -10, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-100 dark:text-ink-800" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="mouvements" name="Mouvements" fill="#D8B878" radius={[4, 4, 0, 0]} animationDuration={600} />
                <Bar yAxisId="left" dataKey="prelevements" name="Transferts" fill="#B7794B" radius={[4, 4, 0, 0]} animationDuration={600} />
                <Line yAxisId="right" type="monotone" dataKey="pertes" name="Pertes (MAD)" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card title={`${BRAND.aiName} a détecté`} className="lg:col-span-2">
            <div className="space-y-3">
              {stories.map((s) => (
                <div key={s.id} className="flex items-start gap-3">
                  <span
                    className={
                      s.severity === 'critique' ? 'mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0' : s.severity === 'a-surveiller' ? 'mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0' : 'mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0'
                    }
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">{s.title}</div>
                    <div className="text-[12px] text-ink-500 dark:text-ink-400 leading-relaxed">{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Bons de prélèvement par statut">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reqBreakdown} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} paddingAngle={2} animationDuration={700}>
                    {reqBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card title="Historique récent des mouvements">
          {recent.length === 0 ? (
            <Empty>Aucun mouvement récent.</Empty>
          ) : (
            <div className="space-y-2">
              {recent.map((m) => (
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
      </Section>
    </>
  )
}
