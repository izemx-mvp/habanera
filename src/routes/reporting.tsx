import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScopeSelect } from "@/components/workflow-ui";
import { formatMAD, isActive } from "@/lib/habanera-data";
import { useOperations } from "@/lib/operations-context";
import { useInsights } from "@/lib/use-insights";
import { useWorkflow } from "@/lib/workflow-context";
import { inPeriod, type Period } from "@/lib/workflow-logic";

export const Route = createFileRoute("/reporting")({
  head: () => ({ meta: [{ title: "Reporting — Habanera" }, { name: "description", content: "Rapports stocks, ventes, consommations, prélèvements, achats, ruptures et anomalies." }, { property: "og:title", content: "Reporting — Habanera" }, { property: "og:description", content: "Reporting de pilotage Habanera par période." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ReportingPage,
});

function ReportingPage() {
  const { articles, suppliers } = useOperations();
  const wf = useWorkflow();
  const { anomalies } = useInsights();
  const [period, setPeriod] = useState<Period>("Ce mois");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const inP = (d: string) => inPeriod(d, period, from, to);
  const r = useMemo(() => {
    const mv = wf.movements.filter((m) => inP(m.date));
    const byType = ["Vente / Consommation", "Prélèvement", "Réception", "Ajustement", "Inventaire"].map((t) => ({ type: t, count: mv.filter((m) => m.type === t).length }));
    const sales = wf.sales.filter((s) => inP(s.date));
    const orders = wf.orders.filter((o) => inP(o.date));
    const receptions = wf.receptions.filter((x) => inP(x.date));
    const reqs = wf.requests.filter((x) => inP(x.date));
    const topConsumed = articles.map((a) => ({ nom: a.nom, qty: -mv.filter((m) => m.articleId === a.id && m.type === "Vente / Consommation").reduce((t, m) => t + m.quantity, 0), unite: a.unite })).filter((x) => x.qty > 0).sort((a, b) => b.qty - a.qty).slice(0, 8);
    const perSupplier = suppliers.map((s) => ({ name: s.name, orders: orders.filter((o) => o.supplierId === s.id).length, amount: orders.filter((o) => o.supplierId === s.id).reduce((t, o) => t + o.lines.reduce((u, l) => u + l.ordered * l.unitPrice, 0), 0) })).filter((x) => x.orders > 0);
    return { byType, sales, orders, receptions, reqs, topConsumed, perSupplier };
  }, [wf, articles, suppliers, period, from, to]);
  const stockValue = articles.filter(isActive).reduce((t, a) => t + a.stock * a.prixAchat, 0);
  const stats: Array<[string, string | number]> = [
    ["Valeur du stock Économat", formatMAD(stockValue)], ["Ventes", formatMAD(r.sales.reduce((t, s) => t + s.total, 0))], ["Articles vendus", r.sales.reduce((t, s) => t + s.quantity, 0)],
    ["Prélèvements", r.reqs.length], ["Commandes", r.orders.length], ["Réceptions", r.receptions.length],
    ["Ruptures actuelles", articles.filter((a) => isActive(a) && a.stock <= 0).length], ["Anomalies", anomalies.filter((a) => inP(a.date)).length],
  ];
  return <AppShell title="Reporting" subtitle="Consultez l'activité par période" action={<div className="flex flex-wrap items-center gap-2"><ScopeSelect value={period} onChange={(v) => setPeriod(v as Period)} options={["Aujourd'hui", "Cette semaine", "Ce mois", "Mois précédent", "Personnalisée", "Tout"]} />{period === "Personnalisée" && <><Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Du" /><Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Au" /></>}</div>}>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([l, v]) => <Card key={l}><CardContent className="p-4"><p className="font-display text-2xl">{v}</p><p className="text-xs text-muted-foreground">{l}</p></CardContent></Card>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Mouvements de stock par type</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={r.byType}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="type" fontSize={10} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Mouvements" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Produits les plus consommés</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Produit</TableHead><TableHead className="text-right">Consommation</TableHead></TableRow></TableHeader><TableBody>{r.topConsumed.map((x) => <TableRow key={x.nom}><TableCell>{x.nom}</TableCell><TableCell className="text-right">{+x.qty.toFixed(2)} {x.unite}</TableCell></TableRow>)}</TableBody></Table>{r.topConsumed.length === 0 && <p className="py-4 text-sm text-muted-foreground">Aucune consommation sur la période.</p>}</CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Fournisseurs</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Fournisseur</TableHead><TableHead>Commandes</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader><TableBody>{r.perSupplier.map((s) => <TableRow key={s.name}><TableCell>{s.name}</TableCell><TableCell>{s.orders}</TableCell><TableCell className="text-right">{formatMAD(s.amount)}</TableCell></TableRow>)}</TableBody></Table>{r.perSupplier.length === 0 && <p className="py-4 text-sm text-muted-foreground">Aucune commande sur la période.</p>}</CardContent></Card>
    </div>
  </AppShell>;
}
