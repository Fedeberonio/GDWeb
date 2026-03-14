import type { Product } from "./types";

export type CatalogLinePricing = {
  quantity: number;
  purchaseUnitPrice: number | null;
  saleUnitPrice: number | null;
  costTotal: number | null;
  saleTotal: number | null;
  marginTotal: number | null;
};

export type CatalogPricingAggregate = {
  totalLines: number;
  knownCostLines: number;
  knownSaleLines: number;
  missingPurchaseCount: number;
  missingSaleCount: number;
  costTotal: number;
  saleTotal: number;
  marginTotal: number | null;
};

function normalizeNonNegativeNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function resolveCatalogPurchasePrice(product?: Product | null): number | null {
  return normalizeNonNegativeNumber(product?.metadata?.wholesaleCost);
}

export function resolveCatalogSalePrice(product?: Product | null): number | null {
  return normalizeNonNegativeNumber(product?.salePrice ?? product?.price);
}

export function resolveCatalogRegularPrice(product?: Product | null): number | null {
  return normalizeNonNegativeNumber(product?.price);
}

export function computeCatalogLinePricing(quantityLike: number | string, product?: Product | null): CatalogLinePricing {
  const parsedQuantity = Number(quantityLike);
  const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;
  const purchaseUnitPrice = resolveCatalogPurchasePrice(product);
  const saleUnitPrice = resolveCatalogSalePrice(product);
  const costTotal = purchaseUnitPrice === null ? null : purchaseUnitPrice * quantity;
  const saleTotal = saleUnitPrice === null ? null : saleUnitPrice * quantity;

  return {
    quantity,
    purchaseUnitPrice,
    saleUnitPrice,
    costTotal,
    saleTotal,
    marginTotal: costTotal === null || saleTotal === null ? null : saleTotal - costTotal,
  };
}

export function aggregateCatalogLinePricing(lines: CatalogLinePricing[]): CatalogPricingAggregate {
  const aggregate = lines.reduce<CatalogPricingAggregate>(
    (accumulator, line) => {
      const hasCost = line.costTotal !== null;
      const hasSale = line.saleTotal !== null;

      return {
        totalLines: accumulator.totalLines + 1,
        knownCostLines: accumulator.knownCostLines + (hasCost ? 1 : 0),
        knownSaleLines: accumulator.knownSaleLines + (hasSale ? 1 : 0),
        missingPurchaseCount: accumulator.missingPurchaseCount + (hasCost ? 0 : 1),
        missingSaleCount: accumulator.missingSaleCount + (hasSale ? 0 : 1),
        costTotal: accumulator.costTotal + (line.costTotal ?? 0),
        saleTotal: accumulator.saleTotal + (line.saleTotal ?? 0),
        marginTotal:
          accumulator.marginTotal === null || line.marginTotal === null
            ? null
            : accumulator.marginTotal + line.marginTotal,
      };
    },
    {
      totalLines: 0,
      knownCostLines: 0,
      knownSaleLines: 0,
      missingPurchaseCount: 0,
      missingSaleCount: 0,
      costTotal: 0,
      saleTotal: 0,
      marginTotal: 0,
    },
  );

  return aggregate;
}

export function computeMarginPercent(profit: number | null, saleTotal: number | null): number | null {
  if (profit === null) return null;
  if (saleTotal === null || !Number.isFinite(saleTotal) || saleTotal <= 0) return null;
  return (profit / saleTotal) * 100;
}

export function formatCatalogCurrency(value: number | null | undefined, fallback = "N/D"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCatalogPercent(value: number | null | undefined, fallback = "N/D"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return `${value.toFixed(1)}%`;
}
