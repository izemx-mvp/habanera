export type Article = {
  id: string;
  nom: string;
  categorie: "Spiritueux" | "Vins" | "Épicerie" | "Frais" | "Boissons";
  point: "Bar" | "Cuisine" | "Économat";
  stock: number;
  seuil: number;
  unite: string;
  prix: number;
};

export const ARTICLES: Article[] = [
  { id: "A-101", nom: "Gin London Dry", categorie: "Spiritueux", point: "Bar", stock: 6, seuil: 12, unite: "btl", prix: 320 },
  { id: "A-102", nom: "Rhum ambré 12 ans", categorie: "Spiritueux", point: "Bar", stock: 18, seuil: 10, unite: "btl", prix: 540 },
  { id: "A-103", nom: "Vin rouge Guerrouane", categorie: "Vins", point: "Bar", stock: 42, seuil: 24, unite: "btl", prix: 145 },
  { id: "A-104", nom: "Huile d'olive Meknès", categorie: "Épicerie", point: "Cuisine", stock: 9, seuil: 15, unite: "L", prix: 95 },
  { id: "A-105", nom: "Safran Taliouine", categorie: "Épicerie", point: "Cuisine", stock: 120, seuil: 60, unite: "g", prix: 28 },
  { id: "A-106", nom: "Citrons confits", categorie: "Frais", point: "Cuisine", stock: 3, seuil: 8, unite: "kg", prix: 60 },
  { id: "A-107", nom: "Eau minérale 1L", categorie: "Boissons", point: "Économat", stock: 240, seuil: 100, unite: "btl", prix: 6 },
  { id: "A-108", nom: "Beurre doux", categorie: "Frais", point: "Cuisine", stock: 14, seuil: 10, unite: "kg", prix: 78 },
  { id: "A-109", nom: "Champagne brut", categorie: "Vins", point: "Bar", stock: 5, seuil: 6, unite: "btl", prix: 1250 },
  { id: "A-110", nom: "Amandes grillées", categorie: "Épicerie", point: "Économat", stock: 26, seuil: 12, unite: "kg", prix: 110 },
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
