// Logique métier pure : aucune dépendance à l'interface ni à la source de données.
import { stockCible, isActive, type Article } from "@/lib/habanera-data";
import type { ServiceName } from "@/lib/permissions";

export type Location = "Économat" | ServiceName;
export type MovementType = "Vente / Consommation" | "Prélèvement" | "Réception" | "Ajustement" | "Inventaire";
export type Movement = { id: string; opId: string; articleId: string; type: MovementType; location: Location; quantity: number; before: number; after: number; date: string; user: string; reference: string };

export type RequestStatus = "Brouillon" | "Envoyé" | "Reçu" | "En cours" | "Traité" | "Partiellement traité" | "Non traité" | "Livré" | "Clôturé";
export type RequestLine = { articleId: string; requested: number; prepared: number };
export type StatusEvent = { date: string; status: string; user: string };
export type StockRequest = { id: string; service: ServiceName; date: string; requester: string; status: RequestStatus; comment: string; lines: RequestLine[]; history: StatusEvent[]; processedBy?: string };

export type OrderStatus = "Simulation" | "À valider" | "Validée" | "Envoyée" | "En attente de réception" | "Partiellement reçue" | "Reçue" | "Clôturée";
export type OrderLine = { articleId: string; ordered: number; received: number; unitPrice: number };
export type SupplierOrder = { id: string; supplierId: string; supplierName: string; date: string; expectedDate: string; status: OrderStatus; lines: OrderLine[]; history: StatusEvent[] };
export type ReceptionLine = { articleId: string; ordered: number; received: number; gap: number };
export type Reception = { id: string; orderId: string; supplierName: string; date: string; user: string; lines: ReceptionLine[] };

export type Recipe = { id: string; name: string; service: ServiceName; price: number; ingredients: Array<{ articleId: string; qty: number }> };
export type RecipeSale = { id: string; date: string; service: ServiceName; recipeId: string; quantity: number; total: number; user: string };
export type NotificationItem = { id: string; date: string; audience: "admin" | "economat" | ServiceName; title: string; detail: string; link: string; read: boolean };
export type ActivityItem = { id: string; date: string; user: string; action: string; reference: string; location?: Location };

export type ServiceStock = Record<string, Partial<Record<ServiceName, number>>>;

export const REQUEST_FLOW: RequestStatus[] = ["Brouillon", "Envoyé", "Reçu", "En cours", "Traité", "Livré", "Clôturé"];
export const ORDER_FLOW: OrderStatus[] = ["Simulation", "À valider", "Validée", "Envoyée", "En attente de réception", "Partiellement reçue", "Reçue", "Clôturée"];
export const OPEN_ORDER: OrderStatus[] = ["À valider", "Validée", "Envoyée", "En attente de réception", "Partiellement reçue"];
export const PENDING_REQUEST: RequestStatus[] = ["Envoyé", "Reçu", "En cours"];
export const TODAY = () => new Date().toISOString();

/** Statut calculé automatiquement à partir des quantités demandées/préparées */
export function requestOutcome(lines: RequestLine[]): "Traité" | "Partiellement traité" | "Non traité" {
  const prepared = lines.reduce((s, l) => s + l.prepared, 0);
  if (prepared <= 0) return "Non traité";
  return lines.every((l) => l.prepared >= l.requested) ? "Traité" : "Partiellement traité";
}

export function orderOutcome(lines: OrderLine[]): OrderStatus {
  const received = lines.reduce((s, l) => s + l.received, 0);
  if (received <= 0) return "En attente de réception";
  return lines.every((l) => l.received >= l.ordered) ? "Reçue" : "Partiellement reçue";
}

/** Quantité déjà en commande ouverte (reliquat non reçu) */
export function openOrderedQty(orders: SupplierOrder[], articleId: string) {
  return orders.filter((o) => OPEN_ORDER.includes(o.status)).flatMap((o) => o.lines).filter((l) => l.articleId === articleId).reduce((s, l) => s + Math.max(0, l.ordered - l.received), 0);
}

/** Stock cible − stock actuel − quantité déjà commandée */
export function proposedQty(article: Article, orders: SupplierOrder[]) {
  return Math.max(0, Math.ceil(stockCible(article) - article.stock - openOrderedQty(orders, article.id)));
}

export function isUnderThreshold(a: Article) { return isActive(a) && a.stock <= a.seuil; }
export function isOut(a: Article) { return isActive(a) && a.stock <= 0; }
export function replenishmentNeeds(articles: Article[]) { return articles.filter(isUnderThreshold); }

export function serviceLevel(stock: ServiceStock, refs: ServiceStock, articleId: string, service: ServiceName) {
  const current = stock[articleId]?.[service] ?? 0;
  const ref = refs[articleId]?.[service];
  return { current, ref, gap: ref === undefined ? 0 : +(current - ref).toFixed(2), status: ref !== undefined && current < ref ? (current <= 0 ? "Manquant" : "À prélever") : "OK" };
}

export function consumptionFor(recipe: Recipe, quantity: number) {
  return recipe.ingredients.map((i) => ({ articleId: i.articleId, qty: +(i.qty * quantity).toFixed(3) }));
}

export function isLate(dateIso: string, hours: number) { return Date.now() - new Date(dateIso).getTime() > hours * 3600_000; }

export type Anomaly = { id: string; kind: "Écart de réception" | "Demande partiellement satisfaite" | "Consommation inhabituelle" | "Écart de stock"; title: string; lines: Array<[string, string]>; location: Location; link: string; date: string };

export function detectAnomalies(input: { articles: Article[]; receptions: Reception[]; requests: StockRequest[]; sales: RecipeSale[]; recipes: Recipe[]; inventoryGaps: Array<{ article: string; theoretical: number; real: number; gap: number; date: string }> }): Anomaly[] {
  const name = (id: string) => input.articles.find((a) => a.id === id)?.nom ?? id;
  const out: Anomaly[] = [];
  input.receptions.forEach((r) => r.lines.filter((l) => l.gap !== 0).forEach((l) => out.push({ id: `AN-${r.id}-${l.articleId}`, kind: "Écart de réception", title: `${name(l.articleId)} — ${r.orderId}`, lines: [["Commandé", String(l.ordered)], ["Reçu", String(l.received)], ["Écart", String(l.gap)]], location: "Économat", link: "/receptions", date: r.date })));
  input.requests.filter((q) => q.status === "Partiellement traité" || q.status === "Non traité" || (q.status === "Livré" || q.status === "Clôturé") && q.lines.some((l) => l.prepared < l.requested)).forEach((q) => q.lines.filter((l) => l.prepared < l.requested).forEach((l) => out.push({ id: `AN-${q.id}-${l.articleId}`, kind: "Demande partiellement satisfaite", title: `${name(l.articleId)} — ${q.id}`, lines: [["Demandé", String(l.requested)], ["Préparé", String(l.prepared)]], location: q.service, link: "/bons-prelevement", date: q.date })));
  // Consommation inhabituelle : consommation du dernier jour vs moyenne des jours précédents
  const byDay = new Map<string, Map<string, number>>();
  input.sales.forEach((s) => { const recipe = input.recipes.find((r) => r.id === s.recipeId); if (!recipe) return; const day = s.date.slice(0, 10); const m = byDay.get(day) ?? new Map(); consumptionFor(recipe, s.quantity).forEach((c) => m.set(`${s.service}|${c.articleId}`, (m.get(`${s.service}|${c.articleId}`) ?? 0) + c.qty)); byDay.set(day, m); });
  const days = [...byDay.keys()].sort();
  const last = days.at(-1);
  if (last && days.length > 1) {
    const previous = days.slice(0, -1);
    byDay.get(last)!.forEach((qty, key) => { const avg = previous.reduce((s, d) => s + (byDay.get(d)!.get(key) ?? 0), 0) / previous.length; if (avg > 0 && qty > avg * 1.8) { const [service, id] = key.split("|"); out.push({ id: `AN-CONSO-${key}`, kind: "Consommation inhabituelle", title: `${name(id!)} — ${service}`, lines: [["Habituelle", `${+avg.toFixed(1)}/jour`], ["Actuelle", `${+qty.toFixed(1)}/jour`]], location: service as ServiceName, link: "/ventes", date: `${last}T20:00:00.000Z` }); } });
  }
  input.inventoryGaps.filter((g) => g.gap !== 0).forEach((g, i) => out.push({ id: `AN-INV-${i}-${g.article}`, kind: "Écart de stock", title: g.article, lines: [["Théorique", String(g.theoretical)], ["Réel", String(g.real)], ["Écart", String(g.real - g.theoretical)]], location: "Économat", link: "/inventaire", date: g.date }));
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export type LiveAlert = { id: string; type: string; level: "Critique" | "Élevée" | "Modérée"; title: string; detail: string; location: Location; link: string; action: string };

export function detectAlerts(input: { articles: Article[]; requests: StockRequest[]; orders: SupplierOrder[]; serviceStock: ServiceStock; serviceRefs: ServiceStock }): LiveAlert[] {
  const out: LiveAlert[] = [];
  input.articles.filter(isActive).forEach((a) => {
    if (a.stock <= 0) out.push({ id: `LA-RUP-${a.id}`, type: "Rupture", level: "Critique", title: `${a.nom} en rupture`, detail: `Stock Économat : 0 ${a.unite}`, location: "Économat", link: "/approvisionnement", action: "Commander" });
    else if (a.stock <= a.seuil) out.push({ id: `LA-SEUIL-${a.id}`, type: "Stock sous seuil", level: "Élevée", title: `${a.nom} sous le seuil`, detail: `${a.stock} ${a.unite} pour un seuil de ${a.seuil}`, location: "Économat", link: "/approvisionnement", action: "Simuler une commande" });
    else if (a.stock > stockCible(a) * 1.6) out.push({ id: `LA-HAUT-${a.id}`, type: "Stock anormalement élevé", level: "Modérée", title: `${a.nom} en surstock`, detail: `${a.stock} ${a.unite} pour une cible de ${stockCible(a)}`, location: "Économat", link: "/stock", action: "Vérifier" });
    (["Bar", "Cuisine"] as ServiceName[]).forEach((svc) => { const lvl = serviceLevel(input.serviceStock, input.serviceRefs, a.id, svc); if (lvl.status !== "OK") out.push({ id: `LA-SVC-${svc}-${a.id}`, type: "Sous stock de référence", level: lvl.status === "Manquant" ? "Élevée" : "Modérée", title: `${a.nom} à prélever (${svc})`, detail: `${lvl.current} / réf. ${lvl.ref} ${a.unite}`, location: svc, link: "/mon-stock", action: "Créer un bon" }); });
  });
  input.requests.filter((q) => PENDING_REQUEST.includes(q.status) && isLate(q.date, 24)).forEach((q) => out.push({ id: `LA-BON-${q.id}`, type: "Bon en retard", level: "Élevée", title: `${q.id} non traité`, detail: `Envoyé par ${q.service} le ${fmtDate(q.date)}`, location: q.service, link: "/bons-prelevement", action: "Traiter" }));
  input.orders.filter((o) => OPEN_ORDER.includes(o.status) && o.status !== "À valider" && new Date(o.expectedDate).getTime() < Date.now()).forEach((o) => out.push({ id: `LA-CMD-${o.id}`, type: "Commande en retard", level: "Élevée", title: `${o.id} en retard`, detail: `${o.supplierName} · attendue le ${fmtDate(o.expectedDate)}`, location: "Économat", link: "/receptions", action: "Relancer / réceptionner" }));
  const rank = { Critique: 0, Élevée: 1, Modérée: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

export function fmtDate(iso: string, withTime = false) {
  const d = new Date(iso);
  return withTime ? d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("fr-FR");
}

export type Period = "Aujourd'hui" | "Cette semaine" | "Ce mois" | "Mois précédent" | "Personnalisée" | "Tout";
export function inPeriod(iso: string, period: Period, from?: string, to?: string) {
  const d = new Date(iso); const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "Tout") return true;
  if (period === "Aujourd'hui") return d >= startOfDay;
  if (period === "Cette semaine") { const s = new Date(startOfDay); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return d >= s; }
  if (period === "Ce mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (period === "Mois précédent") { const p = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === p.getMonth() && d.getFullYear() === p.getFullYear(); }
  return (!from || d >= new Date(from)) && (!to || d <= new Date(`${to}T23:59:59`));
}
