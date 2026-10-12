import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, Section, Card, Stat } from '@/components/ui'
import { OUTFLOWS } from '@/data/generate'
import { acceptedOutflows, fmtMAD, LOCATION_LABEL, lossesValue, OUTFLOW_REASON_LABEL } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import type { OutflowReason } from '@/data/types'

const REASONS: OutflowReason[] = ['casse', 'perte', 'consommation_personnel', 'produit_offert', 'produit_perime', 'autre']

export default function AdminRapports() {
  useDataVersion()
  const accepted = acceptedOutflows()
  const byReason = REASONS.map((r) => ({
    name: OUTFLOW_REASON_LABEL[r],
    valeur: accepted.filter((o) => o.reason === r).reduce((s, o) => s + (o.value ?? 0), 0),
  }))
  const byService = (['bar', 'cuisine'] as const).map((l) => ({
    name: LOCATION_LABEL[l],
    valeur: accepted.filter((o) => o.location === l).reduce((s, o) => s + (o.value ?? 0), 0),
  }))
  const toValorize = accepted.filter((o) => o.value == null).length

  return (
    <>
      <PageHeader title="Rapports et pertes" subtitle="Valeur des sorties hors-vente acceptées, par motif et par service. Les déclarations rejetées ne sont jamais comptabilisées." />
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Valeur totale des pertes" value={fmtMAD(lossesValue())} to="/admin/sorties-hors-vente" />
          <Stat label="Déclarations acceptées" value={String(accepted.length)} to="/admin/sorties-hors-vente" />
          <Stat label="Déclarations rejetées" value={String(OUTFLOWS.filter((o) => o.status === 'rejetee').length)} to="/admin/sorties-hors-vente" />
          <Stat label="À valoriser (coût inconnu)" value={String(toValorize)} tone={toValorize ? 'warning' : 'success'} to="/admin/alertes" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Pertes par motif">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byReason} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DED7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtMAD(Number(v))} />
                  <Bar dataKey="valeur" fill="#B7794B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Pertes par service">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byService} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DED7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtMAD(Number(v))} />
                  <Bar dataKey="valeur" fill="#D8B878" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </Section>
    </>
  )
}
