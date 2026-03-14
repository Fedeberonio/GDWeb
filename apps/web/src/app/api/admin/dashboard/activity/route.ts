import { NextResponse } from "next/server";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase/client";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

const HISTORY_COLLECTION = "history";
const ORDER_ACTIVITIES_COLLECTION = "order_activities";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const db = getFirestoreDb();
    if (!db) throw new Error("Firebase not initialized");

    const limitParam = new URL(request.url).searchParams.get("limit");
    const max = limitParam ? Number(limitParam) : 5;
    const safeLimit = Number.isFinite(max) ? max : 5;

    const [activitiesSnap, historySnap] = await Promise.all([
      getDocs(query(collection(db, ORDER_ACTIVITIES_COLLECTION), orderBy("timestamp", "desc"), limit(safeLimit))),
      getDocs(query(collection(db, HISTORY_COLLECTION), orderBy("timestamp", "desc"), limit(safeLimit))),
    ]);

    const activities = activitiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const history = historySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const data = activities.length ? activities : history;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Admin Dashboard Activity Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
