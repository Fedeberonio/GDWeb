export type OrderSettings = {
  returnDiscountAmount?: number;
  usdExchangeRateDop?: number;
  deliveryFeeDays?: string[];
  deliveryFeeAmount?: number;
  paymentFeePercentage?: number;
};

export const DEFAULT_ORDER_SETTINGS: Required<OrderSettings> = {
  returnDiscountAmount: 30,
  usdExchangeRateDop: 59,
  deliveryFeeDays: ["Martes", "Jueves", "Sábado"],
  deliveryFeeAmount: 100,
  paymentFeePercentage: 10,
};
