// Catalogue HABANERA — repris de la carte du Bar fournie par le client et des produits de
// démonstration Cuisine. Aucun prix n'étant lisible sur la carte transmise, tous les prix de
// vente et coûts d'achat sont "Non renseignés" (null) : à saisir par l'Économat ou l'Administrateur.
import type { Product, ProductCategory, ProductCategoryId } from './types'

export const CATEGORIES: ProductCategory[] = [
  { id: 'cristal', label: 'Sélection Cristal', location: 'bar' },
  { id: 'gins-premium', label: 'Gins Premium', location: 'bar' },
  { id: 'whisky-rhum', label: 'Whisky / Rhum', location: 'bar' },
  { id: 'vodka-tequila', label: 'Vodka / Tequila', location: 'bar' },
  { id: 'gin', label: 'Gin', location: 'bar' },
  { id: 'aperitifs-digestifs', label: 'Apéritifs / Digestifs', location: 'bar' },
  { id: 'cocktails-signature', label: 'Cocktails Signature', location: 'bar' },
  { id: 'classiques-premium', label: 'Classiques Premium', location: 'bar' },
  { id: 'mocktails', label: 'Mocktails', location: 'bar' },
  { id: 'eaux-soft', label: 'Eaux / Soft', location: 'bar' },
  { id: 'bieres', label: 'Bières / Beer', location: 'bar' },
  { id: 'cuisine-demo', label: 'Produits de démonstration', location: 'cuisine' },
]

export const CATEGORY_LABEL: Record<ProductCategoryId, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<ProductCategoryId, string>

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

let seq = 0
function spirit(name: string, categoryId: ProductCategoryId, opts: Partial<Product> = {}): Product {
  seq++
  return {
    id: `${slugify(name)}-${seq}`,
    name,
    categoryId,
    location: 'bar',
    storageUnit: 'bouteille',
    saleUnit: 'verre',
    bottleVolumeMl: 750,
    servingMl: 50,
    dosesPerBottle: 15,
    servingCl: 5,
    trackingMode: 'theorique',
    priceFormats: [
      { label: 'Verre', price: null },
      { label: 'Bouteille', price: null },
    ],
    costPrice: null,
    minStock: 2,
    targetStock: 6,
    active: true,
    countingFrequency: 'hebdomadaire',
    ...opts,
  }
}

function cocktail(name: string, categoryId: ProductCategoryId): Product {
  seq++
  return {
    id: `${slugify(name)}-${seq}`,
    name,
    categoryId,
    location: 'bar',
    storageUnit: 'verre',
    saleUnit: 'verre',
    priceFormats: [{ label: 'Verre', price: null }],
    costPrice: null,
    minStock: 0,
    targetStock: 0,
    active: true,
    countingFrequency: 'hebdomadaire',
  }
}

function soft(name: string, opts: Partial<Product> = {}): Product {
  seq++
  return {
    id: `${slugify(name)}-${seq}`,
    name,
    categoryId: 'eaux-soft',
    location: 'bar',
    storageUnit: 'unite',
    saleUnit: 'unite',
    packSize: 24,
    trackingMode: 'theorique',
    priceFormats: [{ label: 'Unité', price: null }],
    costPrice: null,
    minStock: 24,
    targetStock: 72,
    active: true,
    countingFrequency: 'hebdomadaire',
    ...opts,
  }
}

function beer(name: string, opts: Partial<Product> = {}): Product {
  seq++
  return {
    id: `${slugify(name)}-${seq}`,
    name,
    categoryId: 'bieres',
    location: 'bar',
    storageUnit: 'unite',
    saleUnit: 'unite',
    packSize: 24,
    trackingMode: 'theorique',
    bucketOf5: true,
    priceFormats: [
      { label: 'Unité', price: null },
      { label: 'Seau de 5', price: null },
    ],
    costPrice: null,
    minStock: 48,
    targetStock: 150,
    active: true,
    countingFrequency: 'hebdomadaire',
    ...opts,
  }
}

function kitchen(name: string, unit: 'kg' | 'l' | 'piece', minStock: number, targetStock: number): Product {
  seq++
  return {
    id: `${slugify(name)}-${seq}`,
    name,
    categoryId: 'cuisine-demo',
    location: 'cuisine',
    storageUnit: unit,
    saleUnit: unit,
    priceFormats: [{ label: unit === 'piece' ? 'Pièce' : unit, price: null }],
    costPrice: null,
    minStock,
    targetStock,
    active: true,
    countingFrequency: 'quotidien',
  }
}

export const PRODUCTS: Product[] = [
  // --- Sélection Cristal ---
  ...[
    'Glenmorangie 12 ans',
    'Glenmorangie 15 ans',
    'Johnnie Walker Gold',
    'Talisker 10 ans',
    'Mortlach',
    'Glenmorangie 18 ans',
    'Chivas 18 ans',
    'Zacapa 23',
  ].map((n) => spirit(n, 'cristal', { minStock: 1, targetStock: 3 })),

  // --- Gins Premium ---
  ...['Tanqueray Ten', "G'Vine Nouaison"].map((n) => spirit(n, 'gins-premium', { minStock: 1, targetStock: 4 })),

  // --- Whisky / Rhum ---
  ...[
    'Jameson',
    "Jack Daniel's Honey",
    'Bulleit',
    'J.W. Black',
    'Chivas 12',
    'J.W. Double Black',
    'Bacardi',
    'Negrita',
    'Cachaça',
  ].map((n) => spirit(n, 'whisky-rhum')),

  // --- Vodka / Tequila ---
  ...['Ketel One', "Tito's", 'Absolut', 'Belvedere', 'Cîroc', 'Chopin', 'Sierra Reposado'].map((n) =>
    spirit(n, 'vodka-tequila'),
  ),

  // --- Gin ---
  ...[
    'Tanqueray',
    'The Botanist',
    'Malfy',
    "G'Vine Floraison",
    "Hendrick's",
    'Tanqueray Sevilla',
    'Tanqueray Royale',
    'Ophir',
    'Drunken Horse',
    'Monkey 47',
  ].map((n) => spirit(n, 'gin')),

  // --- Apéritifs / Digestifs ---
  ...[
    'Ricard',
    'Martini',
    'Campari',
    'Rosso Antico',
    'Aperol Spritz',
    'Select Spritz',
    'Limoncello',
    'Sambuca',
    'Get 27',
    'Baileys Dark Chocolate',
    'Amaro Montenegro',
    'Jägermeister',
    'Fernet',
    'Cognac VS',
    'Cognac VSOP',
    'Cognac XO',
  ].map((n) => spirit(n, 'aperitifs-digestifs', { minStock: 1, targetStock: 4 })),

  // --- Cocktails Signature ---
  ...['Smoked Bourbon Habanera', 'Red Velvet Spritz', 'Tijuana Cartel', 'Maracaibo Passion'].map((n) =>
    cocktail(n, 'cocktails-signature'),
  ),

  // --- Classiques Premium ---
  ...[
    'Espresso Martini Signature',
    'Negroni Reserva',
    'Cosmopolitan',
    'Margarita Classica',
    'Aperol Spritz Habanera',
    'Bellini Veneziano',
    'London Mule',
    'Moscow Mule',
    'Mojito Habanera',
  ].map((n) => cocktail(n, 'classiques-premium')),

  // --- Mocktails ---
  ...['Habanera Sunset', 'Fire Passion 0%', 'Red Velvet 0%', 'Cucumber Fresh'].map((n) => cocktail(n, 'mocktails')),

  // --- Eaux / Soft ---
  soft('Sidi Ali'),
  soft('Oulmès'),
  soft('Perrier'),
  soft('Café Nespresso', { storageUnit: 'piece', saleUnit: 'piece', minStock: 50, targetStock: 150 }),
  soft('Coca-Cola'),
  soft('Fanta'),
  soft('Perrier Lemon'),
  soft('Red Bull', { minStock: 36, targetStock: 96 }),
  soft('Energy Drink', { minStock: 36, targetStock: 96 }),

  // --- Bières / Beer ---
  beer('Gold'),
  beer('Casablanca'),
  beer('Budweiser'),
  beer('Carlsberg'),
  beer('Heineken'),
  beer('Kronenbourg'),
  beer('Casablanca Citron'),
  beer('Bière 0.0%'),
  beer('Corona 33 cl'),
  beer('Guinness'),
  beer('Modelo'),
  beer('Leffe'),
  beer('Bière artisanale Kwak'),
  beer('Smirnoff Ice'),
  beer('Booster'),

  // --- Cuisine : produits de démonstration ---
  kitchen('Tomates', 'kg', 5, 20),
  kitchen('Pommes de terre', 'kg', 10, 40),
  kitchen('Poulet', 'kg', 8, 25),
  kitchen("Huile d'olive", 'l', 4, 15),
  kitchen('Citron', 'kg', 3, 12),
]

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)
export const productsByLocation = (loc: 'bar' | 'cuisine' | 'service') => {
  if (loc === 'service') return PRODUCTS.filter((p) => p.active)
  return PRODUCTS.filter((p) => p.location === loc)
}
