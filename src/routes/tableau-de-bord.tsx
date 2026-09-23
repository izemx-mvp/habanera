import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, Wallet } from "lucide-react";
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
import { ARTICLES, CONSOMMATION, MOUVEMENTS, formatMAD } from "@/lib/habanera-data";

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
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const valeur = ARTICLES.reduce((sum, a) => sum + a.stock * a.prixAchat, 0);
  const alertes = ARTICLES.filter((a) => a.stock < a.seuil);

  const kpis = [
    { label: "Valeur du stock", value: formatMAD(valeur), trend: "+4,2 %", up: true, icon: Wallet },
    { label: "Références suivies", value: `${ARTICLES.length}`, trend: "+2 ce mois", up: true, icon: Boxes },
    { label: "Alertes de seuil", value: `${alertes.length}`, trend: "à réapprovisionner", up: false, icon: AlertTriangle },
    { label: "Mouvements (7 j)", value: `${MOUVEMENTS.length * 7}`, trend: "-3,1 %", up: false, icon: ArrowDownRight },
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
            <Card key={kpi.label} className="transition-shadow duration-200 hover:shadow-[var(--shadow-soft)]">
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
            </Card>
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
            <CardTitle className="text-base">Alertes de seuil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : alertes.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucun article sous le seuil. Tout est en ordre.
              </p>
            ) : (
              alertes.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 transition-colors duration-200 hover:bg-muted/60"
                >
                  <div>
                    <p className="text-sm font-medium">{a.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.point} · seuil {a.seuil} {a.unite}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {a.stock} {a.unite}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
