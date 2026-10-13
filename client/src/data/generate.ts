// Générateur de données de démonstration HABANERA — simulation déterministe (graine fixe).
// Toutes les données (stocks, mouvements, bons de prélèvement, commandes, sorties hors-vente)
// sont fictives mais cohérentes entre elles : les quantités, dates et valorisations s'enchaînent
// dans un ordre chronologique unique, comme le ferait une vraie base de données.
import { PRODUCTS, productById } from './catalog'
import { SUPPLIERS, USERS } from './referentials'
import type {
  GoodsReceipt,
  MovementType,
  NonSalesOutflow,
  OutflowReason,
  PurchaseOrder,
  RequisitionOrder,
  StockLocationId,
  StockMovement,
  UnitId,
} from './types'

export const DEMO_TODAY = '2026-10-10'
const START = new Date('2026-08-26T08:00:00')
const dayISO = (offset: number, hour = 9, minute = 0) => {
  const d = new Date(START)
  d.setDate(d.getDate() + offset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261010)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1))

const byName = (name: string) => {
  const p = PRODUCTS.find((p) => p.name === name)
  if (!p) throw new Error(`Produit introuvable dans le catalogue : ${name}`)
  return p
}

// ---------- coûts d'achat connus (saisis sur réception fournisseur) ----------
// Les autres produits n'ont jamais été réceptionnés dans cette fenêtre de démonstration :
// leur CUMP reste "À valoriser" tant qu'aucune réception ne leur attribue un coût.
const KNOWN_COSTS: Record<string, number> = {
  Jameson: 180,
  "Jack Daniel's Honey": 210,
  Absolut: 150,
  Tanqueray: 170,
  Campari: 140,
  Heineken: 14,
  'Corona 33 cl': 16,
  Casablanca: 10,
  'Coca-Cola': 6,
  Perrier: 12,
  'Red Bull': 18,
  Tomates: 8,
  'Pommes de terre': 4,
  Poulet: 45,
  "Huile d'olive": 60,
  Citron: 6,
}

// ---------- état runtime ----------
const balances: Record<StockLocationId, Record<string, number>> = { economat: {}, bar: {}, cuisine: {} }
const cump: Record<string, number | null> = {}
for (const p of PRODUCTS) {
  balances.economat[p.id] = 0
  balances.bar[p.id] = 0
  balances.cuisine[p.id] = 0
  cump[p.id] = null
}

const movements: StockMovement[] = []
let movSeq = 1
const nextMovId = () => `MV-${String(movSeq++).padStart(5, '0')}`

export function applyMovement(opts: {
  date: string
  productId: string
  location: StockLocationId
  type: MovementType
  delta: number // signé : + entrée, - sortie
  unit: UnitId
  userId: string
  documentRef?: string
  comment?: string
  fineDetail?: string
  unitCost?: number | null
}) {
  const before = balances[opts.location][opts.productId] ?? 0
  const after = Math.max(0, Math.round((before + opts.delta) * 10000) / 10000)
  balances[opts.location][opts.productId] = after
  const unitCost = opts.unitCost ?? null
  const quantity = after - before
  movements.push({
    id: nextMovId(),
    date: opts.date,
    productId: opts.productId,
    location: opts.location,
    type: opts.type,
    quantity,
    unit: opts.unit,
    fineDetail: opts.fineDetail,
    stockBefore: before,
    stockAfter: after,
    userId: opts.userId,
    documentRef: opts.documentRef,
    comment: opts.comment,
    unitCost,
    value: unitCost != null ? Math.round(Math.abs(quantity) * unitCost * 100) / 100 : null,
  })
  return movements[movements.length - 1]
}

function receiveGoods(productId: string, qty: number, unitCost: number | null, date: string, documentRef: string, userId: string) {
  const before = balances.economat[productId] ?? 0
  if (unitCost != null) {
    const prevCump = cump[productId]
    cump[productId] = prevCump == null ? unitCost : Math.round(((prevCump * before + unitCost * qty) / (before + qty)) * 100) / 100
  }
  applyMovement({
    date,
    productId,
    location: 'economat',
    type: 'entree_fournisseur',
    delta: qty,
    unit: productById(productId)!.storageUnit,
    userId,
    documentRef,
    comment: 'Réception fournisseur',
    unitCost,
  })
}

// ---------- 1. Inventaire initial (jour 0) ----------
const U_ECO = 'u-eco-1'
const U_ECO2 = 'u-eco-2'
const U_BAR = 'u-bar-1'
const U_BAR2 = 'u-bar-2'
const U_CUISINE = 'u-cuisine-1'
const U_ADMIN = 'u-admin-1'

const ACTIVE_BAR = [
  'Chivas 18 ans',
  'Glenmorangie 12 ans',
  'Tanqueray Ten',
  'Jameson',
  "Jack Daniel's Honey",
  'Chivas 12',
  'Absolut',
  "Tito's",
  'Tanqueray',
  "Hendrick's",
  'Campari',
  'Aperol Spritz',
  'Martini',
  'Perrier',
  'Coca-Cola',
  'Red Bull',
  'Sidi Ali',
  'Heineken',
  'Corona 33 cl',
  'Casablanca',
  'Casablanca Citron',
]
const ACTIVE_CUISINE = ['Tomates', 'Pommes de terre', 'Poulet', "Huile d'olive", 'Citron']
const ACTIVE = [...ACTIVE_BAR, ...ACTIVE_CUISINE]

for (const p of PRODUCTS) {
  const isCuisine = p.location === 'cuisine'
  const sellLoc: StockLocationId = isCuisine ? 'cuisine' : 'bar'
  const ecoUser = U_ECO
  const sellUser = isCuisine ? U_CUISINE : U_BAR

  // Stock central Économat : réserve plus large que le stock cible
  const ecoQty = Math.max(0, Math.round((p.targetStock || 4) * (isCuisine ? 1.4 : 1.8) * (0.8 + rand() * 0.4)))
  if (ecoQty > 0) {
    applyMovement({
      date: dayISO(0, 8, 0),
      productId: p.id,
      location: 'economat',
      type: 'ajustement_inventaire',
      delta: ecoQty,
      unit: p.storageUnit,
      userId: ecoUser,
      documentRef: 'INV-INIT-ECO',
      comment: 'Inventaire initial — stock central',
    })
  }

  // Stock de service (Bar / Cuisine) : proche de la cible, parfois déjà sous le seuil
  if (p.targetStock > 0 || p.minStock > 0) {
    const near = p.id === byName('Chivas 18 ans').id ? 0.35 : 0.75 + rand() * 0.5
    const startQty = Math.max(0, Math.round((p.targetStock || p.minStock * 2 || 4) * near))
    if (startQty > 0) {
      applyMovement({
        date: dayISO(0, 8, 30),
        productId: p.id,
        location: sellLoc,
        type: 'ajustement_inventaire',
        delta: startQty,
        unit: p.storageUnit,
        userId: sellUser,
        documentRef: isCuisine ? 'INV-INIT-CUISINE' : 'INV-INIT-BAR',
        comment: `Inventaire initial — ${isCuisine ? 'Cuisine' : 'Bar'}`,
      })
    }
  }
}

// ---------- 2. Commandes fournisseurs & réceptions ----------
export const PURCHASE_ORDERS: PurchaseOrder[] = []
export const GOODS_RECEIPTS: GoodsReceipt[] = []
let poSeq = 1
const nextPoId = () => `BC-${String(poSeq++).padStart(4, '0')}`
let grSeq = 1
const nextGrId = () => `BR-${String(grSeq++).padStart(4, '0')}`

function makePO(supplierId: string, date: string, items: { name: string; qty: number }[], createdBy: string) {
  const po: PurchaseOrder = {
    id: nextPoId(),
    supplierId,
    date,
    createdBy,
    status: 'envoyee',
    items: items.map((it) => ({
      productId: byName(it.name).id,
      qtyOrdered: it.qty,
      unitCost: KNOWN_COSTS[it.name] ?? null,
      qtyReceived: 0,
    })),
  }
  PURCHASE_ORDERS.push(po)
  return po
}

function receivePO(po: PurchaseOrder, date: string, receivedBy: string, qtyByName: Record<string, number>) {
  const gr: GoodsReceipt = { id: nextGrId(), purchaseOrderId: po.id, date, receivedBy, items: [] }
  for (const it of po.items) {
    const prod = productById(it.productId)!
    const qty = qtyByName[prod.name] ?? it.qtyOrdered - it.qtyReceived
    if (qty <= 0) continue
    it.qtyReceived += qty
    gr.items.push({ productId: it.productId, qtyReceived: qty, unitCost: it.unitCost })
    receiveGoods(it.productId, qty, it.unitCost, date, gr.id, receivedBy)
  }
  po.status = po.items.every((it) => it.qtyReceived >= it.qtyOrdered) ? 'receptionnee' : 'partiellement_recue'
  GOODS_RECEIPTS.push(gr)
  return gr
}

// PO-1 Diageo — spiritueux — réception complète
const po1 = makePO(
  'sup-diageo',
  dayISO(5),
  [
    { name: 'Jameson', qty: 12 },
    { name: "Jack Daniel's Honey", qty: 6 },
    { name: 'Absolut', qty: 12 },
    { name: 'Tanqueray', qty: 12 },
    { name: 'Campari', qty: 6 },
  ],
  U_ECO,
)
receivePO(po1, dayISO(8), U_ECO, {})

// PO-2 Brasseries du Maroc — bières & soft — livraison PARTIELLE sur Heineken (70 puis 30)
const po2 = makePO(
  'sup-brasseries',
  dayISO(20),
  [
    { name: 'Heineken', qty: 100 },
    { name: 'Corona 33 cl', qty: 60 },
    { name: 'Casablanca', qty: 120 },
    { name: 'Coca-Cola', qty: 120 },
    { name: 'Perrier', qty: 60 },
    { name: 'Red Bull', qty: 48 },
  ],
  U_ECO,
)
receivePO(po2, dayISO(25), U_ECO2, { Heineken: 70, 'Corona 33 cl': 60, Casablanca: 120, 'Coca-Cola': 120, Perrier: 60, 'Red Bull': 48 })
receivePO(po2, dayISO(33), U_ECO2, { Heineken: 30 })

// PO-3 Ferme Bio Souss — produits Cuisine — réception complète
const po3 = makePO(
  'sup-ferme',
  dayISO(15),
  [
    { name: 'Tomates', qty: 30 },
    { name: 'Pommes de terre', qty: 50 },
    { name: 'Poulet', qty: 25 },
    { name: "Huile d'olive", qty: 10 },
    { name: 'Citron', qty: 15 },
  ],
  U_ECO,
)
receivePO(po3, dayISO(18), U_ECO, {})

// PO-4 Boucherie Centrale — Poulet — EN ATTENTE DE RÉCEPTION (histoire cachée : rupture annoncée)
makePO('sup-boucherie', dayISO(38), [{ name: 'Poulet', qty: 25 }], U_ECO)

// retour fournisseur (bouteille défectueuse) juste après la réception Diageo
applyMovement({
  date: dayISO(9),
  productId: byName('Jameson').id,
  location: 'economat',
  type: 'retour_fournisseur',
  delta: -1,
  unit: 'bouteille',
  userId: U_ECO,
  documentRef: po1.id,
  comment: 'Bouteille fuyante renvoyée au fournisseur Diageo Maroc Distribution',
  unitCost: KNOWN_COSTS['Jameson'],
})

// ---------- 3. Bons de prélèvement ----------
export const REQUISITIONS: RequisitionOrder[] = []
let reqSeq = 1
const nextReqId = () => `BP-${String(reqSeq++).padStart(4, '0')}`

function deliverItems(
  sellLoc: 'bar' | 'cuisine',
  date: string,
  userId: string,
  items: { name: string; qty: number }[],
  refId: string,
) {
  for (const it of items) {
    const prod = byName(it.name)
    applyMovement({
      date,
      productId: prod.id,
      location: 'economat',
      type: sellLoc === 'bar' ? 'transfert_bar' : 'transfert_cuisine',
      delta: -it.qty,
      unit: prod.storageUnit,
      userId,
      documentRef: refId,
      comment: `Transfert vers ${sellLoc === 'bar' ? 'le Bar' : 'la Cuisine'}`,
      unitCost: cump[prod.id],
    })
    applyMovement({
      date,
      productId: prod.id,
      location: sellLoc,
      type: sellLoc === 'bar' ? 'transfert_bar' : 'transfert_cuisine',
      delta: it.qty,
      unit: prod.storageUnit,
      userId,
      documentRef: refId,
      comment: `Réception en provenance de l'Économat`,
      unitCost: cump[prod.id],
    })
  }
}

// R-1 Bar — livrée intégralement
{
  const items = [
    { name: 'Jameson', qty: 4 },
    { name: 'Absolut', qty: 4 },
    { name: 'Tanqueray', qty: 4 },
    { name: 'Campari', qty: 3 },
    { name: 'Heineken', qty: 48 },
  ]
  const id = nextReqId()
  deliverItems('bar', dayISO(11), U_ECO, items, id)
  REQUISITIONS.push({
    id,
    requestingLocation: 'bar',
    requestedBy: U_BAR,
    date: dayISO(10),
    comment: 'Réassort hebdomadaire',
    items: items.map((it) => ({ productId: byName(it.name).id, qtyRequested: it.qty, qtyPrepared: it.qty, qtyDelivered: it.qty, unit: byName(it.name).storageUnit })),
    status: 'livre',
    history: [
      { date: dayISO(10), status: 'en_attente', userId: U_BAR },
      { date: dayISO(10, 14), status: 'en_preparation', userId: U_ECO },
      { date: dayISO(11), status: 'livre', userId: U_ECO },
    ],
  })
}

// R-2 Cuisine — livrée intégralement
{
  const items = [
    { name: 'Tomates', qty: 10 },
    { name: 'Pommes de terre', qty: 15 },
    { name: 'Poulet', qty: 8 },
    { name: "Huile d'olive", qty: 3 },
    { name: 'Citron', qty: 5 },
  ]
  const id = nextReqId()
  deliverItems('cuisine', dayISO(20), U_ECO, items, id)
  REQUISITIONS.push({
    id,
    requestingLocation: 'cuisine',
    requestedBy: U_CUISINE,
    date: dayISO(19),
    comment: 'Réassort hebdomadaire',
    items: items.map((it) => ({ productId: byName(it.name).id, qtyRequested: it.qty, qtyPrepared: it.qty, qtyDelivered: it.qty, unit: byName(it.name).storageUnit })),
    status: 'livre',
    history: [
      { date: dayISO(19), status: 'en_attente', userId: U_CUISINE },
      { date: dayISO(19, 15), status: 'en_preparation', userId: U_ECO },
      { date: dayISO(20), status: 'livre', userId: U_ECO },
    ],
  })
}

// R-3 Bar — livraison partielle sur Heineken (stock Économat insuffisant), complétée après réception PO-2
{
  const id = nextReqId()
  const requested = [
    { name: 'Heineken', qty: 100 },
    { name: 'Corona 33 cl', qty: 40 },
    { name: 'Perrier', qty: 40 },
    { name: 'Red Bull', qty: 24 },
  ]
  // 1ère préparation t=28 : Heineken limité au disponible (70)
  deliverItems('bar', dayISO(28), U_ECO, [
    { name: 'Heineken', qty: 70 },
    { name: 'Corona 33 cl', qty: 40 },
    { name: 'Perrier', qty: 40 },
    { name: 'Red Bull', qty: 24 },
  ], id)
  // complément après réception du solde Heineken (t=33)
  deliverItems('bar', dayISO(35), U_ECO2, [{ name: 'Heineken', qty: 30 }], id)
  REQUISITIONS.push({
    id,
    requestingLocation: 'bar',
    requestedBy: U_BAR2,
    date: dayISO(27),
    comment: "Réassort avant soirée à forte affluence",
    items: requested.map((it) => ({ productId: byName(it.name).id, qtyRequested: it.qty, qtyPrepared: it.qty, qtyDelivered: it.qty, unit: byName(it.name).storageUnit })),
    status: 'livre',
    history: [
      { date: dayISO(27), status: 'en_attente', userId: U_BAR2 },
      { date: dayISO(28), status: 'partiellement_livre', userId: U_ECO, comment: 'Heineken limité à 70 unités (stock central insuffisant)' },
      { date: dayISO(35), status: 'livre', userId: U_ECO2, comment: 'Solde Heineken livré après réception fournisseur' },
    ],
  })
}

// R-4 Bar — rejetée
{
  const id = nextReqId()
  REQUISITIONS.push({
    id,
    requestingLocation: 'bar',
    requestedBy: U_BAR,
    date: dayISO(14),
    comment: 'Demande pour événement privé',
    items: [{ productId: byName('Zacapa 23').id, qtyRequested: 10, qtyPrepared: 0, qtyDelivered: 0, unit: 'bouteille' }],
    status: 'rejete',
    history: [
      { date: dayISO(14), status: 'en_attente', userId: U_BAR },
      {
        date: dayISO(15),
        status: 'rejete',
        userId: U_ECO,
        comment: 'Quantité disproportionnée au regard du stock Cristal disponible — à reconfirmer avec la Direction',
      },
    ],
  })
}

// R-5 Cuisine — livraison PARTIELLE non résolue (Poulet en rupture, réapprovisionnement attendu via PO-4)
{
  const id = nextReqId()
  const requested = [
    { name: 'Poulet', qty: 15 },
    { name: "Huile d'olive", qty: 5 },
  ]
  deliverItems('cuisine', dayISO(41), U_ECO, [
    { name: 'Poulet', qty: Math.min(8, balances.economat[byName('Poulet').id]) },
    { name: "Huile d'olive", qty: 5 },
  ], id)
  REQUISITIONS.push({
    id,
    requestingLocation: 'cuisine',
    requestedBy: U_CUISINE,
    date: dayISO(40),
    comment: 'Réassort avant le week-end',
    items: requested.map((it) => ({ productId: byName(it.name).id, qtyRequested: it.qty, qtyPrepared: it.qty, qtyDelivered: it.name === 'Poulet' ? Math.min(8, it.qty) : it.qty, unit: byName(it.name).storageUnit })),
    status: 'partiellement_livre',
    history: [
      { date: dayISO(40), status: 'en_attente', userId: U_CUISINE },
      { date: dayISO(41), status: 'partiellement_livre', userId: U_ECO, comment: 'Poulet limité au stock disponible — solde en attente de réception fournisseur (BC-0004)' },
    ],
  })
}

// R-6 Bar — en attente (fraîche)
REQUISITIONS.push({
  id: nextReqId(),
  requestingLocation: 'bar',
  requestedBy: U_BAR,
  date: dayISO(43),
  comment: 'Réassort soft drinks',
  items: [
    { productId: byName('Red Bull').id, qtyRequested: 24, qtyPrepared: 0, qtyDelivered: 0, unit: 'unite' },
    { productId: byName('Perrier').id, qtyRequested: 24, qtyPrepared: 0, qtyDelivered: 0, unit: 'unite' },
  ],
  status: 'en_attente',
  history: [{ date: dayISO(43), status: 'en_attente', userId: U_BAR }],
})

// R-7 Cuisine — en préparation
REQUISITIONS.push({
  id: nextReqId(),
  requestingLocation: 'cuisine',
  requestedBy: U_CUISINE,
  date: dayISO(44),
  comment: '',
  items: [
    { productId: byName('Citron').id, qtyRequested: 5, qtyPrepared: 0, qtyDelivered: 0, unit: 'kg' },
    { productId: byName('Tomates').id, qtyRequested: 8, qtyPrepared: 0, qtyDelivered: 0, unit: 'kg' },
  ],
  status: 'en_preparation',
  history: [
    { date: dayISO(44), status: 'en_attente', userId: U_CUISINE },
    { date: dayISO(44, 16), status: 'en_preparation', userId: U_ECO2 },
  ],
})

// R-8 Bar — brouillon (non soumise)
REQUISITIONS.push({
  id: nextReqId(),
  requestingLocation: 'bar',
  requestedBy: U_BAR2,
  date: dayISO(45),
  comment: 'Préparation soirée dégustation whisky',
  items: [{ productId: byName('Chivas 18 ans').id, qtyRequested: 2, qtyPrepared: 0, qtyDelivered: 0, unit: 'bouteille' }],
  status: 'brouillon',
  history: [{ date: dayISO(45), status: 'brouillon', userId: U_BAR2 }],
})

// ---------- 4. Ventes simulées (consommation courante) ----------
for (let d = 1; d <= 45; d++) {
  for (const name of ACTIVE) {
    const p = byName(name)
    const isCuisine = p.location === 'cuisine'
    const loc: StockLocationId = isCuisine ? 'cuisine' : 'bar'
    if (rand() > (isCuisine ? 0.55 : 0.4)) continue
    const stock = balances[loc][p.id]
    if (stock <= 0) continue
    const base = p.categoryId === 'bieres' ? int(2, 8) : p.categoryId === 'eaux-soft' ? int(2, 10) : isCuisine ? int(1, 3) : int(1, 2)
    const qty = Math.min(stock, base)
    if (qty <= 0) continue
    applyMovement({
      date: dayISO(d, 12 + int(0, 10), int(0, 59)),
      productId: p.id,
      location: loc,
      type: 'vente',
      delta: -qty,
      unit: p.storageUnit,
      userId: isCuisine ? pick([U_CUISINE, 'u-cuisine-2']) : pick([U_BAR, U_BAR2]),
      comment: 'Vente service',
      unitCost: cump[p.id],
    })
  }
}

// Réassorts périodiques — ramènent la plupart des références vers leur stock cible, pour
// refléter une exploitation normale. Chivas 18 ans (Bar) et Poulet (Cuisine) en sont volontairement
// exclus : ce sont les deux histoires de rupture mises en avant sur le tableau de bord.
const REPLENISH_BAR = ACTIVE_BAR.filter((n) => n !== 'Chivas 18 ans')
const REPLENISH_CUISINE = ACTIVE_CUISINE.filter((n) => n !== 'Poulet')
for (const day of [12, 24, 36]) {
  for (const name of [...REPLENISH_BAR, ...REPLENISH_CUISINE]) {
    const p = byName(name)
    const isCuisine = p.location === 'cuisine'
    const loc: StockLocationId = isCuisine ? 'cuisine' : 'bar'
    const target = p.targetStock || p.minStock * 2 || 4
    const current = balances[loc][p.id]
    if (current >= target) continue
    const qty = Math.min(target - current, balances.economat[p.id])
    if (qty <= 0) continue
    const type = isCuisine ? 'transfert_cuisine' : 'transfert_bar'
    applyMovement({ date: dayISO(day, 7, 30), productId: p.id, location: 'economat', type, delta: -qty, unit: p.storageUnit, userId: U_ECO, documentRef: 'REASSORT-PERIODIQUE', comment: 'Réassort périodique', unitCost: cump[p.id] })
    applyMovement({ date: dayISO(day, 7, 45), productId: p.id, location: loc, type, delta: qty, unit: p.storageUnit, userId: U_ECO, documentRef: 'REASSORT-PERIODIQUE', comment: 'Réassort périodique', unitCost: cump[p.id] })
  }
}

// ajustement d'inventaire ponctuel (écart positif constaté au comptage)
applyMovement({
  date: dayISO(29, 23, 10),
  productId: byName("Hendrick's").id,
  location: 'bar',
  type: 'ajustement_inventaire',
  delta: 1,
  unit: 'bouteille',
  userId: U_BAR,
  comment: "Écart d'inventaire constaté lors du comptage hebdomadaire — correction positive",
})

// ---------- 5. Sorties hors-vente ----------
export const OUTFLOWS: NonSalesOutflow[] = []
let outSeq = 1
const nextOutId = () => `SHV-${String(outSeq++).padStart(4, '0')}`

function declareOutflow(opts: {
  name: string
  location: 'bar' | 'cuisine'
  qty: number
  reason: OutflowReason
  comment?: string
  declaredBy: string
  date: string
}): NonSalesOutflow {
  const prod = byName(opts.name)
  return {
    id: nextOutId(),
    productId: prod.id,
    quantity: opts.qty,
    unit: prod.storageUnit,
    reason: opts.reason,
    comment: opts.comment,
    location: opts.location,
    declaredBy: opts.declaredBy,
    date: opts.date,
    status: 'en_attente',
  }
}

function validateOutflow(o: NonSalesOutflow, date: string, validatedBy: string) {
  const prod = productById(o.productId)!
  const unitCostAtValidation = cump[o.productId]
  const mv = applyMovement({
    date,
    productId: o.productId,
    location: o.location,
    type: 'sortie_hors_vente_validee',
    delta: -o.quantity,
    unit: prod.storageUnit,
    userId: validatedBy,
    documentRef: o.id,
    comment: `Sortie hors-vente validée (${o.reason})`,
    unitCost: unitCostAtValidation,
  })
  o.status = 'acceptee'
  o.validatedBy = validatedBy
  o.validatedDate = date
  o.movementId = mv.id
  o.unitCostAtValidation = unitCostAtValidation
  o.value = mv.value
}

function rejectOutflow(o: NonSalesOutflow, date: string, validatedBy: string, reason: string) {
  o.status = 'rejetee'
  o.validatedBy = validatedBy
  o.validatedDate = date
  o.rejectionReason = reason
}

{
  const o1 = declareOutflow({ name: 'Casablanca Citron', location: 'bar', qty: 3, reason: 'casse', comment: 'Verres renversés au service', declaredBy: U_BAR, date: dayISO(12) })
  validateOutflow(o1, dayISO(13), U_ADMIN)
  OUTFLOWS.push(o1)

  const o2 = declareOutflow({ name: 'Heineken', location: 'bar', qty: 6, reason: 'consommation_personnel', comment: 'Dégustation formation équipe', declaredBy: U_BAR2, date: dayISO(16) })
  validateOutflow(o2, dayISO(17), U_ADMIN)
  OUTFLOWS.push(o2)

  const o3 = declareOutflow({ name: 'Tomates', location: 'cuisine', qty: 2, reason: 'produit_perime', declaredBy: U_CUISINE, date: dayISO(21) })
  validateOutflow(o3, dayISO(22), U_ADMIN)
  OUTFLOWS.push(o3)

  const o4 = declareOutflow({ name: 'Jameson', location: 'bar', qty: 1, reason: 'casse', comment: 'Bouteille brisée pendant le service', declaredBy: U_BAR, date: dayISO(24) })
  validateOutflow(o4, dayISO(25), U_ADMIN)
  OUTFLOWS.push(o4)

  const o5 = declareOutflow({ name: "Huile d'olive", location: 'cuisine', qty: 1, reason: 'perte', comment: 'Fuite du bidon en réserve', declaredBy: 'u-cuisine-2', date: dayISO(30) })
  validateOutflow(o5, dayISO(31), U_ADMIN)
  OUTFLOWS.push(o5)

  const o6 = declareOutflow({ name: 'Campari', location: 'bar', qty: 1, reason: 'produit_offert', comment: 'Offert à un client fidèle', declaredBy: U_BAR, date: dayISO(36) })
  validateOutflow(o6, dayISO(37), U_ADMIN)
  OUTFLOWS.push(o6)

  const o7 = declareOutflow({ name: 'Chivas 18 ans', location: 'bar', qty: 1, reason: 'casse', comment: 'Chute accidentelle en réserve', declaredBy: U_BAR2, date: dayISO(40) })
  rejectOutflow(o7, dayISO(41), U_ADMIN, 'Déclaration non justifiée : aucun incident constaté au service, à reconfirmer avec le responsable de salle.')
  OUTFLOWS.push(o7)

  const o8 = declareOutflow({ name: 'Poulet', location: 'cuisine', qty: 3, reason: 'autre', comment: 'Écart constaté à l\'inventaire hebdomadaire, cause non déterminée', declaredBy: U_CUISINE, date: dayISO(42) })
  OUTFLOWS.push(o8) // reste en_attente

  const o9 = declareOutflow({ name: 'Red Bull', location: 'bar', qty: 12, reason: 'consommation_personnel', declaredBy: U_BAR, date: dayISO(44) })
  OUTFLOWS.push(o9) // reste en_attente

  const o10 = declareOutflow({ name: "Tito's", location: 'bar', qty: 1, reason: 'casse', declaredBy: U_BAR2, date: dayISO(33) })
  validateOutflow(o10, dayISO(34), U_ADMIN)
  OUTFLOWS.push(o10)

  const o11 = declareOutflow({ name: 'Citron', location: 'cuisine', qty: 2, reason: 'perte', declaredBy: U_CUISINE, date: dayISO(38) })
  validateOutflow(o11, dayISO(39), U_ADMIN)
  OUTFLOWS.push(o11)

  const o12 = declareOutflow({ name: 'Corona 33 cl', location: 'bar', qty: 5, reason: 'produit_perime', declaredBy: U_BAR, date: dayISO(8) })
  validateOutflow(o12, dayISO(9), U_ADMIN)
  OUTFLOWS.push(o12)

  // Simulation concrète d'une vente en doses : Glenmorangie 15 ans
  // Initialement 1 bouteille au Bar (15 doses) -> Vente de 10 doses (0.667 btl) sur Ticket Z clôture
  // Reste : 0 btl pleine + 5 doses (0.333 btl)
  const glen15 = byName('Glenmorangie 15 ans')
  balances.bar[glen15.id] = 1.0 // S'assure que le Bar avait 1 bouteille pleine (15 doses)
  applyMovement({
    date: dayISO(45, 23, 45),
    productId: glen15.id,
    location: 'bar',
    type: 'vente',
    delta: -0.6667, // -10 doses sur 15
    unit: 'bouteille',
    userId: U_BAR,
    documentRef: 'Z-20261010-045',
    comment: 'Ticket Z caisse de clôture : Vente de 10 doses (50 cl)',
    fineDetail: '-10 doses (soit 50 cl déduits)',
    unitCost: cump[glen15.id] ?? 260,
  })
}

// ---------- exports ----------
movements.sort((a, b) => a.date.localeCompare(b.date))
export const MOVEMENTS = movements
export const BALANCES = balances
export const CUMP = cump
export const REAL_STOCKS: Record<StockLocationId, Record<string, number>> = { economat: {}, bar: {}, cuisine: {} }
export const THEORETICAL_STOCKS: Record<StockLocationId, Record<string, number>> = { economat: {}, bar: {}, cuisine: {} }
for (const p of PRODUCTS) {
  REAL_STOCKS.economat[p.id] = balances.economat[p.id] ?? 0
  REAL_STOCKS.bar[p.id] = balances.bar[p.id] ?? 0
  REAL_STOCKS.cuisine[p.id] = balances.cuisine[p.id] ?? 0
  THEORETICAL_STOCKS.economat[p.id] = balances.economat[p.id] ?? 0
  THEORETICAL_STOCKS.bar[p.id] = balances.bar[p.id] ?? 0
  THEORETICAL_STOCKS.cuisine[p.id] = balances.cuisine[p.id] ?? 0
}
export const SUPPLIERS_REF = SUPPLIERS
export const USERS_REF = USERS
