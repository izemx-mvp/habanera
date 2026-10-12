// Sélecteurs dérivés — calculent indicateurs, alertes et historiques à partir des données
// générées (jamais de chiffre écrit en dur dans les écrans).
import { CATEGORY_LABEL, PRODUCTS, productsByLocation } from './catalog'
import { BALANCES, CUMP, DEMO_TODAY, GOODS_RECEIPTS, MOVEMENTS, OUTFLOWS, PURCHASE_ORDERS, REQUISITIONS } from './generate'
import { SUPPLIERS, userById } from './referentials'
import type { MovementType, Product, RequisitionStatus, StockAlert, StockLocationId } from './types'

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

export const stockAt = (location: StockLocationId, productId: string) => BALANCES[location][productId] ?? 0
export const cumpOf = (productId: string) => CUMP[productId]

export function alertsFor(location: 'bar' | 'cuisine'): StockAlert[] {
  return productsByLocation(location)
    .filter((p) => p.active && p.minStock > 0 && stockAt(location, p.id) < p.minStock)
    .map((p) => ({
      id: `AL-${location}-${p.id}`,
      productId: p.id,
      location,
      currentQty: stockAt(location, p.id),
      minStock: p.minStock,
      date: DEMO_TODAY,
    }))
    .sort((a, b) => a.currentQty / Math.max(1, a.minStock) - b.currentQty / Math.max(1, b.minStock))
}

export function allAlerts(): StockAlert[] {
  return [...alertsFor('bar'), ...alertsFor('cuisine')]
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

export function notificationsFor(role: 'admin' | 'economat' | 'bar' | 'cuisine'): AppNotification[] {
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

  if (role === 'bar' || role === 'cuisine') {
    for (const a of alertsFor(role)) {
      out.push({
        id: `alert:${a.id}`,
        title: `Stock critique — ${PRODUCTS.find((p) => p.id === a.productId)?.name ?? a.productId}`,
        detail: `${a.currentQty}/${a.minStock}`,
        date: a.date,
        severity: 'error',
        link: `/produits/${a.productId}`,
      })
    }
    for (const o of outflowsFor(role).filter((o) => o.status !== 'en_attente').slice(0, 3)) {
      out.push({
        id: `outflow-resolved:${o.id}`,
        title: o.status === 'acceptee' ? `Sortie hors-vente acceptée — ${o.id}` : `Sortie hors-vente rejetée — ${o.id}`,
        detail: PRODUCTS.find((p) => p.id === o.productId)?.name ?? o.productId,
        date: o.validatedDate ?? o.date,
        severity: o.status === 'acceptee' ? 'info' : 'warning',
        link: `/${role}/sorties-hors-vente`,
      })
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
  return [...list, ...extra].map(({ product, qty }) => ({
    product,
    currentQty: qty,
    urgent: qty <= product.minStock * 0.5,
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
