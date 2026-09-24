import { createContext, useContext } from "react";
import type { Article } from "@/lib/habanera-data";

export type PurchaseStatus = "En cours" | "Reçue" | "Reporté" | "Annulé";
export type Purchase = { id: string; supplier: string; articleId: string; quantity: number; receivedQuantity: number; orderDate: string; expectedDate: string; receivedDate?: string; postponedDate?: string; unitPrice: number; status: PurchaseStatus };
export type Sale = { id: string; date: string; point: "Bar" | "Cuisine"; total: number; tickets: number; status: "Intégrée" | "À vérifier" };
export type AlertItem = { id: string; type: string; title: string; detail: string; impact: string; level: "Critique" | "Élevée" | "Modérée"; resolved: boolean; createdAt: string; resolvedAt?: string; resolvedBy?: string };
export type Supplier = { id: string; name: string; category: string; address: string; city: string; phone: string; email: string; contact: string; delay: number; terms: string; quality: number; active: boolean; prices: Record<string, number> };
export type InventoryReport = { id: string; date: string; author: string; totalGap: number; lines: Array<{ article: string; theoretical: number; real: number; gap: number; value: number; unit: string }> };
export type InventoryDraft = { savedAt: string; author: string; counts: Record<string, number> };
export type WithdrawalLine = { articleId: string; requested: number; served: number; observation: string };
export type WithdrawalRecord = { id: string; date: string; service: "Bar" | "Cuisine"; frequency: "Quotidien" | "Hebdomadaire" | "Mixte"; requester: string; validator: string; lines: WithdrawalLine[] };

export type NewArticle = Omit<Article, "id" | "stock" | "achats" | "ventes" | "prelevements" | "prix">;
type OperationsValue = {
  articles: Article[]; purchases: Purchase[]; sales: Sale[]; alerts: AlertItem[]; suppliers: Supplier[]; inventoryReports: InventoryReport[]; inventoryDraft: InventoryDraft | null; withdrawals: WithdrawalRecord[];
  addArticle: (article: NewArticle) => void; updateArticle: (id: string, changes: Partial<Article>) => void; removeArticle: (id: string) => void;
  validateWithdrawal: (record: Omit<WithdrawalRecord, "id">) => WithdrawalRecord; saveInventoryDraft: (counts: Record<string, number>, author: string) => void; addPurchase: (purchase: Omit<Purchase, "id">) => Purchase;
  updatePurchase: (id: string, changes: Partial<Purchase>) => void; addSale: (sale: Omit<Sale, "id">) => Sale; updateSale: (id: string, status: Sale["status"]) => void;
  resolveAlert: (id: string, author: string) => void; addSupplier: (supplier: Omit<Supplier, "id">) => void; updateSupplier: (id: string, changes: Partial<Supplier>) => void;
  closeInventory: (report: Omit<InventoryReport, "id">) => InventoryReport;
  adjustStock: (id: string, delta: number) => void; addAlert: (alert: Omit<AlertItem, "id" | "resolved" | "createdAt">) => void;
};
export const OperationsContext = createContext<OperationsValue | null>(null);


export function useOperations() { const value = useContext(OperationsContext); if (!value) throw new Error("useOperations doit être utilisé dans OperationsProvider"); return value; }