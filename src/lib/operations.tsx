import { useMemo, useRef, useState, type ReactNode } from "react";
import { ARTICLES, type Article } from "@/lib/habanera-data";
import { OperationsContext, type NewArticle } from "@/lib/operations-context";
export type * from "@/lib/operations-context";

const initialPurchases: Purchase[] = [
  { id: "BL-2409", supplier: "Atlas Distribution", articleId: "A-107", quantity: 120, receivedQuantity: 120, orderDate: "2026-09-22", expectedDate: "2026-09-23", receivedDate: "2026-09-23", unitPrice: 6, status: "Reçue" },
  { id: "BC-1842", supplier: "Maison des Vins", articleId: "A-109", quantity: 12, receivedQuantity: 0, orderDate: "2026-09-23", expectedDate: "2026-09-24", unitPrice: 1190, status: "En cours" },
  { id: "BC-1837", supplier: "Comptoir Marrakech", articleId: "A-104", quantity: 16, receivedQuantity: 12, orderDate: "2026-09-20", expectedDate: "2026-09-22", receivedDate: "2026-09-22", unitPrice: 92, status: "Reçue" },
];
const initialSales: Sale[] = [
  { id: "Z-2309-B", date: "2026-09-23", point: "Bar", total: 18420, tickets: 86, status: "Intégrée" },
  { id: "Z-2309-C", date: "2026-09-23", point: "Cuisine", total: 12680, tickets: 64, status: "Intégrée" },
  { id: "Z-2209-B", date: "2026-09-22", point: "Bar", total: 15750, tickets: 73, status: "À vérifier" },
];
const initialAlerts: AlertItem[] = [
  { id: "AL-31", type: "Rupture", title: "Citrons confits sous le seuil", detail: "3 kg disponibles pour un seuil de 8 kg.", impact: "Risque de rupture pendant le service du soir.", level: "Critique", resolved: false, createdAt: "23/09/2026 · 08:14" },
  { id: "AL-30", type: "Inventaire", title: "Écart sur Gin London Dry", detail: "Écart de 2 bouteilles au dernier comptage.", impact: "Démarque estimée à 640 MAD.", level: "Élevée", resolved: false, createdAt: "22/09/2026 · 21:05" },
  { id: "AL-29", type: "Réception", title: "Réception partielle", detail: "La livraison BC-1837 présente 4 unités manquantes.", impact: "Écart fournisseur estimé à 368 MAD.", level: "Modérée", resolved: false, createdAt: "22/09/2026 · 16:40" },
  { id: "AL-28", type: "Rupture", title: "Liqueur d’orange sous le seuil", detail: "7 bouteilles disponibles pour un seuil de 8.", impact: "Carte cocktails partiellement indisponible en soirée.", level: "Élevée", resolved: false, createdAt: "22/09/2026 · 11:20" },
  { id: "AL-27", type: "Inventaire", title: "Écart sur farine pâtissière", detail: "Écart provisoire de 2 kg au comptage cuisine.", impact: "Écart estimé à 24 MAD, à contrôler avant clôture.", level: "Modérée", resolved: false, createdAt: "21/09/2026 · 18:10" },
  { id: "AL-26", type: "Qualité", title: "Contrôle température crème fraîche", detail: "Température relevée puis contrôlée à la réception.", impact: "Lot validé après second contrôle conforme.", level: "Modérée", resolved: true, createdAt: "20/09/2026 · 09:15", resolvedAt: "20/09/2026 · 09:42", resolvedBy: "Salah Bennani" },
  { id: "AL-25", type: "Verrerie", title: "Casse supérieure à la moyenne", detail: "8 verres à cocktail sortis du stock sur la semaine.", impact: "Réassort à anticiper avant le week-end.", level: "Élevée", resolved: true, createdAt: "18/09/2026 · 17:30", resolvedAt: "19/09/2026 · 10:05", resolvedBy: "Salah Bennani" },
];
const initialSuppliers: Supplier[] = [
  { id: "F-01", name: "Atlas Distribution", category: "Boissons & épicerie", address: "18 rue Ibn Sina", city: "Marrakech", phone: "+212 5 24 00 11 22", email: "commandes@atlas.ma", contact: "Amine El Idrissi", delay: 1, terms: "30 jours", quality: 4.8, active: true, prices: { "A-106": 58, "A-107": 6, "A-110": 106 } },
  { id: "F-02", name: "Maison des Vins", category: "Vins & spiritueux", address: "Route de Casablanca", city: "Marrakech", phone: "+212 5 24 10 22 33", email: "pro@maisondesvins.ma", contact: "Leïla Mansouri", delay: 5, terms: "Comptant", quality: 4.6, active: true, prices: { "A-101": 310, "A-102": 525, "A-103": 138, "A-109": 1190 } },
  { id: "F-03", name: "Comptoir Marrakech", category: "Produits frais", address: "Quartier industriel Sidi Ghanem", city: "Marrakech", phone: "+212 5 24 33 44 55", email: "ventes@comptoir.ma", contact: "Omar Bennis", delay: 3, terms: "15 jours", quality: 4.2, active: false, prices: { "A-104": 92, "A-106": 55, "A-108": 75 } },
  { id: "F-04", name: "Marrakech Primeurs", category: "Fruits, légumes & herbes", address: "Marché de gros, route de Safi", city: "Marrakech", phone: "+212 5 24 44 18 06", email: "commandes@marrakech-primeurs.ma", contact: "Khadija Aït Lahcen", delay: 1, terms: "Paiement à 15 jours", quality: 4.7, active: true, prices: { "A-104": 90, "A-106": 54, "A-115": 29, "A-119": 45 } },
  { id: "F-05", name: "Pro CHR Atlas", category: "Verrerie & équipement bar", address: "Zone industrielle Al Massar", city: "Marrakech", phone: "+212 5 24 35 72 10", email: "service@prochr-atlas.ma", contact: "Rachid El Mernissi", delay: 2, terms: "30 jours", quality: 4.5, active: true, prices: { "A-113": 17, "A-114": 38 } },
  { id: "F-06", name: "Saveurs du Haouz", category: "Épicerie & produits secs", address: "12 avenue Guemassa", city: "Marrakech", phone: "+212 5 24 40 63 91", email: "pro@saveursduhaouz.ma", contact: "Salma Chraïbi", delay: 2, terms: "30 jours fin de mois", quality: 4.4, active: true, prices: { "A-105": 26, "A-110": 104, "A-117": 27, "A-118": 11, "A-120": 158 } },
];

export function OperationsProvider({ children }: { children: ReactNode }) {
  const withdrawalSequence = useRef(1);
  const [articles, setArticles] = useState(ARTICLES); const [purchases, setPurchases] = useState(initialPurchases); const [sales, setSales] = useState(initialSales);
  const [alerts, setAlerts] = useState(initialAlerts); const [suppliers, setSuppliers] = useState(initialSuppliers); const [inventoryReports, setInventoryReports] = useState<InventoryReport[]>([]); const [inventoryDraft, setInventoryDraft] = useState<InventoryDraft | null>(null); const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const addArticle = (a: NewArticle) => setArticles((p) => [{ ...a, id: `A-${Date.now()}`, stock: a.stockInitial, achats: 0, ventes: 0, prelevements: 0, prix: a.prixAchat }, ...p]);
  const updateArticle = (id: string, changes: Partial<Article>) => setArticles((p) => p.map((a) => a.id === id ? { ...a, ...changes } : a));
  const removeArticle = (id: string) => setArticles((p) => p.filter((a) => a.id !== id));
  const validateWithdrawal = (record: Omit<WithdrawalRecord, "id">) => { const sequence = withdrawalSequence.current; withdrawalSequence.current += 1; const compactDate = record.date.replaceAll("-", ""); const created = { ...record, id: `PR-${compactDate}-${String(sequence).padStart(2, "0")}` }; setArticles((previous) => previous.map((article) => { const line = record.lines.find((item) => item.articleId === article.id); return line ? { ...article, prelevements: article.prelevements + line.served, stock: Math.max(0, article.stock - line.served) } : article; })); setWithdrawals((previous) => [created, ...previous]); return created; };
  const saveInventoryDraft = (counts: Record<string, number>, author: string) => setInventoryDraft({ counts: { ...counts }, author, savedAt: new Date().toLocaleString("fr-FR") });
  const addPurchase = (purchase: Omit<Purchase, "id">) => { const created = { ...purchase, id: `${purchase.status === "Reçue" ? "BL" : "BC"}-${Date.now().toString().slice(-6)}` }; setPurchases((p) => [created, ...p]); if (purchase.status === "Reçue") setArticles((p) => p.map((a) => a.id === purchase.articleId ? { ...a, achats: a.achats + purchase.receivedQuantity, stock: a.stock + purchase.receivedQuantity } : a)); return created; };
  const updatePurchase = (id: string, changes: Partial<Purchase>) => setPurchases((previous) => previous.map((purchase) => { if (purchase.id !== id) return purchase; const next = { ...purchase, ...changes }; if (purchase.status !== "Reçue" && next.status === "Reçue") setArticles((items) => items.map((a) => a.id === purchase.articleId ? { ...a, achats: a.achats + next.receivedQuantity, stock: a.stock + next.receivedQuantity } : a)); return next; }));
  const addSale = (sale: Omit<Sale, "id">) => { const created = { ...sale, id: `Z-${Date.now().toString().slice(-6)}` }; setSales((p) => [created, ...p]); return created; };
  const updateSale = (id: string, status: Sale["status"]) => setSales((p) => p.map((s) => s.id === id ? { ...s, status } : s));
  const resolveAlert = (id: string, author: string) => setAlerts((p) => p.map((a) => a.id === id ? { ...a, resolved: true, resolvedAt: new Date().toLocaleString("fr-FR"), resolvedBy: author } : a));
  const addSupplier = (supplier: Omit<Supplier, "id">) => setSuppliers((p) => [{ ...supplier, id: `F-${Date.now().toString().slice(-4)}` }, ...p]);
  const updateSupplier = (id: string, changes: Partial<Supplier>) => setSuppliers((p) => p.map((s) => s.id === id ? { ...s, ...changes } : s));
  const closeInventory = (report: Omit<InventoryReport, "id">) => { const created = { ...report, id: `INV-${Date.now().toString().slice(-6)}` }; setInventoryReports((p) => [created, ...p]); return created; };
  const value = useMemo(() => ({ articles, purchases, sales, alerts, suppliers, inventoryReports, inventoryDraft, withdrawals, addArticle, updateArticle, removeArticle, validateWithdrawal, saveInventoryDraft, addPurchase, updatePurchase, addSale, updateSale, resolveAlert, addSupplier, updateSupplier, closeInventory }), [articles, purchases, sales, alerts, suppliers, inventoryReports, inventoryDraft, withdrawals]);
  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

