// Modèle de données HABANERA — types partagés par le générateur, les écrans et le moteur IA.

export type Role = 'admin' | 'economat' | 'bar' | 'cuisine'

export interface Persona {
  id: Role
  name: string
  roleLabel: string
  initials: string
  home: string
  scope: string[]
  color: string
}

export type StockLocationId = 'economat' | 'bar' | 'cuisine'

export type ProductCategoryId =
  | 'cristal'
  | 'gins-premium'
  | 'whisky-rhum'
  | 'vodka-tequila'
  | 'gin'
  | 'aperitifs-digestifs'
  | 'cocktails-signature'
  | 'classiques-premium'
  | 'mocktails'
  | 'eaux-soft'
  | 'bieres'
  | 'cuisine-demo'

export interface ProductCategory {
  id: ProductCategoryId
  label: string
  location: 'bar' | 'cuisine'
}

export type UnitId = 'bouteille' | 'ml' | 'verre' | 'unite' | 'kg' | 'l' | 'piece'

export interface PriceFormat {
  label: string
  price: number | null
}

export interface Product {
  id: string
  name: string
  categoryId: ProductCategoryId
  location: 'bar' | 'cuisine'
  storageUnit: UnitId
  saleUnit: UnitId
  bottleVolumeMl?: number
  servingMl?: number
  bucketOf5?: boolean
  priceFormats: PriceFormat[]
  costPrice: number | null
  minStock: number
  targetStock: number
  active: boolean
  countingFrequency: 'quotidien' | 'hebdomadaire'
}

export type MovementType =
  | 'entree_fournisseur'
  | 'transfert_bar'
  | 'transfert_cuisine'
  | 'retour_stock_central'
  | 'vente'
  | 'sortie_hors_vente_validee'
  | 'ajustement_inventaire'
  | 'retour_fournisseur'

export interface StockMovement {
  id: string
  date: string
  productId: string
  location: StockLocationId
  type: MovementType
  quantity: number
  unit: UnitId
  stockBefore: number
  stockAfter: number
  userId: string
  documentRef?: string
  comment?: string
  unitCost: number | null
  value: number | null
}

export type RequisitionStatus = 'brouillon' | 'en_attente' | 'en_preparation' | 'partiellement_livre' | 'livre' | 'rejete'

export interface RequisitionItem {
  productId: string
  qtyRequested: number
  qtyPrepared: number
  qtyDelivered: number
  unit: UnitId
}

export interface RequisitionHistoryEntry {
  date: string
  status: RequisitionStatus
  userId: string
  comment?: string
}

export interface RequisitionOrder {
  id: string
  requestingLocation: 'bar' | 'cuisine'
  requestedBy: string
  date: string
  items: RequisitionItem[]
  comment?: string
  status: RequisitionStatus
  history: RequisitionHistoryEntry[]
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  city: string
}

export type PurchaseOrderStatus = 'brouillon' | 'envoyee' | 'partiellement_recue' | 'receptionnee' | 'annulee'

export interface PurchaseOrderItem {
  productId: string
  qtyOrdered: number
  unitCost: number | null
  qtyReceived: number
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  date: string
  items: PurchaseOrderItem[]
  status: PurchaseOrderStatus
  createdBy: string
}

export interface GoodsReceiptItem {
  productId: string
  qtyReceived: number
  unitCost: number | null
}

export interface GoodsReceipt {
  id: string
  purchaseOrderId: string
  date: string
  items: GoodsReceiptItem[]
  receivedBy: string
}

export type OutflowReason = 'casse' | 'perte' | 'consommation_personnel' | 'produit_offert' | 'produit_perime' | 'autre'
export type OutflowStatus = 'en_attente' | 'acceptee' | 'rejetee'

export interface NonSalesOutflow {
  id: string
  productId: string
  quantity: number
  unit: UnitId
  reason: OutflowReason
  comment?: string
  location: 'bar' | 'cuisine'
  declaredBy: string
  date: string
  status: OutflowStatus
  validatedBy?: string
  validatedDate?: string
  rejectionReason?: string
  movementId?: string
  unitCostAtValidation?: number | null
  value?: number | null
}

export interface StockAlert {
  id: string
  productId: string
  location: StockLocationId
  currentQty: number
  minStock: number
  date: string
}

export interface AppUser {
  id: string
  name: string
  role: Role
  initials: string
}
