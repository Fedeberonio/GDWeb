import type { NextFunction, Request, Response } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAllowedEmails } from "../config/env";
import { getAdminAuth } from "../firebaseAdmin";

export type AdminRequest = Request & {
  adminUser?: DecodedIdToken;
};

export async function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken, true);
    const email = decodedToken.email?.toLowerCase();
    const allowedEmails = getAdminAllowedEmails();

    if (!email) {
      res.status(403).json({ error: "El token no contiene un correo electrónico" });
      return;
    }

    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      res.status(403).json({ error: "No tienes permisos para acceder" });
      return;
    }

    (req as AdminRequest).adminUser = decodedToken;
    next();
  } catch (error) {
    console.warn("Invalid admin session", error);
    res.status(401).json({ error: "Sesión inválida" });
  }
}
