import { DEFAULT_ORDER_SETTINGS, type OrderSettings } from "./order-settings";

/**
 * Load order settings (server-side).
 * Can be extended to fetch from Firestore or admin API.
 */
export async function loadOrderSettings(): Promise<OrderSettings> {
  return { ...DEFAULT_ORDER_SETTINGS };
}
