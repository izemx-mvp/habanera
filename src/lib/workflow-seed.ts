// Source de données simulée (remplaçable par une vraie base plus tard).
import type { ActivityItem, Movement, NotificationItem, Reception, Recipe, RecipeSale, ServiceStock, StockRequest, SupplierOrder } from "@/lib/workflow-logic";

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
const inHours = (hours: number) => new Date(Date.now() + hours * 3600_000).toISOString();

// [articleId, service, stock actuel, stock de référence]
const LEVELS: Array<[string, "Bar" | "Cuisine", number, number]> = [
  ["A-101", "Bar", 4, 6], ["A-102", "Bar", 3, 4], ["A-103", "Bar", 14, 12], ["A-107", "Bar", 12, 50], ["A-107", "Cuisine", 25, 30],
  ["A-109", "Bar", 2, 3], ["A-111", "Bar", 3, 3], ["A-112", "Bar", 1, 3], ["A-113", "Bar", 25, 20], ["A-114", "Bar", 30, 36],
  ["A-120", "Bar", 2, 3], ["A-121", "Bar", 18, 40], ["A-122", "Bar", 900, 1000], ["A-123", "Bar", 260, 350], ["A-124", "Bar", 120, 200],
  ["A-125", "Bar", 4, 10], ["A-126", "Bar", 0, 24], ["A-106", "Bar", 1, 1],
  ["A-104", "Cuisine", 3, 5], ["A-105", "Cuisine", 30, 25], ["A-106", "Cuisine", 1.5, 3], ["A-108", "Cuisine", 4, 4], ["A-110", "Cuisine", 5, 4],
  ["A-115", "Cuisine", 0.5, 2], ["A-116", "Cuisine", 6, 8], ["A-117", "Cuisine", 7, 6], ["A-118", "Cuisine", 2, 5], ["A-119", "Cuisine", 3, 4],
];
export const SEED_SERVICE_STOCK: ServiceStock = {};
export const SEED_SERVICE_REFS: ServiceStock = {};
LEVELS.forEach(([id, svc, stock, ref]) => { (SEED_SERVICE_STOCK[id] ??= {})[svc] = stock; (SEED_SERVICE_REFS[id] ??= {})[svc] = ref; });

export const SEED_RECIPES: Recipe[] = [
  { id: "R-01", name: "Mojito", service: "Bar", price: 90, ingredients: [{ articleId: "A-123", qty: 5 }, { articleId: "A-121", qty: 1 }, { articleId: "A-124", qty: 5 }, { articleId: "A-122", qty: 10 }] },
  { id: "R-02", name: "Gin tonic", service: "Bar", price: 110, ingredients: [{ articleId: "A-101", qty: 0.06 }, { articleId: "A-113", qty: 1 }, { articleId: "A-121", qty: 0.5 }] },
  { id: "R-03", name: "Coca-Cola", service: "Bar", price: 30, ingredients: [{ articleId: "A-126", qty: 1 }] },
  { id: "R-04", name: "Espresso", service: "Bar", price: 25, ingredients: [{ articleId: "A-120", qty: 0.008 }] },
  { id: "R-05", name: "Tajine poulet citron", service: "Cuisine", price: 160, ingredients: [{ articleId: "A-106", qty: 0.1 }, { articleId: "A-104", qty: 0.03 }, { articleId: "A-105", qty: 0.2 }] },
  { id: "R-06", name: "Filet de bœuf sauce crème", service: "Cuisine", price: 260, ingredients: [{ articleId: "A-116", qty: 0.25 }, { articleId: "A-108", qty: 0.02 }, { articleId: "A-119", qty: 0.05 }] },
  { id: "R-07", name: "Riz basmati safrané", service: "Cuisine", price: 60, ingredients: [{ articleId: "A-117", qty: 0.1 }, { articleId: "A-105", qty: 0.1 }] },
  { id: "R-08", name: "Thé à la menthe", service: "Cuisine", price: 35, ingredients: [{ articleId: "A-115", qty: 0.02 }, { articleId: "A-107", qty: 0.5 }] },
];

const sale = (id: string, h: number, service: "Bar" | "Cuisine", recipeId: string, quantity: number, user: string): RecipeSale => ({ id, date: ago(h), service, recipeId, quantity, total: quantity * (SEED_RECIPES.find((r) => r.id === recipeId)!.price), user });
export const SEED_SALES: RecipeSale[] = [
  sale("V-1001", 74, "Bar", "R-01", 18, "Youssef Amrani"), sale("V-1002", 73, "Bar", "R-02", 12, "Youssef Amrani"), sale("V-1003", 72, "Cuisine", "R-05", 14, "Imane Ouazzani"),
  sale("V-1004", 50, "Bar", "R-01", 22, "Youssef Amrani"), sale("V-1005", 49, "Cuisine", "R-06", 11, "Imane Ouazzani"), sale("V-1006", 48, "Cuisine", "R-08", 20, "Imane Ouazzani"),
  sale("V-1007", 26, "Bar", "R-01", 20, "Youssef Amrani"), sale("V-1008", 25, "Bar", "R-03", 24, "Youssef Amrani"), sale("V-1009", 25, "Cuisine", "R-07", 16, "Imane Ouazzani"),
  sale("V-1010", 3, "Bar", "R-01", 45, "Youssef Amrani"), sale("V-1011", 2, "Bar", "R-04", 30, "Youssef Amrani"), sale("V-1012", 2, "Cuisine", "R-05", 12, "Imane Ouazzani"),
];

const ev = (h: number, status: string, user: string) => ({ date: ago(h), status, user });
export const SEED_REQUESTS: StockRequest[] = [
  { id: "BP-0101", service: "Bar", date: ago(1), requester: "Youssef Amrani", status: "Brouillon", comment: "Réassort cocktails du soir", lines: [{ articleId: "A-126", requested: 24, prepared: 0 }, { articleId: "A-121", requested: 22, prepared: 0 }], history: [ev(1, "Brouillon", "Youssef Amrani")] },
  { id: "BP-0102", service: "Cuisine", date: ago(3), requester: "Imane Ouazzani", status: "Envoyé", comment: "", lines: [{ articleId: "A-115", requested: 2, prepared: 0 }, { articleId: "A-118", requested: 3, prepared: 0 }, { articleId: "A-104", requested: 2, prepared: 0 }], history: [ev(3.2, "Brouillon", "Imane Ouazzani"), ev(3, "Envoyé", "Imane Ouazzani")] },
  { id: "BP-0103", service: "Bar", date: ago(30), requester: "Youssef Amrani", status: "Reçu", comment: "Urgent week-end", lines: [{ articleId: "A-107", requested: 12, prepared: 0 }, { articleId: "A-125", requested: 8, prepared: 0 }, { articleId: "A-112", requested: 4, prepared: 0 }, { articleId: "A-126", requested: 10, prepared: 0 }], history: [ev(30, "Envoyé", "Youssef Amrani"), ev(29, "Reçu", "Nadia El Fassi")] },
  { id: "BP-0104", service: "Cuisine", date: ago(5), requester: "Imane Ouazzani", status: "En cours", comment: "", lines: [{ articleId: "A-116", requested: 4, prepared: 0 }, { articleId: "A-119", requested: 2, prepared: 0 }], history: [ev(5, "Envoyé", "Imane Ouazzani"), ev(4.5, "Reçu", "Nadia El Fassi"), ev(4, "En cours", "Nadia El Fassi")] },
  { id: "BP-0105", service: "Cuisine", date: ago(28), requester: "Imane Ouazzani", status: "Partiellement traité", comment: "Stock huile insuffisant", processedBy: "Nadia El Fassi", lines: [{ articleId: "A-104", requested: 6, prepared: 3 }, { articleId: "A-117", requested: 5, prepared: 5 }], history: [ev(28, "Envoyé", "Imane Ouazzani"), ev(27, "Reçu", "Nadia El Fassi"), ev(26, "Partiellement traité", "Nadia El Fassi")] },
  { id: "BP-0106", service: "Bar", date: ago(48), requester: "Youssef Amrani", status: "Traité", comment: "", processedBy: "Nadia El Fassi", lines: [{ articleId: "A-101", requested: 3, prepared: 3 }, { articleId: "A-113", requested: 12, prepared: 12 }], history: [ev(48, "Envoyé", "Youssef Amrani"), ev(46, "Traité", "Nadia El Fassi")] },
  { id: "BP-0107", service: "Bar", date: ago(72), requester: "Youssef Amrani", status: "Livré", comment: "", processedBy: "Nadia El Fassi", lines: [{ articleId: "A-123", requested: 350, prepared: 350 }], history: [ev(72, "Envoyé", "Youssef Amrani"), ev(70, "Traité", "Nadia El Fassi"), ev(69, "Livré", "Nadia El Fassi")] },
  { id: "BP-0108", service: "Cuisine", date: ago(96), requester: "Imane Ouazzani", status: "Clôturé", comment: "", processedBy: "Nadia El Fassi", lines: [{ articleId: "A-105", requested: 20, prepared: 20 }], history: [ev(96, "Envoyé", "Imane Ouazzani"), ev(94, "Traité", "Nadia El Fassi"), ev(93, "Livré", "Nadia El Fassi"), ev(90, "Clôturé", "Salah Bennani")] },
  { id: "BP-0109", service: "Bar", date: ago(52), requester: "Youssef Amrani", status: "Non traité", comment: "Rupture fournisseur", processedBy: "Nadia El Fassi", lines: [{ articleId: "A-126", requested: 24, prepared: 0 }], history: [ev(52, "Envoyé", "Youssef Amrani"), ev(50, "Non traité", "Nadia El Fassi")] },
];

export const SEED_ORDERS: SupplierOrder[] = [
  { id: "CMD-0121", supplierId: "F-01", supplierName: "Atlas Distribution", date: ago(2), expectedDate: inHours(24), status: "À valider", lines: [{ articleId: "A-126", ordered: 60, received: 0, unitPrice: 7 }], history: [ev(2, "À valider", "Nadia El Fassi")] },
  { id: "CMD-0122", supplierId: "F-02", supplierName: "Maison des Vins", date: ago(80), expectedDate: ago(20), status: "Envoyée", lines: [{ articleId: "A-109", ordered: 6, received: 0, unitPrice: 1190 }, { articleId: "A-112", ordered: 6, received: 0, unitPrice: 265 }], history: [ev(80, "Validée", "Salah Bennani"), ev(79, "Envoyée", "Nadia El Fassi")] },
  { id: "CMD-0123", supplierId: "F-04", supplierName: "Marrakech Primeurs", date: ago(40), expectedDate: ago(16), status: "Partiellement reçue", lines: [{ articleId: "A-121", ordered: 100, received: 70, unitPrice: 2 }, { articleId: "A-115", ordered: 5, received: 5, unitPrice: 29 }], history: [ev(40, "Validée", "Salah Bennani"), ev(39, "Envoyée", "Nadia El Fassi"), ev(18, "Partiellement reçue", "Nadia El Fassi")] },
  { id: "CMD-0124", supplierId: "F-01", supplierName: "Atlas Distribution", date: ago(60), expectedDate: ago(36), status: "Reçue", lines: [{ articleId: "A-107", ordered: 100, received: 95, unitPrice: 6 }, { articleId: "A-113", ordered: 24, received: 24, unitPrice: 17 }], history: [ev(60, "Validée", "Salah Bennani"), ev(59, "Envoyée", "Nadia El Fassi"), ev(36, "Reçue", "Nadia El Fassi")] },
  { id: "CMD-0125", supplierId: "F-06", supplierName: "Saveurs du Haouz", date: ago(6), expectedDate: inHours(40), status: "Validée", lines: [{ articleId: "A-118", ordered: 20, received: 0, unitPrice: 11 }], history: [ev(7, "À valider", "Nadia El Fassi"), ev(6, "Validée", "Salah Bennani")] },
];

export const SEED_RECEPTIONS: Reception[] = [
  { id: "REC-0051", orderId: "CMD-0124", supplierName: "Atlas Distribution", date: ago(36), user: "Nadia El Fassi", lines: [{ articleId: "A-107", ordered: 100, received: 95, gap: -5 }, { articleId: "A-113", ordered: 24, received: 24, gap: 0 }] },
  { id: "REC-0052", orderId: "CMD-0123", supplierName: "Marrakech Primeurs", date: ago(18), user: "Nadia El Fassi", lines: [{ articleId: "A-121", ordered: 100, received: 70, gap: -30 }, { articleId: "A-115", ordered: 5, received: 5, gap: 0 }] },
];

const mv = (id: string, h: number, articleId: string, type: Movement["type"], location: Movement["location"], quantity: number, before: number, user: string, reference: string): Movement => ({ id, opId: `SEED-${id}`, articleId, type, location, quantity, before, after: before + quantity, date: ago(h), user, reference });
export const SEED_MOVEMENTS: Movement[] = [
  mv("MV-0001", 36, "A-107", "Réception", "Économat", 95, 0, "Nadia El Fassi", "REC-0051"),
  mv("MV-0002", 26, "A-104", "Prélèvement", "Économat", -3, 12, "Nadia El Fassi", "BP-0105"),
  mv("MV-0003", 26, "A-104", "Prélèvement", "Cuisine", 3, 0, "Nadia El Fassi", "BP-0105"),
  mv("MV-0004", 18, "A-121", "Réception", "Économat", 70, 10, "Nadia El Fassi", "REC-0052"),
  mv("MV-0005", 3, "A-123", "Vente / Consommation", "Bar", -225, 485, "Youssef Amrani", "V-1010"),
  mv("MV-0006", 2, "A-106", "Vente / Consommation", "Cuisine", -1.2, 2.7, "Imane Ouazzani", "V-1012"),
  mv("MV-0007", 1.5, "A-110", "Ajustement", "Économat", -2, 28, "Nadia El Fassi", "AJ-0007"),
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: "N-01", date: ago(3), audience: "economat", title: "Nouveau bon reçu", detail: "BP-0102 envoyé par la Cuisine", link: "/bons-prelevement", read: false },
  { id: "N-02", date: ago(26), audience: "Cuisine", title: "Bon partiellement traité", detail: "BP-0105 : huile d'olive servie 3/6", link: "/bons-prelevement", read: false },
  { id: "N-03", date: ago(46), audience: "Bar", title: "Bon traité", detail: "BP-0106 prêt à être livré", link: "/bons-prelevement", read: true },
  { id: "N-04", date: ago(50), audience: "Bar", title: "Produit indisponible", detail: "Coca-Cola 33cl en rupture à l'économat", link: "/mon-stock", read: false },
  { id: "N-05", date: ago(20), audience: "admin", title: "Commande en retard", detail: "CMD-0122 · Maison des Vins", link: "/receptions", read: false },
  { id: "N-06", date: ago(18), audience: "admin", title: "Écart important", detail: "REC-0052 : 30 citrons verts manquants", link: "/alertes", read: false },
  { id: "N-07", date: ago(8), audience: "economat", title: "Réception attendue", detail: "CMD-0125 · Saveurs du Haouz", link: "/receptions", read: false },
];

export const SEED_ACTIVITY: ActivityItem[] = [
  { id: "ACT-01", date: ago(1), user: "Youssef Amrani", action: "Nouveau bon de prélèvement (brouillon)", reference: "BP-0101", location: "Bar" },
  { id: "ACT-02", date: ago(2), user: "Nadia El Fassi", action: "Nouvelle commande fournisseur", reference: "CMD-0121", location: "Économat" },
  { id: "ACT-03", date: ago(3), user: "Imane Ouazzani", action: "Bon envoyé à l'économat", reference: "BP-0102", location: "Cuisine" },
  { id: "ACT-04", date: ago(6), user: "Salah Bennani", action: "Validation commande fournisseur", reference: "CMD-0125", location: "Économat" },
  { id: "ACT-05", date: ago(18), user: "Nadia El Fassi", action: "Réception effectuée (partielle)", reference: "REC-0052", location: "Économat" },
  { id: "ACT-06", date: ago(26), user: "Nadia El Fassi", action: "Bon partiellement traité", reference: "BP-0105", location: "Cuisine" },
];
