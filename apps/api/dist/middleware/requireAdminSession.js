"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminSession = requireAdminSession;
const env_1 = require("../config/env");
const firebaseAdmin_1 = require("../firebaseAdmin");
async function requireAdminSession(req, res, next) {
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
        const decodedToken = await (0, firebaseAdmin_1.getAdminAuth)().verifyIdToken(idToken, true);
        const email = decodedToken.email?.toLowerCase();
        const allowedEmails = (0, env_1.getAdminAllowedEmails)();
        if (!email) {
            res.status(403).json({ error: "El token no contiene un correo electrónico" });
            return;
        }
        if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
            res.status(403).json({ error: "No tienes permisos para acceder" });
            return;
        }
        req.adminUser = decodedToken;
        next();
    }
    catch (error) {
        console.warn("Invalid admin session", error);
        res.status(401).json({ error: "Sesión inválida" });
    }
}
//# sourceMappingURL=requireAdminSession.js.map