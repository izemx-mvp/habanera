import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ARTICLES, type Article } from "@/lib/habanera-data";

export type Purchase = { id: string; supplier: string; articleId: string; quantity: number; date: string; status: "En cours" | "Reçue" };
export type Sale = { id: string; date: string; point: "Bar" | "Cuisine"; total: number; tickets: number; status: "Intégrée" | "À vérifier" };
export type AlertItem = { id: string; type: string; title: string; detail: string; level: "Critique" | "Élevée" | "Modérée"; resolved: boolean };

const initialPurchases: Purchase[] = [
  { id: "BL-2409", supplier: "Atlas Distribution", articleId: "A-107", quantity: 120, date: "23/09/2026", status: "Reçue" },
  { id: "BC-1842", supplier: "Maison des Vins", articleId: "A-109", quantity: 12, date: "24/09/2026", status: "En cours" },
];
const initialSales: Sale[] = [
  { id: "Z-2309-B", date: "23/09/2026", point: "Bar", total: 18420, tickets: 86, status: "Intégrée" },
  { id: "Z-2309-C", date: "23/09/2026", point: "Cuisine", total: 12680, tickets: 64, status: "Intégrée" },
  { id: "Z-2209-B", date: "22/09/2026", point: "Bar", total: 15750, tickets: 73, status: "À vérifier" },
];
const initialAlerts: AlertItem[] = [
  { id: "AL-31", type: "Rupture", title: "Citrons confits sous le seuil", detail: "3 kg disponibles pour un seuil de 8 kg.", level: "Critique", resolved: false },
  { id: "AL-30", type: "Inventaire", title: "Écart sur Gin London Dry", detail: "Écart de 2 bouteilles au dernier comptage.", level: "Élevée", resolved: false },
  { id: "AL-29", type: "Réception", title: "Réception partielle", detail: "La livraison BC-1837 présente 4 unités manquantes.", level: "Modérée", resolved: false },
];

type NewArticle = Omit<Article, "id" | "stock" | "achats" | "ventes" | "prelevements" | "prix">;
type OperationsValue = {
  articles: Article[]; purchases: Purchase[]; sales: Sale[]; alerts: AlertItem[];
  addArticle: (article: NewArticle) => void; updateArticle: (id: string, changes: Partial<Article>) => void; removeArticle: (id: string) => void;
  validateWithdrawal: (id: string, quantity: number) => void; addPurchase: (purchase: Omit<Purchase, "id">) => void;
  addSale: (sale: Omit<Sale, "id">) => void; resolveAlert: (id: string) => void;
};
const OperationsContext = createContext<OperationsValue | null>(null);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState(ARTICLES);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [sales, setSales] = useState(initialSales);
  const [alerts, setAlerts] = useState(initialAlerts);
  const addArticle = (a: NewArticle) => setArticles((p) => [{ ...a, id: `A-${Date.now()}`, stock: a.stockInitial, achats: 0, ventes: 0, prelevements: 0, prix: a.prixAchat }, ...p]);
  const updateArticle = (id: string, changes: Partial<Article>) => setArticles((p) => p.map((a) => a.id === id ? { ...a, ...changes } : a));
  const removeArticle = (id: string) => setArticles((p) => p.filter((a) => a.id !== id));
  const validateWithdrawal = (id: string, quantity: number) => setArticles((p) => p.map((a) => a.id === id ? { ...a, prelevements: a.prelevements + quantity, stock: Math.max(0, a.stock - quantity) } : a));
  const addPurchase = (purchase: Omit<Purchase, "id">) => { setPurchases((p) => [{ ...purchase, id: `BL-${Date.now()}` }, ...p]); if (purchase.status === "Reçue") setArticles((p) => p.map((a) => a.id === purchase.articleId ? { ...a, achats: a.achats + purchase.quantity, stock: a.stock + purchase.quantity } : a)); };
  const addSale = (sale: Omit<Sale, "id">) => setSales((p) => [{ ...sale, id: `Z-${Date.now()}` }, ...p]);
  const resolveAlert = (id: string) => setAlerts((p) => p.map((a) => a.id === id ? { ...a, resolved: true } : a));
  const value = useMemo(() => ({ articles, purchases, sales, alerts, addArticle, updateArticle, removeArticle, validateWithdrawal, addPurchase, addSale, resolveAlert }), [articles, purchases, sales, alerts]);
  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations() {
  const value = useContext(OperationsContext);
  if (!value) throw new Error("useOperations doit être utilisé dans OperationsProvider");
  return value;
}