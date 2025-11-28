import { orderSchema, orderStatusSchema, type Order, type OrderStatus } from "./schemas";
import { getOrderById, listOrders, updateOrderStatus } from "./repository";

export async function listOrdersForAdmin(limit = 100): Promise<Order[]> {
  const orders = await listOrders(limit);
  return orders.map((order) => orderSchema.parse(order));
}

export async function getOrderDetail(id: string): Promise<Order | null> {
  const order = await getOrderById(id);
  if (!order) return null;
  return orderSchema.parse(order);
}

export async function updateOrderStatusById(id: string, status: OrderStatus): Promise<Order | null> {
  const parsedStatus = orderStatusSchema.parse(status);
  const updated = await updateOrderStatus(id, parsedStatus);
  if (!updated) return null;
  return orderSchema.parse(updated);
}
