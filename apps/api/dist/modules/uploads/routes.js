"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadsRouter = createUploadsRouter;
const node_buffer_1 = require("node:buffer");
const node_crypto_1 = __importDefault(require("node:crypto"));
const express_1 = require("express");
const firebaseAdmin_1 = require("../../firebaseAdmin");
const requireAdminSession_1 = require("../../middleware/requireAdminSession");
const PUBLIC_BASE = (bucketName, path) => `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
function createUploadsRouter() {
    const router = (0, express_1.Router)();
    router.use(requireAdminSession_1.requireAdminSession);
    router.post("/", async (req, res) => {
        const { data, fileName, contentType, path } = req.body;
        if (!data) {
            res.status(400).json({ error: "Archivo inválido" });
            return;
        }
        try {
            const buffer = node_buffer_1.Buffer.from(data, "base64");
            const bucket = (0, firebaseAdmin_1.getAdminStorageBucket)();
            const safeName = fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") ?? "upload.bin";
            const objectPath = path ?? `uploads/${Date.now()}-${safeName}`;
            const file = bucket.file(objectPath);
            const downloadToken = node_crypto_1.default.randomUUID();
            await file.save(buffer, {
                contentType: contentType || "application/octet-stream",
                resumable: false,
                metadata: {
                    cacheControl: "public,max-age=31536000",
                    metadata: {
                        firebaseStorageDownloadTokens: downloadToken,
                    },
                },
            });
            res.json({
                data: {
                    path: objectPath,
                    url: `${PUBLIC_BASE(bucket.name, objectPath)}&token=${downloadToken}`,
                },
            });
        }
        catch (error) {
            console.error("Upload failed", error);
            res.status(500).json({ error: "No se pudo subir la imagen" });
        }
    });
    return router;
}
//# sourceMappingURL=routes.js.map