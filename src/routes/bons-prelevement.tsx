import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOperations } from "@/lib/operations";

export const Route = createFileRoute("/bons-prelevement")({ head: () => ({ meta: [{ title: "Bons de prélèvement — Habanera" }, { name: "description", content: "Suggestions et validation des prélèvements du bar et de la cuisine." }, { property: "og:title", content: "Bons de prélèvement — Habanera" }, { property: "og:description", content: "Préparez et validez les prélèvements de stock Habanera." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Page });
function Page() {
  const { articles, validateWithdrawal } = useOperations();
  const eligible = articles.filter((a) => a.point !== "Économat" && a.ventes > 0);
  const [done, setDone] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(eligible.map((a) => [a.id, Math.min(a.stock, a.ventes)])));
  return <AppShell title="Bons de Prélèvement" subtitle={`${eligible.length - done.length} suggestions à valider`}><Card><CardContent className="p-5"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Destination</TableHead><TableHead>Stock fixe</TableHead><TableHead>Ventes</TableHead><TableHead>Suggestion</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{eligible.map((a) => <TableRow key={a.id}><TableCell className="font-medium">{a.nom}</TableCell><TableCell>{a.point}</TableCell><TableCell>{a.stockInitial} {a.unite}</TableCell><TableCell>{a.ventes} {a.unite}</TableCell><TableCell><Input className="w-24" type="number" min={1} max={a.stock} value={quantities[a.id] ?? a.ventes} onChange={(e) => setQuantities((q) => ({ ...q, [a.id]: Number(e.target.value) }))} /></TableCell><TableCell className="text-right">{done.includes(a.id) ? <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Validé</Badge> : <Button size="sm" onClick={() => { validateWithdrawal(a.id, quantities[a.id] ?? a.ventes); setDone((d) => [...d, a.id]); toast.success(`Prélèvement de ${a.nom} validé.`); }}>Valider le prélèvement</Button>}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></AppShell>;
}