"use client";

import type { Box } from "@/modules/catalog/types";
import { BalanceChart } from "./balance-chart";
import { getBoxRule, computeBoxPrice } from "@/modules/box-builder/utils";
import { PriceInfoTooltip } from "./price-info-tooltip";

type SummaryCardProps = {
  selectedBox?: Box;
  mix?: string;
  extras: string[];
  likes: string[];
  dislikes: string[];
  notes?: string;
  highlightedProducts?: string[];
  selectedItems: Array<{ slug: string; name: string; quantity: number }>;
  slotsUsed: number;
  slotBudget?: number;
  weightUsed: number;
  costEstimate: number;
  deliveryZone?: string;
  deliveryDay?: string;
  selectedProducts: Record<string, number>;
};

export function SummaryCard({
  selectedBox,
  mix,
  extras,
  likes,
  dislikes,
  notes,
  highlightedProducts,
  selectedItems,
  slotsUsed,
  slotBudget,
  weightUsed,
  costEstimate,
  deliveryZone,
  deliveryDay,
  selectedProducts,
}: SummaryCardProps) {
  return (
    <aside className="sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[32px] border border-[var(--color-border)] bg-white/95 p-6 shadow-soft space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Tu caja</p>
        <p className="font-display text-2xl text-[var(--color-foreground)]">
          {selectedBox ? selectedBox.name.es : "Selecciona una caja"}
        </p>
        {selectedBox && (
          <p className="text-sm text-[var(--color-muted)]">
            {selectedBox.durationDays ? `${selectedBox.durationDays} días` : "Flexible"} · RD$
            {selectedBox.price.amount.toLocaleString("es-DO")}
          </p>
        )}
      </div>
      
      {/* Advertencia de personalización excesiva */}
      {selectedBox && selectedBox.id && (() => {
        const rule = getBoxRule(selectedBox.id);
        const baseContents = rule?.baseContents ?? [];
        const modifiedCount = baseContents.filter((item: { productSlug: string; quantity: number }) => {
          const currentQty = selectedProducts[item.productSlug] ?? 0;
          return currentQty !== item.quantity;
        }).length;
        const isHeavilyCustomized = modifiedCount > baseContents.length * 0.5;
        
        if (isHeavilyCustomized) {
          return (
            <div className="rounded-xl border-2 border-orange-400 bg-orange-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="font-semibold text-orange-800 text-sm">Personalización Extensa</p>
              </div>
                  <p className="text-xs text-orange-700">
                    Pero de todas maneras, excedido el peso o cantidad de cada caja, no te preocupes! puedes pedir lo que quieras y transformar tu pedido a la <strong>&quot;carta&quot;</strong>.
                  </p>
            </div>
          );
        }
        return null;
      })()}

      {/* Gráfico de Balance Visual */}
      {selectedBox && selectedBox.id && (
        <BalanceChart boxId={selectedBox.id} selectedProducts={selectedProducts} />
      )}

      <SummaryRow label="📦 Espacio en tu caja">
        <PriceInfoTooltip
          label="Espacios y peso"
              info="Cada producto ocupa un espacio en tu caja. Mantén el peso dentro del rango para conservar el precio de combo. Pero de todas maneras, excedido el peso o cantidad de cada caja, no te preocupes! puedes pedir lo que quieras y transformar tu pedido a la 'carta'."
        >
          <span>
            {slotBudget ? (
              <>
                <span className={slotsUsed >= slotBudget * 0.9 ? "text-[var(--gd-color-forest)] font-bold" : ""}>
                  {slotsUsed}/{slotBudget} espacios
                </span>
                {" · "}
                <span>{weightUsed.toFixed(1)} kg</span>
              </>
            ) : (
              `${weightUsed.toFixed(1)} kg`
            )}
          </span>
        </PriceInfoTooltip>
      </SummaryRow>
      <SummaryRow label="Productos incluidos">
        {highlightedProducts && highlightedProducts.length > 0
          ? `${highlightedProducts.length} productos elegidos especialmente para ti`
          : "Elige tus favoritos"}
      </SummaryRow>
      
      {/* Precio calculado con lógica de A la Carta y extras de swaps */}
      {selectedBox && selectedBox.id && (() => {
        const mixVariant = mix === "frutas" ? "fruity" : mix === "vegetales" ? "veggie" : "mix";
        const priceInfo = computeBoxPrice(selectedBox.id, selectedBox.price.amount, selectedProducts, mixVariant);
        const isACarta = priceInfo.isACarta;
        const deliveryCost: number = 0; // Delivery gratuito lunes, miércoles y viernes
        // Redondear extras a 2 decimales para evitar problemas de precisión
        const extrasRounded = Math.round(priceInfo.extras * 100) / 100;
        const totalPrice = priceInfo.price + extrasRounded + deliveryCost;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <PriceInfoTooltip
                label="Precio de tu pedido"
                    info={
                      isACarta
                        ? "Tu pedido ha sido transformado a 'A la Carta' con precios individuales. Las cajas pre-armadas tienen mejor precio."
                        : "Precio de la caja pre-armada. Pero de todas maneras, excedido el peso o cantidad de cada caja, no te preocupes! puedes pedir lo que quieras y transformar tu pedido a la 'carta'."
                    }
              >
                <span className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                  {isACarta ? "Precio A la Carta" : "Precio de la caja"}
                </span>
              </PriceInfoTooltip>
            </div>
            <div className={`rounded-xl p-4 border-2 ${
              isACarta 
                ? "border-orange-400 bg-orange-50" 
                : "border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-sprout)]/10"
            }`}>
              {/* Desglose de precio */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted)]">
                    {isACarta ? "Total A la Carta:" : "Caja:"}
                  </span>
                  <span className={`font-semibold ${
                    isACarta ? "text-orange-700" : "text-[var(--gd-color-forest)]"
                  }`}>
                    RD${priceInfo.price.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {!isACarta && extrasRounded > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-muted)]">Extras:</span>
                    <span className="font-semibold text-orange-600">
                      +RD${extrasRounded.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted)]">Delivery:</span>
                  <span className="font-semibold text-green-600">
                    {deliveryCost === 0 ? "Gratis ✓" : `RD$${deliveryCost.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-[var(--gd-color-leaf)]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--color-muted)]">
                      Total:
                    </span>
                    <span className={`font-display text-2xl font-bold ${
                      isACarta ? "text-orange-700" : "text-[var(--gd-color-forest)]"
                    }`}>
                      RD${totalPrice.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              {isACarta && selectedBox.price.amount < priceInfo.price && (
                <div className="mt-2 pt-2 border-t border-orange-300">
                  <p className="text-xs text-orange-700">
                    Precio original de la caja: <span className="line-through">RD${selectedBox.price.amount.toLocaleString("es-DO")}</span>
                  </p>
                  <p className="text-xs font-semibold text-orange-800 mt-1">
                    Diferencia: +RD${(priceInfo.price - selectedBox.price.amount).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              {!isACarta && extrasRounded > 0 && (
                <div className="mt-2 pt-2 border-t border-orange-300">
                  <p className="text-xs text-orange-700">
                    Costos adicionales por cambios de productos aceptados
                  </p>
                </div>
              )}
              {!isACarta && extrasRounded === 0 && (
                <p className="text-xs text-[var(--gd-color-forest)] mt-2 font-medium">
                  ✓ Precio de combo conveniente
                </p>
              )}
            </div>
          </div>
        );
      })()}
      
      <SummaryRow label="Costo estimado (wholesale)">
        <PriceInfoTooltip
          label="Costo estimado"
          info="Este es el costo estimado basado en precios mayoristas. El precio final puede variar según la personalización."
        >
          <span>RD${costEstimate.toFixed(2)}</span>
        </PriceInfoTooltip>
      </SummaryRow>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Contenido actual</p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-foreground)]">
          {selectedItems.length === 0 && <li>Sin selecciones activas</li>}
          {selectedItems.slice(0, 6).map((item) => (
            <li key={item.slug} className="flex justify-between text-[var(--color-muted)]">
              <span>{item.name}</span>
              <span className="font-semibold text-[var(--color-foreground)]">x{item.quantity}</span>
            </li>
          ))}
          {selectedItems.length > 6 && (
            <li className="text-xs text-[var(--color-muted)]">+{selectedItems.length - 6} productos</li>
          )}
        </ul>
      </div>
      <div className="space-y-3">
        <SummaryRow label="Mix">{mix ? mix : "Elige Mix / Fruity / Veggie"}</SummaryRow>
        <SummaryRow label="Extras">{extras.length > 0 ? extras.join(", ") : "Sin extras aún"}</SummaryRow>
        <SummaryRow label="Siempre quiero">{likes.length > 0 ? likes.join(", ") : "Agrega tus favoritos"}</SummaryRow>
        <SummaryRow label="Prefiero evitar">{dislikes.length > 0 ? dislikes.join(", ") : "Nada que evitar todavía"}</SummaryRow>
        <SummaryRow label="Notas especiales">{notes && notes.trim().length > 0 ? notes : "Escribe instrucciones especiales"}</SummaryRow>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-[var(--color-brand-soft)] to-[color:rgba(212,229,184,0.3)] p-4 border border-[var(--color-brand-soft)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)] font-bold">Entrega</p>
        <p className="text-sm text-[var(--color-foreground)] font-semibold mt-1">
          {deliveryZone ? deliveryZone : "Selecciona zona"} · {deliveryDay ? deliveryDay : "Elige día disponible"}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-2">
          Pedidos hasta las 12:00 p.m. se entregan el mismo día. <strong className="text-[var(--color-brand)]">Delivery gratuito</strong> lunes, miércoles y viernes.
        </p>
      </div>
      {selectedBox && (
        <div className="rounded-2xl bg-[var(--color-background-muted)] p-4 border border-[var(--color-brand-soft)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)] font-bold flex items-center gap-2">
            <span>♻️</span>
            <span>Caja retornable</span>
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-2">
            Devuelve tu caja en el próximo pedido y <strong className="text-[var(--color-brand)]">te descontamos del precio.</strong> ¡Todos ganamos! 💚
          </p>
        </div>
      )}
    </aside>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{label}</p>
      <div className="text-sm font-semibold text-[var(--color-foreground)]">{children}</div>
    </div>
  );
}
