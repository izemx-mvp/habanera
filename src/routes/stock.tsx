import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, PackageSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ARTICLES, formatMAD } from "@/lib/habanera-data";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock économat — Habanera" },
      {
        name: "description",
        content: "Inventaire complet de l'économat Habanera avec tri, filtres et alertes de seuil.",
      },
      { property: "og:title", content: "Stock économat — Habanera" },
      {
        property: "og:description",
        content: "Recherchez, triez et filtrez les références du stock de l'établissement.",
      },
    ],
  }),
  component: StockPage,
});

type SortKey = "nom" | "stock" | "prixAchat";

function StockPage() {
  const [q, setQ] = useState("");
  const [point, setPoint] = useState("tous");
  const [sort, setSort] = useState<SortKey>("nom");
  const [asc, setAsc] = useState(true);

  const rows = useMemo(() => {
    const filtered = ARTICLES.filter(
      (a) =>
        (point === "tous" || a.point === point) &&
        (a.nom.toLowerCase().includes(q.toLowerCase()) ||
          a.categorie.toLowerCase().includes(q.toLowerCase())),
    );
    return [...filtered].sort((a, b) => {
      const v =
        sort === "nom" ? a.nom.localeCompare(b.nom) : sort === "stock" ? a.stock - b.stock : a.prixAchat - b.prix;
      return asc ? v : -v;
    });
  }, [q, point, sort, asc]);

  function toggleSort(key: SortKey) {
    if (key === sort) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(true);
    }
  }

  return (
    <AppShell title="Stock économat" subtitle={`${ARTICLES.length} références suivies`}>
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un article ou une catégorie..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={point} onValueChange={setPoint}>
              <SelectTrigger className="sm:w-52">
                <SelectValue placeholder="Point de stockage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les points</SelectItem>
                <SelectItem value="Bar">Bar</SelectItem>
                <SelectItem value="Cuisine">Cuisine</SelectItem>
                <SelectItem value="Économat">Économat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead>
                    <button
                      onClick={() => toggleSort("nom")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Article <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Point</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => toggleSort("stock")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Stock <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => toggleSort("prixAchat")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      Valeur <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium">Aucun article trouvé</p>
                      <p className="text-xs text-muted-foreground">
                        Modifiez votre recherche ou changez de point de stockage.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((a) => (
                    <TableRow key={a.id} className="transition-colors duration-150">
                      <TableCell className="font-medium">{a.nom}</TableCell>
                      <TableCell className="text-muted-foreground">{a.categorie}</TableCell>
                      <TableCell className="text-muted-foreground">{a.point}</TableCell>
                      <TableCell className="text-right">
                        {a.stock} {a.unite}
                      </TableCell>
                      <TableCell className="text-right">{formatMAD(a.stock * a.prixAchat)}</TableCell>
                      <TableCell className="text-right">
                        {a.stock < a.seuil ? (
                          <Badge variant="destructive">Sous seuil</Badge>
                        ) : (
                          <Badge variant="secondary">Suffisant</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
