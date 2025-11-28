import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { initializeFirebaseAdmin } from "./firebaseAdmin";
import { createCatalogRouter } from "./modules/catalog/routes";
import { createAdminCatalogRouter } from "./modules/catalog/admin-routes";
import { createUploadsRouter } from "./modules/uploads/routes";
import { createAdminOrdersRouter } from "./modules/orders/admin-routes";
import { createBoxesRouter } from "./modules/boxes/routes";
import { getEnv } from "./config/env";
import { createBoxBuilderRequestsAdminRouter } from "./modules/boxBuilderRequests/admin-routes";
import { createPublicOrdersRouter } from "./modules/orders/public-routes";

dotenv.config();
initializeFirebaseAdmin();

const app = express();
const env = getEnv();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/catalog", createCatalogRouter());
app.use("/api/boxes", createBoxesRouter());
app.use("/api/orders", createPublicOrdersRouter());
app.use("/api/admin/catalog", createAdminCatalogRouter());
app.use("/api/admin/uploads", createUploadsRouter());
app.use("/api/admin/orders", createAdminOrdersRouter());
app.use("/api/admin/box-builder/requests", createBoxBuilderRequestsAdminRouter());

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`);
});
