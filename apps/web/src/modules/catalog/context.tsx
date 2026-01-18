"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { BoxRule, Product } from "./types";
import { setBoxRulesMap, setProductMetaMap } from "@/modules/box-builder/utils";

type CatalogContextValue = {
  products: Product[];
  boxRules: BoxRule[];
  productMap: Map<string, Product>;
  isLoading: boolean;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

async function fetchCatalog<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status}`);
    }
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.warn(`Catalog fetch failed for ${path}`, error);
    return [];
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [boxRules, setBoxRules] = useState<BoxRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);
      const [productsData, rulesData] = await Promise.all([
        fetchCatalog<Product>("/api/catalog/products"),
        fetchCatalog<BoxRule>("/api/catalog/box-rules"),
      ]);
      if (!isActive) return;
      setProducts(productsData);
      setBoxRules(rulesData);
      setIsLoading(false);
    }

    load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setProductMetaMap(products);
  }, [products]);

  useEffect(() => {
    setBoxRulesMap(boxRules);
  }, [boxRules]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);
  const value = useMemo(
    () => ({ products, boxRules, productMap, isLoading }),
    [products, boxRules, productMap, isLoading],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
}
