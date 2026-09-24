import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useOperations } from "@/lib/operations-context";
import type { ServiceName } from "@/lib/permissions";
import { WorkflowContext, type WorkflowValue } from "@/lib/workflow-context";
import { consumptionFor, orderOutcome, requestOutcome, TODAY, type ActivityItem, type Location, type Movement, type MovementType, type NotificationItem, type Reception, type RecipeSale, type ServiceStock, type StockRequest, type SupplierOrder } from "@/lib/workflow-logic";
import { SEED_ACTIVITY, SEED_MOVEMENTS, SEED_NOTIFICATIONS, SEED_ORDERS, SEED_RECEPTIONS, SEED_RECIPES, SEED_REQUESTS, SEED_SALES, SEED_SERVICE_REFS, SEED_SERVICE_STOCK } from "@/lib/workflow-seed";

let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString().slice(-6)}${(counter++ % 100).toString().padStart(2, "0")}`;

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const ops = useOperations();
  const [serviceStock, setServiceStock] = useState<ServiceStock>(SEED_SERVICE_STOCK);
  const [serviceRefs, setServiceRefs] = useState<ServiceStock>(SEED_SERVICE_REFS);
  const [movements, setMovements] = useState<Movement[]>(SEED_MOVEMENTS);
  const [requests, setRequests] = useState<StockRequest[]>(SEED_REQUESTS);
  const [orders, setOrders] = useState<SupplierOrder[]>(SEED_ORDERS);
  const [receptions, setReceptions] = useState<Reception[]>(SEED_RECEPTIONS);
  const [sales, setSales] = useState<RecipeSale[]>(SEED_SALES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SEED_NOTIFICATIONS);
  const [activity, setActivity] = useState<ActivityItem[]>(SEED_ACTIVITY);

  // Refs synchrones : garantissent des "stock avant/après" exacts et l'idempotence même en cas de double clic.
  const processed = useRef(new Set<string>());
  const serviceRef = useRef(serviceStock); serviceRef.current = serviceStock;
  const articlesRef = useRef(ops.articles); articlesRef.current = ops.articles;
  const ecoOverride = useRef(new Map<string, number>());
  const requestsRef = useRef(requests); requestsRef.current = requests;
  const ordersRef = useRef(orders); ordersRef.current = orders;
  useEffect(() => { ecoOverride.current.clear(); }, [ops.articles]);

  const log = useCallback((user: string, action: string, reference: string, location?: Location) => setActivity((p) => [{ id: uid("ACT"), date: TODAY(), user, action, reference, ...(location ? { location } : {}) }, ...p]), []);
  const notify = useCallback((audience: NotificationItem["audience"], title: string, detail: string, link: string) => setNotifications((p) => [{ id: uid("N"), date: TODAY(), audience, title, detail, link, read: false }, ...p]), []);

  /** Service unique de mouvements de stock. Retourne false si l'opération a déjà été appliquée. */
  const applyMovements = useCallback((opId: string, type: MovementType, reference: string, user: string, entries: Array<{ articleId: string; location: Location; delta: number }>) => {
    if (processed.current.has(opId)) return false;
    processed.current.add(opId);
    const created: Movement[] = [];
    let nextService = serviceRef.current;
    entries.filter((e) => e.delta !== 0).forEach((e, index) => {
      let before: number;
      if (e.location === "Économat") {
        before = ecoOverride.current.get(e.articleId) ?? articlesRef.current.find((a) => a.id === e.articleId)?.stock ?? 0;
        const after = Math.max(0, +(before + e.delta).toFixed(3));
        ecoOverride.current.set(e.articleId, after);
        ops.adjustStock(e.articleId, after - before);
        created.push({ id: `MV-${opId}-${index}`, opId, articleId: e.articleId, type, location: e.location, quantity: +(after - before).toFixed(3), before, after, date: TODAY(), user, reference });
      } else {
        const svc = e.location as ServiceName;
        before = nextService[e.articleId]?.[svc] ?? 0;
        const after = Math.max(0, +(before + e.delta).toFixed(3));
        nextService = { ...nextService, [e.articleId]: { ...nextService[e.articleId], [svc]: after } };
        created.push({ id: `MV-${opId}-${index}`, opId, articleId: e.articleId, type, location: e.location, quantity: +(after - before).toFixed(3), before, after, date: TODAY(), user, reference });
      }
    });
    serviceRef.current = nextService;
    setServiceStock(nextService);
    setMovements((p) => [...created.reverse(), ...p]);
    return true;
  }, [ops]);

  const recordSale: WorkflowValue["recordSale"] = (opId, input) => {
    const recipe = SEED_RECIPES.find((r) => r.id === input.recipeId);
    if (!recipe || input.quantity <= 0) return null;
    const sale: RecipeSale = { id: uid("V"), date: TODAY(), service: input.service, recipeId: recipe.id, quantity: input.quantity, total: recipe.price * input.quantity, user: input.user };
    const ok = applyMovements(`SALE:${opId}`, "Vente / Consommation", sale.id, input.user, consumptionFor(recipe, input.quantity).map((c) => ({ articleId: c.articleId, location: input.service, delta: -c.qty })));
    if (!ok) return null;
    setSales((p) => [sale, ...p]);
    log(input.user, `Vente enregistrée : ${input.quantity} × ${recipe.name}`, sale.id, input.service);
    return sale;
  };

  const createRequest: WorkflowValue["createRequest"] = ({ service, lines, comment, user, send }) => {
    const id = `BP-${String(requestsRef.current.length + 101 + counter++).padStart(4, "0")}`;
    const status = send ? "Envoyé" : "Brouillon";
    const req: StockRequest = { id, service, date: TODAY(), requester: user, status, comment, lines: lines.map((l) => ({ ...l, prepared: 0 })), history: [{ date: TODAY(), status: "Brouillon", user }, ...(send ? [{ date: TODAY(), status: "Envoyé", user }] : [])] };
    requestsRef.current = [req, ...requestsRef.current];
    setRequests(requestsRef.current);
    log(user, send ? "Bon envoyé à l'économat" : "Nouveau bon de prélèvement (brouillon)", id, service);
    if (send) notify("economat", "Nouveau bon reçu", `${id} envoyé par ${service}`, "/bons-prelevement");
    return req;
  };

  const setRequestStatus: WorkflowValue["setRequestStatus"] = (id, status, user) => {
    const req = requestsRef.current.find((r) => r.id === id);
    if (!req || req.status === status) return;
    requestsRef.current = requestsRef.current.map((r) => r.id === id ? { ...r, status, history: [...r.history, { date: TODAY(), status, user }] } : r);
    setRequests(requestsRef.current);
    log(user, `Bon ${status.toLowerCase()}`, id, req.service);
    if (status === "Envoyé") notify("economat", "Nouveau bon reçu", `${id} envoyé par ${req.service}`, "/bons-prelevement");
    if (status === "Livré") notify(req.service, "Bon livré", `${id} livré au service`, "/bons-prelevement");
  };

  const processRequest: WorkflowValue["processRequest"] = (id, prepared, user) => {
    const req = requestsRef.current.find((r) => r.id === id);
    if (!req || !["Reçu", "En cours", "Envoyé"].includes(req.status)) return null;
    const lines = req.lines.map((l) => {
      const available = ecoOverride.current.get(l.articleId) ?? articlesRef.current.find((a) => a.id === l.articleId)?.stock ?? 0;
      return { ...l, prepared: Math.max(0, Math.min(prepared[l.articleId] ?? 0, available)) };
    });
    const ok = applyMovements(`REQ:${id}`, "Prélèvement", id, user, lines.flatMap((l) => [{ articleId: l.articleId, location: "Économat" as Location, delta: -l.prepared }, { articleId: l.articleId, location: req.service as Location, delta: l.prepared }]));
    if (!ok) return null;
    const status = requestOutcome(lines);
    const updated = { ...req, lines, status, processedBy: user, history: [...req.history, { date: TODAY(), status, user }] };
    requestsRef.current = requestsRef.current.map((r) => r.id === id ? updated : r);
    setRequests(requestsRef.current);
    lines.forEach((l) => ops.updateArticle(l.articleId, { prelevements: (articlesRef.current.find((a) => a.id === l.articleId)?.prelevements ?? 0) + l.prepared }));
    log(user, `Validation prélèvement (${status})`, id, req.service);
    notify(req.service, status === "Traité" ? "Bon traité" : status === "Non traité" ? "Produit indisponible" : "Bon partiellement traité", `${id} : ${lines.filter((l) => l.prepared > 0).length}/${lines.length} produits préparés`, "/bons-prelevement");
    if (status !== "Traité") ops.addAlert({ type: "Prélèvement", title: `${id} ${status.toLowerCase()}`, detail: lines.filter((l) => l.prepared < l.requested).map((l) => `${articlesRef.current.find((a) => a.id === l.articleId)?.nom} : ${l.prepared}/${l.requested}`).join(" · "), impact: "Besoin d'achat à anticiper pour couvrir le manque.", level: status === "Non traité" ? "Critique" : "Modérée" });
    return updated;
  };

  const adjustStock: WorkflowValue["adjustStock"] = (opId, { articleId, location, newQuantity, user, type = "Ajustement", reason }) => {
    const current = location === "Économat" ? (ecoOverride.current.get(articleId) ?? articlesRef.current.find((a) => a.id === articleId)?.stock ?? 0) : (serviceRef.current[articleId]?.[location as ServiceName] ?? 0);
    const ref = `${type === "Inventaire" ? "INV" : "AJ"}-${opId.slice(-6)}`;
    const ok = applyMovements(`ADJ:${opId}`, type, ref, user, [{ articleId, location, delta: newQuantity - current }]);
    if (ok) log(user, `${type} de stock (${reason})`, ref, location);
    return ok;
  };

  const createOrder: WorkflowValue["createOrder"] = ({ supplierId, supplierName, lines, status, user, delay }) => {
    const order: SupplierOrder = { id: `CMD-${String(ordersRef.current.length + 121 + counter++).padStart(4, "0")}`, supplierId, supplierName, date: TODAY(), expectedDate: new Date(Date.now() + delay * 86400_000).toISOString(), status, lines: lines.map((l) => ({ ...l, received: 0 })), history: [{ date: TODAY(), status, user }] };
    ordersRef.current = [order, ...ordersRef.current];
    setOrders(ordersRef.current);
    log(user, status === "Simulation" ? "Simulation de commande" : "Nouvelle commande fournisseur", order.id, "Économat");
    return order;
  };

  const setOrderStatus: WorkflowValue["setOrderStatus"] = (id, status, user) => {
    const order = ordersRef.current.find((o) => o.id === id);
    if (!order || order.status === status) return;
    ordersRef.current = ordersRef.current.map((o) => o.id === id ? { ...o, status, history: [...o.history, { date: TODAY(), status, user }] } : o);
    setOrders(ordersRef.current);
    log(user, status === "Validée" ? "Validation commande fournisseur" : `Commande ${status.toLowerCase()}`, id, "Économat");
    if (status === "Envoyée" || status === "En attente de réception") notify("economat", "Réception attendue", `${id} · ${order.supplierName}`, "/receptions");
  };

  const receiveOrder: WorkflowValue["receiveOrder"] = (orderId, received, user) => {
    const order = ordersRef.current.find((o) => o.id === orderId);
    if (!order || !["Envoyée", "En attente de réception", "Partiellement reçue", "Validée"].includes(order.status)) return null;
    const opId = `RCV:${orderId}:${order.lines.map((l) => l.received).join("-")}`;
    const lines = order.lines.map((l) => { const remaining = l.ordered - l.received; const qty = Math.max(0, received[l.articleId] ?? 0); return { articleId: l.articleId, ordered: remaining, received: qty, gap: qty - remaining }; });
    const reception: Reception = { id: uid("REC"), orderId, supplierName: order.supplierName, date: TODAY(), user, lines };
    const ok = applyMovements(opId, "Réception", reception.id, user, lines.map((l) => ({ articleId: l.articleId, location: "Économat" as Location, delta: l.received })));
    if (!ok) return null;
    const newLines = order.lines.map((l) => ({ ...l, received: l.received + (received[l.articleId] ?? 0) }));
    const status = orderOutcome(newLines);
    ordersRef.current = ordersRef.current.map((o) => o.id === orderId ? { ...o, lines: newLines, status, history: [...o.history, { date: TODAY(), status, user }] } : o);
    setOrders(ordersRef.current);
    setReceptions((p) => [reception, ...p]);
    lines.forEach((l) => ops.updateArticle(l.articleId, { achats: (articlesRef.current.find((a) => a.id === l.articleId)?.achats ?? 0) + l.received }));
    log(user, `Réception effectuée (${status === "Reçue" ? "complète" : "partielle"})`, reception.id, "Économat");
    const gaps = lines.filter((l) => l.gap < 0);
    if (gaps.length) {
      ops.addAlert({ type: "Réception", title: `Écart de réception ${orderId}`, detail: gaps.map((g) => `${articlesRef.current.find((a) => a.id === g.articleId)?.nom} : ${g.received}/${g.ordered}`).join(" · "), impact: "Reliquat à recevoir ou à réclamer au fournisseur.", level: "Modérée" });
      notify("admin", "Écart important", `${reception.id} : écart sur ${gaps.length} produit(s)`, "/alertes");
    }
    return reception;
  };

  const setServiceRef: WorkflowValue["setServiceRef"] = (articleId, service, value) => setServiceRefs((p) => ({ ...p, [articleId]: { ...p[articleId], [service]: value } }));
  const markRead = (id: string) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));

  const value = useMemo<WorkflowValue>(() => ({ serviceStock, serviceRefs, movements, requests, orders, receptions, recipes: SEED_RECIPES, sales, notifications, activity, recordSale, createRequest, setRequestStatus, processRequest, adjustStock, createOrder, setOrderStatus, receiveOrder, setServiceRef, markRead }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serviceStock, serviceRefs, movements, requests, orders, receptions, sales, notifications, activity, ops]);
  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}
