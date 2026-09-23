import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function usePagination<T>(items: T[], pageSize = 8) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(1); }, [page, pageCount]);
  const current = Math.min(page, pageCount);
  const paged = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);
  return { paged, page: current, pageCount, setPage, total: items.length };
}

export function DataPagination({ page, pageCount, total, onPageChange, label = "éléments" }: { page: number; pageCount: number; total: number; onPageChange: (page: number) => void; label?: string }) {
  if (total === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">{total} {label} · page {page} sur {pageCount}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" />Précédent</Button>
        <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">Suivant<ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
