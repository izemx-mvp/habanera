import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { useOperations } from "@/lib/operations-context";
import { can } from "@/lib/permissions";
import { useWorkflow } from "@/lib/workflow-context";
import { fmtDate, type Location } from "@/lib/workflow-logic";

export const Route = createFileRoute("/mouvements")({
  validateSearch: (s: Record<string, unknown>): { type?: string } => (typeof s["type"] === "string" ? { type: s["type"] } : {}),
  head: () => ({ meta: [{ title: "Stock & mouvements — Habanera" }, { name: "description", content: "Historique traçable des entrées, sorties, prélèvements, réceptions et ajustements." }, { property: "og:title", content: "Stock & mouvements — Habanera" }, { property: "og:description", content: "Traçabilité complète des mouvements de stock." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MovementsPage,
});

const TYPES = ["Vente / Consommation", "Prélèvement", "Réception", "Ajustement", "Inventaire"];

function MovementsPage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const [q, setQ] = useState("");
  const [type, setType] = useState(search.type ?? "Tous");
  const [loc, setLoc] = useState("Tous");
  const [adjArticle, setAdjArticle] = useState("");
  const [adjLoc, setAdjLoc] = useState<Location>("Économat");
  const [adjQty, setAdjQty] = useState(0);
  const [reason, setReason] = useState("Casse / correction");
  const key = useRef(crypto.randomUUID());
  const name = (id: string) => articles.find((a) => a.id === id);
  const rows = useMemo(() => wf.movements.filter((m) => (type === "Tous" || m.type === type) && (loc === "Tous" || m.location === loc) && ((name(m.articleId)?.nom ?? "").toLowerCase().includes(q.toLowerCase()) || m.reference.toLowerCase().includes(q.toLowerCase()) || m.user.toLowerCase().includes(q.toLowerCase()))), [wf.movements, type, loc, q, articles]);
  const { paged, page, pageCount, setPage, total } = usePagination(rows, 10);

  function adjust() {
    if (!adjArticle || adjQty < 0 || !user) return;
    if (wf.adjustStock(key.current, { articleId: adjArticle, location: adjLoc, newQuantity: adjQty, user: user.nom, reason })) { key.current = crypto.randomUUID(); toast.success("Ajustement enregistré dans l'historique."); }
  }

  return <AppShell title="Stock & mouvements" subtitle="Chaque mouvement : stock avant, quantité, stock après, utilisateur et référence" action={<Button variant="outline" asChild><Link to="/inventaire">Inventaire</Link></Button>}>
    {can(user?.role, "stock.adjust") && <Card className="mb-6"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" />Ajustement de stock</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_160px_140px_1fr_auto]">
      <Select value={adjArticle} onValueChange={setAdjArticle}><SelectTrigger aria-label="Produit"><SelectValue placeholder="Produit" /></SelectTrigger><SelectContent>{articles.map((a) => <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>)}</SelectContent></Select>
      <Select value={adjLoc} onValueChange={(v) => setAdjLoc(v as Location)}><SelectTrigger aria-label="Stock"><SelectValue /></SelectTrigger><SelectContent>{["Économat", "Bar", "Cuisine"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
      <Input type="number" min={0} value={adjQty} onChange={(e) => setAdjQty(Number(e.target.value))} aria-label="Nouveau stock" placeholder="Nouveau stock" />
      <Input value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Motif" />
      <Button disabled={!adjArticle} onClick={adjust}>Enregistrer</Button>
      {adjArticle && <p className="text-xs text-muted-foreground md:col-span-5">Stock actuel : {adjLoc === "Économat" ? name(adjArticle)?.stock : wf.serviceStock[adjArticle]?.[adjLoc] ?? 0} {name(adjArticle)?.unite}</p>}
    </CardContent></Card>}
    <Card><CardContent className="p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_160px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Produit, référence ou utilisateur" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={type} onValueChange={setType}><SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Tous les types</SelectItem>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Select value={loc} onValueChange={setLoc}><SelectTrigger aria-label="Stock"><SelectValue /></SelectTrigger><SelectContent>{["Tous", "Économat", "Bar", "Cuisine"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
      <div className="mt-5 overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Produit</TableHead><TableHead>Type</TableHead><TableHead>Stock</TableHead><TableHead>Quantité</TableHead><TableHead>Avant</TableHead><TableHead>Après</TableHead><TableHead>Utilisateur</TableHead><TableHead>Référence</TableHead></TableRow></TableHeader>
        <TableBody>{paged.map((m) => <TableRow key={m.id}><TableCell className="text-xs">{fmtDate(m.date, true)}</TableCell><TableCell className="font-medium">{name(m.articleId)?.nom}</TableCell><TableCell><Badge variant="outline">{m.type}</Badge></TableCell><TableCell>{m.location}</TableCell><TableCell className={m.quantity < 0 ? "text-destructive" : "text-success"}>{m.quantity > 0 ? "+" : ""}{m.quantity}</TableCell><TableCell>{m.before}</TableCell><TableCell>{m.after}</TableCell><TableCell>{m.user}</TableCell><TableCell>{m.reference}</TableCell></TableRow>)}</TableBody>
      </Table></div>
      <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="mouvements" />
    </CardContent></Card>
  </AppShell>;
}
