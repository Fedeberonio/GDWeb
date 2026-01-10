"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminCatalogRouter = createAdminCatalogRouter;
const express_1 = require("express");
const requireAdminSession_1 = require("../../middleware/requireAdminSession");
const service_1 = require("./service");
function createAdminCatalogRouter() {
    const router = (0, express_1.Router)();
    router.use(requireAdminSession_1.requireAdminSession);
    router.post("/products", async (req, res, next) => {
        try {
            const adminUser = req.adminUser;
            const created = await (0, service_1.createProduct)(req.body, {
                actorEmail: adminUser?.email ?? null,
                actorUid: adminUser?.uid ?? null,
            });
            res.status(201).json({ data: created });
        }
        catch (error) {
            next(error);
        }
    });
    router.get("/products", async (_req, res, next) => {
        try {
            const products = await (0, service_1.listProductsForAdmin)();
            res.json({ data: products });
        }
        catch (error) {
            next(error);
        }
    });
    router.put("/products/:id", async (req, res, next) => {
        try {
            const productId = decodeURIComponent(req.params.id);
            console.log(`[PUT /products/:id] Received request for product ID: "${productId}" (length: ${productId.length})`);
            console.log(`[PUT /products/:id] Request body keys:`, Object.keys(req.body || {}));
            const adminUser = req.adminUser;
            console.log(`[PUT /products/:id] Admin user:`, adminUser?.email || "none");
            const updated = await (0, service_1.updateProductById)(productId, req.body, {
                actorEmail: adminUser?.email ?? null,
                actorUid: adminUser?.uid ?? null,
            });
            if (!updated) {
                console.warn(`[PUT /products/:id] Product not found: "${productId}"`);
                res.status(404).json({ error: "Product not found" });
                return;
            }
            console.log(`[PUT /products/:id] Product updated successfully: "${productId}"`);
            res.json({ data: updated });
        }
        catch (error) {
            console.error(`[PUT /products/:id] Error:`, error);
            next(error);
        }
    });
    router.get("/boxes", async (_req, res, next) => {
        try {
            const boxes = await (0, service_1.listBoxesForAdmin)();
            res.json({ data: boxes });
        }
        catch (error) {
            next(error);
        }
    });
    router.put("/boxes/:id", async (req, res, next) => {
        try {
            const adminUser = req.adminUser;
            const updated = await (0, service_1.updateBoxById)(req.params.id, req.body, {
                actorEmail: adminUser?.email ?? null,
                actorUid: adminUser?.uid ?? null,
            });
            if (!updated) {
                res.status(404).json({ error: "Box not found" });
                return;
            }
            res.json({ data: updated });
        }
        catch (error) {
            next(error);
        }
    });
    router.get("/history", async (req, res, next) => {
        try {
            const limitParam = req.query.limit;
            const parsedLimit = typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : Number.NaN;
            const history = await (0, service_1.listCatalogHistoryEntries)(Number.isNaN(parsedLimit) ? 100 : parsedLimit);
            res.json({
                data: history.map((entry) => ({
                    ...entry,
                    timestamp: entry.timestamp ? entry.timestamp.toDate().toISOString() : null,
                })),
            });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=admin-routes.js.map