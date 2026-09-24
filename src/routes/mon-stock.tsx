import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FilePlus2, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScopeSelect } from "@/components/workflow-ui";
import { useAuth } from "@/lib/auth";
import { useOperations } from "@/lib/operations-context";
import { can, type ServiceName } from "@/lib/permissions";
import { useServiceChoice } from "@/lib/use-service-choice";
import { useWorkflow } from "@/lib/workflow-context";
import { fmtDate, serviceLevel } from "@/lib/workflow-logic";

export const Route = createFileRoute("/mon-stock")({
  validateSearch: (s: Record<string, unknown>): { filtre?: string } => (typeof s.filtre === "string" ? { filtre: s.filtre } : {}),
  head: () => ({ meta: [{ title: "Mon Stock — Habanera" }, { name: "description", content: "Stock du service comparé au stock de référence, produits à prélever." }, { property: "og:title", content: "Mon Stock — Habanera" }, { property: "og:description", content: "Stock Bar et Cuisine vs stock de référence." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MyStock,
});

function MyStock() {
  const { filtre } = Route.useSearch();
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const navigate = useNavigate();
  const { service, setService, allowed } = useServiceChoice();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(filtre === "manquant" ? "Manquant" : filtre === "a-prelever" ? "À prélever" : "Tous");
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => articles.filter((a) => wf.serviceRefs[a.id]?.[service] !== undefined).map((a) => {
    const lvl = serviceLevel(wf.serviceStock, wf.serviceRefs, a.id, service);
    const last = wf.movements.find((m) => m.articleId === a.id && m.location === service);
    return { a, ...lvl, last: last?.date };
  }).filter((r) => r.a.nom.toLowerCase().includes(q.toLowerCase()) && (status === "Tous" || (status === "À prélever" ? r.status !== "OK" : r.status === status))), [articles, wf, service, q, status]);
  const { paged, page, pageCount, setPage, total } = usePagination(rows, 10);
  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  function createBon(send: boolean) {
    const lines = rows.filter((r) => selected.includes(r.a.id)).map((r) => ({ articleId: r.a.id, requested: Math.max(1, Math.ceil((r.ref ?? 0) - r.current)) }));
    if (!lines.length || !user) return;
    const req = wf.createRequest({ service, lines, comment: "Généré depuis Mon Stock", user: user.nom, send });
    setSelected([]);
    toast.success(send ? `${req.id} envoyé à l'économat.` : `${req.id} enregistré en brouillon.`);
    navigate({ to: "/bons-prelevement" });
  }

  return <AppShell title={`Mon Stock — ${service}`} subtitle="Écart = stock actuel − stock de référence" action={<div className="flex flex-wrap gap-2">{allowed.length > 1 && <ScopeSelect value={service} onChange={(v) => { setService(v as ServiceName); setSelected([]); }} options={allowed} />}{can(user?.role, "bon.create") && <><Button variant="outline" disabled={!selected.length} onClick={() => createBon(false)}><FilePlus2 className="mr-2 h-4 w-4" />Brouillon</Button><Button disabled={!selected.length} onClick={() => createBon(true)}><Send className="mr-2 h-4 w-4" />Créer et envoyer ({selected.length})</Button></>}</div>}>
    <Card><CardContent className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-48" aria-label="Statut"><SelectValue /></SelectTrigger><SelectContent>{["Tous", "À prélever", "Manquant", "OK"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" onClick={() => setSelected(rows.filter((r) => r.status !== "OK").map((r) => r.a.id))}>Sélectionner les manques</Button>
      </div>
      <div className="mt-5 overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead className="w-10" /><TableHead>Produit</TableHead><TableHead>Catégorie</TableHead><TableHead>Stock</TableHead><TableHead>Référence</TableHead><TableHead>Écart</TableHead><TableHead>Statut</TableHead><TableHead>Dernière mise à jour</TableHead></TableRow></TableHeader>
        <TableBody>{paged.map((r) => <TableRow key={r.a.id}>
          <TableCell><Checkbox checked={selected.includes(r.a.id)} onCheckedChange={() => toggle(r.a.id)} aria-label={`Sélectionner ${r.a.nom}`} /></TableCell>
          <TableCell className="font-medium">{r.a.nom}</TableCell><TableCell>{r.a.categorie}</TableCell>
          <TableCell>{r.current} {r.a.unite}</TableCell><TableCell>{r.ref}</TableCell>
          <TableCell className={r.gap < 0 ? "text-destructive" : "text-success"}>{r.gap > 0 ? "+" : ""}{r.gap}</TableCell>
          <TableCell><Badge variant={r.status === "OK" ? "success" : r.status === "Manquant" ? "destructive" : "warning"}>{r.status}</Badge></TableCell>
          <TableCell className="text-xs text-muted-foreground">{r.last ? fmtDate(r.last, true) : "—"}</TableCell>
        </TableRow>)}</TableBody>
      </Table></div>
      {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun produit pour ce filtre.</p>}
      <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="produits" />
    </CardContent></Card>
  </AppShell>;
}
