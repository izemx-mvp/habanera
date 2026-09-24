import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderVariant } from "@/components/workflow-ui";
import { useAuth } from "@/lib/auth";
import { useOperations } from "@/lib/operations-context";
import { can } from "@/lib/permissions";
import { useWorkflow } from "@/lib/workflow-context";
import { fmtDate, type SupplierOrder } from "@/lib/workflow-logic";

export const Route = createFileRoute("/receptions")({
  head: () => ({ meta: [{ title: "Réceptions — Habanera" }, { name: "description", content: "Réception des commandes fournisseurs selon les quantités réellement reçues." }, { property: "og:title", content: "Réceptions — Habanera" }, { property: "og:description", content: "Réceptions, reliquats et écarts fournisseurs." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ReceptionsPage,
});

const RECEIVABLE = ["Validée", "Envoyée", "En attente de réception", "Partiellement reçue"];

function ReceptionsPage() {
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const [order, setOrder] = useState<SupplierOrder | null>(null);
  const waiting = wf.orders.filter((o) => RECEIVABLE.includes(o.status));
  const history = usePagination(wf.receptions, 8);
  const name = (id: string) => articles.find((a) => a.id === id);
  return <AppShell title="Réceptions" subtitle="Le stock Économat augmente des quantités réellement reçues">
    <Card><CardHeader><CardTitle className="text-base">Commandes à réceptionner ({waiting.length})</CardTitle></CardHeader><CardContent className="overflow-x-auto">
      <Table><TableHeader><TableRow><TableHead>Commande</TableHead><TableHead>Fournisseur</TableHead><TableHead>Attendue</TableHead><TableHead>Reliquat</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
        <TableBody>{waiting.map((o) => <TableRow key={o.id}><TableCell className="font-medium">{o.id}</TableCell><TableCell>{o.supplierName}</TableCell><TableCell>{fmtDate(o.expectedDate)}{new Date(o.expectedDate).getTime() < Date.now() && <Badge variant="destructive" className="ml-2">Retard</Badge>}</TableCell><TableCell className="text-xs">{o.lines.filter((l) => l.received < l.ordered).map((l) => `${name(l.articleId)?.nom} ${l.ordered - l.received}`).join(" · ")}</TableCell><TableCell><Badge variant={orderVariant(o.status)}>{o.status}</Badge></TableCell><TableCell className="text-right">{can(user?.role, "reception.validate") && <Button size="sm" onClick={() => setOrder(o)}><PackageCheck className="mr-2 h-4 w-4" />Réceptionner</Button>}</TableCell></TableRow>)}</TableBody></Table>
      {waiting.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucune commande en attente de réception.</p>}
    </CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle className="text-base">Historique des réceptions</CardTitle></CardHeader><CardContent className="overflow-x-auto">
      <Table><TableHeader><TableRow><TableHead>Réception</TableHead><TableHead>Commande</TableHead><TableHead>Fournisseur</TableHead><TableHead>Date</TableHead><TableHead>Réceptionné par</TableHead><TableHead>Produit · Attendu / Reçu / Écart</TableHead></TableRow></TableHeader>
        <TableBody>{history.paged.map((r) => <TableRow key={r.id}><TableCell className="font-medium">{r.id}</TableCell><TableCell>{r.orderId}</TableCell><TableCell>{r.supplierName}</TableCell><TableCell>{fmtDate(r.date, true)}</TableCell><TableCell>{r.user}</TableCell><TableCell className="space-y-1 text-xs">{r.lines.map((l) => <div key={l.articleId}>{name(l.articleId)?.nom} · {l.ordered} / {l.received} / <span className={l.gap < 0 ? "font-semibold text-destructive" : "text-success"}>{l.gap}</span></div>)}</TableCell></TableRow>)}</TableBody></Table>
      <DataPagination page={history.page} pageCount={history.pageCount} total={history.total} onPageChange={history.setPage} label="réceptions" />
    </CardContent></Card>
    {order && <ReceiveDialog key={order.id} order={order} onClose={() => setOrder(null)} />}
  </AppShell>;
}

function ReceiveDialog({ order, onClose }: { order: SupplierOrder; onClose: () => void }) {
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const [received, setReceived] = useState<Record<string, number>>(() => Object.fromEntries(order.lines.map((l) => [l.articleId, l.ordered - l.received])));
  const [busy, setBusy] = useState(false);
  function validate() {
    if (busy) return; setBusy(true);
    const r = wf.receiveOrder(order.id, received, user!.nom);
    if (r) { toast.success(`${r.id} enregistrée. Stock Économat mis à jour.`); onClose(); } else { toast.error("Réception déjà enregistrée."); setBusy(false); }
  }
  return <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogContent className="max-w-2xl">
    <DialogHeader><DialogTitle>Réception {order.id}</DialogTitle><DialogDescription>{order.supplierName} · saisissez les quantités réellement reçues.</DialogDescription></DialogHeader>
    <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Commandé (reliquat)</TableHead><TableHead>Reçu</TableHead><TableHead>Écart</TableHead></TableRow></TableHeader>
      <TableBody>{order.lines.map((l) => { const remaining = l.ordered - l.received; const got = received[l.articleId] ?? 0; const a = articles.find((x) => x.id === l.articleId); return <TableRow key={l.articleId}><TableCell>{a?.nom}</TableCell><TableCell>{remaining} {a?.unite}</TableCell><TableCell><Input type="number" min={0} className="w-24" value={got} onChange={(e) => setReceived((p) => ({ ...p, [l.articleId]: Math.max(0, Number(e.target.value)) }))} aria-label={`Reçu ${a?.nom}`} /></TableCell><TableCell className={got - remaining < 0 ? "text-destructive" : "text-success"}>{got - remaining}</TableCell></TableRow>; })}</TableBody></Table></div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button disabled={busy} onClick={validate}>Valider la réception</Button></DialogFooter>
  </DialogContent></Dialog>;
}
