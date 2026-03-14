import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { Router } from "express";

import { getAdminStorageBucket } from "../../firebaseAdmin";
import { requireAdminSession } from "../../middleware/requireAdminSession";

const PUBLIC_BASE = (bucketName: string, path: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;

export function createUploadsRouter() {
  const router = Router();
  router.use(requireAdminSession);

  router.post("/", async (req, res) => {
    const { data, fileName, contentType, path } = req.body as {
      data?: string;
      fileName?: string;
      contentType?: string;
      path?: string;
    };

    if (!data) {
      res.status(400).json({ error: "Archivo inválido" });
      return;
    }

    try {
      const buffer = Buffer.from(data, "base64");
      const bucket = getAdminStorageBucket();
      const safeName = fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") ?? "upload.bin";
      const objectPath = path ?? `uploads/${Date.now()}-${safeName}`;

      const file = bucket.file(objectPath);
      const downloadToken = crypto.randomUUID();
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
    } catch (error) {
      console.error("Upload failed", error);
      res.status(500).json({ error: "No se pudo subir la imagen" });
    }
  });

  return router;
}
