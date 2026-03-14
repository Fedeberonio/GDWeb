"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { Apple, Check, CircleX, Citrus, Heart, Salad, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import { useTranslation } from "@/modules/i18n/use-translation";
import type { Box, BoxRule, Product } from "@/modules/catalog/types";
import type { VariantType } from "./box-selector/helpers";
import { getVisualCategory } from "./box-selector/helpers";

type BoxPreferencesModalProps = {
    isOpen: boolean;
    onClose: () => void;
    box: Box;
    boxRule?: BoxRule;
    productMap: Map<string, Product>;
    initialVariant?: VariantType;
    onConfirm: (data: {
        variant: VariantType;
        likes: string[];
        dislikes: string[];
    }) => void;
};

export function BoxPreferencesModal({
    isOpen,
    onClose,
    box,
    boxRule,
    productMap,
    initialVariant = "mix",
    onConfirm,
}: BoxPreferencesModalProps) {
    const { t, tData } = useTranslation();
    const [selectedVariant, setSelectedVariant] = useState<VariantType>(initialVariant);
    const [likes, setLikes] = useState<Set<string>>(new Set());
    const [dislikes, setDislikes] = useState<Set<string>>(new Set());
    const [selectionBurst, setSelectionBurst] = useState<{ sku: string; kind: "like" | "dislike"; id: number } | null>(null);
    const burstCounterRef = useRef(0);

    // Reset state when opening (or changing box) could be handled by parent key,
    // but let's ensure we are clean if initialVariant changes.

    const contents = useMemo(() => {
        const resolveProduct = (sku: string) => {
            return (
                productMap.get(sku) ||
                productMap.get(sku.toLowerCase()) ||
                productMap.get(sku.toUpperCase())
            );
        };

        const resolveProductLabel = (sku: string, fallback?: string) => {
            const product = resolveProduct(sku);
            const localized = product ? tData(product.name) : "";
            return localized || fallback || sku;
        };

        const contentsFromBoxVariant = (variant: VariantType) => {
            const variantData = box.variants.find((item) => item.id === variant || item.slug === variant);
            if (!variantData?.referenceContents?.length) return [];

            return variantData.referenceContents
                .map((item) => {
                    const sku = String(item.productId ?? "").trim();
                    const fallbackName = item.name?.es ?? item.name?.en ?? sku;
                    return {
                        sku,
                        name: resolveProductLabel(sku, fallbackName),
                        quantity: Number(item.quantity) || 1,
                    };
                })
                .filter((item) => item.sku || item.name);
        };

        const directContents = contentsFromBoxVariant(selectedVariant);
        if (directContents.length > 0) return directContents;

        if (!boxRule) return [];

        const base = boxRule.baseContents || [];
        const variantSpecific = boxRule.variantContents?.[selectedVariant] || [];

        const aggMap = new Map<string, number>();

        const addItems = (items: { productSku: string; quantity: number }[]) => {
            items.forEach(item => {
                const currentQty = aggMap.get(item.productSku) || 0;
                aggMap.set(item.productSku, currentQty + item.quantity);
            });
        };

        addItems(base);
        addItems(variantSpecific);

        const resolved = Array.from(aggMap.entries()).map(([sku, quantity]) => ({
            sku,
            name: resolveProductLabel(sku),
            quantity
        }));

        const filterByVariant = (items: typeof resolved) => {
            if (selectedVariant === "mix") return items;

            if (selectedVariant === "fruity") {
                return items.filter((item) => {
                    const product = resolveProduct(item.sku);
                    const localizedName = item.name || resolveProductLabel(item.sku);
                    const category = getVisualCategory(item.sku, localizedName, product?.categoryId);
                    const skuLower = item.sku.toLowerCase();
                    const nameLower = localizedName.toLowerCase();

                    const isCookingAromatic =
                        skuLower.includes("ajo") ||
                        skuLower.includes("cebolla") ||
                        skuLower.includes("apio") ||
                        skuLower.includes("perejil") ||
                        skuLower.includes("cilantro") ||
                        nameLower.includes("ajo") ||
                        nameLower.includes("cebolla") ||
                        nameLower.includes("apio") ||
                        nameLower.includes("perejil") ||
                        nameLower.includes("cilantro");

                    return (
                        (category === "fruit_large" ||
                            category === "fruit_small" ||
                            category === "citrus") &&
                        !isCookingAromatic
                    );
                });
            }

            return items.filter((item) => {
                const product = resolveProduct(item.sku);
                const localizedName = item.name || resolveProductLabel(item.sku);
                const category = getVisualCategory(item.sku, localizedName, product?.categoryId);
                return (
                    category === "leafy" ||
                    category === "root" ||
                    category === "aromatic" ||
                    (category !== "fruit_large" && category !== "fruit_small" && category !== "citrus")
                );
            });
        };

        const filtered = filterByVariant(resolved);

        return filtered;
    }, [box, boxRule, selectedVariant, productMap, tData]);

    const productImageBySku = useMemo(() => {
        const bySku = new Map<string, string>();
        const byName = new Map<string, string>();
        const seenIds = new Set<string>();

        productMap.forEach((product) => {
            if (!product?.id || seenIds.has(product.id)) return;
            seenIds.add(product.id);

            const imageSrc = product.image || `/assets/images/products/${product.sku}.png`;
            if (!imageSrc) return;

            if (product.sku) {
                bySku.set(product.sku.toLowerCase(), imageSrc);
            }
            if (product.name) {
                const localizedName = tData(product.name).trim().toLowerCase();
                if (localizedName) {
                    byName.set(localizedName, imageSrc);
                }
            }
        });

        return { bySku, byName };
    }, [productMap, tData]);

    const resolveItemThumbnail = (sku: string, name: string) => {
        const normalizedSku = sku.toLowerCase();
        const normalizedName = name.trim().toLowerCase();
        const bySku = productImageBySku.bySku.get(normalizedSku);
        if (bySku) return bySku;

        const byNameExact = productImageBySku.byName.get(normalizedName);
        if (byNameExact) return byNameExact;

        const looseMatch = Array.from(productImageBySku.byName.entries()).find(([productName]) => {
            return productName.includes(normalizedName) || normalizedName.includes(productName);
        });
        if (looseMatch) return looseMatch[1];

        return "/assets/images/products/placeholder.png";
    };

    const likesInView = contents.filter((item) => likes.has(item.sku)).length;
    const dislikesInView = contents.filter((item) => dislikes.has(item.sku)).length;

    const triggerSelectionBurst = (sku: string, kind: "like" | "dislike") => {
        burstCounterRef.current += 1;
        const id = burstCounterRef.current;
        setSelectionBurst({ sku, kind, id });
        window.setTimeout(() => {
            setSelectionBurst((current) => (current?.id === id ? null : current));
        }, 520);
    };

    const toggleLike = (sku: string) => {
        const newLikes = new Set(likes);
        const newDislikes = new Set(dislikes);
        if (newLikes.has(sku)) {
            newLikes.delete(sku);
        } else {
            newLikes.add(sku);
            newDislikes.delete(sku); // Cannot like and dislike same item
            triggerSelectionBurst(sku, "like");
        }
        setLikes(newLikes);
        setDislikes(newDislikes);
    };

    const toggleDislike = (sku: string) => {
        const newLikes = new Set(likes);
        const newDislikes = new Set(dislikes);
        if (newDislikes.has(sku)) {
            newDislikes.delete(sku);
        } else {
            newDislikes.add(sku);
            newLikes.delete(sku); // Cannot like and dislike same item
            triggerSelectionBurst(sku, "dislike");
        }
        setLikes(newLikes);
        setDislikes(newDislikes);
    };

    const handleConfirm = () => {
        onConfirm({
            variant: selectedVariant,
            likes: Array.from(likes),
            dislikes: Array.from(dislikes),
        });
        onClose();
    };

    const variants: { id: VariantType; label: string; icon: React.ReactNode }[] = [
        { id: "mix", label: t("cart.variant_mix"), icon: <Apple className="w-4 h-4 text-red-500" /> },
        { id: "fruity", label: t("cart.variant_fruity"), icon: <Citrus className="w-4 h-4 text-orange-500" /> },
        { id: "veggie", label: t("cart.variant_veggie"), icon: <Salad className="w-4 h-4 text-green-600" /> },
    ];

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
                    className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--gd-color-leaf)]/30 bg-gradient-to-br from-[#f8fff3] via-[#fffef5] to-[#ecf9ff] shadow-[0_24px_60px_rgba(18,64,35,0.30)]"
                >
                    <div className="relative border-b border-[var(--gd-color-leaf)]/20 bg-gradient-to-r from-[var(--gd-color-sprout)]/35 via-[#fff7dd] to-[var(--gd-color-citrus)]/20 p-6 pb-4">
                        <div className="pointer-events-none absolute right-5 top-3 text-[var(--gd-color-orange)]/40">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--gd-color-forest)]">{tData(box.name)}</h2>
                            <p className="text-base font-extrabold text-[var(--gd-color-leaf)]">
                                RD${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-white/80"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="gd-scroll flex-1 space-y-6 overflow-y-auto p-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--gd-color-forest)]/75">
                                {t("box_preferences.step1_title")}
                            </h3>
                            <p className="text-xs text-[var(--gd-color-text-muted)]">{t("box_preferences.step1_subtitle")}</p>
                            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--gd-color-leaf)]/20 bg-white/70 p-2">
                                {variants.map((v) => {
                                    const isActive = selectedVariant === v.id;
                                    return (
                                        <motion.button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setSelectedVariant(v.id)}
                                            whileTap={{ scale: 0.96 }}
                                            className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition-all ${isActive
                                                ? "bg-gradient-to-r from-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] text-white shadow-[0_8px_20px_rgba(35,111,54,0.26)]"
                                                : "bg-white/70 text-[var(--gd-color-forest)]/70 hover:bg-white hover:text-[var(--gd-color-forest)]"
                                                }`}
                                        >
                                            <span className={isActive ? "brightness-200" : ""}>{v.icon}</span>
                                            {v.label}
                                            {isActive && (
                                                <motion.span
                                                    layoutId="variant-pill-active"
                                                    className="absolute -bottom-1.5 h-1.5 w-8 rounded-full bg-[var(--gd-color-citrus)]"
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-[var(--gd-color-leaf)]/25 bg-white/70 p-4 shadow-[0_10px_24px_rgba(31,96,48,0.08)]">
                            <div className="flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <h3 className="text-base font-black text-[var(--gd-color-forest)]">
                                        {t("box_preferences.step2_title")}
                                    </h3>
                                    <p className="text-xs text-[var(--gd-color-text-muted)]">
                                        {t("box_preferences.step2_subtitle")}
                                    </p>
                                </div>
                                <span className="rounded-full border border-[var(--gd-color-citrus)]/40 bg-[var(--gd-color-citrus)]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--gd-color-forest)]">
                                    {t("box_preferences.estimated_content")}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-emerald-300/40 bg-emerald-100/60 px-2 py-2 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">❤️ {t("box_preferences.count_likes")}</p>
                                    <p className="text-lg font-black text-emerald-700">{likesInView}</p>
                                </div>
                                <div className="rounded-xl border border-rose-300/40 bg-rose-100/60 px-2 py-2 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-rose-800">❌ {t("box_preferences.count_dislikes")}</p>
                                    <p className="text-lg font-black text-rose-700">{dislikesInView}</p>
                                </div>
                            </div>
                        </div>

                        <div key={selectedVariant} className="space-y-2 transition-opacity duration-300">
                            {contents.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-[var(--gd-color-leaf)]/30 bg-white/70 py-4 text-center text-sm italic text-[var(--gd-color-text-muted)]">
                                    {t("box_preferences.empty")}
                                </p>
                            ) : (
                                contents.map((item) => {
                                    const isLiked = likes.has(item.sku);
                                    const isDisliked = dislikes.has(item.sku);
                                    const thumbnailSrc = resolveItemThumbnail(item.sku, item.name);
                                    const rowTone = isLiked
                                        ? "border-emerald-300/70 bg-gradient-to-r from-emerald-100/90 to-white"
                                        : isDisliked
                                          ? "border-rose-300/70 bg-gradient-to-r from-rose-100/90 to-white"
                                          : "border-[var(--gd-color-leaf)]/20 bg-white/85 hover:-translate-y-0.5 hover:border-[var(--gd-color-leaf)]/40 hover:shadow-md";

                                    return (
                                        <motion.div
                                            key={item.sku}
                                            layout
                                            whileHover={{ y: -2 }}
                                            className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border p-3 transition-all ${rowTone}`}
                                        >
                                            {selectionBurst?.sku === item.sku && (
                                                <motion.div
                                                    key={`${selectionBurst.id}-${item.sku}`}
                                                    initial={{ opacity: 0, scale: 0.4, y: 10 }}
                                                    animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.8], y: [10, -8, -18] }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className={`pointer-events-none absolute right-24 top-1/2 -translate-y-1/2 ${selectionBurst.kind === "like" ? "text-emerald-500" : "text-rose-500"}`}
                                                >
                                                    <Sparkles className="h-5 w-5" />
                                                </motion.div>
                                            )}

                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-[var(--gd-color-leaf)]/25 bg-white">
                                                    <Image
                                                        src={thumbnailSrc}
                                                        alt={item.name}
                                                        fill
                                                        sizes="24px"
                                                        className="object-cover object-center"
                                                    />
                                                </div>
                                                <span className="truncate text-sm font-semibold text-[var(--gd-color-forest)]">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    type="button"
                                                    onClick={() => toggleLike(item.sku)}
                                                    whileTap={{ scale: 0.9 }}
                                                    animate={isLiked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                                                    transition={{ duration: 0.22 }}
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${isLiked
                                                        ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_8px_16px_rgba(16,185,129,0.35)]"
                                                        : "border-emerald-200 bg-white text-emerald-500 hover:bg-emerald-50"
                                                        }`}
                                                    title={t("box_customize.like_title")}
                                                >
                                                    <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                                                </motion.button>
                                                <motion.button
                                                    type="button"
                                                    onClick={() => toggleDislike(item.sku)}
                                                    whileTap={{ scale: 0.9 }}
                                                    animate={isDisliked ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
                                                    transition={{ duration: 0.28 }}
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${isDisliked
                                                        ? "border-rose-500 bg-rose-500 text-white shadow-[0_8px_16px_rgba(244,63,94,0.3)]"
                                                        : "border-rose-200 bg-white text-rose-500 hover:bg-rose-50"
                                                        }`}
                                                    title={t("box_customize.dislike_title")}
                                                >
                                                    <CircleX className="h-4 w-4" />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        <p className="rounded-xl bg-white/65 px-3 py-2 text-xs leading-relaxed text-[var(--gd-color-forest)]/75">
                            {t("box_preferences.helper_text")}
                        </p>
                    </div>

                    <div className="border-t border-[var(--gd-color-leaf)]/20 bg-white/70 p-5">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] py-3.5 font-bold text-white shadow-[0_14px_22px_rgba(31,96,48,0.28)] transition-all hover:brightness-105 active:scale-[0.98]"
                        >
                            <Check size={18} />
                            {t("common.add_to_cart")}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
