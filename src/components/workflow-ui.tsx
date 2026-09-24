import { Link } from "@tanstack/react-router";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Article } from "@/lib/habanera-data";
import type { OfficialDocument } from "@/lib/pdf";
import { fmtDate, type ActivityItem, type Anomaly, type LiveAlert, type OrderStatus, type RequestStatus, type StockRequest } from "@/lib/workflow-logic";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "elevated";

// Lien interne typé de façon souple (chemins issus des tableaux de configuration)
export function AppLink({ to, search, className, children }: { to: string; search?: Record<string, string>; className?: string; children: ReactNode }) {
  return <Link to={to as "/"} search={search as never} className={className}>{children}</Link>;
}

export function KpiCard({ label, value, hint, to, search, icon: Icon, tone = "default" }: { label: string; value: string | number; hint?: string; to: string; search?: Record<string, string>; icon: LucideIcon; tone?: "default" | "danger" | "warning" | "success" }) {
  const toneClass = { default: "text-primary", danger: "text-destructive", warning: "text-warning", success: "text-success" }[tone];
  return <AppLink to={to} search={search} className="group block">
    <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-center justify-between"><Icon className={`h-4 w-4 ${toneClass}`} /><ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></div>
        <p className="font-display text-2xl leading-none">{value}</p>
        <p className="text-xs font-medium">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  </AppLink>;
}

export function requestVariant(status: RequestStatus): Variant {
  if (status === "Traité" || status === "Livré" || status === "Clôturé") return "success";
  if (status === "Partiellement traité") return "warning";
  if (status === "Non traité") return "destructive";
  if (status === "Brouillon") return "outline";
  return "elevated";
}
export function orderVariant(status: OrderStatus): Variant {
  if (status === "Reçue" || status === "Clôturée") return "success";
  if (status === "Partiellement reçue") return "warning";
  if (status === "Simulation" || status === "À valider") return "outline";
  return "secondary";
}
export const levelVariant = (level: string): Variant => level === "Critique" ? "destructive" : level === "Élevée" ? "elevated" : "warning";

export function ScopeSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-44" aria-label="Périmètre"><SelectValue /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>;
}

export function ActivityList({ items, limit = 8 }: { items: ActivityItem[]; limit?: number }) {
  return <Card><CardHeader><CardTitle className="text-base">Activité récente</CardTitle></CardHeader><CardContent className="divide-y divide-border p-0">
    {items.slice(0, limit).map((a) => <div key={a.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm"><div><p className="font-medium">{a.action}</p><p className="text-xs text-muted-foreground">{a.user}{a.location ? ` · ${a.location}` : ""} · {a.reference}</p></div><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(a.date, true)}</span></div>)}
    {items.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">Aucune activité sur ce périmètre.</p>}
  </CardContent></Card>;
}

export function AlertList({ items, limit = 6, title = "Alertes" }: { items: LiveAlert[]; limit?: number; title?: string }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">{title}</CardTitle><Badge variant="secondary">{items.length}</Badge></CardHeader><CardContent className="divide-y divide-border p-0">
    {items.slice(0, limit).map((a) => <AppLink key={a.id} to={a.link} className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/50"><div className="min-w-0"><div className="flex items-center gap-2"><Badge variant={levelVariant(a.level)}>{a.level}</Badge><span className="truncate font-medium">{a.title}</span></div><p className="mt-1 text-xs text-muted-foreground">{a.type} · {a.detail} · {a.location}</p></div><span className="shrink-0 text-xs text-primary">{a.action} →</span></AppLink>)}
    {items.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">Aucune alerte active.</p>}
  </CardContent></Card>;
}

export function AnomalyList({ items, limit = 6 }: { items: Anomaly[]; limit?: number }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Anomalies</CardTitle><Badge variant="secondary">{items.length}</Badge></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
    {items.slice(0, limit).map((a) => <AppLink key={a.id} to={a.link} className="rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/50"><Badge variant="warning">{a.kind}</Badge><p className="mt-2 font-medium">{a.title}</p><dl className="mt-2 grid grid-cols-3 gap-1 text-xs">{a.lines.map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl></AppLink>)}
    {items.length === 0 && <p className="text-sm text-muted-foreground">Aucune anomalie détectée.</p>}
  </CardContent></Card>;
}

export function requestDocument(req: StockRequest, articles: Article[]): OfficialDocument {
  const find = (id: string) => articles.find((a) => a.id === id);
  return {
    kind: "Bon de prélèvement", reference: req.id, date: fmtDate(req.date), subtitle: "Habanera — Économat Marrakech · Document de traçabilité interne",
    metadata: [["N° de bon", req.id], ["Date", new Date(req.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })], ["Service", req.service], ["Demandeur", req.requester], ["Validateur", req.processedBy ?? "—"], ["Statut", req.status]],
    columns: ["Code", "Désignation", "Qté demandée", "Qté traitée", "Unité"],
    rows: req.lines.map((l) => [l.articleId, find(l.articleId)?.nom ?? l.articleId, l.requested, l.prepared, find(l.articleId)?.unite ?? ""]),
    note: req.comment ? `Commentaire : ${req.comment}` : undefined,
  };
}
