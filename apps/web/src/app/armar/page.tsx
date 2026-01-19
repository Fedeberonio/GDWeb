"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { Box, BoxRule, Product } from "@/modules/catalog/types";
import type { VariantType } from "@/app/_components/box-selector/helpers";
import { BoxCustomizeModal } from "@/app/_components/box-customize-modal";
import { useTranslation } from "@/modules/i18n/use-translation";

type CatalogResponse<T> = {
  data?: T[];
};

const resolveRuleKey = (box: Box) => {
  return box.ruleId;
};

const normalizeVariant = (value?: string | null): VariantType => {
  if (value === "fruity" || value === "veggie" || value === "mix") return value;
  return "mix";
};

export default function ArmarPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const boxParam = searchParams.get("box") ?? "";
  const variant = normalizeVariant(searchParams.get("variant"));

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [boxRules, setBoxRules] = useState<BoxRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadCatalog() {
      setIsLoading(true);
      try {
        const [boxesResponse, productsResponse, rulesResponse] = await Promise.all([
          fetch("/api/catalog/boxes", { cache: "no-store" }),
          fetch("/api/catalog/products", { cache: "no-store" }),
          fetch("/api/catalog/box-rules", { cache: "no-store" }),
        ]);

        const [boxesJson, productsJson, rulesJson] = await Promise.all([
          boxesResponse.json(),
          productsResponse.json(),
          rulesResponse.json(),
        ]);

        if (!isActive) return;
        setBoxes((boxesJson as CatalogResponse<Box>).data ?? []);
        setProducts((productsJson as CatalogResponse<Product>).data ?? []);
        setBoxRules((rulesJson as CatalogResponse<BoxRule>).data ?? []);
      } catch (error) {
        console.error("No se pudo cargar el catálogo para armar caja:", error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isActive = false;
    };
  }, []);

  const selectedBox = useMemo(() => {
    if (!boxParam) return null;
    return (
      boxes.find((box) => box.id === boxParam || box.slug === boxParam) ??
      boxes.find((box) => resolveRuleKey(box) === boxParam) ??
      null
    );
  }, [boxes, boxParam]);

  const rulesById = useMemo(() => new Map(boxRules.map((rule) => [rule.id, rule])), [boxRules]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);

  const ruleKey = selectedBox ? resolveRuleKey(selectedBox) : undefined;
  const boxRule = ruleKey ? rulesById.get(ruleKey) : undefined;
  const baseContents =
    boxRule?.baseContents.map((content) => ({
      ...content,
      name: productMap.get(content.productSlug)?.name?.es ?? content.productSlug,
    })) ?? [];

  const boxDetails = selectedBox
    ? {
        dimensions: selectedBox.dimensionsLabel,
        weight: selectedBox.weightLabel,
      }
    : undefined;

  const boxImage = selectedBox?.heroImage || "/images/boxes/placeholder.jpg";

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <p className="text-sm text-[var(--color-muted)]">Cargando caja...</p>
        </div>
      </main>
    );
  }

  if (!selectedBox) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        <div className="mx-auto max-w-xl px-6 py-20 text-center space-y-4">
          <h1 className="font-display text-2xl text-[var(--color-foreground)]">
            Caja no encontrada
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            No encontramos la caja solicitada. Vuelve al inicio para elegir otra.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-foreground)]"
          >
            {t("checkout.back_home")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-5xl px-6 py-12 text-center">
        <p className="text-sm text-[var(--color-muted)]">Preparando tu caja...</p>
      </div>
      <BoxCustomizeModal
        box={selectedBox}
        baseContents={baseContents}
        boxRule={boxRule}
        availableProducts={products}
        boxImage={boxImage}
        dimensions={boxDetails?.dimensions}
        weight={boxDetails?.weight}
        initialVariant={variant}
        onClose={() => router.push("/")}
        onAddToCart={() => router.push("/")}
      />
    </main>
  );
}
