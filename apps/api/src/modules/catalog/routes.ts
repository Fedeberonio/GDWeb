import { Router } from "express";

import { getBoxes, getCategories, getProducts } from "./service";

export function createCatalogRouter() {
  const router = Router();

  router.get("/categories", async (_req, res, next) => {
    try {
      const categories = await getCategories();
      res.json({ data: categories });
    } catch (error) {
      next(error);
    }
  });

  router.get("/products", async (_req, res, next) => {
    try {
      const products = await getProducts();
      res.json({ data: products });
    } catch (error) {
      next(error);
    }
  });

  router.get("/boxes", async (_req, res, next) => {
    try {
      const boxes = await getBoxes();
      res.json({ data: boxes });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
