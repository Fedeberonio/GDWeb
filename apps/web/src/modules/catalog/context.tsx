"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { BoxRule, Product } from "./types";


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



  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => {
      map.set(product.id, product);
      map.set(product.id.toLowerCase(), product);
      map.set(product.id.toUpperCase(), product);
      map.set(product.slug, product);
      map.set(product.slug.toLowerCase(), product);
      map.set(product.slug.toUpperCase(), product);
      if (product.sku) {
        map.set(product.sku, product);
        map.set(product.sku.toLowerCase(), product);
        map.set(product.sku.toUpperCase(), product);
      }
    });
    return map;
  }, [products]);
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
