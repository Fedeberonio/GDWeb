import { type Order, type OrderStatus } from "./schemas";
export declare function listOrdersForAdmin(limit?: number): Promise<Order[]>;
export declare function getOrderDetail(id: string): Promise<Order | null>;
export declare function updateOrderStatusById(id: string, status: OrderStatus): Promise<Order | null>;
//# sourceMappingURL=service.d.ts.map