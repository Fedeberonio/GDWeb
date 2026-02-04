import { getAdminAllowedEmails } from "@/lib/config/env";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function requireAdminSession(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    throw new Error("Unauthorized");
  }

  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  const email = decoded.email?.toLowerCase();
  const allowedEmails = getAdminAllowedEmails();

  if (!email) {
    throw new Error("Forbidden");
  }

  if (!allowedEmails.includes(email)) {
    throw new Error("Forbidden");
  }

  return decoded;
}
