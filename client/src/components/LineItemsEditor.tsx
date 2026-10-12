import { Plus, Trash2, Wine } from 'lucide-react'
import { FieldLabel } from './ui'
import type { Product } from '@/data/types'

export interface Line {
  productId: string
  qty: number
}

export function LineItemsEditor({ products, lines, onChange }: { products: Product[]; lines: Line[]; onChange: (lines: Line[]) => void }) {
  function update(i: number, patch: Partial<Line>) {
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function remove(i: number) {
    onChange(lines.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...lines, { productId: products[0]?.id ?? '', qty: 1 }])
  }

  return (
    <div>
      <FieldLabel>Produits & Quantités</FieldLabel>
      <div className="space-y-3">
        {lines.map((l, i) => {
          const selectedProduct = products.find((p) => p.id === l.productId)
          const isSpirit = selectedProduct?.storageUnit === 'bouteille' && selectedProduct?.dosesPerBottle
          const unitLabel = selectedProduct?.storageUnit === 'bouteille' ? 'btl' : selectedProduct?.storageUnit ?? 'u'

          return (
            <div key={i} className="p-2.5 rounded-lg border border-ink-200 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/50">
              <div className="flex items-center gap-2">
                <select className="input flex-1" value={l.productId} onChange={(e) => update(i, { productId: e.target.value })}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.dosesPerBottle ? `(1 btl = ${p.dosesPerBottle} doses)` : ''}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="input w-20 text-center font-semibold"
                    value={l.qty}
                    onChange={(e) => update(i, { qty: Math.max(1, Math.floor(Number(e.target.value))) })}
                  />
                  <span className="text-xs text-ink-500 font-medium min-w-[28px]">{unitLabel}</span>
                </div>
                <button type="button" className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-400 hover:text-red-500" onClick={() => remove(i)} aria-label="Retirer la ligne">
                  <Trash2 size={15} />
                </button>
              </div>
              {isSpirit && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                  <Wine size={12} />
                  <span>
                    Conditionnement : Bouteille scellée entière ({l.qty} btl = {l.qty * selectedProduct.dosesPerBottle!} doses de {selectedProduct.servingCl ?? 5} cl). Non fractionnable à l'Économat.
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button type="button" className="btn-ghost btn-sm mt-3" onClick={add}>
        <Plus size={14} />
        Ajouter une ligne
      </button>
    </div>
  )
}
