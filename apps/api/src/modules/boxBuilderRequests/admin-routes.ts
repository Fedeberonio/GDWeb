import { Router } from "express";

import { requireAdminSession } from "../../middleware/requireAdminSession";
import { listBuilderRequests, setBuilderRequestStatus } from "./service";

export function createBoxBuilderRequestsAdminRouter() {
  const router = Router();
  router.use(requireAdminSession);

  router.get("/", async (req, res, next) => {
    try {
      const limitParam = req.query.limit;
      const limit =
        typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : Number.NaN;
      const requests = await listBuilderRequests(Number.isNaN(limit) ? 100 : Math.min(limit, 500));
      res.json({ data: requests });
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

      const updated = await setBuilderRequestStatus(req.params.id, status);
      if (!updated) {
        res.status(404).json({ error: "Solicitud no encontrada" });
        return;
      }

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
