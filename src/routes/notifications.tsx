import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLink } from "@/components/workflow-ui";
import { useAuth } from "@/lib/auth";
import { roleServices } from "@/lib/permissions";
import { useWorkflow } from "@/lib/workflow-context";
import { fmtDate } from "@/lib/workflow-logic";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Habanera" }, { name: "description", content: "Événements importants : bons, ruptures, réceptions et anomalies." }, { property: "og:title", content: "Notifications — Habanera" }, { property: "og:description", content: "Notifications des services Habanera." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, space } = useAuth();
  const wf = useWorkflow();
  const audiences: string[] = user?.role === "Administrateur" ? (space === "service" ? ["Bar", "Cuisine"] : space === "economat" ? ["economat"] : ["admin", "economat", "Bar", "Cuisine"]) : user?.role === "Économat" ? ["economat"] : user ? roleServices(user.role) : [];
  const items = wf.notifications.filter((n) => audiences.includes(n.audience));
  const { paged, page, pageCount, setPage, total } = usePagination(items, 10);
  return <AppShell title="Notifications" subtitle={`${items.filter((n) => !n.read).length} non lue(s)`}>
    <Card><CardContent className="divide-y divide-border p-0">
      {paged.map((n) => <div key={n.id} className={`flex items-center gap-4 px-5 py-4 ${n.read ? "opacity-60" : ""}`}><Bell className="h-4 w-4 shrink-0 text-primary" /><AppLink to={n.link} className="min-w-0 flex-1"><p className="font-medium">{n.title} {!n.read && <Badge variant="elevated" className="ml-1">Nouveau</Badge>}</p><p className="text-sm text-muted-foreground">{n.detail} · {fmtDate(n.date, true)}</p></AppLink>{!n.read && <Button size="sm" variant="ghost" onClick={() => wf.markRead(n.id)}><Check className="mr-1 h-4 w-4" />Lu</Button>}</div>)}
      {items.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">Aucune notification.</p>}
      <div className="px-5"><DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="notifications" /></div>
    </CardContent></Card>
  </AppShell>;
}
