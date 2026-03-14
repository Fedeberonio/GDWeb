import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/app/api/admin/_utils/require-admin-session";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);

    const formData = await request.formData();
    const sku = String(formData.get("sku") ?? "").trim();
    const productId = String(formData.get("productId") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "").trim().toLowerCase();
    const requestedFolder = String(formData.get("folder") ?? "").trim().toLowerCase();
    const file = formData.get("file");

    if (!sku || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file or SKU" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const normalizedSku = sku.toUpperCase();
    const fileName = `${normalizedSku}.png`;
    const isBox =
      normalizedSku.startsWith("GD-CAJA") || categoryId === "cajas" || requestedFolder === "boxes";
    const folder = isBox ? "boxes" : "products";
    const targetDir = path.join(process.cwd(), "public", "assets", "images", folder);
    const targetPath = path.join(targetDir, fileName);

    await mkdir(targetDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const pngBuffer = await sharp(buffer).png().toBuffer();
    await writeFile(targetPath, pngBuffer);

    const imageUrl = `/assets/images/${folder}/${fileName}?v=${Date.now()}`;
    const db = getAdminFirestore();
    const targetId = productId || normalizedSku;
    const targetCollection = isBox ? "catalog_boxes" : "catalog_products";
    const imageField = isBox ? "heroImage" : "image";
    await db.collection(targetCollection).doc(targetId).set({ [imageField]: imageUrl }, { merge: true });

    return NextResponse.json({ data: { imageUrl } }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
