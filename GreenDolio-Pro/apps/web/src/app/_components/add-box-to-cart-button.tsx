"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/modules/cart/context";
import type { Box } from "@/modules/catalog/types";

type AddBoxToCartButtonProps = {
  box: Box;
};

export function AddBoxToCartButton({ box }: AddBoxToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
      addItem({
        slug: box.slug,
        type: "box",
        name: box.name.es,
        quantity: 1,
        price: box.price.amount,
        slotValue: 0,
        weightKg: 0,
      });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleAddToCart}
        className={`flex items-center justify-center gap-2 w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
          isAdded
            ? "bg-[var(--gd-color-leaf)]"
            : "bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] hover:from-[var(--gd-color-leaf)] hover:to-[var(--gd-color-avocado)]"
        }`}
      >
        {isAdded ? (
          <>
            <span className="text-xl">✓</span>
            <span>Agregado al carrito</span>
          </>
        ) : (
          <>
            <span className="text-xl">🛒</span>
            <span>Agregar al carrito</span>
          </>
        )}
      </button>
      <Link
        href="/armar"
        className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-[var(--gd-color-leaf)] bg-white/90 px-6 py-3 text-sm font-semibold text-[var(--gd-color-forest)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]"
      >
        <span>✨</span>
        <span>Personalizar en builder</span>
      </Link>
    </div>
  );
}
