"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/modules/cart/context";
import { CartSidebar } from "./cart-sidebar";
import { ShoppingCart } from "lucide-react";

export function CartButton() {
  const { metrics } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bumpCount, setBumpCount] = useState(0);
  const itemCount = metrics.itemCount;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBump = () => setBumpCount((prev) => prev + 1);
    window.addEventListener("gd-cart-add", handleBump);
    return () => {
      window.removeEventListener("gd-cart-add", handleBump);
    };
  }, []);

  // Renderizar un placeholder durante SSR
  if (!mounted) {
    return (
      <button
        className="relative inline-flex items-center justify-center rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/90 p-2.5 text-[var(--gd-color-forest)] shadow-sm transition-all duration-300 ease-in-out"
        aria-label="Ver carrito"
        disabled
      >
        <ShoppingCart className="h-6 w-6" aria-hidden="true" />
      </button>
    );
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={bumpCount ? { scale: [1, 1.15, 0.96, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative inline-flex items-center justify-center rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/90 p-2.5 text-[var(--gd-color-forest)] shadow-sm transition-all duration-300 ease-in-out hover:bg-white hover:shadow-md"
        aria-label="Ver carrito"
      >
        <ShoppingCart className="h-6 w-6" aria-hidden="true" />
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-md"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <CartSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
