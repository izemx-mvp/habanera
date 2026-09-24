import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockCible, isActive } from "@/lib/habanera-data";
import { useOperations } from "@/lib/operations-context";
import { ACCESS_MATRIX } from "@/lib/permissions";
import { useWorkflow } from "@/lib/workflow-context";

export const Route = createFileRoute("/configuration")({
  head: () => ({ meta: [{ title: "Configuration — Habanera" }, { name: "description", content: "Seuils, stocks cibles, stocks de référence Bar/Cuisine, règles et permissions." }, { property: "og:title", content: "Configuration — Habanera" }, { property: "og:description", content: "Paramétrage des stocks et des accès Habanera." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const [tab, setTab] = useState("stocks");
  return <AppShell title="Configuration" subtitle="Stocks, règles d'alerte, workflow et accès">
    <Tabs value={tab} onValueChange={setTab}><TabsList className="flex h-auto flex-wrap"><TabsTrigger value="stocks">Stocks & seuils</TabsTrigger><TabsTrigger value="regles">Alertes & workflow</TabsTrigger><TabsTrigger value="acces">Rôles & accès</TabsTrigger></TabsList></Tabs>
    <div className="mt-5">{tab === "stocks" ? <StockSettings /> : tab === "regles" ? <Rules /> : <Access />}</div>
  </AppShell>;
}

function NumberCell({ value, onCommit, label }: { value: number | undefined; onCommit: (v: number | undefined) => void; label: string }) {
  return <Input type="number" min={0} className="w-24" defaultValue={value ?? ""} placeholder="—" aria-label={label} onBlur={(e) => { const raw = e.target.value; const v = raw === "" ? undefined : Number(raw); if (v !== value) { onCommit(v); toast.success(`${label} mis à jour.`); } }} />;
}

function StockSettings() {
  const { articles, updateArticle } = useOperations();
  const wf = useWorkflow();
  const [q, setQ] = useState("");
  const rows = useMemo(() => articles.filter((a) => a.nom.toLowerCase().includes(q.toLowerCase())), [articles, q]);
  const { paged, page, pageCount, setPage, total } = usePagination(rows, 10);
  return <Card><CardContent className="p-5">
    <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="mt-5 overflow-x-auto"><Table>
      <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Catégorie / unité</TableHead><TableHead>Seuil min. Économat</TableHead><TableHead>Stock cible</TableHead><TableHead>Réf. Cuisine</TableHead><TableHead>Réf. Bar</TableHead><TableHead>Actif</TableHead></TableRow></TableHeader>
      <TableBody>{paged.map((a) => <TableRow key={a.id}>
        <TableCell className="font-medium">{a.nom}</TableCell><TableCell className="text-xs">{a.categorie} · {a.unite}</TableCell>
        <TableCell><NumberCell label={`Seuil ${a.nom}`} value={a.seuil} onCommit={(v) => updateArticle(a.id, { seuil: v ?? 0 })} /></TableCell>
        <TableCell><NumberCell label={`Cible ${a.nom}`} value={stockCible(a)} onCommit={(v) => updateArticle(a.id, { stockCible: v ?? 0 })} /></TableCell>
        <TableCell><NumberCell label={`Référence Cuisine ${a.nom}`} value={wf.serviceRefs[a.id]?.Cuisine} onCommit={(v) => wf.setServiceRef(a.id, "Cuisine", v)} /></TableCell>
        <TableCell><NumberCell label={`Référence Bar ${a.nom}`} value={wf.serviceRefs[a.id]?.Bar} onCommit={(v) => wf.setServiceRef(a.id, "Bar", v)} /></TableCell>
        <TableCell><Switch checked={isActive(a)} onCheckedChange={(c) => { updateArticle(a.id, { actif: c }); toast.success(c ? "Produit activé." : "Produit désactivé."); }} aria-label={`Actif ${a.nom}`} /></TableCell>
      </TableRow>)}</TableBody>
    </Table></div>
    <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="produits" />
  </CardContent></Card>;
}

function Rules() {
  const [rules, setRules] = useState({ bonRetard: 24, consoFactor: 1.8, surstock: 1.6, notifRupture: true, notifRetard: true, relance: true, validationCommande: true });
  const set = (k: keyof typeof rules, v: number | boolean) => { setRules((p) => ({ ...p, [k]: v })); toast.success("Règle mise à jour."); };
  const num: Array<[keyof typeof rules, string]> = [["bonRetard", "Délai avant bon en retard (heures)"], ["consoFactor", "Consommation inhabituelle (× moyenne)"], ["surstock", "Stock anormalement élevé (× cible)"]];
  const bools: Array<[keyof typeof rules, string]> = [["notifRupture", "Notifier les ruptures"], ["notifRetard", "Notifier les retards"], ["relance", "Relances automatiques fournisseurs"], ["validationCommande", "Validation Admin/Économat obligatoire des commandes"]];
  return <div className="grid gap-6 lg:grid-cols-2">
    <Card><CardHeader><CardTitle className="text-base">Seuils d'alerte</CardTitle></CardHeader><CardContent className="space-y-4">{num.map(([k, l]) => <div key={k} className="flex items-center justify-between gap-4 text-sm"><span>{l}</span><Input type="number" className="w-24" value={rules[k] as number} onChange={(e) => set(k, Number(e.target.value))} aria-label={l} /></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Notifications & validation</CardTitle></CardHeader><CardContent className="space-y-4">{bools.map(([k, l]) => <div key={k} className="flex items-center justify-between gap-4 text-sm"><span>{l}</span><Switch checked={rules[k] as boolean} onCheckedChange={(c) => set(k, c)} aria-label={l} /></div>)}</CardContent></Card>
    <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Statuts du workflow</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>Bons :</strong> Brouillon → Envoyé → Reçu → En cours → Traité / Partiellement traité / Non traité → Livré → Clôturé</p><p><strong>Commandes :</strong> Simulation → À valider → Validée → Envoyée → En attente de réception → Partiellement reçue → Reçue → Clôturée</p></CardContent></Card>
  </div>;
}

function Access() {
  return <Card><CardContent className="overflow-x-auto p-5"><Table><TableHeader><TableRow><TableHead>Rôle</TableHead><TableHead>Espaces</TableHead><TableHead>Actions autorisées</TableHead></TableRow></TableHeader><TableBody>{ACCESS_MATRIX.map((r) => <TableRow key={r.role}><TableCell className="font-medium">{r.role}</TableCell><TableCell><div className="flex flex-wrap gap-1">{r.spaces.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div></TableCell><TableCell className="text-xs text-muted-foreground">{r.actions}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
}
