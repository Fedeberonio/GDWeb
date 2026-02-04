"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminOrdersRouter = createAdminOrdersRouter;
const express_1 = require("express");
const firestore_1 = require("firebase-admin/firestore");
const requireAdminSession_1 = require("../../middleware/requireAdminSession");
const service_1 = require("./service");
const repository_1 = require("./repository");
const firestore_2 = require("../../lib/firestore");
function createAdminOrdersRouter() {
    const router = (0, express_1.Router)();
    router.use(requireAdminSession_1.requireAdminSession);
    router.get("/", async (req, res, next) => {
        try {
            const limitParam = req.query.limit;
            const parsedLimit = typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : Number.NaN;
            const orders = await (0, service_1.listOrdersForAdmin)(Number.isNaN(parsedLimit) ? 50 : parsedLimit);
            res.json({ data: orders });
        }
        catch (error) {
            next(error);
        }
    });
    router.get("/:id", async (req, res, next) => {
        try {
            const order = await (0, service_1.getOrderDetail)(req.params.id);
            if (!order) {
                res.status(404).json({ error: "Pedido no encontrado" });
                return;
            }
            res.json({ data: order });
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
            const updated = await (0, service_1.updateOrderStatusById)(req.params.id, status);
            if (!updated) {
                res.status(404).json({ error: "Pedido no encontrado" });
                return;
            }
            // Registrar actividad de cambio de estado
            try {
                await (0, firestore_2.getDb)()
                    .collection("order_activities")
                    .add({
                    orderId: req.params.id,
                    type: "status_changed",
                    timestamp: firestore_1.FieldValue.serverTimestamp(),
                    userId: req.user?.uid,
                    data: {
                        status,
                    },
                });
            }
            catch (err) {
                console.warn("Error registrando actividad:", err);
            }
            res.json({ data: updated });
        }
        catch (error) {
            next(error);
        }
    });
    // Rutas de actividades
    router.get("/:id/activities", async (req, res, next) => {
        try {
            const snapshot = await (0, firestore_2.getDb)()
                .collection("order_activities")
                .where("orderId", "==", req.params.id)
                .orderBy("timestamp", "desc")
                .get();
            const activities = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            res.json({ data: activities });
        }
        catch (error) {
            next(error);
        }
    });
    router.post("/:id/activities", async (req, res, next) => {
        try {
            const { type, data } = req.body;
            if (!type) {
                res.status(400).json({ error: "El tipo de actividad es obligatorio" });
                return;
            }
            const activityRef = await (0, firestore_2.getDb)().collection("order_activities").add({
                orderId: req.params.id,
                type,
                timestamp: firestore_1.FieldValue.serverTimestamp(),
                userId: req.user?.uid,
                userName: req.user?.email,
                data: data || {},
            });
            const activity = await activityRef.get();
            res.json({ data: { id: activity.id, ...activity.data() } });
        }
        catch (error) {
            next(error);
        }
    });
    // Información del cliente
    router.get("/:id/customer", async (req, res, next) => {
        try {
            const order = await (0, repository_1.getOrderById)(req.params.id);
            if (!order) {
                res.status(404).json({ error: "Pedido no encontrado" });
                return;
            }
            // Buscar todos los pedidos del cliente
            const phone = order.delivery.address.phone;
            const email = order.guestEmail || order.userId;
            let customerOrders = [];
            try {
                const ordersSnapshot = await (0, firestore_2.getDb)()
                    .collection("orders")
                    .where("delivery.address.phone", "==", phone)
                    .get();
                customerOrders = ordersSnapshot.docs.map((doc) => doc.data());
            }
            catch (err) {
                // Si no se puede buscar por phone, buscar por email
                if (email) {
                    try {
                        const ordersSnapshot = await (0, firestore_2.getDb)()
                            .collection("orders")
                            .where("guestEmail", "==", email)
                            .get();
                        customerOrders = ordersSnapshot.docs.map((doc) => doc.data());
                    }
                    catch (err2) {
                        console.warn("Error buscando pedidos del cliente:", err2);
                    }
                }
            }
            const totalSpent = customerOrders.reduce((sum, o) => {
                const total = typeof o.totals?.total?.amount === "number" ? o.totals.total.amount : 0;
                return sum + total;
            }, 0);
            const customerInfo = {
                userId: order.userId,
                email: order.guestEmail,
                phone: order.delivery.address.phone,
                name: order.delivery.address.contactName,
                totalOrders: customerOrders.length,
                totalSpent,
                lastOrderDate: order.createdAt,
            };
            res.json({ data: customerInfo });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=admin-routes.js.map