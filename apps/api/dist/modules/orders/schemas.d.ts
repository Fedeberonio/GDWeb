import { z } from "zod";
export declare const orderStatusSchema: z.ZodEnum<{
    pending: "pending";
    confirmed: "confirmed";
    preparing: "preparing";
    ready: "ready";
    in_transit: "in_transit";
    delivered: "delivered";
    cancelled: "cancelled";
}>;
export declare const orderItemSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        product: "product";
        box: "box";
        addon: "addon";
    }>;
    referenceId: z.ZodString;
    name: z.ZodObject<{
        es: z.ZodString;
        en: z.ZodString;
    }, z.core.$strip>;
    quantity: z.ZodDefault<z.ZodNumber>;
    unitPrice: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const orderTotalsSchema: z.ZodObject<{
    subtotal: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    deliveryFee: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    discounts: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    total: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const deliveryWindowSchema: z.ZodObject<{
    day: z.ZodString;
    slot: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const paymentDetailsSchema: z.ZodObject<{
    method: z.ZodEnum<{
        cash: "cash";
        transfer: "transfer";
        card: "card";
        online: "online";
    }>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        cancelled: "cancelled";
        paid: "paid";
        refunded: "refunded";
    }>>;
    transactionId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const orderSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    guestEmail: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            product: "product";
            box: "box";
            addon: "addon";
        }>;
        referenceId: z.ZodString;
        name: z.ZodObject<{
            es: z.ZodString;
            en: z.ZodString;
        }, z.core.$strip>;
        quantity: z.ZodDefault<z.ZodNumber>;
        unitPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    totals: z.ZodObject<{
        subtotal: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
        deliveryFee: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        discounts: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        total: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        confirmed: "confirmed";
        preparing: "preparing";
        ready: "ready";
        in_transit: "in_transit";
        delivered: "delivered";
        cancelled: "cancelled";
    }>>;
    delivery: z.ZodObject<{
        address: z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            contactName: z.ZodString;
            phone: z.ZodString;
            city: z.ZodString;
            zone: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            isDefault: z.ZodDefault<z.ZodBoolean>;
            location: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodOptional<z.ZodNumber>;
                longitude: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        window: z.ZodOptional<z.ZodObject<{
            day: z.ZodString;
            slot: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    payment: z.ZodObject<{
        method: z.ZodEnum<{
            cash: "cash";
            transfer: "transfer";
            card: "card";
            online: "online";
        }>;
        status: z.ZodDefault<z.ZodEnum<{
            pending: "pending";
            cancelled: "cancelled";
            paid: "paid";
            refunded: "refunded";
        }>>;
        transactionId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    createdAt: z.ZodDefault<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>>;
    updatedAt: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>>;
    whatsappMessageId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
//# sourceMappingURL=schemas.d.ts.map