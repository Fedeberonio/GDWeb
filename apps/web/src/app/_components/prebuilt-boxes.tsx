"use client";

import { useCart } from "@/modules/cart/context";
import type { Box } from "@/modules/catalog/types";

type BaseContent = {
  slug: string;
  quantity: number;
  name: string;
  slotValue: number;
  weightKg: number;
  price: number;
};

type PrebuiltBox = {
  box: Box;
  rule?: {
    slotBudget: number;
    targetWeightKg: number;
    categoryBudget?: Record<string, { min: number; max: number }>;
  };
  baseContents: BaseContent[];
};

type Props = {
  boxes: PrebuiltBox[];
};

export function PrebuiltBoxesSection({ boxes }: Props) {
  const { addItem, metrics } = useCart();

  const handleAddBaseContents = (baseContents: BaseContent[]) => {
    baseContents.forEach((content) => {
      addItem({
        slug: content.slug,
        name: content.name,
        type: "product",
        slotValue: content.slotValue,
        weightKg: content.weightKg,
        price: content.price,
        quantity: content.quantity,
      });
    });
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {boxes.map(({ box, rule, baseContents }) => (
          <article key={box.id} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">{box.name.es}</p>
                <p className="text-lg font-semibold text-[var(--color-foreground)]">{box.durationDays} días</p>
              </div>
              {rule && (
                <span className="rounded-full bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                  {rule.slotBudget} slots
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-[var(--color-muted)]">{box.description?.es ?? "Contenido base balanceado."}</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-foreground)]">
              {baseContents.length === 0 && (
                <p className="text-xs text-[var(--color-muted)]">Contenido base en proceso.</p>
              )}
              {baseContents.map((item) => (
                <div key={`${box.id}-${item.slug}`} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2">
                  <span>{item.name}</span>
                  <span className="font-semibold text-sm text-[var(--color-brand)]">x{item.quantity}</span>
                </div>
              ))}
            </div>
            {rule && (
              <p className="mt-4 text-xs text-[var(--color-muted)]">
                Balance de categorías:{' '}
                {Object.entries(rule.categoryBudget ?? {})
                  .map(([category, budget]) => `${category.replace(/_/g, ' ')} ${budget.min}-${budget.max}`)
                  .join(", ")}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleAddBaseContents(baseContents)}
              className="mt-4 w-full rounded-2xl bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[var(--color-brand-accent)]"
            >
              Agregar contenido base
            </button>
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white/90 p-6 shadow-soft text-sm text-[var(--color-muted)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand)]">Carrito</p>
        <p className="text-base text-[var(--color-foreground)]">Slots ocupados: {metrics.totalSlots}</p>
        <p className="text-base text-[var(--color-foreground)]">Peso estimado: {metrics.totalWeightKg.toFixed(1)} kg</p>
        <p className="text-base text-[var(--color-foreground)]">Costo estimado: RD${metrics.totalCost.toFixed(2)}</p>
      </div>
    </>
  );
}
