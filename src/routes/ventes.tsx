import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
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
import { formatMAD } from "@/lib/habanera-data";
import { useOperations } from "@/lib/operations-context";
import { can, roleServices, type ServiceName } from "@/lib/permissions";
import { useWorkflow } from "@/lib/workflow-context";
import { consumptionFor, fmtDate } from "@/lib/workflow-logic";

export const Route = createFileRoute("/ventes")({
  head: () => ({ meta: [{ title: "Ventes & Consommations — Habanera" }, { name: "description", content: "Ventes par recette et déduction automatique des consommations du stock Bar et Cuisine." }, { property: "og:title", content: "Ventes & Consommations — Habanera" }, { property: "og:description", content: "Vente → recette → consommation → stock du service." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SalesPage,
});

function SalesPage() {
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const services = user ? roleServices(user.role) : [];
  const [service, setService] = useState<string>(services.length > 1 ? "Tous" : services[0] ?? "Bar");
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [product, setProduct] = useState("Tous");
  const [recipeId, setRecipeId] = useState("");
  const [qty, setQty] = useState(1);
  const opKey = useRef(crypto.randomUUID());
  const name = (id: string) => articles.find((a) => a.id === id);
  const recipe = wf.recipes.find((r) => r.id === recipeId);

  const rows = useMemo(() => wf.sales.filter((s) => services.includes(s.service) && (service === "Tous" || s.service === service) && (!date || s.date.slice(0, 10) === date) && (product === "Tous" || wf.recipes.find((r) => r.id === s.recipeId)?.ingredients.some((i) => i.articleId === product)) && (wf.recipes.find((r) => r.id === s.recipeId)?.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))), [wf.sales, wf.recipes, services, service, date, product, q]);
  const { paged, page, pageCount, setPage, total } = usePagination(rows, 8);
  const usedProducts = [...new Set(wf.recipes.filter((r) => services.includes(r.service)).flatMap((r) => r.ingredients.map((i) => i.articleId)))];

  function submit() {
    if (!recipe || qty <= 0 || !user) return;
    const sale = wf.recordSale(opKey.current, { service: recipe.service, recipeId: recipe.id, quantity: qty, user: user.nom });
    if (sale) { opKey.current = crypto.randomUUID(); toast.success(`${sale.id} : ${qty} × ${recipe.name}. Stock ${recipe.service} déduit automatiquement.`); setQty(1); }
  }

  return <AppShell title="Ventes & Consommations" subtitle="Vente → recette → ingrédients → consommation → stock du service">
    {can(user?.role, "vente.create") && <Card className="mb-6"><CardHeader><CardTitle className="text-base">Enregistrer une vente (ou import caisse)</CardTitle></CardHeader><CardContent>
      <div className="flex flex-col gap-3 sm:flex-row"><Select value={recipeId} onValueChange={setRecipeId}><SelectTrigger className="sm:w-72" aria-label="Article vendu"><SelectValue placeholder="Article vendu" /></SelectTrigger><SelectContent>{wf.recipes.filter((r) => services.includes(r.service)).map((r) => <SelectItem key={r.id} value={r.id}>{r.name} · {r.service} · {formatMAD(r.price)}</SelectItem>)}</SelectContent></Select><Input type="number" min={1} className="sm:w-28" value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label="Quantité vendue" /><Button disabled={!recipe || qty <= 0} onClick={submit}><Plus className="mr-2 h-4 w-4" />Enregistrer</Button></div>
      {recipe && <div className="mt-3 flex flex-wrap gap-2 text-xs">{consumptionFor(recipe, qty).map((c) => <Badge key={c.articleId} variant="outline">{name(c.articleId)?.nom} −{c.qty} {name(c.articleId)?.unite}</Badge>)}</div>}
      <p className="mt-3 text-xs text-muted-foreground">Structure prête pour une intégration caisse : chaque ligne importée appelle la même règle de consommation. Les tickets Z restent consultables dans <Link to="/ventes-z" className="text-primary underline">Données Z</Link>.</p>
    </CardContent></Card>}
    <Card><CardContent className="p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_160px_200px_170px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Article vendu ou N°" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={service} onValueChange={setService}><SelectTrigger aria-label="Service"><SelectValue /></SelectTrigger><SelectContent>{services.length > 1 && <SelectItem value="Tous">Tous services</SelectItem>}{services.map((s: ServiceName) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={product} onValueChange={setProduct}><SelectTrigger aria-label="Produit"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Tous produits</SelectItem>{usedProducts.map((id) => <SelectItem key={id} value={id}>{name(id)?.nom}</SelectItem>)}</SelectContent></Select>
        <Input type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="mt-5 overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Service</TableHead><TableHead>Article vendu</TableHead><TableHead>Qté</TableHead><TableHead>Montant</TableHead><TableHead>Consommation déduite</TableHead><TableHead>Saisi par</TableHead></TableRow></TableHeader>
        <TableBody>{paged.map((s) => { const r = wf.recipes.find((x) => x.id === s.recipeId)!; return <TableRow key={s.id}><TableCell className="font-medium">{s.id}</TableCell><TableCell>{fmtDate(s.date, true)}</TableCell><TableCell><Badge variant={s.service === "Bar" ? "secondary" : "warning"}>{s.service}</Badge></TableCell><TableCell>{r.name}</TableCell><TableCell>{s.quantity}</TableCell><TableCell>{formatMAD(s.total)}</TableCell><TableCell className="text-xs">{consumptionFor(r, s.quantity).map((c) => `${name(c.articleId)?.nom} −${c.qty}`).join(" · ")}</TableCell><TableCell>{s.user}</TableCell></TableRow>; })}</TableBody>
      </Table></div>
      <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="ventes" />
    </CardContent></Card>
  </AppShell>;
}
