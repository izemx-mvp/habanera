import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Boxes, ClipboardList, PackageCheck, PackageX, ShoppingCart, SplitSquareHorizontal, Bell } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertList, KpiCard } from "@/components/workflow-ui";
import { isActive } from "@/lib/habanera-data";
import { useOperations } from "@/lib/operations-context";
import { useInsights } from "@/lib/use-insights";
import { useWorkflow } from "@/lib/workflow-context";
import { fmtDate, isOut, isUnderThreshold, OPEN_ORDER, PENDING_REQUEST } from "@/lib/workflow-logic";

export const Route = createFileRoute("/economat")({
  head: () => ({ meta: [{ title: "Dashboard Économat — Habanera" }, { name: "description", content: "Stock économat, bons à traiter, commandes et réceptions Habanera." }, { property: "og:title", content: "Dashboard Économat — Habanera" }, { property: "og:description", content: "Pilotage quotidien de l'économat Habanera." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: EconomatDashboard,
});

function EconomatDashboard() {
  const { articles } = useOperations();
  const wf = useWorkflow();
  const { alerts } = useInsights();
  const active = articles.filter(isActive);
  const eco = alerts.filter((a) => a.location === "Économat" || a.type === "Bon en retard");
  const name = (id: string) => articles.find((a) => a.id === id)?.nom ?? id;
  return <AppShell title="Dashboard Économat" subtitle="Stock central, préparation des bons et approvisionnements">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard icon={Boxes} label="Stock total" value={Math.round(active.reduce((t, a) => t + a.stock, 0)).toLocaleString("fr-FR")} hint={`${active.length} références`} to="/stock" />
      <KpiCard icon={AlertTriangle} tone="warning" label="Produits sous seuil" value={active.filter(isUnderThreshold).length} to="/stock" search={{ filtre: "sous-seuil" }} />
      <KpiCard icon={PackageX} tone="danger" label="Produits en rupture" value={active.filter(isOut).length} to="/stock" search={{ filtre: "rupture" }} />
      <KpiCard icon={ClipboardList} label="Bons à traiter" value={wf.requests.filter((r) => PENDING_REQUEST.includes(r.status)).length} to="/bons-prelevement" search={{ statut: "attente" }} />
      <KpiCard icon={SplitSquareHorizontal} tone="warning" label="Bons partiellement traités" value={wf.requests.filter((r) => r.status === "Partiellement traité").length} to="/bons-prelevement" search={{ statut: "partiel" }} />
      <KpiCard icon={ShoppingCart} label="Commandes en cours" value={wf.orders.filter((o) => OPEN_ORDER.includes(o.status)).length} to="/approvisionnement" search={{ onglet: "commandes" }} />
      <KpiCard icon={PackageCheck} label="Réceptions en attente" value={wf.orders.filter((o) => ["Validée", "Envoyée", "En attente de réception", "Partiellement reçue"].includes(o.status)).length} to="/receptions" />
      <KpiCard icon={Bell} tone={eco.length ? "danger" : "default"} label="Alertes" value={eco.length} to="/alertes" />
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <AlertList items={eco} />
      <Card><CardHeader><CardTitle className="text-base">Derniers mouvements de stock</CardTitle></CardHeader><CardContent className="divide-y divide-border p-0">
        {wf.movements.filter((m) => m.location === "Économat").slice(0, 8).map((m) => <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><div><p className="font-medium">{name(m.articleId)}</p><p className="text-xs text-muted-foreground">{m.type} · {m.reference} · {m.user}</p></div><div className="text-right"><Badge variant={m.quantity >= 0 ? "success" : "elevated"}>{m.quantity > 0 ? "+" : ""}{m.quantity}</Badge><p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(m.date, true)}</p></div></div>)}
      </CardContent></Card>
    </div>
  </AppShell>;
}
