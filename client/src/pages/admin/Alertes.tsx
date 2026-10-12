import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { PageHeader, Section, Stat, Empty } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { allAnomalies, ANOMALY_TYPE_LABEL, fmtDateTime } from '@/data/selectors'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import type { AnomalySeverity } from '@/data/selectors'

const SEVERITY_LABEL: Record<AnomalySeverity, string> = { critique: 'Critique', elevee: 'Élevée', moderee: 'Modérée' }
const SEVERITY_BADGE: Record<AnomalySeverity, string> = {
  critique: 'badge-error',
  elevee: 'badge-warning',
  moderee: 'badge-neutral',
}

type Filter = 'actives' | 'critique' | 'elevee' | 'moderee' | 'resolues' | 'toutes'

export default function AdminAlertes() {
  useDataVersion()
  const navigate = useNavigate()
  const resolvedIds = useAppStore((s) => s.resolvedAnomalyIds)
  const resolveAnomaly = useAppStore((s) => s.resolveAnomaly)
  const reopenAnomaly = useAppStore((s) => s.reopenAnomaly)
  const [filter, setFilter] = useState<Filter>('actives')

  const all = allAnomalies()
  const active = all.filter((a) => !resolvedIds.includes(a.id))
  const resolved = all.filter((a) => resolvedIds.includes(a.id))

  const shown = (() => {
    switch (filter) {
      case 'actives':
        return active
      case 'resolues':
        return resolved
      case 'toutes':
        return all
      default:
        return active.filter((a) => a.severity === filter)
    }
  })()

  return (
    <>
      <PageHeader title="Alertes & anomalies" subtitle="Vue consolidée des ruptures, écarts d'inventaire, réceptions partielles et sorties hors-vente en attente, sur tous les services." />
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Actives" value={String(active.length)} tone={active.length ? 'error' : 'success'} />
          <Stat label="Critiques" value={String(active.filter((a) => a.severity === 'critique').length)} tone="error" />
          <Stat label="Élevées" value={String(active.filter((a) => a.severity === 'elevee').length)} tone="warning" />
          <Stat label="Résolues" value={String(resolved.length)} tone="success" />
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {([
            ['actives', 'Actives'],
            ['critique', 'Critique'],
            ['elevee', 'Élevée'],
            ['moderee', 'Modérée'],
            ['resolues', 'Résolues'],
            ['toutes', 'Toutes'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              className={clsx('chip', filter === key && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <Empty>Aucune anomalie dans ce filtre.</Empty>
        ) : (
          <DataTable
            rows={shown}
            searchKeys={(a) => a.title}
            searchPlaceholder="Rechercher une alerte…"
            columns={[
              { key: 'type', label: 'Catégorie', render: (a) => ANOMALY_TYPE_LABEL[a.type] },
              {
                key: 'title',
                label: 'Anomalie',
                render: (a) => (
                  <button className="text-left font-medium text-ink-900 dark:text-ink-50 hover:text-copper" onClick={() => a.link && navigate(a.link)}>
                    {a.title}
                  </button>
                ),
              },
              { key: 'detail', label: 'Détail', render: (a) => <span className="text-ink-600 dark:text-ink-300">{a.detail}</span> },
              { key: 'severity', label: 'Criticité', render: (a) => <span className={SEVERITY_BADGE[a.severity]}>{SEVERITY_LABEL[a.severity]}</span> },
              { key: 'date', label: 'Date', render: (a) => fmtDateTime(a.date), sortValue: (a) => a.date },
              {
                key: 'action',
                label: '',
                render: (a) =>
                  resolvedIds.includes(a.id) ? (
                    <button className="btn-ghost btn-sm" onClick={() => reopenAnomaly(a.id)}>
                      <RotateCcw size={13} />
                      Rouvrir
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" onClick={() => resolveAnomaly(a.id)}>
                      <CheckCircle2 size={13} />
                      Marquer comme résolu
                    </button>
                  ),
              },
            ]}
          />
        )}
      </Section>
    </>
  )
}
