import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";

import { requireAdminSession } from "../../middleware/requireAdminSession";
import { listOrdersForAdmin, updateOrderStatusById, getOrderDetail } from "./service";
import { getOrderById } from "./repository";
import { getDb } from "../../lib/firestore";

export function createAdminOrdersRouter() {
  const router = Router();

  router.use(requireAdminSession);

  router.get("/", async (req, res, next) => {
    try {
      const limitParam = req.query.limit;
      const parsedLimit =
        typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : Number.NaN;
      const orders = await listOrdersForAdmin(Number.isNaN(parsedLimit) ? 50 : parsedLimit);
      res.json({ data: orders });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const order = await getOrderDetail(req.params.id);
      if (!order) {
        res.status(404).json({ error: "Pedido no encontrado" });
        return;
      }
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id/status", async (req, res, next) => {
    try {
      const status = (req.body?.status ?? "") as string;
      if (!status) {
        res.status(400).json({ error: "El estado es obligatorio" });
        return;
      }

      const updated = await updateOrderStatusById(req.params.id, status as never);
      if (!updated) {
        res.status(404).json({ error: "Pedido no encontrado" });
        return;
      }

      // Registrar actividad de cambio de estado
      try {
        await getDb()
          .collection("order_activities")
          .add({
            orderId: req.params.id,
            type: "status_changed",
            timestamp: FieldValue.serverTimestamp(),
            userId: (req as any).user?.uid,
            data: {
              status,
            },
          });
      } catch (err) {
        console.warn("Error registrando actividad:", err);
      }

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  });

  // Rutas de actividades
  router.get("/:id/activities", async (req, res, next) => {
    try {
      const snapshot = await getDb()
        .collection("order_activities")
        .where("orderId", "==", req.params.id)
        .orderBy("timestamp", "desc")
        .get();

      const activities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ data: activities });
    } catch (error) {
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

      const activityRef = await getDb().collection("order_activities").add({
        orderId: req.params.id,
        type,
        timestamp: FieldValue.serverTimestamp(),
        userId: (req as any).user?.uid,
        userName: (req as any).user?.email,
        data: data || {},
      });

      const activity = await activityRef.get();
      res.json({ data: { id: activity.id, ...activity.data() } });
    } catch (error) {
      next(error);
    }
  });

  // Información del cliente
  router.get("/:id/customer", async (req, res, next) => {
    try {
      const order = await getOrderById(req.params.id);
      if (!order) {
        res.status(404).json({ error: "Pedido no encontrado" });
        return;
      }

      // Buscar todos los pedidos del cliente
      const phone = order.delivery.address.phone;
      const email = order.guestEmail || order.userId;

      let customerOrders: any[] = [];
      try {
        const ordersSnapshot = await getDb()
          .collection("orders")
          .where("delivery.address.phone", "==", phone)
          .get();
        customerOrders = ordersSnapshot.docs.map((doc) => doc.data());
      } catch (err) {
        // Si no se puede buscar por phone, buscar por email
        if (email) {
          try {
            const ordersSnapshot = await getDb()
              .collection("orders")
              .where("guestEmail", "==", email)
              .get();
            customerOrders = ordersSnapshot.docs.map((doc) => doc.data());
          } catch (err2) {
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
    } catch (error) {
      next(error);
    }
  });

  return router;
}
