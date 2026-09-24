import { useMemo } from "react";
import { useOperations } from "@/lib/operations-context";
import { useWorkflow } from "@/lib/workflow-context";
import { detectAlerts, detectAnomalies } from "@/lib/workflow-logic";

/** Alertes et anomalies calculées en continu à partir des données partagées. */
export function useInsights() {
  const { articles, inventoryReports } = useOperations();
  const wf = useWorkflow();
  return useMemo(() => {
    const inventoryGaps = inventoryReports.flatMap((r) => r.lines.map((l) => ({ article: l.article, theoretical: l.theoretical, real: l.real, gap: l.gap, date: new Date().toISOString() })));
    return {
      alerts: detectAlerts({ articles, requests: wf.requests, orders: wf.orders, serviceStock: wf.serviceStock, serviceRefs: wf.serviceRefs }),
      anomalies: detectAnomalies({ articles, receptions: wf.receptions, requests: wf.requests, sales: wf.sales, recipes: wf.recipes, inventoryGaps }),
    };
  }, [articles, inventoryReports, wf.requests, wf.orders, wf.serviceStock, wf.serviceRefs, wf.receptions, wf.sales, wf.recipes]);
}
