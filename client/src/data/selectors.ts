// Sélecteurs dérivés — calculent indicateurs, alertes et historiques à partir des données
// générées (jamais de chiffre écrit en dur dans les écrans).
import { CATEGORY_LABEL, PRODUCTS } from './catalog'
import { BALANCES, CUMP, DEMO_TODAY, GOODS_RECEIPTS, MOVEMENTS, OUTFLOWS, PURCHASE_ORDERS, REQUISITIONS, THEORETICAL_STOCKS } from './generate'
import { SUPPLIERS, userById } from './referentials'
import type { MovementType, Product, RequisitionStatus, Role, StockAlert, StockLocationId } from './types'

export const fmtMAD = (v: number | null | undefined) =>
  v == null ? 'Non renseigné' : `${v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MAD`

export const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
export const fmtDateTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// Stock Réel : recalculé et mis à jour automatiquement par le système selon les flux réels (ventes Z, réceptions, prélèvements)
export const stockAt = (location: StockLocationId, productId: string) => BALANCES[location][productId] ?? 0
export const realStockAt = (location: StockLocationId, productId: string) => BALANCES[location][productId] ?? 0
export const theoreticalStockAt = (location: StockLocationId, productId: string) =>
  THEORETICAL_STOCKS[location]?.[productId] ?? (BALANCES[location][productId] ?? 0)
export const cumpOf = (productId: string) => CUMP[productId]

// Le seuil minimum d'alerte s'applique exclusivement au Stock Central (Économat)
export function allAlerts(): StockAlert[] {
  return PRODUCTS.filter((p) => p.active && p.minStock > 0 && stockAt('economat', p.id) < p.minStock)
    .map((p) => ({
      id: `AL-economat-${p.id}`,
      productId: p.id,
      location: 'economat' as StockLocationId,
      currentQty: stockAt('economat', p.id),
      minStock: p.minStock,
      date: DEMO_TODAY,
    }))
    .sort((a, b) => a.currentQty / Math.max(1, a.minStock) - b.currentQty / Math.max(1, b.minStock))
}

export function alertsFor(location: StockLocationId | 'bar' | 'cuisine'): StockAlert[] {
  if (location === 'economat') return allAlerts()
  return []
}

// Décomposition des doses fines & fonds de bouteilles
export function stockDoseBreakdown(location: StockLocationId, productId: string, overrideQty?: number) {
  const p = PRODUCTS.find((prod) => prod.id === productId)
  const qty = overrideQty !== undefined ? overrideQty : stockAt(location, productId)
  const dosesPerBtl = p?.dosesPerBottle || (p?.storageUnit === 'bouteille' ? 15 : 1)
  const fullBottles = Math.floor(qty)
  const openDoses = Math.round((qty - fullBottles) * dosesPerBtl)
  const totalDoses = Math.round(qty * dosesPerBtl)

  let display = `${qty} ${p?.storageUnit ?? 'u'}`
  let openBottleDetail: string | null = null

  if (p?.storageUnit === 'bouteille' && dosesPerBtl > 1) {
    if (fullBottles === 0 && openDoses > 0) {
      display = `0 btl pleine + ${openDoses} doses (${qty.toFixed(2)} btl)`
      openBottleDetail = `Bouteille entamée (${openDoses} doses restantes / ${dosesPerBtl})`
    } else if (openDoses > 0) {
      display = `${fullBottles} btl & ${openDoses} doses (${qty.toFixed(2)} btl)`
      openBottleDetail = `Bouteille entamée (${openDoses} doses restantes / ${dosesPerBtl})`
    } else {
      display = `${fullBottles} btl (${totalDoses} doses)`
      openBottleDetail = `${fullBottles} bouteille(s) scellée(s)`
    }
  }

  return {
    fullBottles,
    openDoses,
    totalDoses,
    decimalValue: qty,
    display,
    openBottleDetail,
    packEquivalent: p?.packSize ? (qty / p.packSize).toFixed(1) + ' packs' : null,
  }
}

// Calcul du volume en litres en fonction du produit et de la quantité stockée
export function productVolumeLiters(p: Product, qty: number): number {
  if (qty <= 0) return 0
  if (p.storageUnit === 'l') return Math.round(qty * 100) / 100
  if (p.storageUnit === 'bouteille') {
    const volMl = p.bottleVolumeMl || (p.dosesPerBottle ? p.dosesPerBottle * (p.servingMl || 50) : 750)
    return Math.round((qty * volMl) / 10) / 100
  }
  if (p.storageUnit === 'unite' || p.storageUnit === 'piece') {
    // Si bière ou canette/soft, 33 cl ou volume spécifique
    const volMl = p.bottleVolumeMl || (p.categoryId === 'bieres' || p.categoryId === 'eaux-soft' ? 330 : 0)
    return Math.round((qty * volMl) / 10) / 100
  }
  if (p.storageUnit === 'verre') {
    const volMl = p.servingMl || 50
    return Math.round((qty * volMl) / 10) / 100
  }
  return 0
}

// Formatage propre des mouvements : doses, bouteilles, packs, unités sans virgule disgracieuse
export function formatMovementQuantity(m: {
  productId: string
  quantity: number
  unit?: string
  fineDetail?: string
}): string {
  if (m.fineDetail) return m.fineDetail
  const p = PRODUCTS.find((prod) => prod.id === m.productId)
  const isPositive = m.quantity > 0
  const sign = isPositive ? '+' : '-'
  const absQty = Math.abs(m.quantity)

  // Pour les spiritueux (déclinaison bouteille / doses)
  if (p?.storageUnit === 'bouteille' && p?.dosesPerBottle && p.dosesPerBottle > 1) {
    const dosesCount = Math.round(absQty * p.dosesPerBottle)
    const btlInt = Math.floor(dosesCount / p.dosesPerBottle)
    const remDoses = dosesCount % p.dosesPerBottle

    if (btlInt > 0 && remDoses > 0) {
      return `${sign}${btlInt} btl et ${remDoses} doses`
    }
    if (btlInt > 0 && remDoses === 0) {
      return `${sign}${btlInt} btl (${dosesCount} doses)`
    }
    return `${sign}${dosesCount} doses`
  }

  // Pour les packs (bières, sodas, etc.)
  if (p?.packSize && absQty >= p.packSize && absQty % p.packSize === 0) {
    const packs = absQty / p.packSize
    return `${sign}${absQty} ${m.unit || p.storageUnit || 'u'} (${packs} pack${packs > 1 ? 's' : ''})`
  }

  // Quantité standard sans virgule disgracieuse
  const cleanQty = Number.isInteger(m.quantity)
    ? m.quantity
    : Math.round(m.quantity)
  return `${isPositive ? `+${cleanQty}` : cleanQty} ${m.unit || p?.storageUnit || 'u'}`
}

export function formatStockDisplay(qty: number, productId: string): string {
  const p = PRODUCTS.find((prod) => prod.id === productId)
  if (p?.storageUnit === 'bouteille' && p?.dosesPerBottle && p.dosesPerBottle > 1) {
    const totalDoses = Math.round(qty * p.dosesPerBottle)
    const btlInt = Math.floor(totalDoses / p.dosesPerBottle)
    const remDoses = totalDoses % p.dosesPerBottle
    if (btlInt === 0 && remDoses > 0) return `0 btl + ${remDoses} doses (${qty.toFixed(2)} btl)`
    if (remDoses > 0) return `${btlInt} btl & ${remDoses} doses`
    return `${btlInt} btl (${totalDoses} doses)`
  }
  const cleanQty = Number.isInteger(qty) ? qty : Math.round(qty * 100) / 100
  return `${cleanQty} ${p?.storageUnit ?? 'u'}`
}

export type TimePeriod = 'jour' | 'semaine' | 'mois' | 'annee'

export function getFilteredMovements(period: TimePeriod, referenceDate = DEMO_TODAY) {
  const ref = new Date(referenceDate)
  return MOVEMENTS.filter((m) => {
    const d = new Date(m.date)
    if (period === 'jour') {
      return m.date.slice(0, 10) === referenceDate.slice(0, 10)
    }
    if (period === 'semaine') {
      const diffDays = (ref.getTime() - d.getTime()) / (1000 * 3600 * 24)
      return diffDays >= 0 && diffDays <= 7
    }
    if (period === 'mois') {
      return m.date.slice(0, 7) === referenceDate.slice(0, 7)
    }
    if (period === 'annee') {
      return m.date.slice(0, 4) === referenceDate.slice(0, 4)
    }
    return true
  })
}

export function totalSalesStats(period: TimePeriod = 'mois', referenceDate = DEMO_TODAY) {
  const movs = getFilteredMovements(period, referenceDate)
  const salesMovs = movs.filter((m) => m.type === 'vente')
  const totalQty = salesMovs.reduce((s, m) => s + Math.abs(m.quantity), 0)
  const totalValue = salesMovs.reduce((s, m) => {
    const p = PRODUCTS.find((prod) => prod.id === m.productId)
    const price = p?.priceFormats?.[0]?.price ?? (CUMP[m.productId] ? CUMP[m.productId]! * 3 : 80)
    return s + Math.abs(m.quantity) * price
  }, 0)
  return { totalQty, totalValue: Math.round(totalValue) }
}

export function totalPurchasesStats(period: TimePeriod = 'mois', referenceDate = DEMO_TODAY) {
  const movs = getFilteredMovements(period, referenceDate)
  const purchaseMovs = movs.filter((m) => m.type === 'entree_fournisseur')
  const totalQty = purchaseMovs.reduce((s, m) => s + Math.abs(m.quantity), 0)
  const totalValue = purchaseMovs.reduce((s, m) => s + (m.value ?? (m.unitCost ? m.unitCost * m.quantity : 0)), 0)
  return { totalQty, totalValue: Math.round(totalValue) }
}

export function marginAndLossStats(period: TimePeriod = 'mois', referenceDate = DEMO_TODAY) {
  const sales = totalSalesStats(period, referenceDate).totalValue
  const purchases = totalPurchasesStats(period, referenceDate).totalValue
  const losses = lossesValue()
  const grossMargin = sales - purchases
  const marginRate = sales > 0 ? (grossMargin / sales) * 100 : 0
  const lossRate = sales > 0 ? (losses / sales) * 100 : 0
  return {
    sales,
    purchases,
    grossMargin,
    marginRate: Math.max(0, Math.round(marginRate * 10) / 10),
    losses,
    lossRate: Math.round(lossRate * 10) / 10,
  }
}

export function serviceLossesComparison() {
  const barLosses = OUTFLOWS.filter((o) => o.location === 'bar' && o.status === 'acceptee').reduce((s, o) => s + (o.value ?? 0), 0)
  const cuisineLosses = OUTFLOWS.filter((o) => o.location === 'cuisine' && o.status === 'acceptee').reduce((s, o) => s + (o.value ?? 0), 0)
  const total = barLosses + cuisineLosses
  const mostCostlyLocation: 'bar' | 'cuisine' = barLosses >= cuisineLosses ? 'bar' : 'cuisine'
  const mostCostlyAmount = Math.max(barLosses, cuisineLosses)
  const mostCostlyPct = total > 0 ? Math.round((mostCostlyAmount / total) * 100) : 50

  return {
    barLosses,
    cuisineLosses,
    totalLosses: total,
    mostCostlyLocation,
    mostCostlyAmount,
    mostCostlyPct,
  }
}

export function topBestsellers(limit = 5) {
  const map = new Map<string, { qty: number; value: number }>()
  for (const m of MOVEMENTS) {
    if (m.type !== 'vente') continue
    const curr = map.get(m.productId) ?? { qty: 0, value: 0 }
    const p = PRODUCTS.find((prod) => prod.id === m.productId)
    const price = p?.priceFormats?.[0]?.price ?? (CUMP[m.productId] ? CUMP[m.productId]! * 3 : 80)
    curr.qty += Math.abs(m.quantity)
    curr.value += Math.abs(m.quantity) * price
    map.set(m.productId, curr)
  }
  return Array.from(map.entries())
    .map(([productId, stats]) => ({
      product: PRODUCTS.find((p) => p.id === productId)!,
      qty: stats.qty,
      value: Math.round(stats.value),
    }))
    .filter((x) => !!x.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
}

export function topUnderperformers(limit = 5) {
  const salesMap = new Map<string, number>()
  for (const m of MOVEMENTS) {
    if (m.type === 'vente') {
      salesMap.set(m.productId, (salesMap.get(m.productId) ?? 0) + Math.abs(m.quantity))
    }
  }
  return PRODUCTS.filter((p) => p.active)
    .map((p) => ({
      product: p,
      qty: salesMap.get(p.id) ?? 0,
      stock: stockAt('bar', p.id) + stockAt('economat', p.id),
    }))
    .sort((a, b) => a.qty - b.qty)
    .slice(0, limit)
}

export function topPartialDeliveryProducts(limit = 5) {
  const map = new Map<string, { count: number; missingQty: number }>()

  for (const po of PURCHASE_ORDERS) {
    if (po.status === 'partiellement_recue') {
      for (const it of po.items) {
        const diff = it.qtyOrdered - it.qtyReceived
        if (diff > 0) {
          const c = map.get(it.productId) ?? { count: 0, missingQty: 0 }
          c.count++
          c.missingQty += diff
          map.set(it.productId, c)
        }
      }
    }
  }

  for (const r of REQUISITIONS) {
    if (r.status === 'partiellement_livre') {
      for (const it of r.items) {
        const diff = it.qtyRequested - it.qtyDelivered
        if (diff > 0) {
          const c = map.get(it.productId) ?? { count: 0, missingQty: 0 }
          c.count++
          c.missingQty += diff
          map.set(it.productId, c)
        }
      }
    }
  }

  return Array.from(map.entries())
    .map(([productId, stats]) => ({
      product: PRODUCTS.find((p) => p.id === productId)!,
      partialCount: stats.count,
      missingQty: stats.missingQty,
    }))
    .filter((x) => !!x.product)
    .sort((a, b) => b.missingQty - a.missingQty)
    .slice(0, limit)
}

export function economatReplenishList(): { product: Product; qty: number }[] {
  return PRODUCTS.filter((p) => p.active && p.targetStock > 0 && BALANCES.economat[p.id] < p.targetStock * 0.3).map((p) => ({
    product: p,
    qty: BALANCES.economat[p.id],
  }))
}

export const REQ_STATUS_LABEL: Record<string, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente',
  en_preparation: 'En préparation',
  partiellement_livre: 'Partiellement livré',
  livre: 'Livré',
  rejete: 'Rejeté',
}
export const PO_STATUS_LABEL: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  partiellement_recue: 'Partiellement reçue',
  receptionnee: 'Réceptionnée',
  annulee: 'Annulée',
}
export const OUTFLOW_STATUS_LABEL: Record<string, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  rejetee: 'Rejetée',
}
export const OUTFLOW_REASON_LABEL: Record<string, string> = {
  casse: 'Casse',
  perte: 'Perte',
  consommation_personnel: 'Consommation du personnel',
  produit_offert: 'Produit offert',
  produit_perime: 'Produit périmé',
  autre: 'Autre',
}
export const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  entree_fournisseur: 'Entrée fournisseur',
  transfert_bar: 'Transfert vers le Bar',
  transfert_cuisine: 'Transfert vers la Cuisine',
  retour_stock_central: 'Retour au stock central',
  vente: 'Vente',
  sortie_hors_vente_validee: 'Sortie hors-vente validée',
  ajustement_inventaire: "Ajustement d'inventaire",
  retour_fournisseur: 'Retour fournisseur',
}
export const LOCATION_LABEL: Record<StockLocationId, string> = { economat: 'Économat', bar: 'Bar', cuisine: 'Cuisine' }

export function requisitionsFor(location: 'bar' | 'cuisine') {
  return REQUISITIONS.filter((r) => r.requestingLocation === location).sort((a, b) => b.date.localeCompare(a.date))
}
export function outflowsFor(location: 'bar' | 'cuisine') {
  return OUTFLOWS.filter((o) => o.location === location).sort((a, b) => b.date.localeCompare(a.date))
}
export function productMovementTotals(productId: string) {
  let achats = 0
  let ventes = 0
  let prelevements = 0
  for (const m of MOVEMENTS) {
    if (m.productId !== productId) continue
    if (m.type === 'entree_fournisseur') achats += m.quantity
    if (m.type === 'vente') ventes += Math.abs(m.quantity)
    if ((m.type === 'transfert_bar' || m.type === 'transfert_cuisine') && m.quantity > 0) prelevements += m.quantity
  }
  return { achats, ventes, prelevements }
}

export const FREQUENCY_LABEL: Record<string, string> = { quotidien: 'Quotidien', hebdomadaire: 'Hebdomadaire' }

export function movementsForProduct(productId: string) {
  return MOVEMENTS.filter((m) => m.productId === productId).sort((a, b) => b.date.localeCompare(a.date))
}
export function pendingOutflows() {
  return OUTFLOWS.filter((o) => o.status === 'en_attente').sort((a, b) => a.date.localeCompare(b.date))
}
export function acceptedOutflows() {
  return OUTFLOWS.filter((o) => o.status === 'acceptee')
}
export function lossesValue(sinceDaysAgo?: number): number {
  const since = sinceDaysAgo ? new Date(Date.now() - sinceDaysAgo * 86400000).toISOString() : null
  return acceptedOutflows()
    .filter((o) => !since || o.date >= since)
    .reduce((s, o) => s + (o.value ?? 0), 0)
}
export function pendingRequisitions() {
  return REQUISITIONS.filter((r) => r.status === 'en_attente')
}
export function preparingRequisitions() {
  return REQUISITIONS.filter((r) => r.status === 'en_preparation')
}
export function partialRequisitions() {
  return REQUISITIONS.filter((r) => r.status === 'partiellement_livre')
}
export function openPurchaseOrders() {
  return PURCHASE_ORDERS.filter((po) => po.status === 'envoyee' || po.status === 'partiellement_recue')
}
export function supplierName(id: string) {
  return SUPPLIERS.find((s) => s.id === id)?.name ?? id
}
export function userName(id: string) {
  return userById(id)?.name ?? id
}
export function receiptsFor(purchaseOrderId: string) {
  return GOODS_RECEIPTS.filter((r) => r.purchaseOrderId === purchaseOrderId)
}

export interface AppNotification {
  id: string
  title: string
  detail: string
  date: string
  severity: 'info' | 'warning' | 'error'
  link?: string
}

export function notificationsFor(role: Role): AppNotification[] {
  const out: AppNotification[] = []

  if (role === 'admin') {
    for (const o of pendingOutflows()) {
      out.push({
        id: `outflow:${o.id}`,
        title: `Sortie hors-vente à valider — ${o.id}`,
        detail: `${PRODUCTS.find((p) => p.id === o.productId)?.name ?? o.productId} · ${o.quantity} ${o.unit} · ${LOCATION_LABEL[o.location]}`,
        date: o.date,
        severity: 'warning',
        link: '/admin/sorties-hors-vente',
      })
    }
    for (const a of allAlerts()) {
      out.push({
        id: `alert:${a.id}`,
        title: `Stock critique — ${PRODUCTS.find((p) => p.id === a.productId)?.name ?? a.productId}`,
        detail: `${a.currentQty}/${a.minStock} au ${LOCATION_LABEL[a.location]}`,
        date: a.date,
        severity: 'error',
        link: `/produits/${a.productId}`,
      })
    }
  }

  if (role === 'economat') {
    for (const r of pendingRequisitions()) {
      out.push({ id: `req:${r.id}`, title: `Bon de prélèvement en attente — ${r.id}`, detail: LOCATION_LABEL[r.requestingLocation], date: r.date, severity: 'info', link: '/economat/prelevements' })
    }
    for (const r of partialRequisitions()) {
      out.push({ id: `req-partial:${r.id}`, title: `Livraison partielle à compléter — ${r.id}`, detail: LOCATION_LABEL[r.requestingLocation], date: r.date, severity: 'warning', link: '/economat/prelevements' })
    }
    for (const po of openPurchaseOrders()) {
      out.push({ id: `po:${po.id}`, title: `Réception attendue — ${po.id}`, detail: supplierName(po.supplierId), date: po.date, severity: 'info', link: '/economat/commandes' })
    }
  }

  if (role === 'bar' || role === 'cuisine' || role === 'service') {
    const locs: ('bar' | 'cuisine')[] = role === 'service' ? ['bar', 'cuisine'] : [role]
    for (const loc of locs) {
      for (const a of alertsFor(loc)) {
        out.push({
          id: `alert:${a.id}`,
          title: `Stock critique — ${PRODUCTS.find((p) => p.id === a.productId)?.name ?? a.productId}`,
          detail: `${a.currentQty}/${a.minStock} (${LOCATION_LABEL[loc]})`,
          date: a.date,
          severity: 'error',
          link: `/produits/${a.productId}`,
        })
      }
      for (const o of outflowsFor(loc).filter((o) => o.status !== 'en_attente').slice(0, 3)) {
        out.push({
          id: `outflow-resolved:${o.id}`,
          title: o.status === 'acceptee' ? `Sortie acceptée — ${o.id}` : `Sortie rejetée — ${o.id}`,
          detail: `${PRODUCTS.find((p) => p.id === o.productId)?.name ?? o.productId} (${LOCATION_LABEL[loc]})`,
          date: o.validatedDate ?? o.date,
          severity: o.status === 'acceptee' ? 'info' : 'warning',
          link: `/service/sorties-hors-vente?service=${loc}`,
        })
      }
    }
  }

  return out.sort((a, b) => b.date.localeCompare(a.date))
}

export function monthlyActivity(months: number) {
  const end = new Date(DEMO_TODAY)
  const buckets: { key: string; label: string; mouvements: number; prelevements: number; pertes: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.push({ key, label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), mouvements: 0, prelevements: 0, pertes: 0 })
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]))
  for (const m of MOVEMENTS) {
    const key = m.date.slice(0, 7)
    const b = byKey.get(key)
    if (!b) continue
    b.mouvements++
    if (m.type === 'transfert_bar' || m.type === 'transfert_cuisine') b.prelevements++
    if (m.type === 'sortie_hors_vente_validee') b.pertes += m.value ?? 0
  }
  return buckets
}

export function dailySeries(location: StockLocationId, days: number, types: MovementType[] = ['vente']) {
  const end = new Date(DEMO_TODAY)
  const result: { label: string; qty: number; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().slice(0, 10)
    const dayMovs = MOVEMENTS.filter((m) => m.location === location && types.includes(m.type) && m.date.slice(0, 10) === dayStr)
    result.push({
      label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      qty: dayMovs.reduce((s, m) => s + Math.abs(m.quantity), 0),
      value: dayMovs.reduce((s, m) => s + (m.value ?? 0), 0),
    })
  }
  return result
}

export function stockByCategory(location: StockLocationId) {
  const totals = new Map<string, number>()
  for (const p of PRODUCTS) {
    if (!p.active) continue
    const qty = BALANCES[location][p.id] ?? 0
    if (qty <= 0) continue
    totals.set(CATEGORY_LABEL[p.categoryId], (totals.get(CATEGORY_LABEL[p.categoryId]) ?? 0) + qty)
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

export function requisitionStatusBreakdown() {
  const order: RequisitionStatus[] = ['en_attente', 'en_preparation', 'partiellement_livre', 'livre', 'rejete']
  return order.map((s) => ({ name: REQ_STATUS_LABEL[s], value: REQUISITIONS.filter((r) => r.status === s).length }))
}

export type AnomalySeverity = 'critique' | 'elevee' | 'moderee'
export interface Anomaly {
  id: string
  type: 'rupture' | 'ecart_inventaire' | 'reception_partielle' | 'sortie_attente'
  title: string
  detail: string
  severity: AnomalySeverity
  date: string
  location?: StockLocationId
  link?: string
}

const daysAgo = (iso: string) => Math.floor((new Date(DEMO_TODAY).getTime() - new Date(iso).getTime()) / 86400000)

export function allAnomalies(): Anomaly[] {
  const out: Anomaly[] = []

  for (const a of allAlerts()) {
    const ratio = a.currentQty / Math.max(1, a.minStock)
    out.push({
      id: `rupture:${a.id}`,
      type: 'rupture',
      title: `Rupture imminente — ${PRODUCTS.find((p) => p.id === a.productId)?.name ?? a.productId}`,
      detail: `${a.currentQty} disponible(s) contre un seuil minimum de ${a.minStock} au ${LOCATION_LABEL[a.location]}.`,
      severity: ratio === 0 ? 'critique' : ratio < 0.5 ? 'elevee' : 'moderee',
      date: a.date,
      location: a.location,
      link: `/produits/${a.productId}`,
    })
  }

  // Anticipation IA : Bouteilles entamées au Bar avec doses restantes faibles (<= 10 doses ou < 1 btl pleine)
  for (const p of PRODUCTS) {
    if (!p.active || p.storageUnit !== 'bouteille' || !p.dosesPerBottle) continue
    const barStock = BALANCES.bar[p.id] ?? 0
    if (barStock <= 0) continue
    const breakdown = stockDoseBreakdown('bar', p.id)
    // S'il n'y a plus de bouteilles pleines en réserve au bar et qu'il ne reste que le fond entamé (<= 10 doses)
    // ou que le stock total bar est <= 10 doses
    const totalDosesRemaining = breakdown.totalDoses
    if (totalDosesRemaining > 0 && totalDosesRemaining <= 10) {
      out.push({
        id: `anticipation-dose:${p.id}`,
        type: 'rupture',
        title: `Anticipation IA : Fond de bouteille critique — ${p.name}`,
        detail: `Il ne reste que ${totalDosesRemaining} dose(s) (${(totalDosesRemaining * (p.servingCl ?? 5))} cl) au Bar. Suggestion IA : préparer un bon de prélèvement avant rupture de service.`,
        severity: totalDosesRemaining <= 5 ? 'critique' : 'elevee',
        date: DEMO_TODAY,
        location: 'bar',
        link: `/produits/${p.id}`,
      })
    }
  }

  for (const m of MOVEMENTS) {
    if (m.type !== 'ajustement_inventaire') continue
    if (m.documentRef === 'INV-INIT-ECO' || m.documentRef === 'INV-INIT-BAR' || m.documentRef === 'INV-INIT-CUISINE') continue
    out.push({
      id: `ecart:${m.id}`,
      type: 'ecart_inventaire',
      title: `Écart d'inventaire — ${PRODUCTS.find((p) => p.id === m.productId)?.name ?? m.productId}`,
      detail: `${m.quantity > 0 ? '+' : ''}${m.quantity} ${m.unit} constaté(s) au ${LOCATION_LABEL[m.location]}${m.comment ? ' — ' + m.comment : ''}.`,
      severity: 'moderee',
      date: m.date,
      location: m.location,
      link: `/produits/${m.productId}`,
    })
  }

  for (const po of PURCHASE_ORDERS) {
    if (po.status !== 'partiellement_recue') continue
    const missing = po.items.reduce((s, it) => s + (it.qtyOrdered - it.qtyReceived), 0)
    out.push({
      id: `reception:${po.id}`,
      type: 'reception_partielle',
      title: `Réception partielle — ${po.id}`,
      detail: `${missing} unité(s) encore manquante(s) sur la commande auprès de ${supplierName(po.supplierId)}.`,
      severity: 'elevee',
      date: po.date,
      link: '/economat/commandes',
    })
  }

  for (const o of OUTFLOWS) {
    if (o.status !== 'en_attente') continue
    const age = daysAgo(o.date)
    if (age < 2) continue
    out.push({
      id: `sortie:${o.id}`,
      type: 'sortie_attente',
      title: `Sortie hors-vente en attente depuis ${age} jours — ${o.id}`,
      detail: `${PRODUCTS.find((p) => p.id === o.productId)?.name ?? o.productId} · ${OUTFLOW_REASON_LABEL[o.reason]} · ${LOCATION_LABEL[o.location]}.`,
      severity: age > 5 ? 'critique' : 'elevee',
      date: o.date,
      location: o.location,
      link: '/admin/sorties-hors-vente',
    })
  }

  return out.sort((a, b) => b.date.localeCompare(a.date))
}

// ---------- Recommandations fournisseurs (simulation déterministe) ----------
function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const SPIRIT_CATEGORIES = new Set(['cristal', 'gins-premium', 'whisky-rhum', 'vodka-tequila', 'gin', 'aperitifs-digestifs'])

function candidateSuppliers(productId: string): string[] {
  const p = PRODUCTS.find((x) => x.id === productId)
  if (!p) return []
  if (p.categoryId === 'cuisine-demo') return ['sup-ferme', 'sup-boucherie']
  if (p.categoryId === 'bieres' || p.categoryId === 'eaux-soft') return ['sup-brasseries', 'sup-soft']
  if (SPIRIT_CATEGORIES.has(p.categoryId)) return ['sup-diageo', 'sup-celliers']
  return ['sup-diageo', 'sup-brasseries']
}

export interface SupplierQuote {
  supplierId: string
  supplierName: string
  unitPrice: number
  delayDays: number
  qualityRating: number
  decision: 'Recommandé · Éco' | 'Recommandé · Urgent' | 'Alternative'
}

export function supplierRecommendations(productId: string, urgent: boolean): SupplierQuote[] {
  const base = cumpOf(productId) ?? 50
  const candidates = candidateSuppliers(productId)
  const quotes: SupplierQuote[] = candidates.map((supplierId) => {
    const h = hash(productId + supplierId)
    const variance = ((h % 21) - 10) / 100 // -10% à +10%
    const unitPrice = Math.max(1, Math.round(base * (1 + variance) * 100) / 100)
    const delayDays = 1 + (h % 4)
    const qualityRating = Math.round((3.5 + ((h >> 4) % 16) / 10) * 10) / 10
    return { supplierId, supplierName: supplierName(supplierId), unitPrice, delayDays, qualityRating, decision: 'Alternative' }
  })
  if (quotes.length === 0) return quotes
  const best = urgent ? [...quotes].sort((a, b) => a.delayDays - b.delayDays)[0] : [...quotes].sort((a, b) => a.unitPrice - b.unitPrice)[0]
  for (const q of quotes) {
    if (q.supplierId === best.supplierId) q.decision = urgent ? 'Recommandé · Urgent' : 'Recommandé · Éco'
  }
  return quotes.sort((a, b) => (a.decision.startsWith('Recommandé') === b.decision.startsWith('Recommandé') ? 0 : a.decision.startsWith('Recommandé') ? -1 : 1))
}

export function productsToReplenishWithQuotes() {
  const list = [...economatReplenishList()]
  const barCuisineAlerts = allAlerts()
  const extra = barCuisineAlerts
    .filter((a) => !list.some((l) => l.product.id === a.productId))
    .map((a) => ({ product: PRODUCTS.find((p) => p.id === a.productId)!, qty: a.currentQty }))

  // Ajouter les spiritueux avec anticipation sur fond de bouteille critique (<= 10 doses)
  const lowDoseProducts = PRODUCTS.filter((p) => {
    if (!p.active || p.storageUnit !== 'bouteille' || !p.dosesPerBottle) return false
    const barQty = BALANCES.bar[p.id] ?? 0
    if (barQty <= 0) return false
    const breakdown = stockDoseBreakdown('bar', p.id)
    return breakdown.totalDoses > 0 && breakdown.totalDoses <= 10
  }).map((p) => ({
    product: p,
    qty: BALANCES.bar[p.id] ?? 0,
  })).filter((item) => !list.some((l) => l.product.id === item.product.id) && !extra.some((e) => e.product.id === item.product.id))

  return [...list, ...extra, ...lowDoseProducts].map(({ product, qty }) => ({
    product,
    currentQty: qty,
    urgent: qty <= product.minStock * 0.5 || (product.storageUnit === 'bouteille' && qty < 1),
    quotes: supplierRecommendations(product.id, qty <= product.minStock * 0.5),
  }))
}

export const ANOMALY_TYPE_LABEL: Record<Anomaly['type'], string> = {
  rupture: 'Rupture imminente',
  ecart_inventaire: "Écart d'inventaire",
  reception_partielle: 'Réception partielle',
  sortie_attente: 'Sortie en attente',
}

export interface HiddenStory {
  id: string
  title: string
  detail: string
  severity: 'critique' | 'a-surveiller' | 'opportunite'
  link?: string
}

export function hiddenStories(): HiddenStory[] {
  const chivas = PRODUCTS.find((p) => p.name === 'Chivas 18 ans')!
  const poulet = PRODUCTS.find((p) => p.name === 'Poulet')!
  return [
    {
      id: 'story-chivas',
      title: 'Chivas 18 ans proche de la rupture au Bar',
      detail: `Stock Bar : ${stockAt('bar', chivas.id)} bouteille(s) pour un seuil minimum de ${chivas.minStock}. Aucun bon de prélèvement n'a été soumis pour cette référence depuis l'ouverture.`,
      severity: 'critique',
      link: `/produits/${chivas.id}`,
    },
    {
      id: 'story-poulet',
      title: 'Rupture Poulet en Cuisine — réapprovisionnement en attente',
      detail: `Le bon de prélèvement BP-0005 n'a été livré qu'à hauteur du stock disponible. La commande BC-0004 auprès de Boucherie Centrale Casablanca n'a pas encore été réceptionnée.`,
      severity: 'critique',
      link: `/produits/${poulet.id}`,
    },
    {
      id: 'story-perte-jameson',
      title: 'Perte anormale sur Jameson',
      detail: 'Une bouteille de Jameson (valeur 180 MAD) a été déclarée cassée pendant le service — la plus forte perte valorisée du mois.',
      severity: 'a-surveiller',
    },
    {
      id: 'story-shv-attente',
      title: 'Sortie hors-vente en attente depuis plusieurs jours',
      detail: "La déclaration SHV-0008 (Poulet, motif \"Autre\") est en attente de validation depuis le " + fmtDate(OUTFLOWS.find((o) => o.id === 'SHV-0008')!.date) + '.',
      severity: 'a-surveiller',
    },
    {
      id: 'story-reception-partielle',
      title: 'Réception fournisseur partielle en cours',
      detail: 'La commande BC-0002 (Brasseries du Maroc) a été réceptionnée en deux temps : 70 puis 30 unités de Heineken.',
      severity: 'opportunite',
    },
    {
      id: 'story-shv-rejetee',
      title: 'Une sortie hors-vente a été rejetée',
      detail: 'SHV-0007 (Chivas 18 ans, casse) a été rejetée par l\'Administrateur faute de justification suffisante : aucun impact sur le stock.',
      severity: 'opportunite',
    },
  ]
}
