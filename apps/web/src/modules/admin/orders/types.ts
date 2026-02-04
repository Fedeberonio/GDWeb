export type OrderActivityType =
  | "order_created"
  | "status_changed"
  | "payment_received"
  | "whatsapp_sent"
  | "whatsapp_received"
  | "note_added"
  | "image_uploaded";

export type OrderActivity = {
  id: string;
  type: OrderActivityType;
  timestamp: Date | string;
  userId?: string;
  userName?: string;
  data: {
    status?: string;
    message?: string;
    imageUrl?: string;
    phoneNumber?: string;
    note?: string;
  };
};

export type CustomerInfo = {
  userId?: string;
  email?: string;
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date | string;
  // Preferences
  likes?: string;
  dislikes?: string;
  variant?: string;
  mix?: string;
};
