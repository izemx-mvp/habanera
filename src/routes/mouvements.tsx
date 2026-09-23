import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataPagination, usePagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOUVEMENTS } from "@/lib/habanera-data";

export const Route = createFileRoute("/mouvements")({
  head: () => ({
    meta: [
      { title: "Mouvements de stock — Habanera" },
      {
        name: "description",
        content: "Journal des entrées, sorties et transferts de stock entre le bar, la cuisine et l'économat.",
      },
      { property: "og:title", content: "Mouvements de stock — Habanera" },
      {
        property: "og:description",
        content: "Traçabilité complète de chaque entrée, sortie et transfert de l'économat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MouvementsPage,
});

function MouvementsPage() {
  const [filtre, setFiltre] = useState("Tous");
  const rows = MOUVEMENTS.filter((m) => filtre === "Tous" || m.type === filtre);

  const { paged, page, pageCount, setPage, total } = usePagination(rows, 8);

  return (
    <AppShell title="Mouvements" subtitle="Journal de traçabilité des 7 derniers jours">
      <Card>
        <CardContent className="p-5">
          <Tabs value={filtre} onValueChange={setFiltre}>
            <TabsList>
              {["Tous", "Entrée", "Sortie", "Transfert"].map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mt-5 overflow-hidden rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead>Réf.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead>Point</TableHead>
                  <TableHead>Auteur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center text-sm text-muted-foreground">
                      Aucun mouvement de ce type sur la période.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-muted-foreground">{m.id}</TableCell>
                      <TableCell className="text-muted-foreground">{m.date}</TableCell>
                      <TableCell className="font-medium">{m.article}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.type === "Entrée" ? "default" : m.type === "Sortie" ? "destructive" : "secondary"
                          }
                        >
                          {m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{m.quantite}</TableCell>
                      <TableCell className="text-muted-foreground">{m.point}</TableCell>
                      <TableCell className="text-muted-foreground">{m.auteur}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DataPagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} label="mouvements" />
        </CardContent>
      </Card>
    </AppShell>
  );
}
