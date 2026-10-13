// Couche d'actions — toutes les opérations d'écriture passent par ici (jamais une mutation
// directe depuis un écran), pour garantir les mêmes contrôles qu'un vrai moteur serveur :
// pas de quantité nulle ou négative, pas de double mouvement, pas de stock négatif.
import { applyMovement, BALANCES, CUMP, GOODS_RECEIPTS, OUTFLOWS, PURCHASE_ORDERS, REAL_STOCKS, REQUISITIONS, THEORETICAL_STOCKS } from './generate'
import { PRODUCTS, productById } from './catalog'
import { SUPPLIERS } from './referentials'
import { useDataVersion } from '@/store/data-version'
import type {
  GoodsReceipt,
  NonSalesOutflow,
  OutflowReason,
  PriceFormat,
  Product,
  ProductCategoryId,
  PurchaseOrder,
  PurchaseOrderItem,
  RequisitionItem,
  RequisitionOrder,
  StockLocationId,
  Supplier,
  UnitId,
} from './types'

type Result = { ok: true } | { ok: false; error: string }

const nowISO = () => new Date().toISOString()
const bump = () => useDataVersion.getState().bump()

function padId(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, '0')}`
}

// ---------- Bons de prélèvement ----------
export function createRequisition(location: 'bar' | 'cuisine', requestedBy: string, items: { productId: string; qty: number }[], comment?: string): Result {
  const clean = items.filter((it) => it.qty > 0)
  if (clean.length === 0) return { ok: false, error: 'Ajoutez au moins une ligne avec une quantité strictement positive.' }
  for (const it of clean) {
    const p = productById(it.productId)
    if (!p) return { ok: false, error: 'Produit introuvable.' }
  }
  const id = padId('BP', REQUISITIONS.length + 1)
  const reqItems: RequisitionItem[] = clean.map((it) => ({ productId: it.productId, qtyRequested: it.qty, qtyPrepared: 0, qtyDelivered: 0, unit: productById(it.productId)!.storageUnit }))
  const order: RequisitionOrder = {
    id,
    requestingLocation: location,
    requestedBy,
    date: nowISO(),
    items: reqItems,
    comment,
    status: 'en_attente',
    history: [{ date: nowISO(), status: 'en_attente', userId: requestedBy }],
  }
  REQUISITIONS.push(order)
  bump()
  return { ok: true }
}

export function markPreparing(reqId: string, userId: string): Result {
  const r = REQUISITIONS.find((r) => r.id === reqId)
  if (!r) return { ok: false, error: 'Bon introuvable.' }
  if (r.status !== 'en_attente') return { ok: false, error: 'Ce bon n\'est plus en attente.' }
  r.status = 'en_preparation'
  r.history.push({ date: nowISO(), status: 'en_preparation', userId })
  bump()
  return { ok: true }
}

export function deliverRequisition(reqId: string, userId: string, deliveries: { productId: string; qty: number }[]): Result {
  const r = REQUISITIONS.find((r) => r.id === reqId)
  if (!r) return { ok: false, error: 'Bon introuvable.' }
  if (r.status === 'livre' || r.status === 'rejete') return { ok: false, error: 'Ce bon est déjà soldé.' }
  let anyDelivered = false
  for (const d of deliveries) {
    if (d.qty <= 0) continue
    const item = r.items.find((i) => i.productId === d.productId)
    if (!item) continue
    const remaining = item.qtyRequested - item.qtyDelivered
    const available = BALANCES.economat[d.productId] ?? 0
    const qty = Math.min(d.qty, remaining, available)
    if (qty <= 0) continue
    anyDelivered = true
    applyMovement({ date: nowISO(), productId: d.productId, location: 'economat', type: r.requestingLocation === 'bar' ? 'transfert_bar' : 'transfert_cuisine', delta: -qty, unit: item.unit, userId, documentRef: r.id, comment: `Transfert vers ${r.requestingLocation === 'bar' ? 'le Bar' : 'la Cuisine'}`, unitCost: CUMP[d.productId] })
    applyMovement({ date: nowISO(), productId: d.productId, location: r.requestingLocation, type: r.requestingLocation === 'bar' ? 'transfert_bar' : 'transfert_cuisine', delta: qty, unit: item.unit, userId, documentRef: r.id, comment: 'Réception en provenance de l\'Économat', unitCost: CUMP[d.productId] })
    item.qtyPrepared += qty
    item.qtyDelivered += qty
  }
  if (!anyDelivered) return { ok: false, error: 'Aucune quantité livrable : vérifiez le stock disponible au magasin central.' }
  const fullyDelivered = r.items.every((i) => i.qtyDelivered >= i.qtyRequested)
  r.status = fullyDelivered ? 'livre' : 'partiellement_livre'
  r.history.push({ date: nowISO(), status: r.status, userId })
  bump()
  return { ok: true }
}

export function rejectRequisition(reqId: string, userId: string, comment: string): Result {
  const r = REQUISITIONS.find((r) => r.id === reqId)
  if (!r) return { ok: false, error: 'Bon introuvable.' }
  if (r.status === 'livre' || r.status === 'partiellement_livre') return { ok: false, error: 'Ce bon a déjà été partiellement ou totalement livré.' }
  if (!comment.trim()) return { ok: false, error: 'Un motif de rejet est requis.' }
  r.status = 'rejete'
  r.history.push({ date: nowISO(), status: 'rejete', userId, comment })
  bump()
  return { ok: true }
}

export function confirmRequisition(reqId: string, userId: string): Result {
  const r = REQUISITIONS.find((r) => r.id === reqId)
  if (!r) return { ok: false, error: 'Bon introuvable.' }
  r.confirmedByService = true
  r.confirmedAt = nowISO()
  r.confirmedByUserId = userId
  r.history.push({ date: nowISO(), status: r.status, userId, comment: 'Réception physique confirmée par le service' })
  bump()
  return { ok: true }
}

export function contestRequisition(
  reqId: string,
  userId: string,
  items: { productId: string; actualQty: number; reason: string }[],
): Result {
  const r = REQUISITIONS.find((r) => r.id === reqId)
  if (!r) return { ok: false, error: 'Bon introuvable.' }

  for (const c of items) {
    const item = r.items.find((i) => i.productId === c.productId)
    if (!item) continue
    const diff = item.qtyDelivered - c.actualQty
    if (diff > 0) {
      item.contestedQty = diff
      item.contestationReason = c.reason || 'Écart constaté à la réception'
      item.qtyDelivered = c.actualQty

      // Déduire le manquant/perte du stock du service
      applyMovement({
        date: nowISO(),
        productId: c.productId,
        location: r.requestingLocation,
        type: 'sortie_hors_vente_validee',
        delta: -diff,
        unit: item.unit,
        userId,
        documentRef: r.id,
        comment: `Contestation réception terrain (${c.reason || 'Casse transport'})`,
        unitCost: CUMP[c.productId],
      })
    }
  }

  r.hasContestation = true
  r.contestationReason = items[0]?.reason || 'Écart physique signalé'
  r.contestedAt = nowISO()
  r.confirmedByService = true
  r.confirmedAt = nowISO()
  r.confirmedByUserId = userId

  const fullyDelivered = r.items.every((i) => i.qtyDelivered >= i.qtyRequested)
  r.status = fullyDelivered ? 'livre' : 'partiellement_livre'
  r.history.push({
    date: nowISO(),
    status: r.status,
    userId,
    comment: `Contestation signalée : ${items.map((it) => `${productById(it.productId)?.name ?? it.productId} (${it.actualQty} reçus, motif: ${it.reason})`).join(', ')}`,
  })

  bump()
  return { ok: true }
}

export function deliverReliquat(reqId: string, userId: string): Result {
  const r = REQUISITIONS.find((r) => r.id === reqId)
  if (!r) return { ok: false, error: 'Bon introuvable.' }
  if (r.status !== 'partiellement_livre') return { ok: false, error: 'Ce bon n\'a pas de reliquat en attente.' }

  const deliveries: { productId: string; qty: number }[] = []
  for (const it of r.items) {
    const remaining = it.qtyRequested - it.qtyDelivered
    if (remaining > 0) {
      const avail = BALANCES.economat[it.productId] ?? 0
      const deliverQty = Math.min(remaining, avail)
      if (deliverQty > 0) {
        deliveries.push({ productId: it.productId, qty: deliverQty })
      }
    }
  }

  if (deliveries.length === 0) {
    return { ok: false, error: 'Stock central insuffisant pour préparer le reliquat actuellement.' }
  }

  return deliverRequisition(reqId, userId, deliveries)
}

// ---------- Sorties hors-vente ----------
export function declareOutflow(opts: { productId: string; location: 'bar' | 'cuisine'; quantity: number; reason: OutflowReason; comment?: string; declaredBy: string }): Result {
  const p = productById(opts.productId)
  if (!p) return { ok: false, error: 'Produit introuvable.' }
  if (opts.quantity <= 0) return { ok: false, error: 'La quantité doit être strictement positive.' }
  if (opts.reason === 'autre' && !opts.comment?.trim()) return { ok: false, error: 'Un commentaire est obligatoire pour le motif "Autre".' }
  const o: NonSalesOutflow = {
    id: padId('SHV', OUTFLOWS.length + 1),
    productId: opts.productId,
    quantity: opts.quantity,
    unit: p.storageUnit,
    reason: opts.reason,
    comment: opts.comment,
    location: opts.location,
    declaredBy: opts.declaredBy,
    date: nowISO(),
    status: 'en_attente',
  }
  OUTFLOWS.push(o)
  bump()
  return { ok: true }
}

export function acceptOutflow(id: string, validatedBy: string): Result {
  const o = OUTFLOWS.find((o) => o.id === id)
  if (!o) return { ok: false, error: 'Déclaration introuvable.' }
  if (o.status !== 'en_attente') return { ok: false, error: 'Cette déclaration a déjà été traitée.' }
  const available = BALANCES[o.location][o.productId] ?? 0
  if (available < o.quantity) return { ok: false, error: `Stock insuffisant (${available} disponible(s) pour ${o.quantity} demandé(s)).` }
  const unitCost = CUMP[o.productId]
  const mv = applyMovement({ date: nowISO(), productId: o.productId, location: o.location, type: 'sortie_hors_vente_validee', delta: -o.quantity, unit: o.unit, userId: validatedBy, documentRef: o.id, comment: `Sortie hors-vente validée (${o.reason})`, unitCost })
  o.status = 'acceptee'
  o.validatedBy = validatedBy
  o.validatedDate = nowISO()
  o.movementId = mv.id
  o.unitCostAtValidation = unitCost
  o.value = mv.value
  bump()
  return { ok: true }
}

export function rejectOutflowAction(id: string, validatedBy: string, reason: string): Result {
  const o = OUTFLOWS.find((o) => o.id === id)
  if (!o) return { ok: false, error: 'Déclaration introuvable.' }
  if (o.status !== 'en_attente') return { ok: false, error: 'Cette déclaration a déjà été traitée.' }
  if (!reason.trim()) return { ok: false, error: 'Un motif de rejet est requis.' }
  o.status = 'rejetee'
  o.validatedBy = validatedBy
  o.validatedDate = nowISO()
  o.rejectionReason = reason
  bump()
  return { ok: true }
}

// ---------- Commandes fournisseurs & réceptions ----------
export function createPurchaseOrder(
  supplierId: string,
  createdBy: string,
  items: { productId: string; qty: number; unitCost: number | null }[],
  expectedDeliveryDate?: string,
): Result {
  const clean = items.filter((it) => it.qty > 0)
  if (!clean.length) return { ok: false, error: 'Ajoutez au moins une ligne avec une quantité strictement positive.' }
  if (!SUPPLIERS.find((s) => s.id === supplierId)) return { ok: false, error: 'Fournisseur introuvable.' }
  const po: PurchaseOrder = {
    id: padId('BC', PURCHASE_ORDERS.length + 1),
    supplierId,
    date: nowISO(),
    expectedDeliveryDate,
    createdBy,
    status: 'envoyee',
    items: clean.map((it) => ({ productId: it.productId, qtyOrdered: it.qty, unitCost: it.unitCost, qtyReceived: 0 }) as PurchaseOrderItem),
  }
  PURCHASE_ORDERS.push(po)
  bump()
  return { ok: true }
}

export function receivePurchaseOrder(poId: string, receivedBy: string, items: { productId: string; qty: number }[]): Result {
  const po = PURCHASE_ORDERS.find((p) => p.id === poId)
  if (!po) return { ok: false, error: 'Commande introuvable.' }
  if (po.status === 'receptionnee' || po.status === 'annulee') return { ok: false, error: 'Cette commande est déjà soldée.' }
  const gr: GoodsReceipt = { id: padId('BR', GOODS_RECEIPTS.length + 1), purchaseOrderId: po.id, date: nowISO(), receivedBy, items: [] }
  let any = false
  for (const it of items) {
    const line = po.items.find((l) => l.productId === it.productId)
    if (!line) continue
    const remaining = line.qtyOrdered - line.qtyReceived
    const qty = Math.min(it.qty, remaining)
    if (qty <= 0) continue
    any = true
    line.qtyReceived += qty
    gr.items.push({ productId: it.productId, qtyReceived: qty, unitCost: line.unitCost })
    const before = BALANCES.economat[it.productId] ?? 0
    if (line.unitCost != null) {
      const prev = CUMP[it.productId]
      CUMP[it.productId] = prev == null ? line.unitCost : Math.round(((prev * before + line.unitCost * qty) / (before + qty)) * 100) / 100
    }
    applyMovement({ date: nowISO(), productId: it.productId, location: 'economat', type: 'entree_fournisseur', delta: qty, unit: productById(it.productId)!.storageUnit, userId: receivedBy, documentRef: gr.id, comment: 'Réception fournisseur', unitCost: line.unitCost })
  }
  if (!any) return { ok: false, error: 'Aucune quantité à réceptionner (vérifiez les quantités déjà reçues).' }
  po.status = po.items.every((l) => l.qtyReceived >= l.qtyOrdered) ? 'receptionnee' : 'partiellement_recue'
  GOODS_RECEIPTS.push(gr)
  bump()
  return { ok: true }
}

// ---------- Inventaire ----------
export function adjustInventory(location: StockLocationId, productId: string, delta: number, userId: string, comment: string): Result {
  if (delta === 0) return { ok: false, error: 'La variation doit être différente de zéro.' }
  const p = productById(productId)
  if (!p) return { ok: false, error: 'Produit introuvable.' }
  const before = BALANCES[location][productId] ?? 0
  if (before + delta < 0) return { ok: false, error: 'Cet ajustement rendrait le stock négatif.' }
  applyMovement({ date: nowISO(), productId, location, type: 'ajustement_inventaire', delta, unit: p.storageUnit, userId, comment: comment || 'Ajustement d\'inventaire', unitCost: CUMP[productId] })
  bump()
  return { ok: true }
}

export function setProductField<K extends keyof Product>(productId: string, field: K, value: Product[K]): Result {
  const p = productById(productId)
  if (!p) return { ok: false, error: 'Produit introuvable.' }
  ;(p as any)[field] = value
  bump()
  return { ok: true }
}

export function setPriceFormat(productId: string, label: string, price: number | null): Result {
  const p = productById(productId)
  if (!p) return { ok: false, error: 'Produit introuvable.' }
  const f = p.priceFormats.find((f) => f.label === label)
  if (f) f.price = price
  bump()
  return { ok: true }
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function createProduct(opts: {
  name: string
  categoryId: ProductCategoryId
  location: 'bar' | 'cuisine'
  storageUnit: UnitId
  saleUnit: UnitId
  priceFormats?: PriceFormat[]
  minStock: number
  targetStock: number
  dosesPerBottle?: number
  packSize?: number
}): Result {
  if (!opts.name.trim()) return { ok: false, error: 'Le nom du produit est requis.' }
  if (PRODUCTS.some((p) => p.name.toLowerCase() === opts.name.trim().toLowerCase())) {
    return { ok: false, error: 'Un produit porte déjà ce nom dans le catalogue.' }
  }
  const id = `${slugify(opts.name)}-${PRODUCTS.length + 1}`
  const product: Product = {
    id,
    name: opts.name.trim(),
    categoryId: opts.categoryId,
    location: opts.location,
    storageUnit: opts.storageUnit,
    saleUnit: opts.saleUnit,
    priceFormats: opts.priceFormats ?? [{ label: 'Standard', price: null }],
    costPrice: null,
    minStock: opts.minStock,
    targetStock: opts.targetStock,
    dosesPerBottle: opts.dosesPerBottle,
    packSize: opts.packSize,
    active: true,
    countingFrequency: opts.location === 'cuisine' ? 'quotidien' : 'hebdomadaire',
  }
  PRODUCTS.push(product)
  BALANCES.economat[id] = 0
  BALANCES.bar[id] = 0
  BALANCES.cuisine[id] = 0
  CUMP[id] = null
  bump()
  return { ok: true }
}

export interface BulkProductInput {
  name: string
  categoryId: ProductCategoryId
  location: 'bar' | 'cuisine'
  storageUnit: UnitId
  saleUnit: UnitId
  price?: number | null
  costPrice?: number | null
  initialStock?: number
  minStock?: number
  targetStock?: number
}

export function bulkImportProducts(
  items: BulkProductInput[],
  userId = 'Administrateur',
): { ok: boolean; count: number; created: number; updated: number; error?: string } {
  if (!items || items.length === 0) {
    return { ok: false, count: 0, created: 0, updated: 0, error: 'Aucun produit à importer.' }
  }

  let created = 0
  let updated = 0

  for (const it of items) {
    const cleanName = it.name.trim()
    if (!cleanName) continue

    const existing = PRODUCTS.find((p) => p.name.toLowerCase() === cleanName.toLowerCase())
    if (existing) {
      if (it.minStock != null) existing.minStock = it.minStock
      if (it.targetStock != null) existing.targetStock = it.targetStock
      if (it.costPrice != null) {
        existing.costPrice = it.costPrice
        CUMP[existing.id] = it.costPrice
      }
      if (it.price != null && existing.priceFormats.length > 0) {
        existing.priceFormats[0].price = it.price
      }
      if (it.initialStock != null && it.initialStock > 0) {
        const diff = it.initialStock - (BALANCES[existing.location][existing.id] ?? 0)
        if (diff !== 0) {
          applyMovement({
            date: nowISO(),
            productId: existing.id,
            location: existing.location,
            type: 'ajustement_inventaire',
            delta: diff,
            unit: existing.storageUnit,
            userId,
            comment: 'Mise à jour stock via import Excel',
            unitCost: it.costPrice ?? CUMP[existing.id],
          })
        }
      }
      updated++
    } else {
      const id = `${slugify(cleanName)}-${PRODUCTS.length + 1}`
      const unitLabel = it.storageUnit === 'bouteille' ? 'Bouteille' : it.storageUnit === 'verre' ? 'Verre' : 'Unité'
      const product: Product = {
        id,
        name: cleanName,
        categoryId: it.categoryId,
        location: it.location,
        storageUnit: it.storageUnit,
        saleUnit: it.saleUnit || it.storageUnit,
        priceFormats: [{ label: unitLabel, price: it.price ?? null }],
        costPrice: it.costPrice ?? null,
        minStock: it.minStock ?? 2,
        targetStock: it.targetStock ?? 6,
        active: true,
        countingFrequency: it.location === 'cuisine' ? 'quotidien' : 'hebdomadaire',
      }
      PRODUCTS.push(product)
      BALANCES.economat[id] = 0
      BALANCES.bar[id] = 0
      BALANCES.cuisine[id] = 0
      CUMP[id] = it.costPrice ?? null

      if (it.initialStock != null && it.initialStock > 0) {
        applyMovement({
          date: nowISO(),
          productId: id,
          location: it.location,
          type: 'ajustement_inventaire',
          delta: it.initialStock,
          unit: it.storageUnit,
          userId,
          comment: 'Stock initial importé via Excel',
          unitCost: it.costPrice ?? null,
        })
      }
      created++
    }
  }

  bump()
  return { ok: true, count: created + updated, created, updated }
}

export function recordPhysicalStock(
  location: StockLocationId,
  productId: string,
  realQty: number,
  userId: string,
  comment?: string,
): Result {
  const p = productById(productId)
  if (!p) return { ok: false, error: 'Produit introuvable.' }
  REAL_STOCKS[location][productId] = Math.max(0, realQty)
  const theo = BALANCES[location][productId] ?? 0
  const diff = realQty - theo
  if (diff !== 0) {
    applyMovement({
      date: nowISO(),
      productId,
      location,
      type: 'ajustement_inventaire',
      delta: diff,
      unit: p.storageUnit,
      userId,
      comment: comment || `Inventaire physique réel : ${realQty} ${p.storageUnit} constatés (écart: ${diff > 0 ? '+' : ''}${diff})`,
      unitCost: CUMP[productId],
    })
  }
  bump()
  return { ok: true }
}

export function setTheoreticalStock(
  location: StockLocationId,
  productId: string,
  newQty: number,
  _userId?: string,
  _comment?: string,
): Result {
  const p = productById(productId)
  if (!p) return { ok: false, error: 'Produit introuvable.' }
  if (newQty < 0) return { ok: false, error: 'Le stock théorique ne peut pas être négatif.' }
  THEORETICAL_STOCKS[location][productId] = newQty
  bump()
  return { ok: true }
}

export function createSupplier(sup: Omit<Supplier, 'id'>): Result {
  if (!sup.name.trim()) return { ok: false, error: 'Le nom du fournisseur est obligatoire.' }
  const id = `sup-${Date.now().toString(36)}`
  SUPPLIERS.push({ id, ...sup })
  bump()
  return { ok: true }
}

export function updateSupplier(id: string, patch: Partial<Supplier>): Result {
  const s = SUPPLIERS.find((s) => s.id === id)
  if (!s) return { ok: false, error: 'Fournisseur introuvable.' }
  Object.assign(s, patch)
  bump()
  return { ok: true }
}

export function deleteSupplier(id: string): Result {
  const idx = SUPPLIERS.findIndex((s) => s.id === id)
  if (idx < 0) return { ok: false, error: 'Fournisseur introuvable.' }
  SUPPLIERS.splice(idx, 1)
  bump()
  return { ok: true }
}

export function createGroupedPurchaseOrder(
  supplierId: string,
  userId: string,
  items: { productId: string; qty: number; unitCost?: number | null }[],
  reason: string,
): Result & { orderId?: string } {
  const s = SUPPLIERS.find((s) => s.id === supplierId)
  const delay = s?.deliveryDelayDays ?? 2
  const arrivalDate = new Date(Date.now() + delay * 86400000).toISOString()

  const id = padId('BC', PURCHASE_ORDERS.length + 1)
  const po: PurchaseOrder = {
    id,
    supplierId,
    date: nowISO(),
    expectedDeliveryDate: arrivalDate,
    items: items.map((it) => ({
      productId: it.productId,
      qtyOrdered: it.qty,
      unitCost: it.unitCost ?? CUMP[it.productId] ?? null,
      qtyReceived: 0,
    })),
    status: 'envoyee',
    createdBy: userId,
    isGroupedOrder: true,
    groupingReason: reason,
  }
  PURCHASE_ORDERS.push(po)
  bump()
  return { ok: true, orderId: id }
}

export interface ZSaleItemInput {
  productName: string
  quantitySold: number // quantité vendue (en unités ou doses)
  unitType?: 'verre' | 'bouteille' | 'portion' | 'unite'
  unitPrice?: number | null
  totalRevenue?: number | null
}

export function bulkImportZSales(
  items: ZSaleItemInput[],
  options?: {
    location?: StockLocationId
    zReference?: string
    date?: string
    userId?: string
  },
): { ok: boolean; processedCount: number; errors?: string[]; error?: string } {
  if (!items || items.length === 0) {
    return { ok: false, processedCount: 0, error: 'Aucune ligne de vente Z fournie.' }
  }

  const targetLocation: StockLocationId = options?.location || 'bar'
  const zRef = options?.zReference || `Z-${Date.now().toString().slice(-6)}`
  const date = options?.date || nowISO()
  const userId = options?.userId || 'u-admin-1'
  const errors: string[] = []
  let processed = 0

  for (const it of items) {
    if (!it.productName || !it.quantitySold || it.quantitySold <= 0) continue

    const clean = it.productName.trim().toLowerCase()
    const product = PRODUCTS.find((p) => {
      const pName = p.name.toLowerCase()
      return pName === clean || pName.includes(clean) || clean.includes(pName)
    })

    if (!product) {
      errors.push(`Produit non reconnu dans le catalogue : "${it.productName}"`)
      continue
    }

    // Calcul de la déduction : si le produit est spiritueux stocké en bouteille avec dosesPerBottle
    // et que la vente est exprimée en verres/doses
    let deductionUnits = it.quantitySold
    let fineDetail = `-${it.quantitySold} ${it.unitType || product.saleUnit}`

    if (product.storageUnit === 'bouteille' && product.dosesPerBottle && (it.unitType === 'verre' || it.unitType === 'portion' || it.unitType === 'unite')) {
      deductionUnits = it.quantitySold / product.dosesPerBottle
      const btlInt = Math.floor(it.quantitySold / product.dosesPerBottle)
      const dosesRem = it.quantitySold % product.dosesPerBottle
      if (btlInt > 0 && dosesRem > 0) {
        fineDetail = `-${btlInt} btl et ${dosesRem} doses (-${it.quantitySold} doses)`
      } else if (btlInt > 0) {
        fineDetail = `-${btlInt} btl (-${it.quantitySold} doses)`
      } else {
        fineDetail = `-${it.quantitySold} doses`
      }
    }

    applyMovement({
      date,
      productId: product.id,
      location: targetLocation,
      type: 'vente',
      delta: -deductionUnits,
      unit: product.storageUnit,
      userId,
      documentRef: zRef,
      comment: `Ticket Z caisse (${zRef}) : -${it.quantitySold} ${it.unitType || product.saleUnit}`,
      fineDetail,
      unitCost: CUMP[product.id],
    })

    processed++
  }

  bump()
  return {
    ok: processed > 0,
    processedCount: processed,
    errors: errors.length > 0 ? errors : undefined,
  }
}

