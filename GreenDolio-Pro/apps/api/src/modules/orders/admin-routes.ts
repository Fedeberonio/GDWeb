import { Router } from "express";

import { requireAdminSession } from "../../middleware/requireAdminSession";
import { listOrdersForAdmin, updateOrderStatusById } from "./service";

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

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
