import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Eye, Search, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { DocumentPreview } from "@/components/document-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orderVariant } from "@/components/workflow-ui";
import { useAuth } from "@/lib/auth";
import { formatMAD, stockCible, type Article } from "@/lib/habanera-data";
import { useOperations, type Supplier } from "@/lib/operations-context";
import type { OfficialDocument } from "@/lib/pdf";
import { can } from "@/lib/permissions";
import { useWorkflow } from "@/lib/workflow-context";
import { fmtDate, openOrderedQty, ORDER_FLOW, proposedQty, replenishmentNeeds, type OrderStatus, type SupplierOrder } from "@/lib/workflow-logic";

export const Route = createFileRoute("/approvisionnement")({
  validateSearch: (s: Record<string, unknown>): { onglet?: string } => (typeof s["onglet"] === "string" ? { onglet: s["onglet"] } : {}),
  head: () => ({ meta: [{ title: "Approvisionnement — Habanera" }, { name: "description", content: "Besoins automatiques, simulation et commandes fournisseurs Habanera." }, { property: "og:title", content: "Approvisionnement — Habanera" }, { property: "og:description", content: "Besoins, simulation et commandes fournisseurs." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SupplyPage,
});

function pickSupplier(article: Article, suppliers: Supplier[]) {
  const active = suppliers.filter((s) => s.active);
  const main = active.find((s) => s.id === article.fournisseurId);
  if (main) return main;
  return active.filter((s) => s.prices[article.id] !== undefined).sort((a, b) => a.prices[article.id]! - b.prices[article.id]!)[0] ?? active[0]!;
}

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string; action: "commande.create" | "commande.validate" }>> = {
  "Simulation": { to: "À valider", label: "Soumettre", action: "commande.create" },
  "À valider": { to: "Validée", label: "Valider", action: "commande.validate" },
  "Validée": { to: "Envoyée", label: "Envoyer", action: "commande.create" },
  "Envoyée": { to: "En attente de réception", label: "Confirmer l'envoi", action: "commande.create" },
  "Partiellement reçue": { to: "Clôturée", label: "Clôturer (reliquat abandonné)", action: "commande.validate" },
  "Reçue": { to: "Clôturée", label: "Clôturer", action: "commande.validate" },
};

function SupplyPage() {
  const { onglet } = Route.useSearch();
  const [tab, setTab] = useState(onglet === "commandes" ? "commandes" : "besoins");
  return <AppShell title="Approvisionnement" subtitle="Besoins → Simulation → Validation → Commande → Réception → Stock">
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="besoins">Besoins & simulation</TabsTrigger><TabsTrigger value="commandes">Commandes fournisseurs</TabsTrigger></TabsList></Tabs>
    <div className="mt-5">{tab === "besoins" ? <Needs onDone={() => setTab("commandes")} /> : <Orders />}</div>
  </AppShell>;
}

function Needs({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { articles, suppliers } = useOperations();
  const wf = useWorkflow();
  const needs = replenishmentNeeds(articles);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string[]>(() => needs.filter((a) => proposedQty(a, wf.orders) > 0).map((a) => a.id));
  const { paged, page, pageCount, setPage, total } = usePagination(needs, 10);
  const value = (a: Article) => qty[a.id] ?? proposedQty(a, wf.orders);

  function create(status: OrderStatus) {
    const chosen = needs.filter((a) => selected.includes(a.id) && value(a) > 0);
    if (!chosen.length || !user) return;
    const groups = new Map<string, { supplier: Supplier; items: Article[] }>();
    chosen.forEach((a) => { const s = pickSupplier(a, suppliers); const g = groups.get(s.id) ?? { supplier: s, items: [] }; g.items.push(a); groups.set(s.id, g); });
    const ids = [...groups.values()].map(({ supplier, items }) => wf.createOrder({ supplierId: supplier.id, supplierName: supplier.name, status, user: user.nom, delay: supplier.delay, lines: items.map((a) => ({ articleId: a.id, ordered: value(a), unitPrice: supplier.prices[a.id] ?? a.prixAchat })) }).id);
    setSelected([]); setQty({});
    toast.success(`${ids.length} commande(s) créée(s) : ${ids.join(", ")}`);
    onDone();
  }

  return <Card><CardContent className="p-5">
    <p className="text-sm text-muted-foreground">Un produit apparaît dès que <strong>stock actuel ≤ seuil minimum</strong>. Quantité proposée = stock cible − stock actuel − quantité déjà commandée (commandes ouvertes).</p>
    <div className="mt-4 overflow-x-auto"><Table>
      <TableHeader><TableRow><TableHead className="w-10"><Checkbox checked={needs.length > 0 && selected.length === needs.length} onCheckedChange={(c) => setSelected(c ? needs.map((a) => a.id) : [])} aria-label="Tout sélectionner" /></TableHead><TableHead>Produit</TableHead><TableHead>Stock</TableHead><TableHead>Seuil</TableHead><TableHead>Cible</TableHead><TableHead>Déjà commandé</TableHead><TableHead>Fournisseur</TableHead><TableHead>Commande proposée</TableHead></TableRow></TableHeader>
      <TableBody>{paged.map((a) => { const open = openOrderedQty(wf.orders, a.id); return <TableRow key={a.id}>
        <TableCell><Checkbox checked={selected.includes(a.id)} onCheckedChange={() => setSelected((p) => p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id])} aria-label={`Sélectionner ${a.nom}`} /></TableCell>
        <TableCell className="font-medium">{a.nom}</TableCell>
        <TableCell><Badge variant={a.stock <= 0 ? "destructive" : "warning"}>{a.stock} {a.unite}</Badge></TableCell>
        <TableCell>{a.seuil}</TableCell><TableCell>{stockCible(a)}</TableCell><TableCell>{open}</TableCell>
        <TableCell className="text-xs">{pickSupplier(a, suppliers)?.name}</TableCell>
        <TableCell><Input type="number" min={0} className="w-24" value={value(a)} onChange={(e) => setQty((p) => ({ ...p, [a.id]: Math.max(0, Number(e.target.value)) }))} aria-label={`Quantité ${a.nom}`} /></TableCell>
      </TableRow>; })}</TableBody>
    </Table></div>
    {needs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun besoin : tous les stocks sont au-dessus du seuil.</p>}
    <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="besoins" />
    {can(user?.role, "commande.create") && <div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={!selected.length} onClick={() => create("Simulation")}><Calculator className="mr-2 h-4 w-4" />Enregistrer la simulation</Button><Button disabled={!selected.length} onClick={() => create("À valider")}><ShoppingCart className="mr-2 h-4 w-4" />Créer les commandes à valider</Button></div>}
  </CardContent></Card>;
}

function orderDocument(o: SupplierOrder, articles: Article[]): OfficialDocument {
  const find = (id: string) => articles.find((a) => a.id === id);
  return { kind: "Bon de commande fournisseur", reference: o.id, date: fmtDate(o.date), subtitle: "Habanera — Économat Marrakech", metadata: [["N° commande", o.id], ["Fournisseur", o.supplierName], ["Date", fmtDate(o.date)], ["Livraison attendue", fmtDate(o.expectedDate)], ["Statut", o.status]], columns: ["Produit", "Commandé", "Reçu", "Reliquat", "Prix unitaire", "Total"], rows: o.lines.map((l) => [find(l.articleId)?.nom ?? l.articleId, l.ordered, l.received, Math.max(0, l.ordered - l.received), formatMAD(l.unitPrice), formatMAD(l.unitPrice * l.ordered)]), total: `Total : ${formatMAD(o.lines.reduce((t, l) => t + l.unitPrice * l.ordered, 0))}` };
}

function Orders() {
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const [status, setStatus] = useState("Toutes");
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState<OfficialDocument | null>(null);
  const rows = useMemo(() => wf.orders.filter((o) => (status === "Toutes" || o.status === status) && (o.id.toLowerCase().includes(q.toLowerCase()) || o.supplierName.toLowerCase().includes(q.toLowerCase()))), [wf.orders, status, q]);
  const { paged, page, pageCount, setPage, total } = usePagination(rows, 8);
  const name = (id: string) => articles.find((a) => a.id === id)?.nom ?? id;
  return <Card><CardContent className="p-5">
    <div className="grid gap-3 md:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="N° ou fournisseur" value={q} onChange={(e) => setQ(e.target.value)} /></div><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Statut"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Toutes">Tous les statuts</SelectItem>{ORDER_FLOW.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
    <div className="mt-5 overflow-x-auto"><Table>
      <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Fournisseur</TableHead><TableHead>Produits</TableHead><TableHead>Date</TableHead><TableHead>Attendue</TableHead><TableHead>Montant</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
      <TableBody>{paged.map((o) => { const next = NEXT[o.status]; return <TableRow key={o.id}>
        <TableCell className="font-medium">{o.id}</TableCell><TableCell>{o.supplierName}</TableCell>
        <TableCell className="max-w-56 text-xs">{o.lines.map((l) => `${name(l.articleId)} ${l.received}/${l.ordered}`).join(" · ")}</TableCell>
        <TableCell>{fmtDate(o.date)}</TableCell><TableCell>{fmtDate(o.expectedDate)}</TableCell>
        <TableCell>{formatMAD(o.lines.reduce((t, l) => t + l.unitPrice * l.ordered, 0))}</TableCell>
        <TableCell><Badge variant={orderVariant(o.status)}>{o.status}</Badge></TableCell>
        <TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" title="Aperçu PDF" onClick={() => setDoc(orderDocument(o, articles))}><Eye className="h-4 w-4" /></Button>{next && can(user?.role, next.action) && <Button size="sm" variant="outline" onClick={() => { wf.setOrderStatus(o.id, next.to, user!.nom); toast.success(`${o.id} → ${next.to}`); }}>{next.label}</Button>}</div></TableCell>
      </TableRow>; })}</TableBody>
    </Table></div>
    <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="commandes" />
    <DocumentPreview document={doc} open={Boolean(doc)} onOpenChange={(o) => { if (!o) setDoc(null); }} />
  </CardContent></Card>;
}
