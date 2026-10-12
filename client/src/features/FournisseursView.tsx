import { useState } from 'react'
import { Sparkles, ShoppingCart } from 'lucide-react'
import { PageHeader, Section, Card, Empty } from '@/components/ui'
import { fmtMAD, productsToReplenishWithQuotes } from '@/data/selectors'
import { createPurchaseOrder } from '@/data/actions'
import { PERSONA_USER_ID } from '@/data/referentials'
import { useAppStore } from '@/store/app-store'
import { useDataVersion } from '@/store/data-version'

export function FournisseursView() {
  useDataVersion()
  const personaId = useAppStore((s) => s.personaId)!
  const userId = PERSONA_USER_ID[personaId]
  const items = productsToReplenishWithQuotes()
  const [ordered, setOrdered] = useState<Set<string>>(new Set())

  function order(productId: string, supplierId: string, qty: number) {
    createPurchaseOrder(supplierId, userId, [{ productId, qty, unitCost: null }])
    setOrdered((s) => new Set(s).add(productId))
  }

  return (
    <>
      <PageHeader
        title="Fournisseurs & recommandations IA"
        subtitle="Pour chaque produit à réapprovisionner, Habanera AI compare les fournisseurs disponibles et recommande le meilleur choix selon le prix, le délai et la qualité."
      />
      <Section>
        {items.length === 0 ? (
          <Empty>Aucun produit à réapprovisionner pour le moment : tous les stocks couvrent les besoins.</Empty>
        ) : (
          <div className="space-y-5">
            {items.map(({ product, currentQty, urgent, quotes }) => (
              <Card key={product.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[14px] font-medium text-ink-900 dark:text-ink-50">{product.name}</div>
                    <div className="text-[12px] text-ink-500 dark:text-ink-400">
                      Stock actuel : {currentQty} {product.storageUnit} · Seuil : {product.minStock}
                    </div>
                  </div>
                  {urgent && (
                    <span className="badge-error">
                      <Sparkles size={11} />
                      Réapprovisionnement urgent
                    </span>
                  )}
                </div>
                {quotes.length === 0 ? (
                  <Empty>Aucun fournisseur associé à cette catégorie.</Empty>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="bg-ink-50/60 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-700">
                          <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Fournisseur</th>
                          <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Prix unitaire</th>
                          <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Délai</th>
                          <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Qualité</th>
                          <th className="text-left px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Décision IA</th>
                          <th className="text-right px-3 py-2 font-medium text-ink-500 dark:text-ink-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotes.map((q) => (
                          <tr key={q.supplierId} className="border-b border-ink-100 dark:border-ink-800 last:border-0">
                            <td className="px-3 py-2 font-medium text-ink-900 dark:text-ink-50">{q.supplierName}</td>
                            <td className="px-3 py-2 text-right">{fmtMAD(q.unitPrice)}</td>
                            <td className="px-3 py-2 text-right">{q.delayDays} j</td>
                            <td className="px-3 py-2 text-right">{q.qualityRating.toFixed(1)}/5</td>
                            <td className="px-3 py-2">
                              <span className={q.decision.startsWith('Recommandé') ? 'badge-copper' : 'badge-neutral'}>{q.decision}</span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {ordered.has(product.id) ? (
                                <span className="text-emerald-600 dark:text-emerald-400 text-[12px]">Commande envoyée</span>
                              ) : (
                                <button
                                  className="btn-ghost btn-sm"
                                  onClick={() => order(product.id, q.supplierId, Math.max(product.targetStock - currentQty, product.minStock))}
                                >
                                  <ShoppingCart size={12} />
                                  Commander
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
