import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ClipboardList, ShoppingCart, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CONSOMMATION, formatMAD } from "@/lib/habanera-data";
import { useOperations } from "@/lib/operations-context";

export const Route = createFileRoute("/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Habanera Économat" },
      {
        name: "description",
        content: "Vue d'ensemble des stocks, alertes de seuil et consommation du bar et de la cuisine.",
      },
      { property: "og:title", content: "Tableau de bord — Habanera Économat" },
      {
        property: "og:description",
        content: "Valeur du stock, alertes et mouvements récents de l'économat Habanera.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { articles, purchases, alerts: anomalies } = useOperations();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const valeur = articles.reduce((sum, a) => sum + a.stock * a.prixAchat, 0);
  const alertes = articles.filter((a) => a.stock < a.seuil);

  const kpis = [
    { label: "Valeur du stock", value: formatMAD(valeur), trend: "+4,2 %", up: true, icon: Wallet, to: "/stock" as const },
    { label: "Alertes de rupture", value: `${alertes.length}`, trend: "à traiter", up: false, icon: AlertTriangle, to: "/alertes" as const },
    { label: "Bons en attente", value: `${articles.filter((a) => a.ventes > 0).length}`, trend: "prélèvements suggérés", up: false, icon: ClipboardList, to: "/bons-prelevement" as const },
    { label: "Commandes en cours", value: `${purchases.filter((p) => p.status === "En cours").length}`, trend: "livraison attendue", up: true, icon: ShoppingCart, to: "/achats-receptions" as const },
  ];

  return (
    <AppShell
      title="Tableau de bord"
      subtitle="Mercredi 23 septembre · Service du soir en préparation"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) =>
          loading ? (
            <Skeleton key={kpi.label} className="h-32 rounded-xl" />
          ) : (
            <Link key={kpi.label} to={kpi.to} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </span>
                  <kpi.icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                </div>
                <p className="mt-3 font-display text-3xl">{kpi.value}</p>
                <p
                  className={`mt-1 flex items-center gap-1 text-xs ${kpi.up ? "text-success" : "text-muted-foreground"}`}
                >
                  {kpi.up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {kpi.trend}
                </p>
              </CardContent>
            </Card></Link>
          ),
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consommation hebdomadaire (MAD)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CONSOMMATION} margin={{ left: -18, right: 6, top: 6 }}>
                  <defs>
                    <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCuisine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="jour" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bar"
                    name="Bar"
                    stroke="var(--color-chart-1)"
                    fill="url(#gBar)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="cuisine"
                    name="Cuisine"
                    stroke="var(--color-chart-2)"
                    fill="url(#gCuisine)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anomalies détectées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : anomalies.filter((a) => !a.resolved).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucun article sous le seuil. Tout est en ordre.
              </p>
            ) : (
              anomalies.filter((a) => !a.resolved).map((a) => (
                <Link
                  key={a.id}
                  to={a.type === "Inventaire" ? "/inventaire" : a.type === "Réception" ? "/achats-receptions" : "/alertes"}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 transition-all duration-200 hover:border-primary/40 hover:bg-muted/60"
                >
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <Badge variant="destructive">
                    {a.level}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
