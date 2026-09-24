import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Boxes, ClipboardList, Clock, Coins, FileWarning, PackageCheck, PackageSearch, PackageX, ReceiptText, ShoppingCart, Truck, Utensils, Wallet, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityList, AlertList, AnomalyList, KpiCard, ScopeSelect } from "@/components/workflow-ui";
import { formatMAD, isActive } from "@/lib/habanera-data";
import { useOperations } from "@/lib/operations-context";
import type { ServiceName } from "@/lib/permissions";
import { useInsights } from "@/lib/use-insights";
import { useWorkflow } from "@/lib/workflow-context";
import { isLate, isOut, isUnderThreshold, OPEN_ORDER, PENDING_REQUEST, serviceLevel, inPeriod } from "@/lib/workflow-logic";

export const Route = createFileRoute("/tableau-de-bord")({
  head: () => ({ meta: [{ title: "Dashboard Administration — Habanera" }, { name: "description", content: "Pilotage global des stocks, bons, commandes, ventes et anomalies Habanera." }, { property: "og:title", content: "Dashboard Administration — Habanera" }, { property: "og:description", content: "Vue globale et filtrable de l'activité Habanera." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AdminDashboard,
});

type Scope = "Tous" | "Cuisine" | "Bar" | "Économat";

function AdminDashboard() {
  const { articles, suppliers } = useOperations();
  const wf = useWorkflow();
  const { alerts, anomalies } = useInsights();
  const [scope, setScope] = useState<Scope>("Tous");
  const services: ServiceName[] = scope === "Bar" || scope === "Cuisine" ? [scope] : scope === "Tous" ? ["Bar", "Cuisine"] : [];
  const withEco = scope === "Tous" || scope === "Économat";

  const k = useMemo(() => {
    const active = articles.filter(isActive);
    const svcRows = services.flatMap((s) => active.filter((a) => wf.serviceRefs[a.id]?.[s] !== undefined).map((a) => ({ a, s, lvl: serviceLevel(wf.serviceStock, wf.serviceRefs, a.id, s) })));
    const ecoUnits = withEco ? active.reduce((t, a) => t + a.stock, 0) : 0;
    const ecoValue = withEco ? active.reduce((t, a) => t + a.stock * a.prixAchat, 0) : 0;
    const svcValue = svcRows.reduce((t, r) => t + r.lvl.current * r.a.prixAchat, 0);
    const reqs = wf.requests.filter((r) => scope === "Tous" || scope === "Économat" || r.service === scope);
    const pending = reqs.filter((r) => PENDING_REQUEST.includes(r.status));
    const todaySales = wf.sales.filter((s) => inPeriod(s.date, "Aujourd'hui") && services.includes(s.service));
    const consos = wf.movements.filter((m) => m.type === "Vente / Consommation" && inPeriod(m.date, "Aujourd'hui") && services.includes(m.location as ServiceName));
    const scopedAnomalies = anomalies.filter((a) => scope === "Tous" || a.location === scope);
    return {
      units: Math.round(ecoUnits + svcRows.reduce((t, r) => t + r.lvl.current, 0)),
      value: ecoValue + svcValue,
      products: withEco ? active.length : new Set(svcRows.map((r) => r.a.id)).size,
      under: (withEco ? active.filter(isUnderThreshold).length : 0) + svcRows.filter((r) => r.lvl.status !== "OK").length,
      out: (withEco ? active.filter(isOut).length : 0) + svcRows.filter((r) => r.lvl.status === "Manquant").length,
      pending: pending.length, late: pending.filter((r) => isLate(r.date, 24)).length,
      orders: withEco ? wf.orders.filter((o) => OPEN_ORDER.includes(o.status)).length : 0,
      receptions: withEco ? wf.orders.filter((o) => ["Validée", "Envoyée", "En attente de réception", "Partiellement reçue"].includes(o.status)).length : 0,
      suppliers: suppliers.filter((s) => s.active).length,
      sales: todaySales.reduce((t, s) => t + s.total, 0), salesCount: todaySales.reduce((t, s) => t + s.quantity, 0),
      consos: consos.length,
      gaps: scopedAnomalies.filter((a) => a.kind === "Écart de réception" || a.kind === "Écart de stock").length,
      anomalies: scopedAnomalies,
    };
  }, [articles, suppliers, wf, anomalies, scope, services, withEco]);

  const chart = useMemo(() => {
    const days = new Map<string, { jour: string; Bar: number; Cuisine: number }>();
    [...wf.sales].sort((a, b) => a.date.localeCompare(b.date)).forEach((s) => { const key = s.date.slice(0, 10); const row = days.get(key) ?? { jour: new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }), Bar: 0, Cuisine: 0 }; row[s.service] += s.total; days.set(key, row); });
    return [...days.values()];
  }, [wf.sales]);

  const scopedAlerts = alerts.filter((a) => scope === "Tous" || a.location === scope);
  const scopedActivity = wf.activity.filter((a) => scope === "Tous" || a.location === scope);

  return <AppShell title="Dashboard Administration" subtitle="Vue globale de l'activité · données calculées en temps réel" action={<ScopeSelect value={scope} onChange={(v) => setScope(v as Scope)} options={["Tous", "Cuisine", "Bar", "Économat"]} />}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard icon={Boxes} label="Stock total" value={k.units.toLocaleString("fr-FR")} hint="unités tous produits" to="/stock" />
      <KpiCard icon={Wallet} label="Valeur du stock" value={formatMAD(k.value)} hint={scope} to="/stock" />
      <KpiCard icon={PackageSearch} label="Produits" value={k.products} hint="références actives" to="/stock" />
      <KpiCard icon={AlertTriangle} tone="warning" label="Produits sous seuil" value={k.under} hint="seuil / référence" to="/stock" search={{ filtre: "sous-seuil" }} />
      <KpiCard icon={PackageX} tone="danger" label="Produits en rupture" value={k.out} to="/stock" search={{ filtre: "rupture" }} />
      <KpiCard icon={ClipboardList} label="Bons en attente" value={k.pending} to="/bons-prelevement" search={{ statut: "attente" }} />
      <KpiCard icon={Clock} tone={k.late ? "danger" : "default"} label="Bons en retard" value={k.late} hint="> 24 h sans traitement" to="/bons-prelevement" search={{ statut: "retard" }} />
      <KpiCard icon={ShoppingCart} label="Commandes en cours" value={k.orders} to="/approvisionnement" search={{ onglet: "commandes" }} />
      <KpiCard icon={PackageCheck} label="Réceptions en attente" value={k.receptions} to="/receptions" />
      <KpiCard icon={Truck} label="Fournisseurs actifs" value={k.suppliers} to="/fournisseurs" />
      <KpiCard icon={ReceiptText} tone="success" label="Ventes du jour" value={formatMAD(k.sales)} hint={`${k.salesCount} articles vendus`} to="/ventes" />
      <KpiCard icon={Utensils} label="Consommations du jour" value={k.consos} hint="mouvements automatiques" to="/mouvements" search={{ type: "Vente / Consommation" }} />
      <KpiCard icon={Scale} tone="warning" label="Écarts de stock" value={k.gaps} hint="réception & inventaire" to="/alertes" search={{ vue: "anomalies" }} />
      <KpiCard icon={FileWarning} tone={k.anomalies.length ? "danger" : "default"} label="Anomalies" value={k.anomalies.length} to="/alertes" search={{ vue: "anomalies" }} />
      <KpiCard icon={Coins} label="Alertes actives" value={scopedAlerts.length} to="/alertes" />
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card><CardHeader><CardTitle className="text-base">Ventes par service (MAD)</CardTitle></CardHeader><CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="jour" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend />{(scope === "Tous" || scope === "Bar") && <Bar dataKey="Bar" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />}{(scope === "Tous" || scope === "Cuisine") && <Bar dataKey="Cuisine" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />}</BarChart></ResponsiveContainer>
      </CardContent></Card>
      <AlertList items={scopedAlerts} />
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]"><AnomalyList items={k.anomalies} /><ActivityList items={scopedActivity} /></div>
  </AppShell>;
}
