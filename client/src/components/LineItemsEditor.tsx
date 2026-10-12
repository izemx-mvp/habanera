import { Plus, Trash2 } from 'lucide-react'
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
      <FieldLabel>Produits</FieldLabel>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <select className="input flex-1" value={l.productId} onChange={(e) => update(i, { productId: e.target.value })}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="input w-24"
              value={l.qty}
              onChange={(e) => update(i, { qty: Math.max(0, Number(e.target.value)) })}
            />
            <button type="button" className="p-2 rounded-lg hover:bg-ink-100 text-ink-500" onClick={() => remove(i)} aria-label="Retirer la ligne">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-ghost btn-sm mt-3" onClick={add}>
        <Plus size={14} />
        Ajouter une ligne
      </button>
    </div>
  )
}
