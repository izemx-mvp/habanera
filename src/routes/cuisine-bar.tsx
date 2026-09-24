import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, Boxes, CheckCircle2, ClipboardList, PackageX, ReceiptText } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActivityList, AlertList, KpiCard, ScopeSelect } from "@/components/workflow-ui";
import { formatMAD } from "@/lib/habanera-data";
import { useAuth } from "@/lib/auth";
import { useOperations } from "@/lib/operations-context";
import { roleServices, type ServiceName } from "@/lib/permissions";
import { useInsights } from "@/lib/use-insights";
import { useWorkflow } from "@/lib/workflow-context";
import { inPeriod, PENDING_REQUEST, serviceLevel } from "@/lib/workflow-logic";

export const Route = createFileRoute("/cuisine-bar")({
  head: () => ({ meta: [{ title: "Dashboard Cuisine & Bar — Habanera" }, { name: "description", content: "Stock du service, bons de prélèvement et ventes du jour pour la cuisine et le bar." }, { property: "og:title", content: "Dashboard Cuisine & Bar — Habanera" }, { property: "og:description", content: "Suivi opérationnel du service Habanera." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ServiceDashboard,
});

export function useServiceChoice() {
  const { user } = useAuth();
  const allowed = user ? roleServices(user.role) : (["Bar"] as ServiceName[]);
  const [service, setService] = useState<ServiceName>(allowed[0]!);
  return { service: allowed.includes(service) ? service : allowed[0]!, setService, allowed };
}

function ServiceDashboard() {
  const { articles } = useOperations();
  const wf = useWorkflow();
  const { alerts } = useInsights();
  const { service, setService, allowed } = useServiceChoice();
  const rows = articles.filter((a) => wf.serviceRefs[a.id]?.[service] !== undefined).map((a) => serviceLevel(wf.serviceStock, wf.serviceRefs, a.id, service));
  const reqs = wf.requests.filter((r) => r.service === service);
  const sales = wf.sales.filter((s) => s.service === service && inPeriod(s.date, "Aujourd'hui"));
  const svcAlerts = alerts.filter((a) => a.location === service);
  return <AppShell title={`Dashboard ${service}`} subtitle="Stock du service, bons et ventes du jour" action={allowed.length > 1 ? <ScopeSelect value={service} onChange={(v) => setService(v as ServiceName)} options={allowed} /> : undefined}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard icon={Boxes} label="Produits suivis" value={rows.length} hint="stock du service" to="/mon-stock" />
      <KpiCard icon={AlertTriangle} tone="warning" label="Sous stock de référence" value={rows.filter((r) => r.status !== "OK").length} to="/mon-stock" search={{ filtre: "a-prelever" }} />
      <KpiCard icon={PackageX} tone="danger" label="Produits manquants" value={rows.filter((r) => r.status === "Manquant").length} to="/mon-stock" search={{ filtre: "manquant" }} />
      <KpiCard icon={ClipboardList} label="Bons en cours" value={reqs.filter((r) => r.status === "Brouillon" || PENDING_REQUEST.includes(r.status)).length} to="/bons-prelevement" search={{ statut: "attente" }} />
      <KpiCard icon={CheckCircle2} tone="success" label="Bons traités récemment" value={reqs.filter((r) => ["Traité", "Partiellement traité", "Livré"].includes(r.status)).length} to="/bons-prelevement" search={{ statut: "traites" }} />
      <KpiCard icon={ReceiptText} tone="success" label="Ventes du jour" value={formatMAD(sales.reduce((t, s) => t + s.total, 0))} hint={`${sales.reduce((t, s) => t + s.quantity, 0)} articles`} to="/ventes" />
      <KpiCard icon={Bell} tone={svcAlerts.length ? "danger" : "default"} label="Alertes" value={svcAlerts.length} to="/notifications" />
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><AlertList items={svcAlerts} /><ActivityList items={wf.activity.filter((a) => a.location === service)} /></div>
  </AppShell>;
}
