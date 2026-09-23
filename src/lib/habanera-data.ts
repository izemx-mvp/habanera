export type Frequence = "Quotidien" | "Hebdomadaire";

export type Article = {
  id: string;
  nom: string;
  categorie: "Spiritueux" | "Vins" | "Épicerie" | "Frais" | "Boissons" | "Verrerie" | "Produits secs";
  point: "Bar" | "Cuisine";
  frequence: Frequence;
  stock: number;
  stockInitial: number;
  achats: number;
  ventes: number;
  prelevements: number;
  seuil: number;
  unite: string;
  prix: number;
  prixAchat: number;
};

export const ARTICLES: Article[] = [
  { id: "A-101", nom: "Gin London Dry", categorie: "Spiritueux", point: "Bar", frequence: "Quotidien", stock: 25, stockInitial: 40, achats: 8, ventes: 15, prelevements: 8, seuil: 12, unite: "btl", prix: 320, prixAchat: 320 },
  { id: "A-102", nom: "Rhum ambré 12 ans", categorie: "Spiritueux", point: "Bar", frequence: "Hebdomadaire", stock: 18, stockInitial: 22, achats: 6, ventes: 7, prelevements: 3, seuil: 10, unite: "btl", prix: 540, prixAchat: 540 },
  { id: "A-103", nom: "Vin rouge Guerrouane", categorie: "Vins", point: "Bar", frequence: "Quotidien", stock: 42, stockInitial: 48, achats: 18, ventes: 16, prelevements: 8, seuil: 24, unite: "btl", prix: 145, prixAchat: 145 },
  { id: "A-104", nom: "Huile d'olive Meknès", categorie: "Épicerie", point: "Cuisine", frequence: "Hebdomadaire", stock: 9, stockInitial: 15, achats: 4, ventes: 7, prelevements: 3, seuil: 15, unite: "L", prix: 95, prixAchat: 95 },
  { id: "A-105", nom: "Safran Taliouine", categorie: "Épicerie", point: "Cuisine", frequence: "Hebdomadaire", stock: 120, stockInitial: 140, achats: 40, ventes: 45, prelevements: 15, seuil: 60, unite: "g", prix: 28, prixAchat: 28 },
  { id: "A-106", nom: "Citrons confits", categorie: "Frais", point: "Cuisine", frequence: "Quotidien", stock: 3, stockInitial: 9, achats: 5, ventes: 8, prelevements: 3, seuil: 8, unite: "kg", prix: 60, prixAchat: 60 },
  { id: "A-107", nom: "Eau minérale 1L", categorie: "Boissons", point: "Bar", frequence: "Quotidien", stock: 240, stockInitial: 180, achats: 120, ventes: 45, prelevements: 15, seuil: 100, unite: "btl", prix: 6, prixAchat: 6 },
  { id: "A-108", nom: "Beurre doux", categorie: "Frais", point: "Cuisine", frequence: "Quotidien", stock: 14, stockInitial: 16, achats: 8, ventes: 7, prelevements: 3, seuil: 10, unite: "kg", prix: 78, prixAchat: 78 },
  { id: "A-109", nom: "Champagne brut", categorie: "Vins", point: "Bar", frequence: "Hebdomadaire", stock: 5, stockInitial: 8, achats: 2, ventes: 4, prelevements: 1, seuil: 6, unite: "btl", prix: 1250, prixAchat: 1250 },
  { id: "A-110", nom: "Amandes grillées", categorie: "Épicerie", point: "Cuisine", frequence: "Hebdomadaire", stock: 26, stockInitial: 30, achats: 12, ventes: 10, prelevements: 6, seuil: 12, unite: "kg", prix: 110, prixAchat: 110 },
  { id: "A-111", nom: "Vodka premium", categorie: "Spiritueux", point: "Bar", frequence: "Hebdomadaire", stock: 11, stockInitial: 18, achats: 6, ventes: 9, prelevements: 4, seuil: 8, unite: "btl", prix: 410, prixAchat: 410 },
  { id: "A-112", nom: "Liqueur d’orange", categorie: "Spiritueux", point: "Bar", frequence: "Hebdomadaire", stock: 7, stockInitial: 14, achats: 3, ventes: 7, prelevements: 3, seuil: 8, unite: "btl", prix: 265, prixAchat: 265 },
  { id: "A-113", nom: "Tonic artisanal", categorie: "Boissons", point: "Bar", frequence: "Quotidien", stock: 46, stockInitial: 72, achats: 24, ventes: 38, prelevements: 12, seuil: 36, unite: "btl", prix: 18, prixAchat: 18 },
  { id: "A-114", nom: "Verres à cocktail", categorie: "Verrerie", point: "Bar", frequence: "Hebdomadaire", stock: 28, stockInitial: 36, achats: 6, ventes: 0, prelevements: 14, seuil: 24, unite: "pièce", prix: 42, prixAchat: 42 },
  { id: "A-115", nom: "Menthe fraîche", categorie: "Frais", point: "Cuisine", frequence: "Quotidien", stock: 4, stockInitial: 12, achats: 6, ventes: 10, prelevements: 4, seuil: 7, unite: "kg", prix: 32, prixAchat: 32 },
  { id: "A-116", nom: "Filet de bœuf", categorie: "Frais", point: "Cuisine", frequence: "Quotidien", stock: 18, stockInitial: 25, achats: 12, ventes: 14, prelevements: 5, seuil: 12, unite: "kg", prix: 190, prixAchat: 190 },
  { id: "A-117", nom: "Riz basmati", categorie: "Produits secs", point: "Cuisine", frequence: "Hebdomadaire", stock: 21, stockInitial: 30, achats: 15, ventes: 18, prelevements: 6, seuil: 16, unite: "kg", prix: 29, prixAchat: 29 },
  { id: "A-118", nom: "Farine pâtissière", categorie: "Produits secs", point: "Cuisine", frequence: "Hebdomadaire", stock: 8, stockInitial: 20, achats: 10, ventes: 16, prelevements: 6, seuil: 12, unite: "kg", prix: 12, prixAchat: 12 },
  { id: "A-119", nom: "Crème fraîche", categorie: "Frais", point: "Cuisine", frequence: "Quotidien", stock: 13, stockInitial: 18, achats: 8, ventes: 9, prelevements: 4, seuil: 10, unite: "L", prix: 48, prixAchat: 48 },
  { id: "A-120", nom: "Café arabica", categorie: "Épicerie", point: "Bar", frequence: "Quotidien", stock: 16, stockInitial: 24, achats: 12, ventes: 14, prelevements: 6, seuil: 12, unite: "kg", prix: 165, prixAchat: 165 },
];

export type Mouvement = {
  id: string;
  date: string;
  article: string;
  type: "Entrée" | "Sortie" | "Transfert";
  quantite: number;
  point: string;
  auteur: string;
};

export const MOUVEMENTS: Mouvement[] = [
  { id: "M-9021", date: "23 sept. 09:12", article: "Gin London Dry", type: "Sortie", quantite: 4, point: "Bar", auteur: "Youssef Amrani" },
  { id: "M-9020", date: "23 sept. 08:40", article: "Eau minérale 1L", type: "Entrée", quantite: 120, point: "Économat", auteur: "Nadia El Fassi" },
  { id: "M-9019", date: "22 sept. 19:55", article: "Citrons confits", type: "Sortie", quantite: 2, point: "Cuisine", auteur: "Imane Ouazzani" },
  { id: "M-9018", date: "22 sept. 16:22", article: "Vin rouge Guerrouane", type: "Transfert", quantite: 12, point: "Économat → Bar", auteur: "Nadia El Fassi" },
  { id: "M-9017", date: "22 sept. 11:08", article: "Huile d'olive Meknès", type: "Sortie", quantite: 3, point: "Cuisine", auteur: "Imane Ouazzani" },
  { id: "M-9016", date: "21 sept. 21:47", article: "Champagne brut", type: "Sortie", quantite: 1, point: "Bar", auteur: "Karim Tazi" },
];

export const CONSOMMATION = [
  { jour: "Lun", bar: 3200, cuisine: 2400 },
  { jour: "Mar", bar: 2800, cuisine: 2100 },
  { jour: "Mer", bar: 3900, cuisine: 2600 },
  { jour: "Jeu", bar: 4200, cuisine: 3100 },
  { jour: "Ven", bar: 6100, cuisine: 4300 },
  { jour: "Sam", bar: 7400, cuisine: 5200 },
  { jour: "Dim", bar: 4800, cuisine: 3600 },
];

export const formatMAD = (v: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(v);
