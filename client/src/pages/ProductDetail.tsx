import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader, Section, Card, Stat, Tag } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { productById, CATEGORY_LABEL } from '@/data/catalog'
import { cumpOf, fmtDateTime, fmtMAD, formatMovementQuantity, formatStockDisplay, LOCATION_LABEL, MOVEMENT_TYPE_LABEL, movementsForProduct, stockAt } from '@/data/selectors'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'
import clsx from 'clsx'

export default function ProductDetail() {
  useDataVersion()
  const { id } = useParams()
  const navigate = useNavigate()
  const personaId = useAppStore((s) => s.personaId)
  const product = id ? productById(id) : undefined

  if (!product) {
    return (
      <Section className="pt-10">
        <p className="text-ink-500">Produit introuvable.</p>
      </Section>
    )
  }

  const canSeeEconomat = personaId === 'admin' || personaId === 'economat'
  const movements = movementsForProduct(product.id)
  const cump = cumpOf(product.id)

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={`${CATEGORY_LABEL[product.categoryId]} · ${product.location === 'bar' ? 'Bar' : 'Cuisine'}`}
        actions={
          <button className="btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
            Retour
          </button>
        }
      />
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label={product.location === 'bar' ? 'Stock Bar' : 'Stock Cuisine'} value={String(stockAt(product.location, product.id))} hint={product.storageUnit} tone={stockAt(product.location, product.id) < product.minStock ? 'error' : undefined} />
          {canSeeEconomat && <Stat label="Stock Économat" value={String(stockAt('economat', product.id))} hint={product.storageUnit} />}
          <Stat label="Seuil minimum / cible" value={`${product.minStock} / ${product.targetStock}`} />
          <Stat label="Coût moyen pondéré" value={cump != null ? fmtMAD(cump) : 'À valoriser'} hint={cump == null ? 'Aucune réception connue' : undefined} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card title="Prix de vente par format">
            <div className="space-y-2">
              {product.priceFormats.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-600">{f.label}</span>
                  <span className={f.price == null ? 'text-ink-400 italic' : 'font-medium text-ink-900'}>{f.price != null ? fmtMAD(f.price) : 'Non renseigné'}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Unités & conditionnement">
            <div className="space-y-2 text-[13px] text-ink-700">
              <div className="flex justify-between">
                <span className="text-ink-500">Unité de stockage</span>
                <span>{product.storageUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Unité de vente</span>
                <span>{product.saleUnit}</span>
              </div>
              {product.bottleVolumeMl && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Contenance bouteille</span>
                  <span>{product.bottleVolumeMl} ml</span>
                </div>
              )}
              {product.servingMl && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Dose servie</span>
                  <span>{product.servingMl} ml</span>
                </div>
              )}
              {product.bucketOf5 && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Seau de 5</span>
                  <span>débite 5 unités</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-ink-500">Statut</span>
                <Tag>{product.active ? 'Actif' : 'Inactif'}</Tag>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Mouvements de stock" className="p-0">
          <div className="p-5">
            <DataTable
              rows={movements}
              emptyLabel="Aucun mouvement enregistré pour ce produit."
              columns={[
                { key: 'date', label: 'Date', render: (m) => fmtDateTime(m.date), sortValue: (m) => m.date },
                { key: 'type', label: 'Type', render: (m) => MOVEMENT_TYPE_LABEL[m.type] },
                { key: 'loc', label: 'Service', render: (m) => LOCATION_LABEL[m.location] },
                {
                  key: 'qty',
                  label: 'Quantité',
                  render: (m) => {
                    const isPositive = m.quantity > 0
                    return (
                      <span
                        className={clsx(
                          'font-semibold text-xs',
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {formatMovementQuantity(m)}
                      </span>
                    )
                  },
                },
                { key: 'before', label: 'Avant → après', render: (m) => `${formatStockDisplay(m.stockBefore, m.productId)} → ${formatStockDisplay(m.stockAfter, m.productId)}` },
                { key: 'value', label: 'Valeur', render: (m) => (m.value != null ? fmtMAD(m.value) : '—') },
              ]}
            />
          </div>
        </Card>
      </Section>
    </>
  )
}
