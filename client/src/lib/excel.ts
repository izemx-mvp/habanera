// Utilitaire d'import / export Excel (.xlsx) pour HABANERA ERP
import type { ProductCategoryId, UnitId } from '@/data/types'
import { CATEGORIES } from '@/data/catalog'

declare global {
  interface Window {
    XLSX?: any
  }
}

export interface ExcelProductRow {
  name: string
  location: 'bar' | 'cuisine'
  categoryId: ProductCategoryId
  categoryLabel?: string
  storageUnit: UnitId
  saleUnit: UnitId
  price: number | null
  costPrice: number | null
  initialStock: number
  minStock: number
  targetStock: number
}

// Assure que SheetJS est chargé
export async function ensureXLSX(): Promise<any> {
  if (typeof window !== 'undefined' && window.XLSX) {
    return window.XLSX
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="xlsx"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.XLSX))
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    script.onload = () => resolve(window.XLSX)
    script.onerror = () => reject(new Error('Impossible de charger la bibliothèque SheetJS.'))
    document.head.appendChild(script)
  })
}

function normalizeKey(k: string): string {
  return k
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function mapCategory(val: string, location: 'bar' | 'cuisine'): ProductCategoryId {
  const norm = normalizeKey(val || '')
  if (norm.includes('biere') || norm.includes('beer')) return 'bieres'
  if (norm.includes('cristal')) return 'cristal'
  if (norm.includes('ginpremium')) return 'gins-premium'
  if (norm.includes('whisky') || norm.includes('rhum') || norm.includes('rum')) return 'whisky-rhum'
  if (norm.includes('vodka') || norm.includes('tequila')) return 'vodka-tequila'
  if (norm.includes('gin')) return 'gin'
  if (norm.includes('aperitif') || norm.includes('digestif')) return 'aperitifs-digestifs'
  if (norm.includes('signature')) return 'cocktails-signature'
  if (norm.includes('classique')) return 'classiques-premium'
  if (norm.includes('mocktail') || norm.includes('sansalcool')) return 'mocktails'
  if (norm.includes('eau') || norm.includes('soft') || norm.includes('soda')) return 'eaux-soft'
  if (norm.includes('cuisine') || norm.includes('nourriture') || norm.includes('ingredient')) return 'cuisine-demo'

  const matched = CATEGORIES.find((c) => normalizeKey(c.label).includes(norm))
  if (matched) return matched.id

  return location === 'bar' ? 'bieres' : 'cuisine-demo'
}

function mapUnit(val: string, location: 'bar' | 'cuisine'): UnitId {
  const norm = normalizeKey(val || '')
  if (norm.includes('bouteille') || norm.includes('btl')) return 'bouteille'
  if (norm.includes('verre') || norm.includes('shot')) return 'verre'
  if (norm.includes('kg') || norm.includes('kilo')) return 'kg'
  if (norm.includes('litre') || norm === 'l') return 'l'
  if (norm.includes('piece') || norm.includes('pc')) return 'piece'
  if (norm.includes('ml')) return 'ml'
  return location === 'bar' ? 'bouteille' : 'kg'
}

export async function parseExcelFile(file: File, defaultLocation?: 'bar' | 'cuisine'): Promise<ExcelProductRow[]> {
  const XLSX = await ensureXLSX()
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error('Le document Excel est vide.')

  const worksheet = workbook.Sheets[firstSheetName]
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Aucune ligne de produit trouvée dans la feuille.')
  }

  const products: ExcelProductRow[] = []

  for (const raw of rawRows) {
    const keys = Object.keys(raw)
    const normalizedMap: Record<string, any> = {}
    for (const k of keys) {
      normalizedMap[normalizeKey(k)] = raw[k]
    }

    const name =
      normalizedMap['nom'] ||
      normalizedMap['nomduproduit'] ||
      normalizedMap['produit'] ||
      normalizedMap['designation'] ||
      normalizedMap['libelle'] ||
      normalizedMap['article'] ||
      ''

    if (!String(name).trim()) continue

    const locRaw = String(
      normalizedMap['service'] ||
        normalizedMap['emplacement'] ||
        normalizedMap['departement'] ||
        normalizedMap['lieu'] ||
        defaultLocation ||
        'bar',
    ).toLowerCase()

    const location: 'bar' | 'cuisine' = locRaw.includes('cuis') ? 'cuisine' : 'bar'

    const catRaw = String(normalizedMap['categorie'] || normalizedMap['famille'] || normalizedMap['rayon'] || '')
    const categoryId = mapCategory(catRaw, location)

    const unitRaw = String(normalizedMap['unite'] || normalizedMap['unitedestockage'] || normalizedMap['cond'] || '')
    const storageUnit = mapUnit(unitRaw, location)
    const saleUnit = storageUnit

    const priceRaw = normalizedMap['prix'] || normalizedMap['prixdevente'] || normalizedMap['pv'] || normalizedMap['prixunitaire']
    const price = priceRaw !== '' && !isNaN(Number(priceRaw)) ? Number(priceRaw) : null

    const costRaw = normalizedMap['cout'] || normalizedMap['prixdachat'] || normalizedMap['pa'] || normalizedMap['cump']
    const costPrice = costRaw !== '' && !isNaN(Number(costRaw)) ? Number(costRaw) : null

    const stockRaw = normalizedMap['stock'] || normalizedMap['stockactuel'] || normalizedMap['stockinitial'] || normalizedMap['quantite'] || 0
    const initialStock = !isNaN(Number(stockRaw)) ? Math.max(0, Number(stockRaw)) : 0

    const minRaw = normalizedMap['seuil'] || normalizedMap['seuilmin'] || normalizedMap['stockmin'] || normalizedMap['seuilminimum'] || 2
    const minStock = !isNaN(Number(minRaw)) ? Math.max(0, Number(minRaw)) : 2

    const targetRaw = normalizedMap['cible'] || normalizedMap['stockcible'] || normalizedMap['stockmax'] || 6
    const targetStock = !isNaN(Number(targetRaw)) ? Math.max(minStock, Number(targetRaw)) : Math.max(minStock, 6)

    products.push({
      name: String(name).trim(),
      location,
      categoryId,
      storageUnit,
      saleUnit,
      price,
      costPrice,
      initialStock,
      minStock,
      targetStock,
    })
  }

  return products
}

export async function downloadExcelTemplate(location?: 'bar' | 'cuisine') {
  const XLSX = await ensureXLSX()
  const data = [
    {
      'Nom du produit': location === 'cuisine' ? 'Filet de Bœuf' : 'Gin Bombay Sapphire',
      Service: location === 'cuisine' ? 'Cuisine' : 'Bar',
      Catégorie: location === 'cuisine' ? 'Produits de démonstration' : 'Gins Premium',
      Unité: location === 'cuisine' ? 'kg' : 'bouteille',
      'Prix de vente (MAD)': location === 'cuisine' ? '' : 120,
      'Coût achat (MAD)': location === 'cuisine' ? 140 : 190,
      'Stock initial': 12,
      'Seuil minimum': 3,
      'Stock cible': 15,
    },
    {
      'Nom du produit': location === 'cuisine' ? 'Saumon Frais' : 'Rhum Diplomatico Reserva',
      Service: location === 'cuisine' ? 'Cuisine' : 'Bar',
      Catégorie: location === 'cuisine' ? 'Produits de démonstration' : 'Whisky / Rhum',
      Unité: location === 'cuisine' ? 'kg' : 'bouteille',
      'Prix de vente (MAD)': location === 'cuisine' ? '' : 140,
      'Coût achat (MAD)': location === 'cuisine' ? 160 : 280,
      'Stock initial': 8,
      'Seuil minimum': 2,
      'Stock cible': 10,
    },
    {
      'Nom du produit': location === 'cuisine' ? 'Fromage Mozzarella Di Bufala' : 'Bière Stella Artois',
      Service: location === 'cuisine' ? 'Cuisine' : 'Bar',
      Catégorie: location === 'cuisine' ? 'Produits de démonstration' : 'Bières / Beer',
      Unité: location === 'cuisine' ? 'kg' : 'unite',
      'Prix de vente (MAD)': location === 'cuisine' ? '' : 45,
      'Coût achat (MAD)': location === 'cuisine' ? 85 : 13,
      'Stock initial': 48,
      'Seuil minimum': 24,
      'Stock cible': 96,
    },
  ]

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Modèle Produits')
  const filename = `modele_import_produits_${location || 'habanera'}.xlsx`
  XLSX.writeFile(wb, filename)
}

export interface ExcelZRow {
  productName: string
  quantitySold: number
  unitType: 'verre' | 'bouteille' | 'portion' | 'unite'
  unitPrice: number | null
  totalRevenue: number | null
  date?: string
}

export async function parseZExcelFile(file: File): Promise<ExcelZRow[]> {
  const XLSX = await ensureXLSX()
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

  const results: ExcelZRow[] = []

  for (const raw of rawRows) {
    const keys = Object.keys(raw)
    const findVal = (terms: string[]) => {
      const match = keys.find((k) => {
        const norm = normalizeKey(k)
        return terms.some((t) => norm.includes(t))
      })
      return match ? raw[match] : null
    }

    const name = String(findVal(['produit', 'article', 'nom', 'designation', 'libelle', 'item']) || '').trim()
    if (!name) continue

    const qtyVal = Number(findVal(['qte', 'quantite', 'vendue', 'nbre', 'ventes', 'qty', 'vendu'])) || 0
    if (qtyVal <= 0) continue

    const unitStr = String(findVal(['unite', 'format', 'type', 'portion']) || '').toLowerCase()
    let unitType: 'verre' | 'bouteille' | 'portion' | 'unite' = 'unite'
    if (unitStr.includes('verre') || unitStr.includes('dose') || unitStr.includes('shot')) {
      unitType = 'verre'
    } else if (unitStr.includes('bouteille') || unitStr.includes('btl')) {
      unitType = 'bouteille'
    } else if (unitStr.includes('portion')) {
      unitType = 'portion'
    }

    const price = Number(findVal(['prix', 'pu', 'tarif', 'unitaire'])) || null
    const revenue = Number(findVal(['total', 'recette', 'ca', 'chiffre', 'montant'])) || (price ? price * qtyVal : null)
    const dateStr = String(findVal(['date', 'jour', 'heure']) || '').trim() || undefined

    results.push({
      productName: name,
      quantitySold: qtyVal,
      unitType,
      unitPrice: price,
      totalRevenue: revenue,
      date: dateStr,
    })
  }

  return results
}

export async function downloadZTemplate(): Promise<void> {
  const XLSX = await ensureXLSX()
  const data = [
    {
      'Nom du produit': 'Casablanca',
      'Quantité vendue': 14,
      'Unité / Format': 'bouteille',
      'Prix unitaire (MAD)': 45,
      'Total Ventes (MAD)': 630,
    },
    {
      'Nom du produit': 'Heineken',
      'Quantité vendue': 22,
      'Unité / Format': 'bouteille',
      'Prix unitaire (MAD)': 45,
      'Total Ventes (MAD)': 990,
    },
    {
      'Nom du produit': 'Gin Bombay Sapphire',
      'Quantité vendue': 18,
      'Unité / Format': 'verre',
      'Prix unitaire (MAD)': 90,
      'Total Ventes (MAD)': 1620,
    },
    {
      'Nom du produit': 'Jameson',
      'Quantité vendue': 12,
      'Unité / Format': 'verre',
      'Prix unitaire (MAD)': 85,
      'Total Ventes (MAD)': 1020,
    },
    {
      'Nom du produit': 'Red Bull',
      'Quantité vendue': 8,
      'Unité / Format': 'unite',
      'Prix unitaire (MAD)': 50,
      'Total Ventes (MAD)': 400,
    },
  ]

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ticket Z Journée')
  XLSX.writeFile(wb, 'modele_import_ticket_z_caisse.xlsx')
}
