import { createContext, useContext } from "react";
import type { ServiceName } from "@/lib/permissions";
import type { ActivityItem, Location, Movement, MovementType, NotificationItem, OrderStatus, Reception, Recipe, RecipeSale, RequestStatus, ServiceStock, StockRequest, SupplierOrder } from "@/lib/workflow-logic";

export type WorkflowValue = {
  serviceStock: ServiceStock; serviceRefs: ServiceStock; movements: Movement[]; requests: StockRequest[]; orders: SupplierOrder[];
  receptions: Reception[]; recipes: Recipe[]; sales: RecipeSale[]; notifications: NotificationItem[]; activity: ActivityItem[];
  recordSale: (opId: string, input: { service: ServiceName; recipeId: string; quantity: number; user: string }) => RecipeSale | null;
  createRequest: (input: { service: ServiceName; lines: Array<{ articleId: string; requested: number }>; comment: string; user: string; send: boolean }) => StockRequest;
  setRequestStatus: (id: string, status: RequestStatus, user: string) => void;
  processRequest: (id: string, prepared: Record<string, number>, user: string) => StockRequest | null;
  adjustStock: (opId: string, input: { articleId: string; location: Location; newQuantity: number; user: string; type?: MovementType; reason: string }) => boolean;
  createOrder: (input: { supplierId: string; supplierName: string; lines: Array<{ articleId: string; ordered: number; unitPrice: number }>; status: OrderStatus; user: string; delay: number }) => SupplierOrder;
  setOrderStatus: (id: string, status: OrderStatus, user: string) => void;
  receiveOrder: (orderId: string, received: Record<string, number>, user: string) => Reception | null;
  setServiceRef: (articleId: string, service: ServiceName, value: number | undefined) => void;
  markRead: (id: string) => void;
};

export const WorkflowContext = createContext<WorkflowValue | null>(null);
export function useWorkflow() {
  const value = useContext(WorkflowContext);
  if (!value) throw new Error("useWorkflow doit être utilisé dans WorkflowProvider");
  return value;
}
