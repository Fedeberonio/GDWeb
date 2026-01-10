import type { Order, OrderStatus } from "./schemas";
export declare function listOrders(limit?: number): Promise<Order[]>;
export declare function getOrderById(id: string): Promise<Order | null>;
export declare function createOrder(order: Omit<Order, "createdAt" | "updatedAt"> & {
    createdAt?: unknown;
    updatedAt?: unknown;
}): Promise<{
    id: string;
    items: {
        id: string;
        type: "product" | "box" | "addon";
        referenceId: string;
        name: {
            es: string;
            en: string;
        };
        quantity: number;
        unitPrice: {
            amount: number;
            currency: string;
        };
        metadata?: Record<string | number | symbol, unknown>;
    }[];
    totals: {
        subtotal: {
            amount: number;
            currency: string;
        };
        total: {
            amount: number;
            currency: string;
        };
        deliveryFee?: {
            amount: number;
            currency: string;
        };
        discounts?: {
            amount: number;
            currency: string;
        };
    };
    status: "pending" | "confirmed" | "preparing" | "ready" | "in_transit" | "delivered" | "cancelled";
    delivery: {
        address: {
            id: string;
            label: string;
            contactName: string;
            phone: string;
            city: string;
            zone: string;
            isDefault: boolean;
            notes?: string;
            location?: {
                latitude?: number;
                longitude?: number;
            };
        };
        window?: {
            day: string;
            slot?: string;
        };
        notes?: string;
    };
    payment: {
        method: "cash" | "transfer" | "card" | "online";
        status: "pending" | "cancelled" | "paid" | "refunded";
        transactionId?: string;
    };
    createdAt: string | Date;
    userId?: string;
    guestEmail?: string;
    updatedAt?: string | Date;
    whatsappMessageId?: string;
}>;
export declare function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null>;
//# sourceMappingURL=repository.d.ts.map