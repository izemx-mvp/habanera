import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, Sparkles } from 'lucide-react'
import { PageHeader, Section, Card, Stat, Empty } from '@/components/ui'
import { ServiceScopeSelector, type ServiceScope } from '@/components/ServiceScopeSelector'
import { PRODUCTS, productById } from '@/data/catalog'
import { MOVEMENTS } from '@/data/generate'
import {
  dailySeries,
  fmtDateTime,
  MOVEMENT_TYPE_LABEL,
  pendingOutflows,
  requisitionsFor,
  LOCATION_LABEL
} from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export default function ServiceDashboard() {
  useDataVersion()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialService = (searchParams.get('service') as ServiceScope) || 'all'
  const [scope, setScope] = useState<ServiceScope>(initialService)

  function handleScopeChange(newScope: ServiceScope) {
    setScope(newScope)
    setSearchParams(newScope === 'all' ? {} : { service: newScope })
  }

  // Filtered collections based on perimeter
  const barProducts = PRODUCTS.filter((p) => p.active && p.location === 'bar')

  // Requisitions
  const barReqs = requisitionsFor('bar').filter((r) => r.status !== 'livre' && r.status !== 'rejete')
  const cuisineReqs = requisitionsFor('cuisine').filter((r) => r.status !== 'livre' && r.status !== 'rejete')
  const activeReqs = scope === 'bar' ? barReqs : scope === 'cuisine' ? cuisineReqs : [...barReqs, ...cuisineReqs]

  // Pending Outflows
  const pendingDecl = pendingOutflows().filter((o) => scope === 'all' || o.location === scope)

  // Recent Movements
  const recentMovements = MOVEMENTS
    .filter((m) => scope === 'all' ? (m.location === 'bar' || m.location === 'cuisine') : m.location === scope)
    .slice(-8)
    .reverse()

  // Chart data
  const barSales = dailySeries('bar', 14)
  const cuisineMovements = dailySeries('cuisine', 14, ['vente', 'sortie_hors_vente_validee'])

  const combinedSeries = barSales.map((item, idx) => ({
    label: item.label,
    barQty: item.qty,
    cuisineQty: cuisineMovements[idx]?.qty ?? 0,
    totalQty: item.qty + (cuisineMovements[idx]?.qty ?? 0),
  }))

  return (
    <>
      <PageHeader
        title="Opérations de Service"
        subtitle="Espace unifié Bar & Cuisine — Suivi des flux opérationnels, stocks terrain, réquisitions et pertes."
        actions={
          <ServiceScopeSelector value={scope} onChange={handleScopeChange} />
        }
      />

      <Section>
        {/* INFO BANNER */}
        <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[13px] text-ink-700 dark:text-ink-300 flex items-start gap-3">
          <Sparkles className="text-copper shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-ink-900 dark:text-ink-100">Interface Opérationnelle Unifiée : </span>
            Vous gérez simultanément l'espace <strong>Bar</strong> (boissons, cocktails, doses fines) et l'espace <strong>Cuisine</strong>.
            Le sélecteur de périmètre ci-dessus vous permet de filtrer en un clic vos opérations ou de travailler en vue combinée.
          </div>
        </div>

        {/* PRIMARY KPIS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div onClick={() => navigate('/service/stock')} className="cursor-pointer">
            <Stat
              label="Stock Bar / Cuisine"
              value={`${barProducts.length} réf.`}
              hint="Unités fines & doses de 5 cl"
            />
          </div>

          <div onClick={() => navigate('/service/z-mouvements')} className="cursor-pointer">
            <Stat
              label="Z et mouvements"
              value={`${recentMovements.length} flux`}
              hint="Rapprochement caisse Z"
            />
          </div>

          <div onClick={() => navigate('/service/prelevements')} className="cursor-pointer">
            <Stat
              label="Bons de prélèvement en cours"
              value={String(activeReqs.length)}
              hint={`${activeReqs.length} demande(s) en attente Économat`}
              tone={activeReqs.length ? 'warning' : undefined}
            />
          </div>

          <div onClick={() => navigate('/service/sorties-hors-vente')} className="cursor-pointer">
            <Stat
              label="Sorties hors-vente à valider"
              value={String(pendingDecl.length)}
              tone={pendingDecl.length ? 'warning' : 'success'}
              hint="Pertes, offerts, casse"
            />
          </div>
        </div>

        {/* SALES & ACTIVITY CHART */}
        <Card title={`Activité opérationnelle (14 derniers jours) — ${scope === 'all' ? 'Bar & Cuisine' : LOCATION_LABEL[scope]}`} className="mb-6">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedSeries} margin={{ left: -20, top: 8 }}>
                <defs>
                  <linearGradient id="serviceGradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B7794B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#B7794B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="serviceGradientCuisine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5A4536" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5A4536" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink-100 dark:text-ink-800" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: any, name: any) => [`${v} unités`, name === 'barQty' ? 'Bar' : name === 'cuisineQty' ? 'Cuisine' : 'Total']} />
                {(scope === 'all' || scope === 'bar') && (
                  <Area type="monotone" dataKey="barQty" name="barQty" stroke="#B7794B" strokeWidth={2} fill="url(#serviceGradientBar)" />
                )}
                {(scope === 'all' || scope === 'cuisine') && (
                  <Area type="monotone" dataKey="cuisineQty" name="cuisineQty" stroke="#5A4536" strokeWidth={2} fill="url(#serviceGradientCuisine)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* RECENT MOVEMENTS & TASKS */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card
            title="Derniers mouvements de stock"
            action={
              <Link to="/service/z-mouvements" className="text-xs text-copper hover:underline flex items-center gap-1">
                Z et mouvements complets <ArrowRight size={12} />
              </Link>
            }
          >
            {recentMovements.length === 0 ? (
              <Empty>Aucun mouvement récent enregistré.</Empty>
            ) : (
              <div className="space-y-2">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[12.5px] py-1.5 border-b border-ink-100 dark:border-ink-800 last:border-0">
                    <div className="min-w-0">
                      <div className="font-medium text-ink-900 dark:text-ink-100 truncate">
                        {productById(m.productId)?.name}
                      </div>
                      <div className="text-[11px] text-ink-400">
                        {LOCATION_LABEL[m.location]} · {MOVEMENT_TYPE_LABEL[m.type]} · {fmtDateTime(m.date)}
                      </div>
                    </div>
                    <span className={m.quantity > 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Bons de prélèvement récents"
            action={
              <Link to={`/service/prelevements?service=${scope}`} className="text-xs text-copper hover:underline flex items-center gap-1">
                Tous les bons <ArrowRight size={12} />
              </Link>
            }
          >
            {activeReqs.length === 0 ? (
              <Empty>Aucun bon de prélèvement en cours pour ce périmètre.</Empty>
            ) : (
              <div className="space-y-2">
                {activeReqs.slice(0, 6).map((r) => {
                  const totalReq = r.items.reduce((s, i) => s + i.qtyRequested, 0)
                  const totalDel = r.items.reduce((s, i) => s + i.qtyDelivered, 0)
                  return (
                    <div
                      key={r.id}
                      onClick={() => navigate(`/service/prelevements?service=${r.requestingLocation}`)}
                      className="p-2.5 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800/50 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-2">
                          {r.id}
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-ink-200 dark:bg-ink-700 font-medium">
                            {LOCATION_LABEL[r.requestingLocation]}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {r.items.length} produit(s) · {totalDel}/{totalReq} reçu(s)
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600">
                        {r.status === 'partiellement_livre' ? 'Reliquat en attente' : 'En traitement'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </Section>
    </>
  )
}
