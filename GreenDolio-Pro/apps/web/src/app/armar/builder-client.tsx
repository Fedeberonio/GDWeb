"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import type { Box, Product } from "@/modules/catalog/types";
import { Container } from "../_components/container";
import { StepperHeader } from "../_components/box-builder/stepper-header";
import { SummaryCard } from "../_components/box-builder/summary-card";
import { ProductGallery } from "../_components/box-builder/product-gallery";
import { BaseContentsDisplay } from "../_components/box-builder/base-contents-display";
import { DiscoverBoxView } from "../_components/box-builder/discover-box-view";
import { useBoxBuilder } from "@/modules/box-builder/context";
import type { BuilderState } from "@/modules/box-builder/state";
import { computeSlots, computeWeight, computeCost, getBoxRule, getProductMeta, checkBalanceIssues, computeBoxPrice } from "@/modules/box-builder/utils";
import { submitBuilderRequest, validateBuilderSelection } from "@/modules/box-builder/api";
import type { VariantType } from "../_components/box-selector/helpers";
import { useCart } from "@/modules/cart/context";
import type { BoxConfiguration } from "@/modules/cart/types";
import toast from "react-hot-toast";

const STEPS = [
  { id: "box", label: "Elige tu caja" },
  { id: "discover", label: "Descubre tu caja" },
  { id: "mix", label: "Personaliza" },
  { id: "prefs", label: "Gustos" },
  { id: "delivery", label: "Entrega" },
] as const;

const LIKE_OPTIONS = ["Aguacate", "Pepino", "Piña", "Mango", "Hierbas frescas", "Tubérculos"];
const DISLIKE_OPTIONS = ["Cilantro", "Remolacha", "Pimientos picantes", "Apio", "Papaya", "Plátano maduro"];

const DELIVERY_ZONES = [
  { id: "juandolio", name: "Juan Dolio · Villas del Mar", info: "Centro, Metro Country Club, Playa Hemingway" },
  { id: "sde", name: "Santo Domingo Este", info: "Costa Verde, Ens. Ozama, Ciudad Juan Bosch" },
  { id: "bocachica", name: "Boca Chica · Andrés", info: "Ruta express y corporativa" },
  { id: "sanpedro", name: "San Pedro de Macorís", info: "Colonial, Villa Olímpica, Ingenio Porvenir" },
] as const;

const DELIVERY_DAYS = [
  { id: "lun", label: "Lunes", detail: "Ruta Juan Dolio → Sto. Dgo." },
  { id: "mie", label: "Miércoles", detail: "Ruta Juan Dolio → Sto. Dgo." },
  { id: "vie", label: "Viernes", detail: "Ruta Juan Dolio → Sto. Dgo." },
  { id: "sab", label: "Sábado", detail: "Pedidos corporativos / eventos" },
] as const;

const resolveVariantFilter = (mix?: BuilderState["mix"]): VariantType => {
  if (mix === "frutas") return "fruity";
  if (mix === "vegetales") return "veggie";
  return "mix";
};

export function BuilderClient({ boxes, products }: { boxes: Box[]; products: Product[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { addItem } = useCart();
  const lastInitializedBoxId = useRef<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [customLike, setCustomLike] = useState("");
  const [customDislike, setCustomDislike] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [submissionWarnings, setSubmissionWarnings] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { state, updateState } = useBoxBuilder();

  const selectedBox = useMemo(() => boxes.find((b) => b.id === state.boxId), [boxes, state.boxId]);
  const rule = getBoxRule(state.boxId);
  const selectedProducts = useMemo(() => state.selectedProducts ?? {}, [state.selectedProducts]);
  const slotsUsed = computeSlots(selectedProducts);
  const weightUsed = computeWeight(selectedProducts);
  const costEstimate = computeCost(selectedProducts);
  const selectedItems = useMemo(
    () =>
      Object.entries(selectedProducts)
        .filter(([, quantity]) => quantity && quantity > 0)
        .map(([slug, quantity]) => ({
          slug,
          quantity: quantity as number,
          name: getProductMeta(slug)?.name ?? slug,
        })),
    [selectedProducts],
  );

  const galleryProducts = useMemo(() => {
    // Filtrar solo productos individuales (excluir cajas)
    const individualProducts = products.filter((product) => {
      const isBaby = product.slug.toLowerCase().includes("baby") || product.tags?.some((tag) => tag.toLowerCase() === "baby-only");
      return product.categoryId !== "cajas" && !product.id.startsWith("box-") && !isBaby;
    });
    const featured = individualProducts.filter((product) => product.isFeatured);
    const rest = individualProducts.filter((product) => !product.isFeatured);
    return [...featured, ...rest];
  }, [products]);
  const galleryVariant = resolveVariantFilter(state.mix);

  const priceInfo = useMemo(() => {
    if (!selectedBox) return null;
    const mixVariant: VariantType = state.mix === "frutas" ? "fruity" : state.mix === "vegetales" ? "veggie" : "mix";
    const result = computeBoxPrice(selectedBox.id, selectedBox.price.amount, selectedProducts, mixVariant);
    const extrasRounded = Math.round(result.extras * 100) / 100;
    const finalPrice = result.price + extrasRounded;
    return {
      ...result,
      extrasRounded,
      finalPrice,
      mixVariant,
    };
  }, [selectedBox, selectedProducts, state.mix]);

  useEffect(() => {
    if (!warning) return;
    const timeout = setTimeout(() => setWarning(null), 2500);
    return () => clearTimeout(timeout);
  }, [warning]);

  const handleSelectBox = (box: Box) => {
    const boxRule = getBoxRule(box.id);
    const baseSelection: Record<string, number> = {};
    boxRule?.baseContents.forEach((item: { productSlug: string; quantity: number }) => {
      baseSelection[item.productSlug] = item.quantity;
    });
    updateState({
      boxId: box.id,
      variant: "mix", // Por defecto Mix
      selectedProducts: baseSelection,
      highlightedProducts: Object.keys(baseSelection),
    });
    setActiveStep(1); // Ir al paso de descubrimiento
  };

  // Inicializar caja desde query parameter
  useEffect(() => {
    const boxIdFromQuery = searchParams.get("box");
    if (boxIdFromQuery && boxes.length > 0) {
      const box = boxes.find((b) => b.id === boxIdFromQuery);
      // Solo inicializar si la caja del query es diferente a la última inicializada
      if (box && box.id !== lastInitializedBoxId.current) {
        lastInitializedBoxId.current = box.id;
        const boxRule = getBoxRule(box.id);
        const baseSelection: Record<string, number> = {};
        if (boxRule?.baseContents) {
          boxRule.baseContents.forEach((item: { productSlug: string; quantity: number }) => {
            baseSelection[item.productSlug] = item.quantity;
          });
        }
        updateState({
          boxId: box.id,
          variant: "mix",
          selectedProducts: baseSelection,
          highlightedProducts: Object.keys(baseSelection),
        });
        const timer = setTimeout(() => setActiveStep(1), 0); // Ir directamente al paso de descubrimiento
        return () => clearTimeout(timer);
      }
    } else if (!boxIdFromQuery) {
      // Si no hay box en el query, resetear el ref para permitir nueva inicialización
      lastInitializedBoxId.current = null;
    }
  }, [searchParams, pathname, boxes, updateState]);

  const handleAcceptAsIs = () => {
    // Si acepta la caja tal cual, saltar directamente a gustos y preferencias
    // Asegurar que el mix esté seleccionado por defecto si no lo está
    if (!state.mix) {
      updateState({ mix: "mix" });
    }
    setActiveStep(3); // Paso de gustos
  };

  const handleCustomize = () => {
    // Ir al paso de personalización
    setActiveStep(2); // Paso de mix/personalización
  };

  const toggleListValue = (type: "likes" | "dislikes" | "extras" | "highlightedProducts", value: string) => {
    const list = state[type];
    if (list.includes(value)) {
      updateState({ [type]: list.filter((item) => item !== value) } as Partial<BuilderState>);
    } else {
      updateState({ [type]: [...list, value] } as Partial<BuilderState>);
    }
  };

  const handleToggleProduct = (product: Product) => {
    if (!rule || !selectedBox) return;
    const meta = getProductMeta(product.slug);
    const slotValue = meta?.slotValue ?? 1;
    const currentQty = selectedProducts[product.slug] ?? 0;
    const nextSelection = { ...selectedProducts } as Record<string, number>;

    if (currentQty > 0) {
      delete nextSelection[product.slug];
      updateState({ selectedProducts: nextSelection, highlightedProducts: Object.keys(nextSelection) });
      return;
    }

    if (rule.slotBudget && slotsUsed + slotValue > rule.slotBudget) {
      setWarning("Tu caja está llena. Quita otro producto para hacer espacio. 💚");
      return;
    }

    nextSelection[product.slug] = 1;
    updateState({ selectedProducts: nextSelection, highlightedProducts: Object.keys(nextSelection) });
  };

  const handleSwapProduct = (oldSlug: string, newSlug: string, quantity?: number) => {
    if (!rule || !selectedBox) return;
    
    const oldMeta = getProductMeta(oldSlug);
    const newMeta = getProductMeta(newSlug);
    const oldSlotValue = oldMeta?.slotValue ?? 1;
    const newSlotValue = newMeta?.slotValue ?? 1;
    const oldQuantity = selectedProducts[oldSlug] ?? 0;
    const targetQuantity = Math.max(1, Math.min(quantity ?? oldQuantity, oldQuantity || 1));

    // Calcular slots después del swap (solo la cantidad intercambiada)
    const currentSlotsWithoutSwapped = slotsUsed - (oldSlotValue * targetQuantity);
    const slotsAfterSwap = currentSlotsWithoutSwapped + (newSlotValue * targetQuantity);

    // Verificar que el nuevo producto quepa
    if (rule.slotBudget && slotsAfterSwap > rule.slotBudget) {
      setWarning(`El producto "${newMeta?.name ?? newSlug}" no cabe en tu caja. Necesitas ${slotsAfterSwap} espacios pero solo tienes ${rule.slotBudget}. 💚`);
      return;
    }

    // Realizar el swap
    const nextSelection = { ...selectedProducts } as Record<string, number>;
    const remainingOld = Math.max(0, oldQuantity - targetQuantity);
    if (remainingOld > 0) {
      nextSelection[oldSlug] = remainingOld;
    } else {
      delete nextSelection[oldSlug];
    }
    nextSelection[newSlug] = (nextSelection[newSlug] ?? 0) + targetQuantity;

    updateState({
      selectedProducts: nextSelection,
      highlightedProducts: Object.keys(nextSelection),
    });

    // Feedback positivo con timeout más largo
    const oldName = oldMeta?.name ?? oldSlug;
    const newName = newMeta?.name ?? newSlug;
    setWarning(`✅ Intercambiado exitosamente: ${oldName} → ${newName}`);
    
    // Limpiar el mensaje después de 4 segundos
    setTimeout(() => {
      setWarning(null);
    }, 4000);
  };

  const handleAddCustomValue = (type: "likes" | "dislikes", value: string, reset: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    toggleListValue(type, trimmed);
    reset();
  };

  const balanceIssues = useMemo(() => {
    if (!state.boxId || activeStep !== 2) return { hasCriticalIssues: false, issues: [] };
    return checkBalanceIssues(state.boxId, selectedProducts);
  }, [state.boxId, selectedProducts, activeStep]);

  const canContinue = () => {
    if (activeStep === 0) return Boolean(state.boxId);
    if (activeStep === 1) return true; // Paso de descubrimiento siempre permite continuar
    if (activeStep === 2) {
      // Bloquear si hay problemas críticos de balance
      if (balanceIssues.hasCriticalIssues) return false;
      return Boolean(state.mix);
    }
    if (activeStep === 4) {
      return (
        Boolean(state.deliveryZone) &&
        Boolean(state.deliveryDay) &&
        state.contactName.trim().length > 2 &&
        state.contactPhone.trim().length >= 7
      );
    }
    return true;
  };

  const getContinueButtonTooltip = () => {
    if (activeStep === 0) {
      if (!state.boxId) return "Por favor selecciona una caja para continuar";
    }
    if (activeStep === 2) {
      if (balanceIssues.hasCriticalIssues) {
        const issues = balanceIssues.issues.map((i) => i.message).join(". ");
        return `Tu caja necesita ajustes: ${issues}`;
      }
      if (!state.mix) return "Por favor selecciona un tipo de mix (Mix completo, Solo frutas, o Solo vegetales)";
    }
    if (activeStep === 4) {
      const missing: string[] = [];
      if (!state.deliveryZone) missing.push("zona de entrega");
      if (!state.deliveryDay) missing.push("día de entrega");
      if (state.contactName.trim().length <= 2) missing.push("nombre completo");
      if (state.contactPhone.trim().length < 7) missing.push("teléfono válido");
      if (missing.length > 0) {
        return `Por favor completa: ${missing.join(", ")}`;
      }
    }
    return null;
  };

  const handlePrimaryAction = () => {
    if (activeStep === STEPS.length - 1) {
      void handleSubmit();
      return;
    }
    setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  };

  const handleAddToCart = () => {
    if (!selectedBox || !priceInfo) {
      setSubmissionStatus("error");
      setSubmissionMessage("Selecciona una caja y personalízala para agregarla al carrito.");
      return;
    }

    const configuration: BoxConfiguration = {
      boxId: selectedBox.id,
      mix: state.mix,
      variant: priceInfo.mixVariant,
      selectedProducts,
      likes: state.likes,
      dislikes: state.dislikes,
      notes: state.notes,
      deliveryZone: state.deliveryZone,
      deliveryDay: state.deliveryDay,
      contactName: state.contactName,
      contactPhone: state.contactPhone,
      contactEmail: state.contactEmail || undefined,
      price: {
        base: selectedBox.price.amount,
        extras: priceInfo.extrasRounded,
        final: priceInfo.finalPrice,
        isACarta: priceInfo.isACarta,
      },
    };

    addItem({
      type: "box",
      slug: selectedBox.slug,
      name: selectedBox.name.es,
      quantity: 1,
      price: configuration.price.final,
      slotValue: slotsUsed,
      weightKg: weightUsed,
      image: selectedBox.heroImage,
      configuration,
    });

    toast.success("Caja agregada al carrito con tu personalización 💚");
  };

  const handleSubmit = async () => {
    if (!state.boxId) {
      setSubmissionStatus("error");
      setSubmissionMessage("¡Ups! Necesitas elegir una caja primero. 😊");
      return;
    }
    if (!state.contactName.trim() || state.contactName.trim().length < 3) {
      setSubmissionStatus("error");
      setSubmissionMessage("Por favor, cuéntanos tu nombre para poder contactarte.");
      return;
    }
    if (!state.contactPhone.trim() || state.contactPhone.trim().length < 7) {
      setSubmissionStatus("error");
      setSubmissionMessage("Necesitamos tu número de WhatsApp para confirmar tu pedido.");
      return;
    }
    if (!acceptedTerms) {
      setSubmissionStatus("error");
      setSubmissionMessage("Por favor, acepta los términos y condiciones para continuar.");
      return;
    }

    setSubmissionStatus("loading");
    setSubmissionMessage("Revisando tu caja perfecta...");
    setSubmissionWarnings([]);
    try {
      const result = await validateBuilderSelection({
        boxId: state.boxId,
        selectedProducts,
        mix: state.mix,
        likes: state.likes,
        dislikes: state.dislikes,
        notes: state.notes,
        deliveryZone: state.deliveryZone,
        deliveryDay: state.deliveryDay,
      });
      setSubmissionWarnings(result.issues.warnings ?? []);
      if (!result.valid) {
        setSubmissionStatus("error");
        setSubmissionMessage(result.issues.errors[0] ?? "Revisa tu selección, algo necesita ajustarse.");
        return;
      }

      setSubmissionMessage("¡Todo se ve perfecto! Enviando tu pedido...");

      const submission = await submitBuilderRequest({
        boxId: state.boxId,
        selectedProducts,
        mix: state.mix,
        likes: state.likes,
        dislikes: state.dislikes,
        notes: state.notes,
        deliveryZone: state.deliveryZone,
        deliveryDay: state.deliveryDay,
        contactName: state.contactName,
        contactPhone: state.contactPhone,
        contactEmail: state.contactEmail || undefined,
      });

      setSubmissionStatus("success");
      setSubmissionWarnings(submission.issues.warnings ?? []);
      const firstName = state.contactName.split(" ")[0];
      setSubmissionMessage(
        `¡Perfecto ${firstName}! 🎉 Tu pedido está registrado (#${submission.id}). Te contactaremos por WhatsApp en menos de 24 horas para confirmar la entrega y los productos frescos que incluiremos.`,
      );
    } catch (error) {
      let message = "Algo salió mal, pero no te preocupes. Intenta de nuevo o escríbenos por WhatsApp.";
      
      if (error instanceof Error) {
        // Mejorar mensajes de error específicos
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          message = "⚠️ Error de conexión. Por favor verifica tu conexión a internet e intenta nuevamente. Si el problema persiste, contáctanos por WhatsApp.";
        } else if (error.message.includes("API request failed")) {
          message = "⚠️ Error del servidor. Estamos trabajando para solucionarlo. Por favor intenta en unos minutos o contáctanos directamente por WhatsApp.";
        } else {
          message = error.message;
        }
      }
      
      setSubmissionStatus("error");
      setSubmissionMessage(message);
      setSubmissionWarnings([]);
    }
  };

  return (
    <main className="bg-[var(--color-background)] min-h-screen">
      <Container className="space-y-10 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">Green Dolio</p>
            <h1 className="font-display text-4xl text-[var(--color-foreground)]">🎨 Arma tu caja a tu gusto</h1>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              Elige tu caja favorita y luego... <strong className="text-[var(--color-brand)]">¡personalízala como quieras!</strong> 
              Cada caja viene pre-armada con productos frescos seleccionados especialmente para ti el mismo día. 
              Puedes cambiar o intercambiar productos siempre manteniendo el balance perfecto. <span className="text-lg">🌱</span>
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            Volver al inicio
          </Link>
        </div>

        <StepperHeader steps={STEPS as unknown as Array<{ id: string; label: string }>} activeStep={activeStep} onStepSelect={(step) => setActiveStep(step)} />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6 rounded-[32px] border border-[var(--color-border)] bg-white/95 p-6 shadow-soft">
            {activeStep === 0 && (
              <div className="space-y-8">
                <header className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">Paso 1</p>
                  <h2 className="font-display text-2xl text-[var(--color-foreground)]">Selecciona tu caja base</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Elige la caja que mejor se adapte a ti. <strong className="text-[var(--color-brand)]">Cada caja incluye productos frescos elegidos el mismo día</strong> y siempre encontrarás una sorpresa especialmente elegida para ti.
                  </p>
                </header>
                <div className="grid gap-4 md:grid-cols-3">
                  {boxes.map((box, index) => {
                    const isActive = box.id === state.boxId;
                    
                    // Mapeo de imágenes de producto para cada caja (default - imágenes de costado)
                    // Usar slugs completos y también IDs cortos para mayor compatibilidad
                    const productImages: Record<string, string> = {
                      // IDs cortos
                      "box-1": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
                      "box-2": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
                      "box-3": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
                      // Slugs completos
                      "box-1-caribbean-fresh-pack-3-dias": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
                      "box-2-island-weekssential-1-semana": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
                      "box-3-allgreenxclusive-2-semanas": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
                      // Slugs parciales
                      "caribbean-fresh-pack": "/images/boxes/box-1-caribbean-fresh-pack-veggie-product.png",
                      "island-weekssential": "/images/boxes/box-2-island-weekssential-veggie-product.jpg",
                      "allgreenxclusive": "/images/boxes/box-3-allgreenxclusive-2-semanas.jpg",
                    };
                    
                    // Mapeo de imágenes hover (para Box 1, Box 2 y Box 3)
                    const hoverImages: Record<string, string> = {
                      // IDs cortos
                      "box-1": "/images/boxes/box-1-caribbean-fresh-pack-veggie-topdown.png",
                      "box-2": "/images/boxes/box-2-island-weekssential-veggie-topdown.png",
                      "box-3": "/images/boxes/box-3-allgreenxclusive-veggie-topdown.png",
                      // Slugs completos
                      "box-1-caribbean-fresh-pack-3-dias": "/images/boxes/box-1-caribbean-fresh-pack-veggie-topdown.png",
                      "box-2-island-weekssential-1-semana": "/images/boxes/box-2-island-weekssential-veggie-topdown.png",
                      "box-3-allgreenxclusive-2-semanas": "/images/boxes/box-3-allgreenxclusive-veggie-topdown.png",
                      // Slugs parciales
                      "caribbean-fresh-pack": "/images/boxes/box-1-caribbean-fresh-pack-veggie-topdown.png",
                      "island-weekssential": "/images/boxes/box-2-island-weekssential-veggie-topdown.png",
                      "allgreenxclusive": "/images/boxes/box-3-allgreenxclusive-veggie-topdown.png",
                    };
                    
                    // Usar imagen de producto del mapeo primero, luego heroImage, luego placeholder
                    const boxImage = productImages[box.id] || 
                                    productImages[box.slug] || 
                                    box.heroImage || 
                                    "/images/boxes/placeholder.jpg";
                    
                    // Imagen hover
                    const boxHoverImage = hoverImages[box.id] || hoverImages[box.slug] || null;
                    const hasHoverImage = boxHoverImage !== null;
                    
                    // Escalas y padding según el tamaño de la caja (Box 1 pequeña, Box 2 mediana, Box 3 grande)
                    const boxSizeConfig: Record<string, { scale: string; padding: string }> = {
                      "box-1": { scale: "0.75", padding: "p-8" }, // Más pequeña - 75% del tamaño
                      "box-2": { scale: "0.90", padding: "p-6" }, // Mediana - 90% del tamaño
                      "box-3": { scale: "1.0", padding: "p-4" },  // Grande - 100% del tamaño
                    };
                    
                    const boxNumber = box.id.replace("box-", "") || String(index + 1);
                    const config = boxSizeConfig[box.id] || boxSizeConfig[`box-${boxNumber}`] || { scale: "0.85", padding: "p-6" };
                    
                    return (
                      <button
                        key={box.id}
                        type="button"
                        onClick={() => handleSelectBox(box)}
                        className={`group relative rounded-3xl border-2 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                          isActive
                            ? "border-[var(--color-brand)] bg-[color:rgba(125,184,53,0.08)]"
                            : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]"
                        }`}
                      >
                        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-[var(--color-background-muted)]">
                          {/* Imagen default */}
                          <div 
                            className={`absolute inset-0 transition-opacity duration-500 ${hasHoverImage ? "group-hover:opacity-0" : "group-hover:scale-[1.02]"} ${config.padding}`}
                            style={{ transform: `scale(${config.scale})` }}
                          >
                            <Image
                              src={boxImage}
                              alt={box.name.es}
                              fill
                              sizes="(max-width: 768px) 100vw, 300px"
                              className="object-contain object-center"
                            />
                          </div>
                          {/* Imagen hover */}
                          {hasHoverImage && (
                            <div 
                              className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${config.padding}`}
                              style={{ transform: `scale(${config.scale})` }}
                            >
                              <Image
                                src={boxHoverImage}
                                alt={`${box.name.es} - Vista cenital`}
                                fill
                                sizes="(max-width: 768px) 100vw, 300px"
                                className="object-contain object-center"
                              />
                            </div>
                          )}
                        </div>
                        <p className="mt-4 text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{box.slug}</p>
                        <p className="font-display text-xl text-[var(--color-foreground)]">{box.name.es}</p>
                        <p className="text-sm text-[var(--color-muted)]">
                          {box.durationDays ? `${box.durationDays} días` : "Flexible"} · RD$
                          {box.price.amount.toLocaleString("es-DO")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {activeStep === 1 && selectedBox && (
              <DiscoverBoxView
                box={selectedBox}
                variant={state.variant || "mix"}
                onAccept={handleAcceptAsIs}
                onCustomize={handleCustomize}
              />
            )}
            {activeStep === 2 && (
              <div className="space-y-8">
                <header className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">Paso 3</p>
                    <h2 className="font-display text-2xl text-[var(--color-foreground)]">Revisa tu caja pre-armada</h2>
                    <p className="text-sm text-[var(--color-muted)] mt-2">
                      Tu caja ya viene con productos seleccionados. Puedes intercambiar productos o agregar extras según tus preferencias.
                    </p>
                  </div>
                  
                  {/* Explicación visual mejorada - Estilo casero y divertido */}
                  <div className="rounded-2xl border-2 border-[var(--gd-color-leaf)]/30 bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📦</span>
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-semibold text-[var(--gd-color-forest)]">
                          Tu caja viene pre-armada con productos frescos seleccionados el mismo día
                        </p>
                        <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                          ¿Quieres cambiar algo? <strong className="text-[var(--gd-color-forest)]">¡Perfecto!</strong> Puedes intercambiar productos del contenido base por otros que te gusten más. 
                            Solo mantenemos el balance para que tu caja sea equilibrada. Pero de todas maneras, excedido el peso o cantidad de cada caja, no te preocupes! puedes pedir lo que quieras y transformar tu pedido a la <strong>&quot;carta&quot;</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-[var(--gd-color-leaf)]/20">
                      <span className="text-xl">💡</span>
                      <div className="text-xs text-[var(--color-muted)]">
                        <strong className="text-[var(--gd-color-forest)]">¿Cómo funciona?</strong> Cada producto ocupa un espacio en tu caja. 
                        El gráfico de balance te muestra si estás dentro del rango recomendado para una caja equilibrada y deliciosa. <span className="text-sm">🌱</span>
                      </div>
                    </div>
                  </div>
                </header>
                
                {/* Mostrar contenido base de la caja */}
                {selectedBox && (
                  <BaseContentsDisplay
                    box={selectedBox}
                    selectedProducts={selectedProducts}
                    availableProducts={products}
                    slotBudget={rule?.slotBudget}
                    onSwapProduct={handleSwapProduct}
                  />
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { id: "mix", label: "Mix completo", description: "Frutas y vegetales para toda la semana" },
                    { id: "frutas", label: "Solo frutas", description: "Perfecto para jugos, snacks y postres" },
                    { id: "vegetales", label: "Solo vegetales", description: "Ideal para salsas, bowls y meal prep" },
                  ].map((option) => {
                    const isActive = state.mix === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => updateState({ mix: option.id as BuilderState["mix"] })}
                        className={`rounded-3xl border-2 p-4 text-left transition ${
                          isActive
                            ? "border-[var(--color-brand)] bg-[color:rgba(125,184,53,0.08)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                        }`}
                      >
                        <p className="font-semibold text-[var(--color-foreground)]">{option.label}</p>
                        <p className="text-sm text-[var(--color-muted)]">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛒</span>
                    <h3 className="font-display text-lg font-bold text-[var(--gd-color-forest)]">
                      Galería de Productos Disponibles
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Haz clic en un producto para agregarlo o quitarlo. Recuerda: las cajas pre-armadas son combos convenientes con mejor precio.
                  </p>
                  <ProductGallery
                    products={galleryProducts}
                    selection={selectedProducts}
                    onToggle={handleToggleProduct}
                    variantFilter={galleryVariant}
                  />
                </div>
                {warning && (
                  <div
                    className={`rounded-xl border-2 p-4 ${
                      warning.startsWith("✅")
                        ? "bg-green-50 border-green-300 text-green-800"
                        : "bg-red-50 border-red-300 text-red-800"
                    }`}
                  >
                    <p className="text-sm font-semibold">{warning}</p>
                  </div>
                )}
                {/* Advertencia de problemas críticos de balance */}
                {balanceIssues.hasCriticalIssues && (
                  <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <p className="font-semibold text-red-800 text-sm">Problemas de balance detectados</p>
                    </div>
                    <p className="text-xs text-red-700 mb-2">
                      Tu caja necesita ajustes antes de continuar. Por favor, corrige los siguientes problemas:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {balanceIssues.issues.map((issue, idx) => (
                        <li key={idx} className="text-xs text-red-700">
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-600 font-semibold mt-2">
                      💡 Sugerencia: Usa el botón &quot;Intercambiar&quot; en los productos base o agrega productos de las categorías faltantes.
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeStep === 3 && (
              <div className="space-y-8">
              <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">Paso 4</p>
                <h2 className="font-display text-2xl text-[var(--color-foreground)]">Personaliza gustos</h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Cuéntanos qué productos amas y cuáles prefieres evitar. <strong className="text-[var(--color-brand)]">Elegiremos cada producto personalmente con amor, exactamente como lo harías tú cuando vas a comprar.</strong>
                </p>
              </header>
              {/* Campos de preferencias en el paso de personalización */}
              <div className="mt-2 space-y-4">
                <ChipSection
                  title="Siempre quiero"
                  options={LIKE_OPTIONS}
                  selected={state.likes}
                  onToggle={(value) => toggleListValue("likes", value)}
                  inputValue={customLike}
                  onInputChange={setCustomLike}
                  onAdd={() => handleAddCustomValue("likes", customLike, () => setCustomLike(""))}
                />
                <ChipSection
                  title="Prefiero evitar"
                  options={DISLIKE_OPTIONS}
                  selected={state.dislikes}
                  onToggle={(value) => toggleListValue("dislikes", value)}
                  inputValue={customDislike}
                  onInputChange={setCustomDislike}
                  onAdd={() => handleAddCustomValue("dislikes", customDislike, () => setCustomDislike(""))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                  Notas especiales (opcional)
                  <p className="text-xs font-normal normal-case text-[var(--color-muted)] mt-1">
                    Cualquier instrucción especial que nos ayude a armar tu caja perfecta
                  </p>
                </label>
                <textarea
                  value={state.notes}
                  onChange={(event) => updateState({ notes: event.target.value })}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-muted)] p-4 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand)] focus:outline-none"
                  placeholder="Ej: Prefiero frutas maduras; evitar productos con semillas duras..."
                />
              </div>
            </div>
            )}
            {activeStep === 4 && (
              <div className="space-y-8">
                <header className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">Paso 5</p>
                  <h2 className="font-display text-2xl text-[var(--color-foreground)]">Confirma logística</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Elige tu zona y el día de entrega. <strong className="text-[var(--color-brand)]">Pedidos confirmados hasta las 12:00 p.m. se entregan el mismo día.</strong> Delivery gratuito lunes, miércoles y viernes.
                  </p>
                </header>
                <div className="grid gap-3">
                  {DELIVERY_ZONES.map((zone) => {
                    const isActive = state.deliveryZone === zone.id;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => updateState({ deliveryZone: zone.id })}
                        className={`rounded-3xl border-2 p-4 text-left transition ${
                          isActive
                            ? "border-[var(--color-brand)] bg-[color:rgba(125,184,53,0.08)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                        }`}
                      >
                        <p className="font-semibold text-[var(--color-foreground)]">{zone.name}</p>
                        <p className="text-sm text-[var(--color-muted)]">{zone.info}</p>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)] mb-3">Horario</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {DELIVERY_DAYS.map((day) => {
                      const isActive = state.deliveryDay === day.id;
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => updateState({ deliveryDay: day.id })}
                          className={`rounded-2xl border-2 p-4 text-left transition ${
                            isActive
                              ? "border-[var(--color-brand)] bg-[color:rgba(125,184,53,0.08)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                          }`}
                        >
                          <p className="font-semibold text-[var(--color-foreground)]">{day.label}</p>
                          <p className="text-xs text-[var(--color-muted)]">{day.detail}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                    ¿Cómo te llamas? <span className="text-red-500">*</span>
                    <input
                      type="text"
                      value={state.contactName}
                      onChange={(event) => updateState({ contactName: event.target.value })}
                      placeholder="Nombre completo"
                      required
                      minLength={2}
                      className={`mt-2 w-full rounded-2xl border px-4 py-2 text-sm text-[var(--color-foreground)] focus:outline-none transition ${
                        state.contactName.length > 0 && state.contactName.length < 2
                          ? "border-red-400 bg-red-50"
                          : "border-[var(--color-border)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      {state.contactName.length > 0 && state.contactName.length < 2
                        ? "⚠️ Mínimo 2 caracteres"
                        : "Para personalizar tu experiencia"}
                    </p>
                  </label>
                  <label className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                    WhatsApp <span className="text-red-500">*</span>
                    <input
                      type="tel"
                      value={state.contactPhone}
                      onChange={(event) => {
                        // Solo permitir números, espacios, + y -
                        const value = event.target.value.replace(/[^\d\s\+\-]/g, "");
                        updateState({ contactPhone: value });
                      }}
                      placeholder="+1 809 000 0000"
                      required
                      minLength={7}
                      className={`mt-2 w-full rounded-2xl border px-4 py-2 text-sm text-[var(--color-foreground)] focus:outline-none transition ${
                        state.contactPhone.length > 0 && state.contactPhone.length < 7
                          ? "border-red-400 bg-red-50"
                          : "border-[var(--color-border)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      {state.contactPhone.length > 0 && state.contactPhone.length < 7
                        ? "⚠️ Mínimo 7 dígitos"
                        : "Te contactaremos aquí para confirmar"}
                    </p>
                  </label>
                  <label className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">
                    Email (opcional)
                    <input
                      type="email"
                      value={state.contactEmail}
                      onChange={(event) => updateState({ contactEmail: event.target.value })}
                      placeholder="tucorreo@dominio.com"
                      className="mt-2 w-full rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-brand)] focus:outline-none transition"
                    />
                    <p className="text-xs text-[var(--color-muted)] mt-1 font-medium">
                      📧 Para recibir confirmaciones de tu pedido y actualizaciones de entrega
                    </p>
                  </label>
                </div>

                {/* Resumen antes de confirmar */}
                <div className="mt-8 pt-8 border-t-2 border-[var(--gd-color-leaf)]/30">
                  <header className="space-y-2 mb-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-brand)]">Resumen del pedido</p>
                    <h3 className="font-display text-xl text-[var(--color-foreground)]">Revisa tu pedido antes de confirmar</h3>
                  </header>
                  
                  <div className="space-y-4 rounded-2xl border-2 border-[var(--gd-color-leaf)]/30 bg-gradient-to-br from-[var(--gd-color-sprout)]/20 to-white p-6">
                    {/* Caja seleccionada */}
                    {selectedBox && (
                      <div className="pb-4 border-b border-[var(--gd-color-leaf)]/20">
                        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)] mb-2">Caja seleccionada</p>
                        <p className="font-display text-lg text-[var(--gd-color-forest)]">{selectedBox.name.es}</p>
                        <p className="text-sm text-[var(--color-muted)] mt-1">
                          {selectedItems.length} productos · {weightUsed.toFixed(1)} kg
                        </p>
                      </div>
                    )}

                    {/* Preferencias */}
                    {(state.likes.length > 0 || state.dislikes.length > 0 || state.notes) && (
                      <div className="pb-4 border-b border-[var(--gd-color-leaf)]/20">
                        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)] mb-2">Preferencias</p>
                        {state.likes.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-[var(--gd-color-forest)] mb-1">Siempre quiero:</p>
                            <div className="flex flex-wrap gap-1">
                              {state.likes.map((like) => (
                                <span key={like} className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                  {like}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {state.dislikes.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-[var(--gd-color-forest)] mb-1">Prefiero evitar:</p>
                            <div className="flex flex-wrap gap-1">
                              {state.dislikes.map((dislike) => (
                                <span key={dislike} className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                  {dislike}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {state.notes && (
                          <div>
                            <p className="text-xs font-semibold text-[var(--gd-color-forest)] mb-1">Notas especiales:</p>
                            <p className="text-xs text-[var(--color-muted)] italic">{state.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Entrega */}
                    <div className="pb-4 border-b border-[var(--gd-color-leaf)]/20">
                      <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)] mb-2">Entrega</p>
                      {state.deliveryZone && (
                        <p className="text-sm text-[var(--color-foreground)]">
                          📍 {DELIVERY_ZONES.find((z) => z.id === state.deliveryZone)?.name || state.deliveryZone}
                        </p>
                      )}
                      {state.deliveryDay && (
                        <p className="text-sm text-[var(--color-foreground)]">
                          📅 {DELIVERY_DAYS.find((d) => d.id === state.deliveryDay)?.label || state.deliveryDay}
                        </p>
                      )}
                      {(!state.deliveryZone || !state.deliveryDay) && (
                        <p className="text-xs text-[var(--color-muted)] italic">Selecciona zona y día de entrega</p>
                      )}
                    </div>

                    {/* Contacto */}
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)] mb-2">Contacto</p>
                      {state.contactName && (
                        <p className="text-sm text-[var(--color-foreground)]">👤 {state.contactName}</p>
                      )}
                      {state.contactPhone && (
                        <p className="text-sm text-[var(--color-foreground)]">📱 {state.contactPhone}</p>
                      )}
                      {state.contactEmail && (
                        <p className="text-sm text-[var(--color-foreground)]">✉️ {state.contactEmail}</p>
                      )}
                      {(!state.contactName || !state.contactPhone) && (
                        <p className="text-xs text-[var(--color-muted)] italic">Completa los datos de contacto</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checkbox de términos y condiciones */}
                {activeStep === 4 && (
                  <div className="mt-6 pt-6 border-t-2 border-[var(--gd-color-leaf)]/30">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-2 border-[var(--color-border)] text-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-[var(--color-foreground)] font-medium">
                          Acepto los términos y condiciones <span className="text-red-500">*</span>
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-1">
                          Al confirmar, aceptas nuestros términos de servicio y política de privacidad. 
                          Nos comprometemos a entregar productos frescos y de calidad.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3 border-t border-[var(--color-border)] pt-6">
              {submissionMessage && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    submissionStatus === "success"
                      ? "bg-green-50 text-green-700"
                      : submissionStatus === "error"
                        ? "bg-red-50 text-red-600"
                        : "bg-[var(--color-background-muted)] text-[var(--color-muted)]"
                  }`}
                >
                  {submissionMessage}
                  {submissionWarnings.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--color-muted)]">
                      {submissionWarnings.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {/* Mostrar botones de navegación solo si no estamos en el paso de descubrimiento */}
              {activeStep !== 1 && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                    disabled={activeStep === 0}
                    className="rounded-full border border-[var(--color-border)] px-6 py-2 text-sm font-semibold text-[var(--color-muted)] disabled:opacity-50"
                  >
                    Paso anterior
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!selectedBox || !priceInfo}
                      className="rounded-full border border-[var(--color-brand)] px-6 py-2 text-sm font-semibold text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!selectedBox ? "Selecciona una caja" : undefined}
                    >
                      Agregar al carrito
                    </button>
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={handlePrimaryAction}
                        disabled={!canContinue() || submissionStatus === "loading" || (activeStep === STEPS.length - 1 && !acceptedTerms)}
                        className="rounded-full bg-[var(--color-brand)] px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-[var(--color-brand-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canContinue() ? getContinueButtonTooltip() || undefined : (activeStep === STEPS.length - 1 && !acceptedTerms) ? "Debes aceptar los términos y condiciones" : undefined}
                      >
                        {activeStep === STEPS.length - 1
                          ? submissionStatus === "loading"
                            ? "Revisando tu caja..."
                            : submissionStatus === "success"
                              ? "¡Pedido enviado!"
                              : "Confirmar pedido"
                          : "Continuar"}
                      </button>
                      {!canContinue() && getContinueButtonTooltip() && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-[var(--gd-color-leaf)]/30 bg-white p-3 shadow-xl text-xs text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          <p className="font-semibold text-[var(--gd-color-forest)] mb-1">⚠️ No puedes continuar</p>
                          <p>{getContinueButtonTooltip()}</p>
                          <div className="absolute bottom-0 right-4 transform translate-y-full">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--gd-color-leaf)]/30" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <SummaryCard
            selectedBox={selectedBox}
            mix={state.mix}
            extras={state.extras}
            likes={state.likes}
            dislikes={state.dislikes}
            notes={state.notes}
            highlightedProducts={state.highlightedProducts}
            selectedItems={selectedItems}
            slotsUsed={slotsUsed}
            slotBudget={rule?.slotBudget}
            weightUsed={weightUsed}
            costEstimate={costEstimate}
            deliveryZone={state.deliveryZone}
            deliveryDay={state.deliveryDay}
            selectedProducts={selectedProducts}
          />
        </div>
      </Container>
    </main>
  );
}

// BuilderState ya está importado directamente desde el módulo

type ChipSectionProps = {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
};

function ChipSection({ title, options, selected, onToggle, inputValue, onInputChange, onAdd }: ChipSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-muted)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const isActive = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                isActive
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Escribe un producto personalizado..."
          className="flex-1 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm focus:border-[var(--color-brand)] focus:outline-none transition"
        />
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-[var(--color-brand-accent)]"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
