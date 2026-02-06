import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { FieldValue } from "firebase-admin/firestore";
import type { OrderItem } from "@/modules/orders/types";

// Helper to recalculate simple totals (same logic as finalize)
function calculateTotals(items: OrderItem[]) {
  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice.amount * item.quantity,
    0
  );
  return {
    subtotal: { amount: subtotalAmount, currency: "DOP" },
    total: { amount: subtotalAmount, currency: "DOP" }, // Base logic
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminSession(request);
    const db = getAdminFirestore();
    const docRef = db.collection("orders").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = docSnap.data();
    const order = {
      id: docSnap.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminSession(request);
    const body = await request.json();
    const { items, deliveryFee, delivery, paymentStatus, paymentMethod } = body;

    // Validate if at least one updateable field is present
    if (!items && !delivery && !deliveryFee && !paymentStatus && !paymentMethod) {
      return NextResponse.json({ error: "Invalid payload: No updateable fields provided" }, { status: 400 });
    }

    if (items && !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items payload" }, { status: 400 });
    }

    const cleanNumber = (value: unknown, fallback = 0) => {
      if (value === "" || value === null || value === undefined) return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const db = getAdminFirestore();
    const docRef = db.collection("orders").doc(id);

    // Calculate new totals if items are present
    const cleanItems = Array.isArray(items)
      ? items.map((item: any) => {
          const unitAmount = cleanNumber(item?.unitPrice?.amount ?? item?.unitPrice ?? 0);
          const startAmount = cleanNumber(item?.startPrice?.amount ?? unitAmount);
          return {
            ...item,
            quantity: cleanNumber(item?.quantity ?? 0),
            unitPrice: {
              amount: unitAmount,
              currency: item?.unitPrice?.currency ?? "DOP",
            },
            startPrice: {
              amount: startAmount,
              currency: item?.startPrice?.currency ?? item?.unitPrice?.currency ?? "DOP",
            },
          };
        })
      : null;

    const newTotals = cleanItems ? calculateTotals(cleanItems) : null;

    // If deliveryFee provided, or if we should fetch existing to preserve it?
    // Let's fetch existing for safety to preserve other fields
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const existingData = docSnap.data();

    // VALIDATION: Cannot mark as paid if status is pending or cancelled
    // Exception: If we are also updating status to something else in this same request (though UI keeps them separate usually)
    if (paymentStatus === 'paid') {
      const currentStatus = existingData?.status;
      const invalidStatuses = ['pending', 'cancelled'];
      if (invalidStatuses.includes(currentStatus)) {
        return NextResponse.json({
          error: "No se puede marcar como pagado un pedido que no ha sido confirmado."
        }, { status: 400 });
      }
    }
    const existingFee = deliveryFee !== undefined
      ? { amount: cleanNumber(deliveryFee), currency: "DOP" }
      : (existingData?.totals?.deliveryFee || { amount: 0, currency: "DOP" });

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    if (cleanItems) {
      updateData.items = cleanItems;
      updateData.totals = {
        ...newTotals,
        deliveryFee: existingFee
      };
    } else if (deliveryFee !== undefined) {
      // If only delivery fee update without items
      const existingSubtotal = existingData?.totals?.subtotal || { amount: 0, currency: "DOP" };
      updateData.totals = {
        subtotal: existingSubtotal,
        deliveryFee: existingFee,
        total: {
          amount: existingSubtotal.amount + existingFee.amount,
          currency: "DOP"
        }
      };
    }

    if (delivery) {
      updateData.delivery = delivery;
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating order:", error);
    const message = error instanceof Error ? error.message : "Check server logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("DELETE order attempt:", id);
  try {
    await requireAdminSession(request);
    const { searchParams } = new URL(request.url);
    const restoreStock = searchParams.get("restoreStock") === "true";

    const db = getAdminFirestore();
    const orderRef = db.collection("orders").doc(id);

    await db.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error("Order not found");
      }

      const orderData = orderSnap.data();

      // If restoreStock is requested AND order has items
      if (restoreStock && Array.isArray(orderData?.items)) {
        for (const item of orderData.items) {
          // Assuming item.productId is the ID in catalog_products, fallback to item.id (slug)
          const productId = item.productId || item.id;
          if (productId && item.quantity > 0) {
            const productRef = db.collection("catalog_products").doc(productId);
            // We increment stock using FieldValue.increment
            transaction.update(productRef, {
              "metadata.stock": FieldValue.increment(item.quantity)
            });
          }
        }
      }

      transaction.delete(orderRef);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
