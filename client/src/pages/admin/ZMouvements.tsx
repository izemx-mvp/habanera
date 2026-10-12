import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Sparkles, Upload, Wine } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { ZImportModal } from '@/components/ZImportModal'
import { productById, PRODUCTS } from '@/data/catalog'
import { BALANCES, MOVEMENTS } from '@/data/generate'
import { fmtDateTime, LOCATION_LABEL, MOVEMENT_TYPE_LABEL } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import type { MovementType, StockLocationId } from '@/data/types'

export default function AdminZMouvements() {
  useDataVersion()
  const navigate = useNavigate()

  const [locationFilter, setLocationFilter] = useState<'all' | StockLocationId>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | MovementType>('all')
  const [importOpen, setImportOpen] = useState(false)

  // Total Z sales
  const salesMovements = MOVEMENTS.filter((m) => m.type === 'vente')
  const totalSalesCount = salesMovements.length
  const totalDosesDispensed = salesMovements.reduce((sum, m) => {
    const p = PRODUCTS.find((prod) => prod.id === m.productId)
    const factor = p?.dosesPerBottle || (p?.storageUnit === 'bouteille' ? 15 : 1)
    return sum + Math.abs(m.quantity) * factor
  }, 0)

  // Alertes & Recommandations IA (anticipation sous seuil bouteille entamée <= 10 doses)
  const doseAnticipations = PRODUCTS.filter((p) => {
    if (p.location !== 'bar' || p.storageUnit !== 'bouteille' || !p.dosesPerBottle) return false
    const qty = BALANCES.bar[p.id] ?? 0
    const totalDoses = Math.round(qty * p.dosesPerBottle)
    const openDoses = totalDoses % p.dosesPerBottle
    return (openDoses > 0 && openDoses <= 10) || (totalDoses > 0 && totalDoses <= 10)
  }).map((p) => {
    const qty = BALANCES.bar[p.id] ?? 0
    const totalDoses = Math.round(qty * p.dosesPerBottle!)
    const openDoses = totalDoses % p.dosesPerBottle!
    return {
      product: p,
      totalDoses,
      openDoses: openDoses > 0 ? openDoses : totalDoses,
      fullBottles: Math.floor(qty),
    }
  })

  const filteredMovements = MOVEMENTS
    .filter((m) => locationFilter === 'all' || m.location === locationFilter)
    .filter((m) => typeFilter === 'all' || m.type === typeFilter)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader
        title="Z et mouvements de stock"
        subtitle="Rapprochement des clôtures de caisse (Tickets Z), déduction précise en doses/cl et historique complet des flux."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setImportOpen(true)}>
            <Upload size={14} />
            Importer en masse (Ticket Z)
          </button>
        }
      />

      <Section>
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Total flux enregistrés" value={String(MOVEMENTS.length)} />
          <Stat label="Lignes de vente Ticket Z" value={String(totalSalesCount)} />
          <Stat
            label="Portions & doses servies"
            value={`${Math.round(totalDosesDispensed)} doses`}
            hint="Déduction fine en cl/doses"
          />
          <Stat
            label="Rapprochement Z / Caisses"
            value="100% rapproché"
            tone="success"
          />
        </div>

        {/* Explainability note */}
        <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[13px] text-ink-700 dark:text-ink-300 flex items-start gap-3">
          <Sparkles className="text-copper shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-ink-900 dark:text-ink-100">Intégration des Tickets Z : </span>
            Chaque clôture de caisse Z déduit mathématiquement les portions consommées au Bar et en Cuisine.
            Pour les spiritueux, <strong>la déduction se fait en doses fines (5 cl)</strong>, maintenant la traçabilité des bouteilles entamées sans déduire une unité bouteille complète prématurément.
          </div>
        </div>

        {/* Alertes & Recommandations IA (Anticipation de réapprovisionnement) */}
        {doseAnticipations.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-ink-900 dark:text-ink-100">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-500" size={18} />
                <span className="font-bold text-sm text-amber-700 dark:text-amber-400">
                  Alertes & Recommandations IA — Anticipation de réapprovisionnement
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Seuil de vigilance : ≤ 10 doses en bouteille entamée
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {doseAnticipations.map(({ product: p, openDoses, totalDoses }) => (
                <div key={p.id} className="p-3 bg-white dark:bg-ink-900 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold text-sm text-ink-900 dark:text-ink-100 flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        (Reste {openDoses} doses dans la bouteille entamée / {totalDoses} doses disponibles)
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 dark:text-ink-400 mt-0.5">
                      💡 <strong>Recommandation IA :</strong> Risque d'épuisement imminent. Émettre un bon de prélèvement d'<strong>1 bouteille pleine scellée</strong> vers l'Économat pour sécuriser le Bar.
                    </p>
                  </div>
                  <button
                    className="btn-primary btn-xs whitespace-nowrap"
                    onClick={() => navigate('/admin/prelevements')}
                  >
                    Créer bon de prélèvement (1 btl)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex gap-2">
            {(['all', 'bar', 'cuisine', 'economat'] as const).map((loc) => (
              <button
                key={loc}
                className={clsx(
                  'chip',
                  locationFilter === loc && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
                )}
                onClick={() => setLocationFilter(loc)}
              >
                {loc === 'all' ? 'Tous les espaces' : LOCATION_LABEL[loc]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              className={clsx('chip', typeFilter === 'all' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setTypeFilter('all')}
            >
              Tous types
            </button>
            <button
              className={clsx('chip', typeFilter === 'vente' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setTypeFilter('vente')}
            >
              Ventes Z
            </button>
            <button
              className={clsx('chip', typeFilter === 'entree_fournisseur' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setTypeFilter('entree_fournisseur')}
            >
              Réceptions
            </button>
            <button
              className={clsx('chip', typeFilter === 'sortie_hors_vente_validee' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')}
              onClick={() => setTypeFilter('sortie_hors_vente_validee')}
            >
              Sorties hors-vente
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          rows={filteredMovements}
          onRowClick={(m) => navigate(`/produits/${m.productId}`)}
          searchKeys={(m) => `${productById(m.productId)?.name ?? ''} ${m.documentRef ?? ''} ${m.comment ?? ''}`}
          searchPlaceholder="Rechercher par référence, ticket Z, bon de commande…"
          pageSize={20}
          columns={[
            {
              key: 'date',
              label: 'Date & Heure',
              render: (m) => fmtDateTime(m.date),
              sortValue: (m) => m.date,
            },
            {
              key: 'product',
              label: 'Produit & Unité fine',
              render: (m) => {
                const p = productById(m.productId)
                return (
                  <div>
                    <span className="font-medium text-ink-900 dark:text-ink-100">{p?.name}</span>
                    <div className="text-[11px] text-ink-500">
                      {m.fineDetail || `${Math.abs(m.quantity)} ${m.unit}`}
                    </div>
                  </div>
                )
              },
              sortValue: (m) => productById(m.productId)?.name ?? '',
            },
            {
              key: 'location',
              label: 'Service',
              render: (m) => (
                <span className="text-xs px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-800 font-medium">
                  {LOCATION_LABEL[m.location]}
                </span>
              ),
              sortValue: (m) => m.location,
            },
            {
              key: 'type',
              label: 'Nature du mouvement',
              render: (m) => (
                <span className="text-xs text-ink-700 dark:text-ink-300">
                  {MOVEMENT_TYPE_LABEL[m.type]}
                </span>
              ),
              sortValue: (m) => m.type,
            },
            {
              key: 'quantity',
              label: 'Quantité mouvementée',
              render: (m) => {
                const isPositive = m.quantity > 0
                const p = PRODUCTS.find((prod) => prod.id === m.productId)
                const dosesCount = p?.dosesPerBottle ? Math.round(Math.abs(m.quantity) * p.dosesPerBottle) : null

                // Formatage explicite (ex: "-20 doses" ou "-1 btl et 5 doses")
                let fineDisplay = m.fineDetail
                if (!fineDisplay && dosesCount && p?.storageUnit === 'bouteille') {
                  const btlInt = Math.floor(dosesCount / p.dosesPerBottle!)
                  const rem = dosesCount % p.dosesPerBottle!
                  if (btlInt > 0 && rem > 0) {
                    fineDisplay = `-${btlInt} btl et ${rem} doses (-${dosesCount} doses)`
                  } else if (btlInt > 0) {
                    fineDisplay = `-${btlInt} btl (-${dosesCount} doses)`
                  } else {
                    fineDisplay = `-${dosesCount} doses`
                  }
                }

                return (
                  <div>
                    <span
                      className={clsx(
                        'font-bold text-xs inline-flex items-center gap-1',
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {fineDisplay || `${isPositive ? `+${m.quantity}` : m.quantity} ${m.unit}`}
                    </span>
                    {dosesCount && !fineDisplay && (
                      <div className="text-[10px] text-ink-500 font-medium">
                        soit {dosesCount} doses ({Math.round(dosesCount * (p?.servingCl ?? 5))} cl)
                      </div>
                    )}
                  </div>
                )
              },
              sortValue: (m) => m.quantity,
            },
            {
              key: 'impact',
              label: 'Impact portions / Doses',
              render: (m) => {
                const p = PRODUCTS.find((prod) => prod.id === m.productId)
                if (p?.storageUnit === 'bouteille' && p?.dosesPerBottle) {
                  const dosesAfter = Math.round(m.stockAfter * p.dosesPerBottle)
                  const openBottleDoses = dosesAfter % p.dosesPerBottle
                  const isCrit = openBottleDoses > 0 && openBottleDoses <= 10
                  const isSale = m.type === 'vente' || m.quantity < 0
                  const dosesSold = Math.round(Math.abs(m.quantity) * p.dosesPerBottle)

                  return (
                    <div className="text-xs">
                      {isSale && openBottleDoses > 0 ? (
                        <div className="font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-1">
                          <Wine size={12} className={isCrit ? 'text-amber-500' : 'text-copper'} />
                          <span>{dosesSold} doses vendues — Reste {openBottleDoses} doses dans la bouteille entamée</span>
                        </div>
                      ) : (
                        <div className="font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-1">
                          <Wine size={12} className={isCrit ? 'text-amber-500' : 'text-copper'} />
                          <span>Reste {dosesAfter} doses en stock</span>
                        </div>
                      )}
                      <div className={clsx('text-[11px] font-medium', isCrit ? 'text-amber-600 dark:text-amber-400' : 'text-ink-400')}>
                        {openBottleDoses > 0
                          ? `Bouteille entamée (${openBottleDoses} doses restantes / ${p.dosesPerBottle})`
                          : `${Math.floor(dosesAfter / p.dosesPerBottle)} bouteille(s) scellée(s)`}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="text-xs">
                    <span className="font-medium text-ink-700 dark:text-ink-300">
                      Reste {m.stockAfter} {m.unit}
                    </span>
                  </div>
                )
              },
            },
            {
              key: 'documentRef',
              label: 'Justificatif / Réf.',
              render: (m) => (
                <div className="text-xs">
                  <span className="font-mono text-ink-700 dark:text-ink-300">{m.documentRef || '—'}</span>
                  {m.comment && <div className="text-[10px] text-ink-400 truncate max-w-xs">{m.comment}</div>}
                </div>
              ),
            },
          ]}
        />
      </Section>

      <ZImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        location={locationFilter === 'all' ? 'bar' : locationFilter}
      />
    </>
  )
}
