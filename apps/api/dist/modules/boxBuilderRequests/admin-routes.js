"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoxBuilderRequestsAdminRouter = createBoxBuilderRequestsAdminRouter;
const express_1 = require("express");
const requireAdminSession_1 = require("../../middleware/requireAdminSession");
const service_1 = require("./service");
function createBoxBuilderRequestsAdminRouter() {
    const router = (0, express_1.Router)();
    router.use(requireAdminSession_1.requireAdminSession);
    router.get("/", async (req, res, next) => {
        try {
            const limitParam = req.query.limit;
            const limit = typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : Number.NaN;
            const requests = await (0, service_1.listBuilderRequests)(Number.isNaN(limit) ? 100 : Math.min(limit, 500));
            res.json({ data: requests });
        }
        catch (error) {
            next(error);
        }
    });
    router.put("/:id/status", async (req, res, next) => {
        try {
            const status = (req.body?.status ?? "");
            if (!status) {
                res.status(400).json({ error: "El estado es obligatorio" });
                return;
            }
            const updated = await (0, service_1.setBuilderRequestStatus)(req.params.id, status);
            if (!updated) {
                res.status(404).json({ error: "Solicitud no encontrada" });
                return;
            }
            res.json({ data: updated });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=admin-routes.js.map