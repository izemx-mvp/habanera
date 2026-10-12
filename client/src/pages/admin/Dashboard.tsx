import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar } from 'lucide-react'
import clsx from 'clsx'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { PageHeader, Section, Card, Stat, Empty } from '@/components/ui'
import { productById } from '@/data/catalog'
import { DEMO_TODAY, MOVEMENTS } from '@/data/generate'
import {
  allAlerts,
  fmtDateTime,
  fmtMAD,
  hiddenStories,
  monthlyActivity,
  MOVEMENT_TYPE_LABEL,
  openPurchaseOrders,
  pendingRequisitions,
  partialRequisitions,
  requisitionStatusBreakdown,
  totalSalesStats,
  totalPurchasesStats,
  marginAndLossStats,
  serviceLossesComparison,
  topBestsellers,
  topUnderperformers,
  topPartialDeliveryProducts,
  type TimePeriod
} from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import { BRAND } from '@/data/brand'

const PIE_COLORS = ['#B7794B', '#D8B878', '#9C9087', '#5A4536', '#DC2626']

export default function AdminDashboard() {
  useDataVersion()
  const navigate = useNavigate()

  // Time filter state
  const [period, setPeriod] = useState<TimePeriod>('mois')
  const [selectedDate, setSelectedDate] = useState<string>(DEMO_TODAY.slice(0, 10))

  // Core metrics derived dynamically
  const alerts = allAlerts()
  const pendingReq = pendingRequisitions()
  const partialPOs = openPurchaseOrders().filter((po) => po.status === 'partiellement_recue')

  // New KPIs per specification (Section 2)
  const salesData = totalSalesStats(period, selectedDate)
  const purchasesData = totalPurchasesStats(period, selectedDate)
  const marginLossData = marginAndLossStats(period, selectedDate)
  const serviceLosses = serviceLossesComparison()
  const bestsellers = topBestsellers(5)
  const underperformers = topUnderperformers(5)
  const partialDeliveryItems = topPartialDeliveryProducts(5)

  const recent = [...MOVEMENTS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  const stories = hiddenStories()
  const reqBreakdown = requisitionStatusBreakdown().filter((r) => r.value > 0)
  const activity = monthlyActivity(period === 'annee' ? 12 : period === 'semaine' ? 3 : 6)

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Pilotage global HABANERA — Ventes, Achats fournisseurs, Marges & Performance opérationnelle."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Flexible Time View Selector */}
            <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-xl text-xs font-medium">
              {(['jour', 'semaine', 'mois', 'annee'] as const).map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    period === p
                      ? 'bg-ink-900 text-white dark:bg-copper dark:text-ink-950 shadow-xs'
                      : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white'
                  }`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 px-3 py-1.5 rounded-xl text-xs text-ink-700 dark:text-ink-300">
              <Calendar size={14} className="text-copper" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs text-ink-900 dark:text-ink-100 focus:outline-none"
              />
            </div>
          </div>
        }
      />

      <Section>
        {/* ROW 1: PRIMARY FINANCIAL & OPERATIONAL KPIS (All clickable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div
            onClick={() => navigate('/admin/z-mouvements')}
            className="cursor-pointer group hover:scale-[1.01] transition-transform"
          >
            <Stat
              label={`Ventes totales (${period})`}
              value={fmtMAD(salesData.totalValue)}
              hint={`${salesData.totalQty} articles / doses vendus · Cliquer pour le Z`}
            />
          </div>

          <div
            onClick={() => navigate('/admin/commandes')}
            className="cursor-pointer group hover:scale-[1.01] transition-transform"
          >
            <Stat
              label={`Achats fournisseurs (${period})`}
              value={fmtMAD(purchasesData.totalValue)}
              hint={`${purchasesData.totalQty} unités reçues · Voir commandes`}
            />
          </div>

          <div
            onClick={() => navigate('/admin/sorties-hors-vente')}
            className="cursor-pointer group hover:scale-[1.01] transition-transform"
          >
            <Stat
              label="Marge vs Taux de perte"
              value={`${marginLossData.marginRate}% marge`}
              hint={`Pertes : ${fmtMAD(marginLossData.losses)} (${marginLossData.lossRate}%)`}
              tone={marginLossData.lossRate > 5 ? 'warning' : 'success'}
            />
          </div>

          <div
            onClick={() => navigate('/admin/sorties-hors-vente')}
            className="cursor-pointer group hover:scale-[1.01] transition-transform"
          >
            <Stat
              label="Service hors-vente le + coûteux"
              value={serviceLosses.mostCostlyLocation === 'bar' ? 'Bar' : 'Cuisine'}
              hint={`${fmtMAD(serviceLosses.mostCostlyAmount)} (${serviceLosses.mostCostlyPct}% des pertes)`}
              tone={serviceLosses.mostCostlyAmount > 1000 ? 'error' : undefined}
            />
          </div>
        </div>

        {/* ROW 2: CRITICAL ACTION COUNTERS (All clickable) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div onClick={() => navigate('/admin/stock-economat')} className="cursor-pointer">
            <Stat
              label="Stocks critiques Économat"
              value={String(alerts.length)}
              tone={alerts.length ? 'error' : 'success'}
              hint="Seuil minimum central"
            />
          </div>
          <div onClick={() => navigate('/admin/prelevements')} className="cursor-pointer">
            <Stat
              label="Bons de prélèvement"
              value={String(pendingReq.length + partialRequisitions().length)}
              hint={`${partialRequisitions().length} reliquats en attente`}
            />
          </div>
          <div onClick={() => navigate('/admin/commandes')} className="cursor-pointer">
            <Stat
              label="Commandes fournisseurs"
              value={String(openPurchaseOrders().length)}
              hint={`${partialPOs.length} livraisons partielles`}
            />
          </div>
          <div onClick={() => navigate('/admin/stock-bar')} className="cursor-pointer">
            <Stat
              label="Stock Bar & Portions"
              value="En service"
              hint="Suivi théorique vs réel"
            />
          </div>
        </div>

        {/* ROW 3: PRODUCT PERFORMANCE TABLES (Best sellers vs Underperformers vs Partial Deliveries) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Bestsellers */}
          <Card
            title="Top Ventes (Bestsellers)"
            action={
              <button
                onClick={() => navigate('/admin/z-mouvements')}
                className="text-xs text-copper hover:underline flex items-center gap-1"
              >
                Tout voir <ArrowRight size={12} />
              </button>
            }
          >
            <div className="space-y-3">
              {bestsellers.map((item, idx) => (
                <div
                  key={item.product.id}
                  onClick={() => navigate(`/produits/${item.product.id}`)}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-copper/10 text-copper text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-medium text-ink-900 dark:text-ink-100 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-ink-400">{item.product.storageUnit}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtMAD(item.value)}</div>
                    <div className="text-[10px] text-ink-400">{item.qty} vendus</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Underperformers */}
          <Card
            title="Moins vendus (Underperformers)"
            action={
              <button
                onClick={() => navigate('/admin/stock-economat')}
                className="text-xs text-copper hover:underline flex items-center gap-1"
              >
                Gérer stocks <ArrowRight size={12} />
              </button>
            }
          >
            <div className="space-y-3">
              {underperformers.map((item, idx) => (
                <div
                  key={item.product.id}
                  onClick={() => navigate(`/produits/${item.product.id}`)}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800/50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-ink-200 dark:bg-ink-800 text-ink-600 dark:text-ink-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-medium text-ink-900 dark:text-ink-100 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-ink-400">Stock restant : {item.stock} {item.product.storageUnit}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-medium">
                      Rotation lente
                    </span>
                    <div className="text-[10px] text-ink-400 mt-0.5">{item.qty} vente(s)</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Partial Deliveries (Root cause supply bottlenecks) */}
          <Card
            title="Incidents Livraisons Partielles"
            action={
              <button
                onClick={() => navigate('/admin/commandes')}
                className="text-xs text-copper hover:underline flex items-center gap-1"
              >
                Fournisseurs <ArrowRight size={12} />
              </button>
            }
          >
            <div className="space-y-3">
              {partialDeliveryItems.length === 0 ? (
                <Empty>Aucune rupture de livraison constatée.</Empty>
              ) : (
                partialDeliveryItems.map((item) => (
                  <div
                    key={item.product.id}
                    onClick={() => navigate(`/produits/${item.product.id}`)}
                    className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800/50 cursor-pointer transition"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-ink-900 dark:text-ink-100 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-ink-400">
                        {item.partialCount} livraison(s) incomplète(s)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-red-600 dark:text-red-400 text-[11px]">
                        -{item.missingQty} {item.product.storageUnit}
                      </span>
                      <div className="text-[10px] text-ink-400">reliquat dû</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ACTIVITY CHART */}
        <Card title={`Évolution de l'activité HABANERA — ${period.toUpperCase()}`} className="mb-6">
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

        {/* AI INSIGHTS & STATUS BREAKDOWN */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card title={`${BRAND.aiName} a détecté`} className="lg:col-span-2">
            <div className="space-y-3">
              {stories.map((s) => (
                <div
                  key={s.id}
                  onClick={() => s.link && navigate(s.link)}
                  className={clsx(
                    'flex items-start gap-3 p-2 rounded-xl transition',
                    s.link && 'cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800/40'
                  )}
                >
                  <span
                    className={
                      s.severity === 'critique'
                        ? 'mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0'
                        : s.severity === 'a-surveiller'
                        ? 'mt-1.5 w-2 h-2 rounded-full bg-amber-500 shrink-0'
                        : 'mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0'
                    }
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 flex items-center gap-1.5">
                      {s.title}
                      {s.link && <ArrowRight size={12} className="text-copper inline" />}
                    </div>
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

        {/* RECENT MOVEMENTS */}
        <Card
          title="Historique récent des mouvements"
          action={
            <button
              onClick={() => navigate('/admin/z-mouvements')}
              className="text-xs text-copper hover:underline flex items-center gap-1"
            >
              Tous les mouvements <ArrowRight size={12} />
            </button>
          }
        >
          {recent.length === 0 ? (
            <Empty>Aucun mouvement récent.</Empty>
          ) : (
            <div className="space-y-2">
              {recent.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/produits/${m.productId}`)}
                  className="flex items-center justify-between text-[12.5px] py-2 px-2 hover:bg-ink-50 dark:hover:bg-ink-800/40 rounded-xl cursor-pointer transition"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink-800 dark:text-ink-200">{productById(m.productId)?.name}</div>
                    <div className="text-ink-400 text-[11px]">{MOVEMENT_TYPE_LABEL[m.type]} · {fmtDateTime(m.date)}</div>
                  </div>
                  <span className={clsx('font-semibold', m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-700 dark:text-ink-300')}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Section>
    </>
  )
}
