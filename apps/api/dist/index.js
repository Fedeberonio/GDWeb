"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseAdmin_1 = require("./firebaseAdmin");
const routes_1 = require("./modules/catalog/routes");
const admin_routes_1 = require("./modules/catalog/admin-routes");
const routes_2 = require("./modules/uploads/routes");
const admin_routes_2 = require("./modules/orders/admin-routes");
const routes_3 = require("./modules/boxes/routes");
const env_1 = require("./config/env");
const admin_routes_3 = require("./modules/boxBuilderRequests/admin-routes");
const public_routes_1 = require("./modules/orders/public-routes");
dotenv_1.default.config();
(0, firebaseAdmin_1.initializeFirebaseAdmin)();
const app = (0, express_1.default)();
const env = (0, env_1.getEnv)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/catalog", (0, routes_1.createCatalogRouter)());
app.use("/api/boxes", (0, routes_3.createBoxesRouter)());
app.use("/api/orders", (0, public_routes_1.createPublicOrdersRouter)());
app.use("/api/admin/catalog", (0, admin_routes_1.createAdminCatalogRouter)());
app.use("/api/admin/uploads", (0, routes_2.createUploadsRouter)());
app.use("/api/admin/orders", (0, admin_routes_2.createAdminOrdersRouter)());
app.use("/api/admin/box-builder/requests", (0, admin_routes_3.createBoxBuilderRequestsAdminRouter)());
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});
app.listen(env.PORT, () => {
    console.log(`API server listening on port ${env.PORT}`);
});
//# sourceMappingURL=index.js.map