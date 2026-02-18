import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

// GET: Fetch activities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession(request);
    const { id } = await params;

    const db = getAdminFirestore();
    const activitiesSnapshot = await db
      .collection("orders")
      .doc(id)
      .collection("activities")
      .orderBy("timestamp", "desc")
      .get();

    const activities = activitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure timestamp is serializable (or handled by client)
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST: Add new activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdminSession(request);
    const { id } = await params;
    const body = await request.json();

    const db = getAdminFirestore();
    const activityRef = db.collection("orders").doc(id).collection("activities").doc();

    const newActivity = {
      type: body.type,
      data: body.data || {},
      timestamp: FieldValue.serverTimestamp(),
      userId: user.uid,
      userName: "Admin", // Could fetch real name if needed
    };

    await activityRef.set(newActivity);

    return NextResponse.json({ success: true, id: activityRef.id });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
