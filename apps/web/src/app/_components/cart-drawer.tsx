"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/modules/cart/context";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";
import { useEffect, useState } from "react";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, metrics, removeItem, updateQuantity, clear } = useCart();
  const total = metrics.totalCost;

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleWhatsAppClick = () => {
    const message = items
      .map((item) => {
        const unitPrice = item.configuration?.price?.final ?? item.price;
        const extras = item.configuration?.price?.extras ?? 0;
        const extrasText = extras > 0 ? ` (+RD$${extras.toLocaleString("es-DO", { maximumFractionDigits: 2 })} extras)` : "";
        return `${item.quantity}x ${item.name} - RD$${(unitPrice * item.quantity).toLocaleString("es-DO")} ${extrasText}`.trim();
      })
      .join("\n");
    const totalText = `Total: RD$${total.toLocaleString("es-DO")}`;
    const whatsappUrl = `https://wa.me/18098234567?text=${encodeURIComponent(`Hola! Quiero hacer este pedido:\n\n${message}\n\n${totalText}`)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("¡Pedido enviado por WhatsApp! 🎉");
    clear();
    onClose();
  };

  const handleRemoveItem = (slug: string, name: string) => {
    removeItem(slug);
    toast.success(`${name} eliminado del carrito`);
  };

  const handleUpdateQuantity = (slug: string, quantity: number) => {
    if (quantity <= 0) {
      const item = items.find((i) => i.slug === slug);
      if (item) handleRemoveItem(slug, item.name);
    } else {
      updateQuantity(slug, quantity);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-6">
              <h2 className="font-display text-2xl text-[var(--color-foreground)]">Tu pedido</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-[var(--color-background-muted)] transition-colors"
                aria-label="Cerrar carrito"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4"
                >
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    className="text-6xl"
                  >
                    🛒
                  </motion.div>
                  <p className="text-lg text-[var(--color-muted)]">Tu carrito está vacío</p>
                  <p className="text-sm text-[var(--color-muted)]">Agrega productos para comenzar</p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.slug}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.05,
                      }}
                      layout
                      className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {item.image && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-background-muted)]"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </motion.div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-[var(--color-foreground)]">{item.name}</h3>
                            <p className="text-xs text-[var(--color-muted)]">{item.type === "box" ? "Caja" : "Producto"}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveItem(item.slug, item.name)}
                            className="text-[var(--color-muted)] hover:text-[var(--gd-color-apple)] transition-colors"
                            aria-label="Eliminar"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="h-5 w-5"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUpdateQuantity(item.slug, item.quantity - 1)}
                              className="rounded-full border border-[var(--color-border)] w-8 h-8 flex items-center justify-center hover:bg-[var(--color-background-muted)] transition-colors"
                              aria-label="Disminuir cantidad"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-4 w-4"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                              </svg>
                            </motion.button>
                            <motion.span
                              key={item.quantity}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              className="font-semibold w-8 text-center"
                            >
                              {item.quantity}
                            </motion.span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUpdateQuantity(item.slug, item.quantity + 1)}
                              className="rounded-full border border-[var(--color-border)] w-8 h-8 flex items-center justify-center hover:bg-[var(--color-background-muted)] transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-4 w-4"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </motion.button>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[var(--gd-color-forest)]">
                              RD${((item.configuration?.price?.final ?? item.price) * item.quantity).toLocaleString("es-DO")}
                            </p>
                            {item.configuration?.price?.extras ? (
                              <p className="text-[10px] text-orange-600">
                                Incluye extras: RD${item.configuration.price.extras.toLocaleString("es-DO", { maximumFractionDigits: 2 })}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {item.configuration && (
                          <div className="rounded-xl bg-white/80 border border-[var(--color-border)] p-3 text-[11px] text-[var(--color-muted)] space-y-1">
                            <p className="font-semibold text-[var(--color-foreground)]">Personalización</p>
                            <p>Mix: {item.configuration.mix || item.configuration.variant || "mix"}</p>
                            <p>Entrega: {item.configuration.deliveryZone || "Por definir"} · {item.configuration.deliveryDay || "Día a convenir"}</p>
                            <p className="text-[var(--color-foreground)] font-semibold">
                              Total caja: RD${item.configuration.price?.final.toLocaleString("es-DO", { minimumFractionDigits: 2 }) ?? (item.configuration.price?.base ?? 0)}
                            </p>
                            {item.configuration.notes && <p>Notas: {item.configuration.notes}</p>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="border-t border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-[var(--color-foreground)]">Total:</span>
                <span className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
                  RD${total.toLocaleString("es-DO")}
                </span>
              </div>
              
              <Link href="/checkout" onClick={onClose} className="w-full">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={items.length === 0}
                    className={`w-full rounded-2xl bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:from-[var(--gd-color-leaf)] hover:to-[var(--gd-color-avocado)] hover:shadow-2xl flex items-center justify-center gap-2 ${items.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <span>💳</span>
                    <span>Ir a Pagar</span>
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsAppClick}
                className="w-full rounded-2xl border-2 border-[var(--gd-color-leaf)] bg-white px-6 py-3 text-sm font-semibold text-[var(--gd-color-forest)] transition-all duration-300 hover:bg-[var(--gd-color-leaf)]/10"
              >
                <span>📱 Pedir por WhatsApp</span>
              </motion.button>
              
              <button
                onClick={() => {
                  clear();
                  toast.success("Carrito vaciado");
                }}
                className="w-full text-center text-xs text-[var(--color-muted)] hover:underline"
              >
                Vaciar carrito
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
