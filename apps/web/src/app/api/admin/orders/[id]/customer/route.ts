import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import type { CustomerInfo } from "@/modules/admin/orders/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminSession(request);

    const db = getAdminFirestore();
    const orderDoc = await db.collection("orders").doc(id).get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data();
    const userId = orderData?.userId;
    // Basic info from order delivery
    const customerInfo: CustomerInfo = {
      name: orderData?.delivery?.address?.contactName || "Unknown",
      phone: orderData?.delivery?.address?.phone || "",
      email: orderData?.guestEmail || "",
      totalOrders: 0,
      totalSpent: 0,
    };

    if (userId) {
      // Fetch User Profile for preferences & stats
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        customerInfo.userId = userId;
        customerInfo.email = userData?.email || customerInfo.email;
        customerInfo.name = userData?.displayName || customerInfo.name;
        // Preferences
        customerInfo.likes = userData?.likes;
        customerInfo.dislikes = userData?.dislikes;
        customerInfo.variant = userData?.variant; // "mix" | "fruity" | "veggie"
        // customerInfo.mix = userData?.mix; // If stored differently
      }

      // Calculate stats (Total Orders & Spent)
      try {
        const ordersQuery = await db.collection("orders")
          .where("userId", "==", userId)
          .get(); // Fetch all and filter in memory to avoid index requirement for now

        const validOrders = ordersQuery.docs.filter(d => d.data().status !== 'cancelled');

        customerInfo.totalOrders = validOrders.length;
        customerInfo.totalSpent = validOrders.reduce((sum, doc) => {
          const d = doc.data();
          return sum + (d.totals?.total?.amount || 0);
        }, 0);

        // Find last order date
        if (validOrders.length > 0) {
          const timestamps = validOrders.map(d => {
            const val = d.data().createdAt;
            // Handle both Firestore Timestamp and ISO strings
            if (val && typeof val.toDate === 'function') return val.toDate().getTime();
            if (typeof val === 'string') return new Date(val).getTime();
            return 0;
          });
          customerInfo.lastOrderDate = new Date(Math.max(...timestamps));
        }
      } catch (err) {
        console.error("Stats calculation failed:", err);
        // Don't crash the whole customer info fetch
      }
    }

    return NextResponse.json({ data: customerInfo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error fetching customer info:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
