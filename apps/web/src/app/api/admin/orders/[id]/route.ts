import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import { FieldValue } from "firebase-admin/firestore";
import { loadOrderSettings } from "@/lib/config/load-order-settings";
import { calculateOrderTotals } from "@/lib/utils/order-totals";

type EditableOrderItem = {
  quantity?: number;
  unitPrice?: number | { amount?: number; currency?: string };
  startPrice?: number | { amount?: number; currency?: string };
  [key: string]: unknown;
};

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
    const { items, deliveryFee, delivery, paymentStatus, paymentMethod, status } = body;

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

    // If deliveryFee provided, or if we should fetch existing to preserve it?
    // Let's fetch existing for safety to preserve other fields
    const docSnap = await docRef.get();
    if (!docSnap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const existingData = docSnap.data();

    // Calculate new totals if items are present
    const cleanItems = Array.isArray(items)
      ? (items as EditableOrderItem[]).map((item) => {
          const unitPriceObj = typeof item.unitPrice === "object" && item.unitPrice !== null ? item.unitPrice : null;
          const startPriceObj = typeof item.startPrice === "object" && item.startPrice !== null ? item.startPrice : null;
          const unitAmount = cleanNumber(unitPriceObj?.amount ?? item?.unitPrice ?? 0);
          const startAmount = cleanNumber(startPriceObj?.amount ?? unitAmount);
          return {
            ...item,
            quantity: cleanNumber(item?.quantity ?? 0),
            unitPrice: {
              amount: unitAmount,
              currency: unitPriceObj?.currency ?? "DOP",
            },
            startPrice: {
              amount: startAmount,
              currency: startPriceObj?.currency ?? unitPriceObj?.currency ?? "DOP",
            },
          };
        })
      : null;

    // Recalculate totals if items, payment, or delivery changed
    const shouldRecalculate = cleanItems || paymentMethod || delivery?.window?.day;
    const itemsToUse = cleanItems || (existingData?.items || []);
    const settings = await loadOrderSettings();
    const existingDiscountAmount = cleanNumber(
      existingData?.totals?.discounts?.amount ?? existingData?.totals?.discount?.amount ?? 0,
    );
    const existingTipAmount = cleanNumber(
      existingData?.totals?.tip?.amount ?? existingData?.tip?.amount ?? 0,
    );

    const newTotals = shouldRecalculate
      ? calculateOrderTotals(
          {
            items: itemsToUse,
            deliveryDay: delivery?.window?.day || existingData?.delivery?.window?.day,
            paymentMethod: paymentMethod || existingData?.paymentMethod,
            manualDiscount: existingDiscountAmount,
          },
          {
            paymentFeePercentage: settings.paymentFeePercentage,
            deliveryFeeAmount: settings.deliveryFeeAmount,
            deliveryFeeDays: settings.deliveryFeeDays,
          },
        )
      : null;

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

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (status) updateData.status = status;

    if (cleanItems) {
      updateData.items = cleanItems;
      const recalculatedSubtotal = newTotals?.subtotal ?? { amount: 0, currency: "DOP" };
      const recalculatedPaymentFee = newTotals?.paymentFee ?? { amount: 0, currency: "DOP" };
      const recalculatedDeliveryFee = newTotals?.deliveryFee ?? existingFee;
      const recalculatedBaseTotal =
        recalculatedSubtotal.amount + recalculatedDeliveryFee.amount + recalculatedPaymentFee.amount - existingDiscountAmount;
      updateData.totals = {
        subtotal: recalculatedSubtotal,
        deliveryFee: recalculatedDeliveryFee,
        paymentFee: recalculatedPaymentFee,
        discounts: { amount: existingDiscountAmount, currency: "DOP" },
        tip: { amount: existingTipAmount, currency: "DOP" },
        total: {
          amount: recalculatedBaseTotal + existingTipAmount,
          currency: "DOP",
        },
      };
    } else if (deliveryFee !== undefined) {
      // If only delivery fee update without items
      const existingSubtotal = existingData?.totals?.subtotal || { amount: 0, currency: "DOP" };
      const existingPaymentFee = existingData?.totals?.paymentFee || { amount: 0, currency: "DOP" };
      const existingDiscount = existingData?.totals?.discounts || { amount: existingDiscountAmount, currency: "DOP" };
      const existingTip = existingData?.totals?.tip || { amount: existingTipAmount, currency: "DOP" };
      updateData.totals = {
        subtotal: existingSubtotal,
        deliveryFee: existingFee,
        paymentFee: existingPaymentFee,
        discounts: existingDiscount,
        tip: existingTip,
        total: {
          amount:
            existingSubtotal.amount +
            existingFee.amount +
            (existingPaymentFee?.amount ?? 0) -
            (existingDiscount?.amount ?? 0) +
            (existingTip?.amount ?? 0),
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
