import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const USERS_COLLECTION = "users";
const ORDERS_COLLECTION = "orders";

type NormalizedOrder = {
  id: string;
  userId?: string;
  date: string;
  status: string;
  total: number;
  deliveryAddress?: {
    label?: string;
    city?: string;
    zone?: string;
    contactName?: string;
    phone?: string;
  };
  guestEmail?: string | null;
};

function toDateString(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return "";
}

function formatAddress(address?: {
  label?: string;
  city?: string;
  zone?: string;
}) {
  if (!address) return null;
  const parts = [address.label, address.zone, address.city].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);

    const db = getAdminFirestore();

    const [usersSnapshot, ordersSnapshot] = await Promise.all([
      db.collection(USERS_COLLECTION).get(),
      db.collection(ORDERS_COLLECTION).get(),
    ]);

    const ordersByUser = new Map<string, NormalizedOrder[]>();

    ordersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId as string | undefined;
      if (!userId) return;

      const normalized: NormalizedOrder = {
        id: doc.id,
        userId,
        date: toDateString(data.createdAt) || new Date().toISOString(),
        status: data.status || "pending",
        total: data?.totals?.total?.amount ?? 0,
        deliveryAddress: data?.delivery?.address,
        guestEmail: data?.guestEmail ?? null,
      };

      const existing = ordersByUser.get(userId);
      if (existing) {
        existing.push(normalized);
      } else {
        ordersByUser.set(userId, [normalized]);
      }
    });

    const customers = usersSnapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, any>;
        const orders = ordersByUser.get(doc.id) ?? [];

        orders.sort((a, b) => b.date.localeCompare(a.date));
        const latestOrder = orders[0];

        const totalSpent = orders.reduce((sum, order) => {
          return order.status !== "cancelled" ? sum + order.total : sum;
        }, 0);

        const addresses = new Set<string>();
        if (typeof data.direccion === "string" && data.direccion.trim()) {
          addresses.add(data.direccion.trim());
        }
        orders.forEach((order) => {
          const formatted = formatAddress(order.deliveryAddress);
          if (formatted) addresses.add(formatted);
        });

        const createdAt = toDateString(data.fechaCreacion) || "";

        return {
          id: doc.id,
          name: data.displayName || data.name || latestOrder?.deliveryAddress?.contactName || "Sin nombre",
          email: data.email || latestOrder?.guestEmail || "—",
          phone: data.telefono || latestOrder?.deliveryAddress?.phone || null,
          city: data.city || latestOrder?.deliveryAddress?.city || null,
          sector: data.sector || latestOrder?.deliveryAddress?.zone || null,
          ordersCount: orders.length,
          totalSpent,
          status: data.status || (orders.length > 0 ? "active" : "inactive"),
          avatarUrl: data.avatarUrl || null,
          orders: orders.map((order) => ({
            id: order.id,
            date: order.date,
            status: order.status,
            total: order.total,
          })),
          addresses: Array.from(addresses),
          createdAt,
        };
      })
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        return b.ordersCount - a.ordersCount;
      });

    return NextResponse.json({ data: customers });
  } catch (error) {
    console.error("Error fetching admin customers:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
