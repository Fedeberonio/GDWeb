"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCatalogRouter = createCatalogRouter;
const express_1 = require("express");
const service_1 = require("./service");
function createCatalogRouter() {
    const router = (0, express_1.Router)();
    router.get("/categories", async (_req, res, next) => {
        try {
            const categories = await (0, service_1.getCategories)();
            res.json({ data: categories });
        }
        catch (error) {
            next(error);
        }
    });
    router.get("/products", async (_req, res, next) => {
        try {
            const products = await (0, service_1.getProducts)();
            res.json({ data: products });
        }
        catch (error) {
            next(error);
        }
    });
    router.get("/boxes", async (_req, res, next) => {
        try {
            const boxes = await (0, service_1.getBoxes)();
            res.json({ data: boxes });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=routes.js.map