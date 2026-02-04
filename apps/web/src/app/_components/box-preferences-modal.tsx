"use client";

import { useMemo, useState } from "react";
import { Apple, Citrus, Salad, X, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    // Reset state when opening (or changing box) could be handled by parent key,
    // but let's ensure we are clean if initialVariant changes.

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

    const contents = useMemo(() => {
        const variantContent: Record<VariantType, Array<{ sku: string; name: string; quantity: number }>> = {
            mix: [
                { sku: "mix-garlic", name: "Garlic", quantity: 2 },
                { sku: "mix-onion", name: "Red/Yellow Onion", quantity: 2 },
                { sku: "mix-potatoes", name: "Potatoes", quantity: 2 },
                { sku: "mix-broccoli", name: "Broccoli", quantity: 2 },
                { sku: "mix-mango", name: "Mango", quantity: 2 },
            ],
            fruity: [
                { sku: "fruit-pineapple", name: "Pineapple", quantity: 2 },
                { sku: "fruit-mango", name: "Mango", quantity: 3 },
                { sku: "fruit-passion", name: "Passion Fruit", quantity: 6 },
                { sku: "fruit-bananas", name: "Bananas", quantity: 5 },
                { sku: "fruit-papaya", name: "Papaya", quantity: 1 },
                { sku: "fruit-oranges", name: "Seasonal Oranges", quantity: 4 },
            ],
            veggie: [
                { sku: "veg-broccoli", name: "Broccoli", quantity: 2 },
                { sku: "veg-lettuce", name: "Lettuce", quantity: 2 },
                { sku: "veg-tomatoes", name: "Tomatoes", quantity: 4 },
                { sku: "veg-eggplant", name: "Eggplant", quantity: 2 },
                { sku: "veg-carrots", name: "Carrots", quantity: 3 },
                { sku: "veg-zucchini", name: "Zucchini", quantity: 2 },
            ],
        };

        if (!boxRule) return variantContent[selectedVariant] ?? [];

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

        if (filtered.length === 0) {
            return variantContent[selectedVariant] ?? [];
        }

        return filtered;
    }, [boxRule, selectedVariant, productMap, tData]);

    const toggleLike = (sku: string) => {
        const newLikes = new Set(likes);
        const newDislikes = new Set(dislikes);
        if (newLikes.has(sku)) {
            newLikes.delete(sku);
        } else {
            newLikes.add(sku);
            newDislikes.delete(sku); // Cannot like and dislike same item
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
        { id: "mix", label: "Mix", icon: <Apple className="w-4 h-4 text-red-500" /> },
        { id: "fruity", label: "Frutas", icon: <Citrus className="w-4 h-4 text-orange-500" /> },
        { id: "veggie", label: "Vegetales", icon: <Salad className="w-4 h-4 text-green-600" /> },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-start bg-[var(--gd-color-cream)]/30">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--gd-color-forest)]">{tData(box.name)}</h2>
                            <p className="text-[var(--gd-color-leaf)] font-semibold">
                                RD${box.price.amount.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Step 1: Variant Selector */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                1. Elige tu Variedad
                            </h3>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                {variants.map((v) => {
                                    const isActive = selectedVariant === v.id;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? "bg-white text-[var(--gd-color-forest)] shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            <span>{v.icon}</span>
                                            {v.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step 2: Content Preferences */}
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    2. Personaliza tus Preferencias
                                </h3>
                                <span className="text-xs text-gray-400 font-normal px-2 py-1 bg-gray-50 rounded-lg">
                                    Contenido estimado
                                </span>
                            </div>

                            <div key={selectedVariant} className="space-y-2 transition-opacity duration-300">
                                {contents.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-4">
                                        Detalles del contenido no disponibles para esta selección.
                                    </p>
                                ) : (
                                    contents.map((item) => {
                                        const isLiked = likes.has(item.sku);
                                        const isDisliked = dislikes.has(item.sku);

                                        return (
                                            <div key={item.sku} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--gd-color-cream)] flex items-center justify-center text-xs font-bold text-[var(--gd-color-forest)]">
                                                        {item.quantity}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleLike(item.sku)}
                                                        className={`p-2 rounded-full transition-colors ${isLiked
                                                            ? "bg-green-100 text-green-600"
                                                            : "text-gray-300 hover:bg-gray-100"
                                                            }`}
                                                        title="Me gusta (Priorizar)"
                                                    >
                                                        <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleDislike(item.sku)}
                                                        className={`p-2 rounded-full transition-colors ${isDisliked
                                                            ? "bg-red-100 text-red-500"
                                                            : "text-gray-300 hover:bg-gray-100"
                                                            }`}
                                                        title="No me gusta (Evitar)"
                                                    >
                                                        <ThumbsDown size={16} fill={isDisliked ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                                Usa <ThumbsUp size={12} className="inline mx-1" /> para decirnos qué te encanta, y <ThumbsDown size={12} className="inline mx-1" /> para lo que prefieres evitar. Haremos lo posible por ajustar tu caja.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={handleConfirm}
                            className="w-full py-3.5 bg-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)] text-white rounded-xl font-semibold shadow-lg shadow-green-900/10 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                        >
                            <Check size={18} />
                            Agregar al Carrito
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
