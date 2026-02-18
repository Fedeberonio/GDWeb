
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, type DocumentData, type DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import type { OrderItem, OrderTotals } from "@/modules/orders/types";
import type { Product } from "@/modules/catalog/types";
import { createProductStockLogAdmin } from "@/modules/inventory/services/stockLogServiceAdmin";

type FinalizeRequestBody = {
    items: OrderItem[];
    delivery?: Record<string, unknown>;
    customerName?: string;
    customerPhone?: string;
    language?: "es" | "en";
};

// Helper to calculate totals on the server side to ensure data integrity
function calculateTotals(items: OrderItem[]): OrderTotals {
    const subtotalAmount = items.reduce(
        (sum, item) => sum + item.unitPrice.amount * item.quantity,
        0
    );

    return {
        subtotal: { amount: subtotalAmount, currency: "DOP" },
        total: { amount: subtotalAmount, currency: "DOP" }, // Assuming no extra fees/discounts for this basic implementation
        deliveryFee: { amount: 0, currency: "DOP" }, // Could be preserved if passed, but calculating fresh for safety
    };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Security Check
        const user = await requireAdminSession(request);

        const { id: orderId } = await params;
        const body = (await request.json()) as FinalizeRequestBody;
        const { items } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: "Invalid items format" },
                { status: 400 }
            );
        }

        // Optional fields from confirmation modal
        const { delivery, customerName, customerPhone, language } = body;

        const db = getAdminFirestore();
        const orderRef = db.collection("orders").doc(orderId);

        // Preparar items y refs fuera de la transacción (se usan también para logs)
        const productItems = items.filter((item) => item.type === "product");
        const productRefs = productItems.map((item) =>
            db.collection("catalog_products").doc(item.id)
        );
        let productDocs: Array<DocumentSnapshot<DocumentData>> = [];

        // 2. Transaction
        await db.runTransaction(async (transaction) => {
            // 2a. Read current order to ensure it exists
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) {
                throw new Error("Pedido no encontrado");
            }

            // 2b. Prepare reads for product stock
            // Filter for items that are actual products tracked in catalog_products
            if (productRefs.length > 0) {
                productDocs = await transaction.getAll(...productRefs);

                // 2c. Check Stock Availability
                productDocs.forEach((doc) => {
                    if (!doc.exists) {
                        throw new Error(`Producto no encontrado: ${doc.id}`);
                    }
                    const productData = doc.data() as Product;
                    const requestedItem = productItems.find((i) => i.id === doc.id);

                    if (!requestedItem) return;

                    const currentStock = productData.metadata?.stock ?? 0;
                    if (currentStock < requestedItem.quantity) {
                        throw new Error(
                            `Stock insuficiente para ${productData.name.es}. Disponible: ${currentStock}, Solicitado: ${requestedItem.quantity}`
                        );
                    }
                });

                // 2d. Decrement Stock
                productItems.forEach((item) => {
                    const productRef = db.collection("catalog_products").doc(item.id);
                    transaction.update(productRef, {
                        "metadata.stock": FieldValue.increment(-item.quantity),
                    });
                });
            }

            // 2e. Update Order
            // We explicitly rely on the items passed from the client as the final list.
            const currentOrderData = orderDoc.data();
            const existingTotals = currentOrderData?.totals;
            const newTotals = calculateTotals(items);

            // Preserve existing delivery fee and discounts if they exist
            const deliveryFeeAmount = existingTotals?.deliveryFee?.amount;
            if (typeof deliveryFeeAmount === "number" && existingTotals?.deliveryFee) {
                newTotals.deliveryFee = existingTotals.deliveryFee;
                newTotals.total.amount += deliveryFeeAmount;
            }
            const discountsAmount = existingTotals?.discounts?.amount;
            if (typeof discountsAmount === "number" && existingTotals?.discounts) {
                newTotals.discounts = existingTotals.discounts;
                newTotals.total.amount -= discountsAmount;
            }

            // Construct update object
            const updateData: Record<string, unknown> = {
                items: items,
                totals: newTotals,
                status: "confirmed",
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (language) {
                updateData.metadata = {
                    ...currentOrderData?.metadata,
                    language
                };
            }

            // Apply manual overrides from confirmation modal
            if (delivery) {
                updateData.delivery = delivery;
            }

            // If contact details changed, update the nested fields efficiently
            // Note: If we had a separate 'customer' document, we would update that too, 
            // but here we just update the snapshot in the order.
            if (customerName || customerPhone) {
                const deliveryData =
                    (typeof updateData.delivery === "object" && updateData.delivery !== null
                        ? (updateData.delivery as Record<string, unknown>)
                        : ((currentOrderData?.delivery as Record<string, unknown> | undefined) ?? {}));

                const addressData =
                    (typeof deliveryData.address === "object" && deliveryData.address !== null
                        ? (deliveryData.address as Record<string, unknown>)
                        : ((currentOrderData?.delivery?.address as Record<string, unknown> | undefined) ?? {}));

                if (customerName) addressData.contactName = customerName;
                if (customerPhone) addressData.phone = customerPhone;

                deliveryData.address = addressData;
                updateData.delivery = deliveryData;
            }

            transaction.update(orderRef, updateData);
        });

        // Crear logs de stock (fuera de transacción)
        try {
            for (const item of productItems) {
                const productDoc = productDocs.find((doc) => doc.id === item.id);
                if (!productDoc?.exists) continue;

                const productData = productDoc.data() as Product;
                const previousStock = productData.metadata?.stock ?? 0;
                const newStock = previousStock - item.quantity;

                await createProductStockLogAdmin({
                    productId: item.id,
                    delta: -item.quantity,
                    previousStock,
                    newStock,
                    reason: "order_finalized",
                    orderId: orderId,
                    actorEmail: user.email || null,
                });
            }
        } catch (logError) {
            console.warn("Failed to create stock logs:", logError);
            // No bloqueamos si falla el log
        }

        // 3. Return updated order (fetched fresh or just success)
        return NextResponse.json({ success: true, message: "Orden finalizada y stock descontado" });

    } catch (error) {
        console.error("Error finalizing order:", error);
        const message = error instanceof Error ? error.message : "Error desconocido al finalizar";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
