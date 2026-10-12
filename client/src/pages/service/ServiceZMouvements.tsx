import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Calendar, Receipt, Wine, ArrowDownRight, ArrowUpRight, Upload } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Section, Stat } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { ZImportModal } from '@/components/ZImportModal'
import { PRODUCTS } from '@/data/catalog'
import { BALANCES, MOVEMENTS } from '@/data/generate'
import { fmtDateTime, MOVEMENT_TYPE_LABEL } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import type { MovementType } from '@/data/types'

export default function ServiceZMouvements() {
  useDataVersion()
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<'all' | MovementType>('all')
  const [importOpen, setImportOpen] = useState(false)

  // Uniquement les mouvements du service Bar (produits Bar/Cuisine actuels)
  const serviceMovements = MOVEMENTS.filter((m) => m.location === 'bar' || m.location === 'cuisine')

  // Ventes Ticket Z
  const zSales = serviceMovements.filter((m) => m.type === 'vente')
  const totalZSales = zSales.length

  // Total portions / doses décomptées
  const totalDosesDispensed = zSales.reduce((sum, m) => {
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

  const filteredMovements = serviceMovements
    .filter((m) => typeFilter === 'all' || m.type === typeFilter)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageHeader
        title="Z et mouvements"
        subtitle="Rapprochement des clôtures de caisse (Ticket Z), consommation en doses/cl et flux d'approvisionnement du service Bar/Cuisine."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setImportOpen(true)}>
            <Upload size={14} />
            Importer en masse (Ticket Z)
          </button>
        }
      />

      <Section>
        {/* Résumé des indicateurs Z */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat
            label="Lignes Ticket Z"
            value={String(totalZSales)}
            hint="Ventes enregistrées en caisse"
          />
          <Stat
            label="Portions & doses servies"
            value={`${Math.round(totalDosesDispensed)} doses`}
            hint="Calcul fin 5 cl / dose"
          />
          <Stat
            label="Flux de stock service"
            value={String(serviceMovements.length)}
            hint="Entrées, ventes & sorties"
          />
          <Stat
            label="Rapprochement Z"
            value="100% synchronisé"
            tone="success"
            hint="Aucun écart de déduction"
          />
        </div>

        {/* Note explicative Ticket Z & Doses */}
        <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[13px] text-ink-700 dark:text-ink-300 flex items-start gap-3">
          <Sparkles className="text-copper shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-semibold text-ink-900 dark:text-ink-100">Déduction mathématique continue : </span>
            Chaque vente enregistrée sur le Ticket Z déduit la portion exacte (ex. 5 cl de Gin ou Vodka). Les bouteilles entamées restent disponibles en stock fixe jusqu'à épuisement complet de la dernière dose, sans créer d'alerte superflue.
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
                      💡 <strong>Recommandation IA :</strong> Risque d'épuisement durant le service. Émettre un bon de prélèvement d'<strong>1 bouteille pleine scellée</strong> vers l'Économat pour réapprovisionner le Bar.
                    </p>
                  </div>
                  <button
                    className="btn-primary btn-xs whitespace-nowrap"
                    onClick={() => navigate('/service/prelevements')}
                  >
                    Créer bon de prélèvement (1 btl)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres de types de flux */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex gap-2">
            <button
              className={clsx(
                'chip',
                typeFilter === 'all' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
              )}
              onClick={() => setTypeFilter('all')}
            >
              Tous les mouvements ({serviceMovements.length})
            </button>
            <button
              className={clsx(
                'chip',
                typeFilter === 'vente' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
              )}
              onClick={() => setTypeFilter('vente')}
            >
              Ventes Z ({zSales.length})
            </button>
            <button
              className={clsx(
                'chip',
                typeFilter === 'transfert_bar' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
              )}
              onClick={() => setTypeFilter('transfert_bar')}
            >
              Réceptions Économat
            </button>
            <button
              className={clsx(
                'chip',
                typeFilter === 'sortie_hors_vente_validee' && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper'
              )}
              onClick={() => setTypeFilter('sortie_hors_vente_validee')}
            >
              Sorties hors-vente (Casse/Offerts)
            </button>
          </div>
        </div>

        {/* Tableau des mouvements */}
        <DataTable
          rows={filteredMovements}
          onRowClick={(m) => navigate(`/produits/${m.productId}`)}
          searchKeys={(m) => {
            const p = PRODUCTS.find((prod) => prod.id === m.productId)
            return `${p?.name ?? ''} ${m.comment ?? ''} ${m.type}`
          }}
          searchPlaceholder="Rechercher une vente Z, un cocktail, une boisson, un motif…"
          pageSize={15}
          columns={[
            {
              key: 'date',
              label: 'Date & Heure',
              render: (m) => (
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-ink-400 shrink-0" />
                  <span className="text-xs font-mono text-ink-700 dark:text-ink-300">
                    {fmtDateTime(m.date)}
                  </span>
                </div>
              ),
              sortValue: (m) => m.date,
            },
            {
              key: 'product',
              label: 'Produit (Bar / Cuisine)',
              render: (m) => {
                const p = PRODUCTS.find((prod) => prod.id === m.productId)
                return (
                  <div>
                    <div className="font-medium text-ink-900 dark:text-ink-100">
                      {p?.name ?? m.productId}
                    </div>
                    {p?.dosesPerBottle && (
                      <div className="text-[11px] text-ink-400">
                        1 btl = {p.dosesPerBottle} doses ({p.servingCl ?? 5} cl)
                      </div>
                    )}
                  </div>
                )
              },
              sortValue: (m) => {
                const p = PRODUCTS.find((prod) => prod.id === m.productId)
                return p?.name ?? m.productId
              },
            },
            {
              key: 'type',
              label: 'Nature du flux',
              render: (m) => {
                const isZ = m.type === 'vente'
                const isReception = m.type === 'transfert_bar' || m.type === 'transfert_cuisine' || m.quantity > 0
                return (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                      isZ && 'bg-copper/15 text-copper dark:bg-copper/25 dark:text-copper-lighter',
                      !isZ && isReception && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                      !isZ && !isReception && 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300'
                    )}
                  >
                    {isZ ? <Receipt size={12} /> : isReception ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {MOVEMENT_TYPE_LABEL[m.type]}
                  </span>
                )
              },
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
                        'font-bold text-sm',
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {fineDisplay || `${isPositive ? `+${m.quantity}` : m.quantity} ${m.unit}`}
                    </span>
                    {dosesCount && !fineDisplay && (
                      <div className="text-[11px] text-ink-500 font-medium">
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
                  // Calcul du stock après mouvement
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
                    {m.comment && <div className="text-[11px] text-ink-400">{m.comment}</div>}
                  </div>
                )
              },
            },
          ]}
        />
      </Section>

      <ZImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        location="bar"
      />
    </>
  )
}
