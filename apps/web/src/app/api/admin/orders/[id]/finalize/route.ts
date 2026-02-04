
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";
import type { OrderItem, OrderTotals } from "@/modules/orders/types";
import type { Product } from "@/modules/catalog/types";

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
    { params }: { params: { id: string } }
) {
    try {
        // 1. Security Check
        await requireAdminSession(request);

        const orderId = params.id;
        const body = await request.json();
        const { items } = body as { items: OrderItem[] };

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: "Invalid items format" },
                { status: 400 }
            );
        }

        // Optional fields from confirmation modal
        const { delivery, customerName, customerPhone, language } = body as {
            delivery?: any,
            customerName?: string,
            customerPhone?: string,
            language?: "es" | "en"
        };

        const db = getAdminFirestore();
        const orderRef = db.collection("orders").doc(orderId);

        // 2. Transaction
        await db.runTransaction(async (transaction) => {
            // 2a. Read current order to ensure it exists
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) {
                throw new Error("Pedido no encontrado");
            }

            // 2b. Prepare reads for product stock
            // Filter for items that are actual products tracked in catalog_products
            const productItems = items.filter((item) => item.type === "product");
            const productRefs = productItems.map((item) =>
                db.collection("catalog_products").doc(item.id)
            );

            if (productRefs.length > 0) {
                const productDocs = await transaction.getAll(...productRefs);

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
            const newTotals = calculateTotals(items);

            // Preserve existing delivery fee and discounts if they exist
            if (currentOrderData?.totals?.deliveryFee) {
                newTotals.deliveryFee = currentOrderData.totals.deliveryFee;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                newTotals.total.amount += newTotals.deliveryFee!.amount;
            }
            if (currentOrderData?.totals?.discounts) {
                newTotals.discounts = currentOrderData.totals.discounts;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                newTotals.total.amount -= newTotals.discounts!.amount;
            }

            // Construct update object
            const updateData: any = {
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
                // Ensure we don't overwrite the whole delivery object if we didn't pass 'delivery' prop
                if (!updateData.delivery) {
                    updateData.delivery = currentOrderData?.delivery || {};
                }
                if (!updateData.delivery.address) {
                    updateData.delivery.address = currentOrderData?.delivery?.address || {};
                }

                if (customerName) updateData.delivery.address.contactName = customerName;
                if (customerPhone) updateData.delivery.address.phone = customerPhone;
            }

            transaction.update(orderRef, updateData);
        });

        // 3. Return updated order (fetched fresh or just success)
        return NextResponse.json({ success: true, message: "Orden finalizada y stock descontado" });

    } catch (error) {
        console.error("Error finalizing order:", error);
        const message = error instanceof Error ? error.message : "Error desconocido al finalizar";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
