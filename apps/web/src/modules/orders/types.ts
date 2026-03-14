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
  paymentFee?: Price;
  discounts?: Price;
  tip?: Price;
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
  cash?: {
    currency: "DOP" | "USD";
    exchangeRateDop: number;
    amountDue: number;
    requiresChange: boolean;
    paidWithAmount?: number | null;
    changeAmount?: number;
    remainingAmount?: number;
  };
};

export type OrderStockWarningItem = {
  id: string;
  name?: string;
  requested: number;
  available: number;
};

export type OrderStockValidation = {
  hasInsufficientStock: boolean;
  checkedAt: string;
  items: OrderStockWarningItem[];
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
  paymentStatus?: "unpaid" | "paid" | "refunded";
  paymentMethod?: "transfer_popular" | "transfer_qik" | "cash" | "card" | "other";
  paymentCash?: {
    currency: "DOP" | "USD";
    exchangeRateDop: number;
    amountDue: number;
    requiresChange: boolean;
    paidWithAmount?: number | null;
    changeAmount?: number;
    remainingAmount?: number;
  };
  createdAt: string;
  updatedAt?: string;
  stockValidation?: OrderStockValidation;
  returnsPackaging?: {
    returned: boolean;
    discountAmount: number;
    customerReturnCountAfterOrder?: number;
    qualifiesForSpecialReward?: boolean;
  };
  tip?: {
    amount: number;
    type: "none" | "10" | "15" | "20" | "custom";
  };
  metadata?: {
    language?: "es" | "en";
    [key: string]: unknown;
  };
};
