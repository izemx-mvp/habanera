import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, Eye, Search } from "lucide-react";
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
import { useOperations, type WithdrawalRecord } from "@/lib/operations";
import { downloadPdf, type OfficialDocument } from "@/lib/pdf";

export const Route = createFileRoute("/bons-prelevement")({
  head: () => ({ meta: [{ title: "Bons de prélèvement — Habanera" }, { name: "description", content: "Validation et traçabilité des prélèvements Habanera." }, { property: "og:title", content: "Bons de prélèvement — Habanera" }, { property: "og:description", content: "Préparez les sorties de stock par service." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Page,
});

const requester = { Bar: "Youssef Amrani — Chef barman", Cuisine: "Imane Ouazzani — Cheffe de cuisine" } as const;

function Page() {
  const { articles, validateWithdrawal, withdrawals } = useOperations();
  const [service, setService] = useState<"Bar" | "Cuisine">("Bar");
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] = useState("Tous");
  const [date, setDate] = useState("2026-09-23");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selection, setSelection] = useState<string[]>([]);
  const [document, setDocument] = useState<OfficialDocument | null>(null);

  const eligible = useMemo(() => articles.filter((article) => article.point === service && article.ventes > 0 && article.nom.toLowerCase().includes(search.toLowerCase()) && (frequency === "Tous" || article.frequence === frequency)), [articles, service, search, frequency]);
  const recordFor = (articleId: string) => withdrawals.find((record) => record.date === date && record.service === service && record.lines.some((line) => line.articleId === articleId));
  const pending = eligible.filter((article) => !recordFor(article.id));
  const serviceRecords = withdrawals.filter((record) => record.service === service);
  const { paged, page, pageCount, setPage, total } = usePagination(eligible, 8);
  const selectable = pending.map((article) => article.id);
  const selected = selection.filter((id) => selectable.includes(id));
  const allSelected = selectable.length > 0 && selected.length === selectable.length;

  function makeDocument(record: WithdrawalRecord): OfficialDocument {
    const formattedDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${record.date}T12:00:00`));
    return { kind: "BON DE PRÉLÈVEMENT", reference: record.id, date: formattedDate, subtitle: "Sortie officielle de l’économat", metadata: [["N° de bon", record.id], ["Date", formattedDate], ["Service demandeur", record.service === "Cuisine" ? "Cuisine / Production chaude" : "Bar"], ["Demandeur", record.requester], ["Validateur", record.validator], ["Fréquence", record.frequency]], columns: ["Code Article", "Désignation", "Qté demandée", "Qté servie", "Unité", "Observations"], rows: record.lines.map((line) => { const article = articles.find((item) => item.id === line.articleId); return [line.articleId, article?.nom ?? "Article", line.requested, line.served, article?.unite ?? "u", line.observation]; }), note: "La signature confirme la remise physique des quantités au service demandeur." };
  }

  function validateSelection() {
    if (!selected.length) return;
    const lines = selected.map((id) => {
      const article = articles.find((item) => item.id === id);
      const requested = article ? Math.min(article.stock, article.ventes) : 0;
      const served = Math.max(0, Math.min(article?.stock ?? 0, quantities[id] ?? requested));
      return { articleId: id, requested, served, observation: served < requested ? "Stock insuffisant" : service === "Cuisine" ? "Contrôle température OK" : "Quantité contrôlée" };
    });
    const frequencies = new Set(selected.map((id) => articles.find((item) => item.id === id)?.frequence));
    const recordFrequency = frequencies.size === 1 ? [...frequencies][0] ?? "Quotidien" : "Mixte";
    const created = validateWithdrawal({ date, service, frequency: recordFrequency, requester: requester[service], validator: "Salah Bennani — Responsable des stocks", lines });
    setSelection([]);
    setDocument(makeDocument(created));
    toast.success(`Bon ${created.id} généré avec ${lines.length} article(s).`);
  }

  return <AppShell title="Bons de Prélèvement" subtitle={`${pending.length} suggestion${pending.length > 1 ? "s" : ""} à valider pour le ${date.split("-").reverse().join("/")}`} action={<Button disabled={!selected.length} onClick={validateSelection}><CheckCircle2 className="mr-2 h-4 w-4" />Valider la sélection{selected.length ? ` (${selected.length})` : ""}</Button>}>
    <Tabs value={service} onValueChange={(value) => { setService(value as "Bar" | "Cuisine"); setSelection([]); }} className="mb-4"><TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="Bar">Bar</TabsTrigger><TabsTrigger value="Cuisine">Cuisine</TabsTrigger></TabsList></Tabs>
    <Card className="mb-4"><CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_190px_190px]">
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={`Rechercher dans ${service}`} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <Select value={frequency} onValueChange={setFrequency}><SelectTrigger aria-label="Fréquence"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Fréquence : Tous</SelectItem><SelectItem value="Quotidien">Quotidien</SelectItem><SelectItem value="Hebdomadaire">Hebdomadaire</SelectItem></SelectContent></Select>
      <Input aria-label="Date du prélèvement" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
    </CardContent></Card>
    <Card><CardContent className="p-5"><div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-10"><Checkbox aria-label="Tout sélectionner" checked={allSelected} disabled={!selectable.length} onCheckedChange={(checked) => setSelection(checked === true ? selectable : [])} /></TableHead>
          <TableHead>Produit</TableHead><TableHead>Fréquence</TableHead><TableHead>Stock</TableHead><TableHead>Demandée</TableHead><TableHead>À servir</TableHead><TableHead className="text-right">Bon</TableHead>
        </TableRow></TableHeader>
        <TableBody>{paged.map((article) => {
          const record = recordFor(article.id);
          const requested = Math.min(article.stock, article.ventes);
          return <TableRow key={article.id}>
            <TableCell><Checkbox aria-label={`Sélectionner ${article.nom}`} disabled={Boolean(record)} checked={selection.includes(article.id)} onCheckedChange={(checked) => setSelection((current) => checked === true ? [...current, article.id] : current.filter((id) => id !== article.id))} /></TableCell>
            <TableCell className="font-medium">{article.nom}<p className="text-xs text-muted-foreground">{article.id} · {service}</p></TableCell>
            <TableCell><Badge variant="secondary">{article.frequence}</Badge></TableCell>
            <TableCell>{article.stock} {article.unite}</TableCell>
            <TableCell>{requested} {article.unite}</TableCell>
            <TableCell><Input className="w-24" type="number" min={0} max={article.stock} disabled={Boolean(record)} value={record?.lines.find((line) => line.articleId === article.id)?.served ?? quantities[article.id] ?? requested} onChange={(event) => setQuantities((current) => ({ ...current, [article.id]: Number(event.target.value) }))} /></TableCell>
            <TableCell><div className="flex min-w-48 justify-end gap-2">{record ? <><Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Validé</Badge><Button size="icon" variant="outline" title="Aperçu du bon" onClick={() => setDocument(makeDocument(record))}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="outline" title="Télécharger le bon" onClick={() => void downloadPdf(makeDocument(record))}><Download className="h-4 w-4" /></Button></> : <span className="text-xs text-muted-foreground">En attente</span>}</div></TableCell>
          </TableRow>;
        })}</TableBody>
      </Table>
    </div>
      <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="produits" />
    </CardContent></Card>
    {serviceRecords.length > 0 && <section className="mt-6"><h2 className="mb-3 text-lg">Bons générés — {service}</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{serviceRecords.map((record) => <Card key={record.id}><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{record.id}</p><p className="text-xs text-muted-foreground">{record.service} · {record.frequency} · {record.lines.length} article(s)</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" title="Aperçu" onClick={() => setDocument(makeDocument(record))}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Télécharger" onClick={() => void downloadPdf(makeDocument(record))}><Download className="h-4 w-4" /></Button></div></CardContent></Card>)}</div></section>}
    <DocumentPreview document={document} open={Boolean(document)} onOpenChange={(open) => { if (!open) setDocument(null); }} />
  </AppShell>;
}
