import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase/admin";

// Tipos básicos para el payload (simplificados)
type OrderPayload = {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  deliveryDay?: string;
  deliveryZone?: string;
  notes?: string;
  paymentMethod?: string;
  items: any[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as OrderPayload;

    // Validación básica
    if (!body.contactName || !body.contactPhone || !body.items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // AUTH IDENTITY
    let userId = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch (e) {
        console.warn("Failed to verify ID token in order creation:", e);
        // Continue as guest
      }
    }

    // Calcular Totales (Replicando lógica del cliente para consistencia inicial)
    const diasConCargo = ["Martes", "Jueves", "Sábado"];
    const deliveryDay = body.deliveryDay || "";
    const deliveryFeeAmount = diasConCargo.includes(deliveryDay) ? 100 : 0;

    // Calcular subtotal
    const subtotal = body.items.reduce((sum: number, item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    // Calcular fee de PayPal si aplica
    const isPayPal = body.paymentMethod === "online" || body.paymentMethod === "PayPal"; // "online" es el valor mapeado
    const paypalFeeAmount = isPayPal ? (subtotal + deliveryFeeAmount) * 0.10 : 0;

    const totalAmount = subtotal + deliveryFeeAmount + paypalFeeAmount;

    // Construir objeto de orden
    const orderData = {
      status: "pending",
      paymentStatus: "unpaid", // Root level
      paymentMethod: body.paymentMethod || "cash", // Root level
      userId: userId, // Identity
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      guestEmail: body.contactEmail || null,
      delivery: {
        address: {
          contactName: body.contactName,
          phone: body.contactPhone,
          label: body.address || "Dirección principal",
          city: "Santo Domingo",
          zone: body.deliveryZone || "Zona Metropolitana",
          notes: body.notes || null, // FIX: Avoid undefined
        },
        window: {
          day: deliveryDay,
          slot: "12:30 PM - 8:00 PM"
        }
      },
      payment: { // Keep for backward compatibility if needed, but rely on root
        method: body.paymentMethod || "cash",
        status: "pending"
      },
      items: body.items.map((item: any) => ({
        id: item.slug || item.id, // Fallback
        productId: item.slug || item.id, // Ensure productId exists for restoration
        type: item.type || "product",
        name: { es: item.name, en: item.name }, // Simple map
        quantity: item.quantity,
        unitPrice: { amount: item.price, currency: "DOP" },
        startPrice: { amount: item.price, currency: "DOP" },
        metadata: item.metadata || item.configuration || {}
      })),
      totals: {
        subtotal: { amount: subtotal, currency: "DOP" },
        deliveryFee: { amount: deliveryFeeAmount, currency: "DOP" },
        // incluir fee de servicio/paypal si es necesario en un campo 'fees' o sumado
        total: { amount: totalAmount, currency: "DOP" }
      }
    };

    const db = getAdminFirestore();
    const docRef = await db.collection("orders").add(orderData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      data: { id: docRef.id } // Compatibilidad con ambos formatos
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating order in Firestore:", error);
    return NextResponse.json({ error: "Error interno al crear la orden" }, { status: 500 });
  }
}
