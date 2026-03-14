"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Edit2, Search, Box as BoxIcon, AlertTriangle } from "lucide-react";

import { adminFetch } from "@/modules/admin/api/client";
import type { Box, Product } from "@/modules/catalog/types";
import { BoxEditDrawer } from "./box-edit-drawer";

type BoxGridManagerProps = {
  initialBoxes: Box[];
  products: Product[];
  onBoxUpdated?: (box: Box) => void;
};

export function BoxGridManager({ initialBoxes, products, onBoxUpdated }: BoxGridManagerProps) {
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Crear mapa de productos para validación
  const productMap = useMemo(() => {
    const normalizeName = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (p.sku) map.set(p.sku, p);
      map.set(p.id, p);
      if (p.slug) map.set(p.slug, p);
      if (p.name?.es) map.set(normalizeName(p.name.es), p);
      if (p.name?.en) map.set(normalizeName(p.name.en), p);
    });
    return map;
  }, [products]);

  const boxImageMap = useMemo(
    (): Record<string, string> => ({
      "GD-CAJA-001": "/assets/images/boxes/GD-CAJA-001.png",
      "GD-CAJA-002": "/assets/images/boxes/GD-CAJA-002.png",
      "GD-CAJA-003": "/assets/images/boxes/GD-CAJA-003.png",
    }),
    [],
  );

  const isInternalIngredient = useCallback((product: Product) => {
    const productKey = (product.sku ?? product.id ?? "").toUpperCase();
    const categoryId = (product.categoryId ?? "").toLowerCase();
    return categoryId === "ingredientes" || productKey.startsWith("GD-ING-") || productKey.startsWith("GD-INGR-");
  }, []);

  // Validar baseContents de una caja
  const validateBoxContents = useCallback(
    (box: Box): { isValid: boolean; issues: string[] } => {
      const issues: string[] = [];

      // Validar cada variante
      box.variants.forEach((variant) => {
        variant.referenceContents?.forEach((content) => {
          const contentId = content.productId?.trim();
          const contentName = content.name?.es?.trim() || content.name?.en?.trim() || "";
          const normalizedName = contentName
            ? contentName
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            : "";

          // Buscar producto por SKU, ID o slug
          const product =
            (contentId
              ? productMap.get(contentId) ||
                products.find((p) => p.sku === contentId || p.id === contentId || p.slug === contentId)
              : null) ||
            (normalizedName ? productMap.get(normalizedName) : null);

          if (!product) {
            const missingLabel = contentId || contentName || "sin identificar";
            issues.push(`Variante ${variant.name.es}: Producto "${missingLabel}" no encontrado`);
            return;
          }

          if (isInternalIngredient(product)) {
            issues.push(
              `Variante ${variant.name.es}: Producto interno "${product.name.es}" no debe usarse en cajas`
            );
            return;
          }

          // Validar que el producto esté activo
          if (product.status && product.status !== "active" && product.status !== "coming_soon") {
            issues.push(
              `Variante ${variant.name.es}: Producto "${product.name.es}" está ${product.status}`
            );
          }

          // Validar que no sea producto baby (excepto en box-1)
          const isBaby = product.sku?.toLowerCase().includes("baby") || product.tags?.includes("baby-only");
          const isBox1 = box.id.toLowerCase().includes("box-1") || box.id.toLowerCase().includes("gd-caja-001");
          if (isBaby && !isBox1) {
            issues.push(
              `Variante ${variant.name.es}: Producto baby "${product.name.es}" no permitido en esta caja`
            );
          }

          // Validar que tenga imagen
          const sku = product.sku || product.id;
          const hasImage = product.image || sku; // Si tiene SKU, la imagen existe en /assets/images/products/${sku}.png
          if (!hasImage) {
            issues.push(`Variante ${variant.name.es}: Producto "${product.name.es}" sin imagen`);
          }
        });
      });

      return {
        isValid: issues.length === 0,
        issues,
      };
    },
    [isInternalIngredient, products, productMap]
  );

  const filteredBoxes = useMemo(() => {
    return boxes.filter((box) => {
      if (searchQuery === "") return true;
      const query = searchQuery.toLowerCase();
      return (
        box.name.es?.toLowerCase().includes(query) ||
        box.name.en?.toLowerCase().includes(query) ||
        box.id.toLowerCase().includes(query)
      );
    });
  }, [boxes, searchQuery]);

  const handleBoxClick = useCallback((box: Box) => {
    setSelectedBox(box);
    setIsDrawerOpen(true);
  }, []);

  const handleBoxUpdated = useCallback(
    (updatedBox: Box) => {
      setBoxes((prev) => prev.map((b) => (b.id === updatedBox.id ? updatedBox : b)));
      setIsDrawerOpen(false);
      setSelectedBox(null);
      onBoxUpdated?.(updatedBox);
    },
    [onBoxUpdated]
  );

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedBox(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--gd-color-forest)] mb-1">Solicitudes Personalizadas</h2>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              {filteredBoxes.length} de {boxes.length} cajas
            </p>
          </div>

          <div className="relative w-full lg:w-auto lg:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--gd-color-text-muted)]" />
            <input
              type="text"
              placeholder="Buscar cajas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 focus:border-[var(--gd-color-leaf)]/50 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid de cajas */}
      {filteredBoxes.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center shadow-lg border border-white/60">
          <p className="text-[var(--gd-color-text-muted)]">No se encontraron cajas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoxes.map((box) => {
            const validation = validateBoxContents(box);
            const mappedImage = boxImageMap[box.id] || boxImageMap[box.id.toUpperCase()];
            const heroImage =
              typeof box.heroImage === "string" && box.heroImage.startsWith("/assets/images/boxes/")
                ? box.heroImage
                : undefined;
            const imageUrl = heroImage || mappedImage || `/assets/images/boxes/${box.id}.png`;

            return (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => handleBoxClick(box)}
              >
                {/* Imagen */}
                <div className="relative h-48 w-full bg-gradient-to-br from-[var(--gd-color-sprout)]/30 to-white overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={box.name.es || ""}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BoxIcon className="h-16 w-16 text-[var(--gd-color-leaf)]/30" />
                    </div>
                  )}
                  {box.isFeatured && (
                    <div className="absolute top-3 right-3 bg-[var(--gd-color-leaf)] text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Destacada
                    </div>
                  )}
                  {!validation.isValid && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {validation.issues.length} problema{validation.issues.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-[var(--gd-color-forest)] text-sm mb-1 line-clamp-1">
                      {box.name.es}
                    </h3>
                    <p className="text-xs text-[var(--gd-color-text-muted)] font-mono">{box.id}</p>
                    {box.durationDays && (
                      <p className="text-xs text-[var(--gd-color-text-muted)] mt-1">
                        {box.durationDays} día{box.durationDays > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-[var(--gd-color-forest)]">
                      {box.price.amount.toLocaleString("es-DO")} {box.price.currency}
                    </p>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] border border-[var(--gd-color-leaf)]/40">
                      {box.variants.length} variante{box.variants.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Alertas de validación */}
                  {!validation.isValid && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-xs text-red-700">
                      <p className="font-semibold mb-1">Problemas detectados:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {validation.issues.slice(0, 2).map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                        {validation.issues.length > 2 && (
                          <li>+{validation.issues.length - 2} más...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoxClick(box);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--gd-color-leaf)]/10 hover:bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] font-medium text-sm transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Drawer de edición */}
      <BoxEditDrawer
        box={selectedBox}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        products={products}
        onBoxUpdated={handleBoxUpdated}
      />
    </div>
  );
}
