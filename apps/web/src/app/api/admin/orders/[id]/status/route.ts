import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

// Helper to recursively serialize dates/timestamps
function serializeData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeData);
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeData(data[key]);
    }
    return result;
  }

  return data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(request);

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const orderRef = db.collection("orders").doc(id);

    // Update status
    await orderRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Return the updated order data with serialization
    const updatedDoc = await orderRef.get();

    // Safety check if doc exists (it should since we just updated it)
    if (!updatedDoc.exists) {
      return NextResponse.json({ error: "Order not found after update" }, { status: 404 });
    }

    const serializedData = serializeData(updatedDoc.data());

    return NextResponse.json({
      data: {
        id: updatedDoc.id,
        ...serializedData,
        // Fallbacks if serialization missed something or resulted in undefined for strictly required fields
        createdAt: serializedData.createdAt || new Date().toISOString(),
        updatedAt: serializedData.updatedAt || new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
