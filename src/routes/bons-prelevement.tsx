import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DocumentPreview } from "@/components/document-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
const frequencyFor = (sales: number): "Quotidien" | "Hebdo" => sales >= 10 ? "Quotidien" : "Hebdo";

function Page() {
  const { articles, validateWithdrawal, withdrawals } = useOperations();
  const [service, setService] = useState<"Bar" | "Cuisine">("Bar");
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] = useState("Tous");
  const [date, setDate] = useState("2026-09-23");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [document, setDocument] = useState<OfficialDocument | null>(null);
  const eligible = useMemo(() => articles.filter((article) => article.point === service && article.ventes > 0 && article.nom.toLowerCase().includes(search.toLowerCase()) && (frequency === "Tous" || frequencyFor(article.ventes) === frequency)), [articles, service, search, frequency]);
  const recordFor = (articleId: string) => withdrawals.find((record) => record.date === date && record.service === service && record.lines.some((line) => line.articleId === articleId));
  const pending = eligible.filter((article) => !recordFor(article.id));

  function makeDocument(record: WithdrawalRecord): OfficialDocument {
    const formattedDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${record.date}T12:00:00`));
    return { kind: "BON DE PRÉLÈVEMENT", reference: record.id, date: formattedDate, subtitle: "Sortie officielle de l’économat", metadata: [["N° de bon", record.id], ["Date", formattedDate], ["Service demandeur", record.service === "Cuisine" ? "Cuisine / Production chaude" : "Bar"], ["Demandeur", record.requester], ["Validateur", record.validator]], columns: ["Code Article", "Désignation", "Qté demandée", "Qté servie", "Unité", "Observations"], rows: record.lines.map((line) => { const article = articles.find((item) => item.id === line.articleId); return [line.articleId, article?.nom ?? "Article", line.requested, line.served, article?.unite ?? "u", line.observation]; }), note: "La signature confirme la remise physique des quantités au service demandeur." };
  }

  function validateLines(ids: string[]) {
    const grouped = ids.reduce<Record<"Quotidien" | "Hebdo", string[]>>((groups, id) => { const article = articles.find((item) => item.id === id); if (article) groups[frequencyFor(article.ventes)].push(id); return groups; }, { Quotidien: [], Hebdo: [] });
    const created: WithdrawalRecord[] = [];
    (["Quotidien", "Hebdo"] as const).forEach((recordFrequency) => {
      if (!grouped[recordFrequency].length) return;
      created.push(validateWithdrawal({ date, service, frequency: recordFrequency, requester: requester[service], validator: "Salah Bennani — Responsable des stocks", lines: grouped[recordFrequency].map((id) => { const article = articles.find((item) => item.id === id); const requested = article ? Math.min(article.stock, article.ventes) : 0; const served = Math.max(0, Math.min(article?.stock ?? 0, quantities[id] ?? requested)); return { articleId: id, requested, served, observation: served < requested ? "Stock insuffisant" : service === "Cuisine" ? "Contrôle température OK" : "Quantité contrôlée" }; }) }));
    });
    const firstRecord = created[0];
    if (firstRecord) { setDocument(makeDocument(firstRecord)); toast.success(ids.length > 1 ? "Prélèvements validés et bons générés." : "Prélèvement validé et bon généré."); }
  }

  return <AppShell title="Bons de Prélèvement" subtitle={`${pending.length} suggestion${pending.length > 1 ? "s" : ""} à valider pour le ${date.split("-").reverse().join("/")}`} action={<Button disabled={!pending.length} onClick={() => validateLines(pending.map((article) => article.id))}><CheckCircle2 className="mr-2 h-4 w-4" />Tout valider</Button>}>
    <Tabs value={service} onValueChange={(value) => setService(value as "Bar" | "Cuisine")} className="mb-4"><TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="Bar">Fenêtre Bar</TabsTrigger><TabsTrigger value="Cuisine">Fenêtre Cuisine</TabsTrigger></TabsList></Tabs>
    <Card className="mb-4"><CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_190px_190px]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={`Rechercher dans ${service}`} value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={frequency} onValueChange={setFrequency}><SelectTrigger aria-label="Fréquence"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Tous">Fréquence : Tous</SelectItem><SelectItem value="Quotidien">Quotidien</SelectItem><SelectItem value="Hebdo">Hebdo</SelectItem></SelectContent></Select><Input aria-label="Date du prélèvement" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></CardContent></Card>
    <Card><CardContent className="p-5"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Fréquence</TableHead><TableHead>Stock</TableHead><TableHead>Demandée</TableHead><TableHead>À servir</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{eligible.map((article) => { const record = recordFor(article.id); const requested = Math.min(article.stock, article.ventes); return <TableRow key={article.id}><TableCell className="font-medium">{article.nom}<p className="text-xs text-muted-foreground">{article.id} · {service}</p></TableCell><TableCell><Badge variant="secondary">{frequencyFor(article.ventes)}</Badge></TableCell><TableCell>{article.stock} {article.unite}</TableCell><TableCell>{requested} {article.unite}</TableCell><TableCell><Input className="w-24" type="number" min={0} max={article.stock} disabled={Boolean(record)} value={record?.lines.find((line) => line.articleId === article.id)?.served ?? quantities[article.id] ?? requested} onChange={(event) => setQuantities((current) => ({ ...current, [article.id]: Number(event.target.value) }))} /></TableCell><TableCell><div className="flex min-w-48 justify-end gap-2">{record ? <><Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Validé</Badge><Button size="icon" variant="outline" title="Aperçu du bon" onClick={() => setDocument(makeDocument(record))}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="outline" title="Télécharger le bon" onClick={() => void downloadPdf(makeDocument(record))}><Download className="h-4 w-4" /></Button></> : <Button size="sm" onClick={() => validateLines([article.id])}>Valider</Button>}</div></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>
    {withdrawals.length > 0 && <section className="mt-6"><h2 className="mb-3 text-lg">Bons générés</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{withdrawals.map((record) => <Card key={record.id}><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{record.id}</p><p className="text-xs text-muted-foreground">{record.service} · {record.frequency} · {record.lines.length} article(s)</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" title="Aperçu" onClick={() => setDocument(makeDocument(record))}><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Télécharger" onClick={() => void downloadPdf(makeDocument(record))}><Download className="h-4 w-4" /></Button></div></CardContent></Card>)}</div></section>}
    <DocumentPreview document={document} open={Boolean(document)} onOpenChange={(open) => { if (!open) setDocument(null); }} />
  </AppShell>;
}
