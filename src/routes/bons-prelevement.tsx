import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, Eye, FilePlus2, Plus, Printer, Search, Send, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { DocumentPreview } from "@/components/document-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { requestDocument, requestVariant } from "@/components/workflow-ui";
import { useAuth } from "@/lib/auth";
import { useOperations } from "@/lib/operations-context";
import { downloadPdf, printPdf, type OfficialDocument } from "@/lib/pdf";
import { can, roleServices, type ServiceName } from "@/lib/permissions";
import { useWorkflow } from "@/lib/workflow-context";
import { fmtDate, isLate, PENDING_REQUEST, requestOutcome, type RequestStatus, type StockRequest } from "@/lib/workflow-logic";

export const Route = createFileRoute("/bons-prelevement")({
  validateSearch: (s: Record<string, unknown>): { statut?: string } => (typeof s["statut"] === "string" ? { statut: s["statut"] } : {}),
  head: () => ({ meta: [{ title: "Bons de prélèvement — Habanera" }, { name: "description", content: "Création, envoi, traitement et suivi des bons de prélèvement Bar et Cuisine." }, { property: "og:title", content: "Bons de prélèvement — Habanera" }, { property: "og:description", content: "Workflow complet des bons de prélèvement avec PDF." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: RequestsPage,
});

const STATUSES: RequestStatus[] = ["Brouillon", "Envoyé", "Reçu", "En cours", "Traité", "Partiellement traité", "Non traité", "Livré", "Clôturé"];
const PRESETS: Record<string, (r: StockRequest) => boolean> = {
  attente: (r) => PENDING_REQUEST.includes(r.status),
  retard: (r) => PENDING_REQUEST.includes(r.status) && isLate(r.date, 24),
  partiel: (r) => r.status === "Partiellement traité",
  traites: (r) => ["Traité", "Partiellement traité", "Non traité", "Livré"].includes(r.status),
};
const PRESET_LABEL: Record<string, string> = { attente: "En attente (à traiter)", retard: "En retard", partiel: "Partiellement traités", traites: "Traités récemment" };

function RequestsPage() {
  const { statut } = Route.useSearch();
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const services = user ? roleServices(user.role) : [];
  const [tab, setTab] = useState<string>(services.length > 1 ? "Tous" : services[0] ?? "Bar");
  const [status, setStatus] = useState<string>(statut && PRESETS[statut] ? statut : "Tous");
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [doc, setDoc] = useState<OfficialDocument | null>(null);

  const rows = useMemo(() => wf.requests.filter((r) => services.includes(r.service) && (tab === "Tous" || r.service === tab)
    && (status === "Tous" || (PRESETS[status] ? PRESETS[status]!(r) : r.status === status))
    && (!date || r.date.slice(0, 10) === date)
    && (r.id.toLowerCase().includes(q.toLowerCase()) || r.requester.toLowerCase().includes(q.toLowerCase()) || r.lines.some((l) => articles.find((a) => a.id === l.articleId)?.nom.toLowerCase().includes(q.toLowerCase())))), [wf.requests, services, tab, status, date, q, articles]);
  const { paged, page, pageCount, setPage, total } = usePagination(rows, 8);
  const open = wf.requests.find((r) => r.id === openId) ?? null;

  return <AppShell title="Bons de prélèvement" subtitle="Brouillon → Envoyé → Reçu → En cours → Traité → Livré → Clôturé" action={can(user?.role, "bon.create") ? <Button onClick={() => setCreating(true)}><FilePlus2 className="mr-2 h-4 w-4" />Nouveau bon</Button> : undefined}>
    <Card><CardContent className="p-5">
      <Tabs value={tab} onValueChange={setTab}><TabsList>{services.length > 1 && <TabsTrigger value="Tous">Tous</TabsTrigger>}{services.map((s) => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}</TabsList></Tabs>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="N° de bon, demandeur ou produit" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Statut"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Tous les statuts</SelectItem>{Object.keys(PRESETS).map((k) => <SelectItem key={k} value={k}>{PRESET_LABEL[k]}</SelectItem>)}{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Input type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="mt-5 overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>N° de bon</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead>Demandeur</TableHead><TableHead>Produits</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Document</TableHead></TableRow></TableHeader>
        <TableBody>{paged.map((r) => <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
          <TableCell className="font-medium">{r.id}{PENDING_REQUEST.includes(r.status) && isLate(r.date, 24) && <Badge variant="destructive" className="ml-2">Retard</Badge>}</TableCell>
          <TableCell><Badge variant={r.service === "Bar" ? "secondary" : "warning"}>{r.service}</Badge></TableCell>
          <TableCell>{fmtDate(r.date, true)}</TableCell><TableCell>{r.requester}</TableCell><TableCell>{r.lines.length}</TableCell>
          <TableCell><Badge variant={requestVariant(r.status)}>{r.status}</Badge></TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" title="Aperçu PDF" onClick={() => setDoc(requestDocument(r, articles))}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Télécharger" onClick={() => void downloadPdf(requestDocument(r, articles))}><Download className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Imprimer" onClick={() => void printPdf(requestDocument(r, articles))}><Printer className="h-4 w-4" /></Button></div></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>
      {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucun bon pour ces filtres.</p>}
      <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="bons" />
    </CardContent></Card>
    {open && <RequestSheet key={open.id + open.status} req={open} onClose={() => setOpenId(null)} onPreview={() => setDoc(requestDocument(open, articles))} />}
    {creating && <CreateDialog services={services} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenId(id); }} />}
    <DocumentPreview document={doc} open={Boolean(doc)} onOpenChange={(o) => { if (!o) setDoc(null); }} />
  </AppShell>;
}

function RequestSheet({ req, onClose, onPreview }: { req: StockRequest; onClose: () => void; onPreview: () => void }) {
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const [prepared, setPrepared] = useState<Record<string, number>>(() => Object.fromEntries(req.lines.map((l) => { const stock = articles.find((a) => a.id === l.articleId)?.stock ?? 0; return [l.articleId, Math.min(l.requested, stock)]; })));
  const [busy, setBusy] = useState(false);
  const role = user?.role;
  const processing = ["Envoyé", "Reçu", "En cours"].includes(req.status) && can(role, "bon.process");
  const preview = requestOutcome(req.lines.map((l) => ({ ...l, prepared: prepared[l.articleId] ?? 0 })));
  const name = (id: string) => articles.find((a) => a.id === id);
  const act = (status: RequestStatus, message: string) => { wf.setRequestStatus(req.id, status, user!.nom); toast.success(message); };

  function validate() {
    if (busy) return;
    setBusy(true);
    const result = wf.processRequest(req.id, prepared, user!.nom);
    if (result) toast.success(`${req.id} : ${result.status}. Stocks Économat et ${req.service} mis à jour.`);
    else { toast.error("Ce bon a déjà été traité."); setBusy(false); }
  }

  return <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
    <SheetHeader><SheetTitle>{req.id} · {req.service}</SheetTitle><SheetDescription>Demandé par {req.requester} le {fmtDate(req.date, true)}{req.comment ? ` · ${req.comment}` : ""}</SheetDescription></SheetHeader>
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center gap-2"><Badge variant={requestVariant(req.status)}>{req.status}</Badge>{processing && <span className="text-xs text-muted-foreground">Résultat prévu : <strong>{preview}</strong></span>}</div>
      <div className="overflow-x-auto rounded-lg border"><Table>
        <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Demandé</TableHead>{processing && <TableHead>Disponible</TableHead>}<TableHead>Préparé</TableHead></TableRow></TableHeader>
        <TableBody>{req.lines.map((l) => { const a = name(l.articleId); const stock = a?.stock ?? 0; return <TableRow key={l.articleId}>
          <TableCell className="font-medium">{a?.nom ?? l.articleId}<span className="block text-xs text-muted-foreground">{l.articleId}</span></TableCell>
          <TableCell>{l.requested} {a?.unite}</TableCell>
          {processing && <TableCell><Badge variant={stock >= l.requested ? "success" : stock > 0 ? "warning" : "destructive"}>{stock}</Badge></TableCell>}
          <TableCell>{processing ? <Input type="number" min={0} max={stock} className="w-24" value={prepared[l.articleId] ?? 0} onChange={(e) => setPrepared((p) => ({ ...p, [l.articleId]: Math.max(0, Math.min(stock, Number(e.target.value))) }))} aria-label={`Quantité préparée ${a?.nom}`} /> : l.prepared}</TableCell>
        </TableRow>; })}</TableBody>
      </Table></div>

      <div className="flex flex-wrap gap-2">
        {req.status === "Brouillon" && can(role, "bon.create") && <Button onClick={() => act("Envoyé", `${req.id} envoyé à l'économat.`)}><Send className="mr-2 h-4 w-4" />Envoyer à l'économat</Button>}
        {req.status === "Envoyé" && can(role, "bon.process") && <Button variant="outline" onClick={() => act("Reçu", "Bon marqué comme reçu.")}>Marquer reçu</Button>}
        {req.status === "Reçu" && can(role, "bon.process") && <Button variant="outline" onClick={() => act("En cours", "Préparation démarrée.")}>Démarrer la préparation</Button>}
        {processing && <Button disabled={busy} onClick={validate}><CheckCircle2 className="mr-2 h-4 w-4" />Valider le prélèvement</Button>}
        {["Traité", "Partiellement traité"].includes(req.status) && can(role, "bon.process") && <Button onClick={() => act("Livré", "Bon livré au service.")}>Marquer livré</Button>}
        {["Livré", "Non traité"].includes(req.status) && can(role, "bon.close") && <Button variant="outline" onClick={() => act("Clôturé", "Bon clôturé.")}>Clôturer</Button>}
        {!can(role, "bon.process") && PENDING_REQUEST.includes(req.status) && <p className="text-xs text-muted-foreground">En attente de traitement par l'économat.</p>}
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4"><Button variant="outline" onClick={onPreview}><Eye className="mr-2 h-4 w-4" />Aperçu PDF</Button><Button variant="outline" onClick={() => void downloadPdf(requestDocument(req, articles))}><Download className="mr-2 h-4 w-4" />Télécharger</Button><Button variant="outline" onClick={() => void printPdf(requestDocument(req, articles))}><Printer className="mr-2 h-4 w-4" />Imprimer</Button></div>

      <section><p className="text-xs uppercase text-muted-foreground">Historique</p><ol className="mt-2 space-y-2 border-l-2 border-border pl-4 text-sm">{req.history.map((h, i) => <li key={i}><span className="font-medium">{h.status}</span> · {h.user} <span className="text-xs text-muted-foreground">{fmtDate(h.date, true)}</span></li>)}</ol></section>
    </div>
  </SheetContent></Sheet>;
}

function CreateDialog({ services, onClose, onCreated }: { services: ServiceName[]; onClose: () => void; onCreated: (id: string) => void }) {
  const { user } = useAuth();
  const { articles } = useOperations();
  const wf = useWorkflow();
  const [service, setService] = useState<ServiceName>(services[0] ?? "Bar");
  const [lines, setLines] = useState<Array<{ articleId: string; requested: number }>>([]);
  const [articleId, setArticleId] = useState("");
  const [qty, setQty] = useState(1);
  const [comment, setComment] = useState("");
  const options = articles.filter((a) => wf.serviceRefs[a.id]?.[service] !== undefined || a.point === service);
  function add() { if (!articleId || qty <= 0) return; setLines((p) => [...p.filter((l) => l.articleId !== articleId), { articleId, requested: qty }]); setArticleId(""); setQty(1); }
  function save(send: boolean) { if (!lines.length || !user) { toast.error("Ajoutez au moins un produit."); return; } const r = wf.createRequest({ service, lines, comment, user: user.nom, send }); toast.success(send ? `${r.id} envoyé à l'économat.` : `${r.id} enregistré en brouillon.`); onCreated(r.id); }
  return <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogContent className="max-w-xl">
    <DialogHeader><DialogTitle>Nouveau bon de prélèvement</DialogTitle><DialogDescription>Demande de produits à l'économat.</DialogDescription></DialogHeader>
    <div className="space-y-4">
      <div><Label>Service</Label><Select value={service} onValueChange={(v) => { setService(v as ServiceName); setLines([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      <div className="flex gap-2"><Select value={articleId} onValueChange={setArticleId}><SelectTrigger className="flex-1" aria-label="Produit"><SelectValue placeholder="Choisir un produit" /></SelectTrigger><SelectContent>{options.map((a) => <SelectItem key={a.id} value={a.id}>{a.nom} ({a.unite})</SelectItem>)}</SelectContent></Select><Input type="number" min={1} className="w-24" value={qty} onChange={(e) => setQty(Number(e.target.value))} aria-label="Quantité" /><Button variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button></div>
      <ul className="divide-y rounded-lg border text-sm">{lines.map((l) => { const a = articles.find((x) => x.id === l.articleId); return <li key={l.articleId} className="flex items-center justify-between px-3 py-2"><span>{a?.nom}</span><span className="flex items-center gap-2">{l.requested} {a?.unite}<Button size="icon" variant="ghost" onClick={() => setLines((p) => p.filter((x) => x.articleId !== l.articleId))}><Trash2 className="h-4 w-4 text-destructive" /></Button></span></li>; })}{!lines.length && <li className="px-3 py-4 text-center text-muted-foreground">Aucun produit ajouté.</li>}</ul>
      <div><Label>Commentaire</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optionnel" /></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={() => save(false)}>Enregistrer en brouillon</Button><Button onClick={() => save(true)}><Send className="mr-2 h-4 w-4" />Envoyer</Button></DialogFooter>
  </DialogContent></Dialog>;
}
