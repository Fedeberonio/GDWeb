"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/modules/cart/context";
import toast from "react-hot-toast";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/modules/i18n/use-translation";
import { useCatalog } from "@/modules/catalog/context";
import { ProductImageFallback } from "./product-image-fallback";
import { Check, Minus, Plus, ShoppingCart, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { acquireBodyScrollLock, releaseBodyScrollLock } from "@/lib/dom/body-scroll-lock";

const CHECKOUT_DRAFT_KEY = "gd-checkout-draft";

const resolveVariantKey = (variant?: string, mix?: string) => {
  if (variant === "fruity" || variant === "veggie" || variant === "mix") return variant;
  if (mix === "frutas") return "fruity";
  if (mix === "vegetales") return "veggie";
  return "mix";
};

const getCatalogHref = (variantKey: string) => {
  if (variantKey === "fruity") return "/categoria/frutas";
  if (variantKey === "veggie") return "/categoria/vegetales";
  return "/#catalogo";
};

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { t, tData } = useTranslation();
  const { productMap } = useCatalog();
  const [checkoutDraft, setCheckoutDraft] = useState<{ deliveryDay?: string; metodoPago?: string } | null>(null);
  const resolvePreferenceLabel = useCallback(
    (value: string) => {
      const product = productMap.get(value);
      return product ? tData(product.name) : value;
    },
    [productMap, tData],
  );
  const { items, metrics, removeItem, updateQuantity, clear } = useCart();
  const total = metrics.totalCost;
  const boxItems = items.filter((item) => item.type === "box" && item.configuration);
  const hasBoxItems = boxItems.length > 0;
  const hasPreferences = boxItems.some(
    (item) => (item.configuration?.likes?.length ?? 0) > 0 || (item.configuration?.dislikes?.length ?? 0) > 0
  );
  const catalogVariant =
    boxItems.length === 1
      ? resolveVariantKey(boxItems[0].configuration?.variant, boxItems[0].configuration?.mix)
      : "mix";
  const catalogHref = getCatalogHref(catalogVariant);

  const getVariantLabel = (variantKey: string) => {
    if (variantKey === "fruity") return t("cart.variant_fruity");
    if (variantKey === "veggie") return t("cart.variant_veggie");
    return t("cart.variant_mix");
  };
  const boxImageMap: Record<string, string> = {
    "GD-CAJA-001": "/assets/images/boxes/GD-CAJA-001.png",
    "GD-CAJA-002": "/assets/images/boxes/GD-CAJA-002.png",
    "GD-CAJA-003": "/assets/images/boxes/GD-CAJA-003.png",
  };
  const resolveItemImage = (item: typeof items[number]) => {
    if (item.image) return item.image;
    if (item.type === "box") {
      const boxId = item.configuration?.boxId;
      if (boxId && boxImageMap[boxId]) return boxImageMap[boxId];
    }
    return undefined;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOpen) return;
    try {
      const rawDraft = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!rawDraft) {
        setCheckoutDraft(null);
        return;
      }
      const draft = JSON.parse(rawDraft) as { deliveryDay?: string; metodoPago?: string };
      setCheckoutDraft({ deliveryDay: draft?.deliveryDay, metodoPago: draft?.metodoPago });
    } catch {
      setCheckoutDraft(null);
    }
  }, [isOpen]);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    const lockId = "cart-drawer";
    if (isOpen) {
      acquireBodyScrollLock(lockId);
      return () => releaseBodyScrollLock(lockId);
    }
    releaseBodyScrollLock(lockId);
    return undefined;
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const orderSummary = useMemo(() => {
    const subtotal = total;
    const deliveryDay = checkoutDraft?.deliveryDay?.trim() ?? "";
    const chargedDays = new Set(["martes", "jueves", "sábado", "sabado", "tuesday", "thursday", "saturday"]);
    const normalizedDay = deliveryDay.toLowerCase();
    const hasDeliveryDay = Boolean(deliveryDay);
    const deliveryFee = hasDeliveryDay && chargedDays.has(normalizedDay) ? 100 : 0;
    const computedTotal = subtotal + (hasDeliveryDay ? deliveryFee : 0);
    return { subtotal, hasDeliveryDay, deliveryFee, computedTotal };
  }, [checkoutDraft?.deliveryDay, total]);

  const handleWhatsAppClick = () => {
    const greeting = t("cart.whatsapp_greeting") || "Hola! Quiero hacer este pedido:"; // Fallback if key missing
    const totalLabel = t("common.total");

    const message = items
      .map((item) => {
        const unitPrice = item.configuration?.price?.final ?? item.price;
        const extras = item.configuration?.price?.extras ?? 0;
        const extrasText = extras > 0 ? ` (+RD$${extras.toLocaleString("es-DO", { maximumFractionDigits: 2 })} extras)` : "";
        let line = `${item.quantity}x ${item.name} - RD$${(unitPrice * item.quantity).toLocaleString("es-DO")} ${extrasText}`.trim();

        if (item.type === "box" && item.configuration) {
          const variantKey = resolveVariantKey(item.configuration.variant, item.configuration.mix);
          const variantLabel = getVariantLabel(variantKey);
          const likes = (item.configuration.likes || []).map(resolvePreferenceLabel).filter(Boolean);
          const dislikes = (item.configuration.dislikes || []).map(resolvePreferenceLabel).filter(Boolean);
          const preferenceLines = [`  - ${t("cart.mix")}: ${variantLabel}`];
          if (likes.length > 0) preferenceLines.push(`  - ${t("cart.likes")}: ${likes.join(", ")}`);
          if (dislikes.length > 0) preferenceLines.push(`  - ${t("cart.dislikes")}: ${dislikes.join(", ")}`);
          line = `${line}\n${preferenceLines.join("\n")}`;
        }

        if (item.notes || (item.excludedIngredients?.length ?? 0) > 0) {
          const extraLines: string[] = [];
          if (item.excludedIngredients?.length) {
            extraLines.push(`  - ${t("cart.excluded_ingredients")}: ${item.excludedIngredients.join(", ")}`);
          }
          if (item.notes) {
            extraLines.push(`  - ${t("cart.notes")}: ${item.notes}`);
          }
          line = `${line}\n${extraLines.join("\n")}`;
        }

        return line;
      })
      .join("\n");
    const totalText = `${totalLabel}: RD$${total.toLocaleString("es-DO")}`;
    const whatsappUrl = `https://wa.me/18097537338?text=${encodeURIComponent(`${greeting}\n\n${message}\n\n${totalText}`)}`;
    window.open(whatsappUrl, "_blank");
    toast.success(t("cart.notification_sent"));
    clear();
    onClose();
  };

  const handleRemoveItem = (slug: string, name: string) => {
    removeItem(slug);
    toast.success(`${name} ${t("cart.notification_removed")}`);
  };

  const handleUpdateQuantity = (slug: string, quantity: number) => {
    if (quantity <= 0) {
      const item = items.find((i) => i.slug === slug);
      if (item) handleRemoveItem(slug, item.name);
    } else {
      updateQuantity(slug, quantity);
    }
  };

  // Render using Portal to escape parent stacking contexts
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[var(--z-drawer-overlay)] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[var(--z-drawer)] h-full w-full max-w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-6">
              <h2 className="font-display text-2xl text-[var(--color-foreground)]">{t("cart.title")}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-[var(--color-background-muted)] transition-colors duration-300 ease-in-out"
                aria-label="Cerrar carrito"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="gd-scroll flex-1 overflow-y-auto p-6 space-y-4">
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
                    <ShoppingCart className="w-14 h-14 text-[var(--gd-color-forest)]" aria-hidden="true" />
                  </motion.div>
                  <p className="text-lg text-[var(--color-muted)]">{t("common.empty_cart")}</p>
                  <p className="text-sm text-[var(--color-muted)]">{t("common.empty_cart_msg")}</p>
                </motion.div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => {
                      const variantKey = item.configuration
                        ? resolveVariantKey(item.configuration.variant, item.configuration.mix)
                        : "mix";
                      const variantLabel = item.configuration ? getVariantLabel(variantKey) : "";
                      const unitPrice = item.configuration?.price?.final ?? item.price;
                      const lineTotal = unitPrice * item.quantity;
                      const likes = (item.configuration?.likes || []).map(resolvePreferenceLabel).filter(Boolean);
                      const dislikes = (item.configuration?.dislikes || []).map(resolvePreferenceLabel).filter(Boolean);
                      const hasItemNotes = Boolean(item.notes);
                      const hasExcludedIngredients = (item.excludedIngredients?.length ?? 0) > 0;
                      const showItemCustomizations = item.type === "product" && (hasItemNotes || hasExcludedIngredients);
                      return (
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
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-background-muted)]"
                          >
                            <ProductImageFallback
                              slug={item.slug}
                              name={item.name}
                              image={resolveItemImage(item)}
                              className="object-cover"
                              sizes="80px"
                            />
                          </motion.div>
                          <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-[var(--color-foreground)]">{item.name}</h3>
                                <p className="text-xs text-[var(--color-muted)]">
                                  {item.type === "box" && item.configuration
                                    ? `${t("cart.type_box")} • ${variantKey.toUpperCase()}`
                                    : item.type === "box"
                                      ? t("cart.type_box")
                                      : t("cart.type_product")}
                                </p>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveItem(item.slug, item.name)}
                                className="text-[var(--color-muted)] hover:text-[var(--gd-color-apple)] transition-colors"
                                aria-label={t("common.remove")}
                              >
                                <Trash2 className="h-5 w-5" aria-hidden="true" />
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
                                  <Minus className="h-4 w-4" aria-hidden="true" />
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
                                  <Plus className="h-4 w-4" aria-hidden="true" />
                                </motion.button>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-[var(--color-muted)]">
                                  RD${unitPrice.toLocaleString("es-DO")} c/u
                                </p>
                                <p className="font-bold text-[var(--gd-color-forest)]">
                                  RD${lineTotal.toLocaleString("es-DO")}
                                </p>
                                {item.configuration?.price?.extras ? (
                                  <p className="text-[10px] text-orange-600">
                                    {t("cart.extras")}: RD${item.configuration.price.extras.toLocaleString("es-DO", { maximumFractionDigits: 2 })}
                                  </p>
                                ) : null}
                              </div>
                          </div>
                          {showItemCustomizations && (
                            <div className="rounded-xl bg-white/80 border border-[var(--color-border)] p-3 text-[11px] text-[var(--color-muted)] space-y-1">
                              {hasExcludedIngredients && (
                                <p>
                                  {t("cart.excluded_ingredients")}: {item.excludedIngredients?.join(", ")}
                                </p>
                              )}
                              {hasItemNotes && <p>{t("cart.notes")}: {item.notes}</p>}
                            </div>
                          )}
                          {item.configuration && (
                            <div className="rounded-xl bg-white/80 border border-[var(--color-border)] p-3 text-[11px] text-[var(--color-muted)] space-y-1">
                              <p className="font-semibold text-[var(--color-foreground)]">{t("cart.customization")}</p>
                                <p>{t("cart.mix")}: {variantLabel}</p>
                                {likes.length > 0 && (
                                  <p className="inline-flex items-center gap-2">
                                    <ThumbsUp className="w-4 h-4 text-green-600" />
                                    {t("cart.likes")}: {likes.join(", ")}
                                  </p>
                                )}
                                {dislikes.length > 0 && (
                                  <p className="inline-flex items-center gap-2">
                                    <ThumbsDown className="w-4 h-4 text-red-500" />
                                    {t("cart.dislikes")}: {dislikes.join(", ")}
                                  </p>
                                )}
                                <p>{t("cart.delivery_zone")}: {item.configuration.deliveryZone || t("checkout.delivery_to_define")} · {t("cart.delivery_day")}: {item.configuration.deliveryDay || t("checkout.day_to_agree")}</p>
                                <p className="text-[var(--color-foreground)] font-semibold">
                                  {t("cart.total_box")}: RD${item.configuration.price?.final.toLocaleString("es-DO", { minimumFractionDigits: 2 }) ?? (item.configuration.price?.base ?? 0)}
                                </p>
                                {item.configuration.notes && <p>{t("cart.notes")}: {item.configuration.notes}</p>}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {hasBoxItems && (
                    <div className="rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-sprout)]/20 p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">
                        {t("cart.add_a_la_carte_title")}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {hasPreferences ? t("cart.add_a_la_carte_hint_with_likes") : t("cart.add_a_la_carte_hint_no_likes")}
                      </p>
                      <Link
                        href={catalogHref}
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/40 bg-white px-4 py-2 text-xs font-semibold text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/30 transition-colors"
                        onClick={onClose}
                      >
                        {t("cart.view_catalog")}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-[var(--color-border)] p-6 space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-muted)]/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t("checkout.subtotal")}</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    RD${orderSummary.subtotal.toLocaleString("es-DO")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t("checkout.delivery")}</span>
                  {orderSummary.hasDeliveryDay ? (
                    orderSummary.deliveryFee > 0 ? (
                      <span className="font-semibold text-[var(--color-foreground)]">RD${orderSummary.deliveryFee.toLocaleString("es-DO")}</span>
                    ) : (
                      <span className="font-semibold text-green-700">{t("checkout.free")}</span>
                    )
                  ) : (
                    <span className="font-semibold text-[var(--color-muted)]">{t("checkout.delivery_to_define")}</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">{t("checkout.total")}</span>
                  <span className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
                    RD${orderSummary.computedTotal.toLocaleString("es-DO")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--gd-color-forest)] transition-all duration-300 ease-in-out hover:bg-[var(--color-background-muted)]"
                >
                  {t("cart.continue_shopping")}
                </button>
                <Link href="/checkout" onClick={onClose} className="w-full">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={items.length === 0}
                    className={`w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-emerald-600 hover:shadow-xl flex items-center justify-center gap-2 ${items.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>{t("cart.finish_order")}</span>
                  </motion.button>
                </Link>
              </div>

              <button
                onClick={() => {
                  clear();
                  toast.success(t("cart.notification_cleared"));
                }}
                className="w-full text-center text-xs text-[var(--color-muted)] hover:underline"
              >
                {t("common.clear_cart")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
