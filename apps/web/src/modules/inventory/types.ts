export type StockLogReason = 
  | "order_finalized"
  | "order_deleted" 
  | "manual_edit"
  | "purchase"
  | "adjustment";

export type ProductStockLog = {
  productId: string;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: StockLogReason;
  orderId?: string;
  actorEmail: string | null;
  createdAt: any; // Firebase Timestamp
};
