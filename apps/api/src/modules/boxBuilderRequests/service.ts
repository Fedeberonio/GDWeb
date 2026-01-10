// @ts-nocheck
import { Timestamp } from "firebase-admin/firestore";
import { requestStatusSchema, boxBuilderRequestSchema, type BoxBuilderRequest } from "./schemas";
import { listRequests, updateRequestStatus } from "./repository";

export async function listBuilderRequests(limit = 100): Promise<BoxBuilderRequest[]> {
  const requests = await listRequests(limit);
  return requests.map((request) => {
    // Normalizar createdAt: puede ser Timestamp, Date, string o undefined
    let createdAt: string | undefined;
    if (request.createdAt instanceof Timestamp) {
      createdAt = request.createdAt.toDate().toISOString();
    } else if (request.createdAt instanceof Date) {
      createdAt = request.createdAt.toISOString();
    } else if (typeof request.createdAt === "string") {
      createdAt = request.createdAt;
    } else {
      createdAt = undefined;
    }

    // Normalizar status: debe ser uno de los valores válidos
    const status = typeof request.status === "string" && ["pending", "confirmed", "cancelled"].includes(request.status)
      ? request.status
      : "pending";

    const normalized = {
      ...request,
      createdAt,
      status,
    };
    return boxBuilderRequestSchema.parse(normalized);
  });
}

export async function setBuilderRequestStatus(id: string, status: string): Promise<BoxBuilderRequest | null> {
  const parsedStatus = requestStatusSchema.parse(status);
  const updated = await updateRequestStatus(id, parsedStatus);
  if (!updated) return null;
  return updated as BoxBuilderRequest;
}
// @ts-nocheck
