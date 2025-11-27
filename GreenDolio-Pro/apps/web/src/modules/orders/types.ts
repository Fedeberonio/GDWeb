import type { Price } from "@/modules/catalog/types";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  type: "product" | "box" | "addon";
  referenceId: string;
  name: { es: string; en: string };
  quantity: number;
  unitPrice: Price;
  metadata?: Record<string, unknown>;
};

export type OrderTotals = {
  subtotal: Price;
  deliveryFee?: Price;
  discounts?: Price;
  total: Price;
};

export type OrderDelivery = {
  address: {
    label: string;
    contactName: string;
    phone: string;
    city: string;
    zone: string;
    notes?: string;
  };
  window?: {
    day: string;
    slot?: string;
  };
  notes?: string;
};

export type PaymentDetails = {
  method: "cash" | "transfer" | "card" | "online";
  status: "pending" | "paid" | "refunded" | "cancelled";
  transactionId?: string;
};

export type Order = {
  id: string;
  userId?: string;
  guestEmail?: string;
  items: OrderItem[];
  totals: OrderTotals;
  status: OrderStatus;
  delivery: OrderDelivery;
  payment: PaymentDetails;
  createdAt: string;
  updatedAt?: string;
};
