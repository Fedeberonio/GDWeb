"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  Leaf,
  Package,
  ShoppingCart,
  Truck,
  Printer,
  Trash2,
  Plus,
  Search,
  ListChecks,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getFirestoreDb } from "@/lib/firebase/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { adminFetch } from "@/modules/admin/api/client";
import { useAuth } from "@/modules/auth/context";
import type { Order, OrderItem, OrderStatus } from "@/modules/orders/types";
import { buildOrderConfirmationMessage, type ProductLabelMap } from "@/modules/orders/whatsapp-message";
import type { OrderActivity, CustomerInfo } from "@/modules/admin/orders/types";
import type { Product } from "@/modules/catalog/types";
import { OrderDetailsModal, ConfirmationData } from "./_components/order-confirmation-modal";
import { ShoppingChecklist } from "./shopping-checklist";

const DELIVERY_WINDOWS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
  "Horario flexible",
];

const DELIVERY_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function getLocalizedText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return fallback;

  const record = value as Record<string, unknown>;
  if (typeof record.es === "string") return record.es;
  if (typeof record.en === "string") return record.en;

  if (record.es && typeof record.es === "object") {
    const nested = getLocalizedText(record.es, "");
    if (nested) return nested;
  }
  if (record.en && typeof record.en === "object") {
    const nested = getLocalizedText(record.en, "");
    if (nested) return nested;
  }

  return fallback;
}

function formatDateLabel(value?: string | Date) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildOrderItemImageCandidates(productId: string, itemType?: string) {
  const normalizedId = productId.trim();
  const fallback = ["/assets/images/products/placeholder.png"];
  if (!normalizedId) return fallback;

  const productCandidates = [
    `/assets/images/products/${normalizedId}.png`,
    `/assets/images/products/${normalizedId}.jpg`,
    `/assets/images/products/${normalizedId}.jpeg`,
  ];

  if (itemType === "box") {
    return [
      `/assets/images/boxes/${normalizedId}.png`,
      `/assets/images/boxes/${normalizedId}.jpg`,
      `/assets/images/boxes/${normalizedId}.jpeg`,
      ...productCandidates,
      ...fallback,
    ];
  }

  return [
    ...productCandidates,
    `/assets/images/salads/${normalizedId}.png`,
    `/assets/images/salads/${normalizedId}.jpg`,
    `/assets/images/salads/${normalizedId}.jpeg`,
    ...fallback,
  ];
}

function OrderItemThumbnail({
  productId,
  itemType,
  alt,
}: {
  productId: string;
  itemType?: string;
  alt: string;
}) {
  const candidates = useMemo(
    () => buildOrderItemImageCandidates(productId, itemType),
    [productId, itemType],
  );
  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    setSrcIndex(0);
  }, [productId, itemType]);

  const safeIndex = Math.min(srcIndex, Math.max(0, candidates.length - 1));
  return (
    <img
      src={candidates[safeIndex]}
      alt={alt}
      className="h-12 w-12 rounded-lg border border-slate-200 object-cover bg-white shadow-sm"
      onError={() => {
        setSrcIndex((prev) => (prev + 1 < candidates.length ? prev + 1 : prev));
      }}
    />
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [activities, setActivities] = useState<OrderActivity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [hasShoppingList, setHasShoppingList] = useState(false);
  const [checklistProgress, setChecklistProgress] = useState({
    isComplete: false,
    checkedCount: 0,
    totalCount: 0,
  });

  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (authLoading) return;
    try {
      setLoading(true);

      const orderRes = await adminFetch(`/api/admin/orders/${orderId}`);
      if (!orderRes.ok) throw new Error("Error loading order");

      const orderJson = await orderRes.json();
      const orderData = orderJson.data as Order;

      setOrder(orderData);
      setEditedOrder(JSON.parse(JSON.stringify(orderData)));

      const results = await Promise.allSettled([
        adminFetch(`/api/admin/orders/${orderId}/activities`),
        adminFetch(`/api/admin/orders/${orderId}/customer`),
        adminFetch(`/api/admin/catalog/products`),
      ]);

      if (results[0].status === "fulfilled" && results[0].value.ok) {
        const json = await results[0].value.json();
        setActivities(json.data || []);
      }

      if (results[1].status === "fulfilled" && results[1].value.ok) {
        const json = await results[1].value.json();
        setCustomer(json.data || null);
      }

      if (results[2].status === "fulfilled" && results[2].value.ok) {
        const json = await results[2].value.json();
        setProducts(json.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos del pedido");
    } finally {
      setLoading(false);
    }
  }, [orderId, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [loadData, authLoading]);

  useEffect(() => {
    if (showProductSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showProductSearch]);

  useEffect(() => {
    const currentOrderId = order?.id;
    if (!currentOrderId) {
      setHasShoppingList(false);
      return;
    }
    const orderIdForCheck: string = currentOrderId;

    async function checkShoppingList() {
      try {
        const db = getFirestoreDb();
        const docRef = doc(db, "orders", orderIdForCheck, "market_costs", "summary");
        const snapshot = await getDoc(docRef);
        setHasShoppingList(snapshot.exists());
      } catch (err) {
        console.error("Error checking shopping list:", err);
      }
    }

    checkShoppingList();
  }, [order?.id]);

  const hasUnsavedChanges = useMemo(() => {
    if (!order || !editedOrder) return false;
    return JSON.stringify(order) !== JSON.stringify(editedOrder);
  }, [order, editedOrder]);

  const calculations = useMemo(() => {
    if (!editedOrder) return { subtotal: 0, deliveryFee: 0, paymentFee: 0, discount: 0, returnDiscount: 0, tip: 0, total: 0 };
    
    const subtotal = editedOrder.items.reduce(
      (acc, item) => acc + item.unitPrice.amount * item.quantity,
      0,
    );
    
    const diasConCargo = ["Martes", "Jueves", "Sábado"];
    const deliveryDay = editedOrder.delivery?.window?.day || "";
    const deliveryFee = diasConCargo.includes(deliveryDay) ? 100 : 0;
    
    const methodLower = (editedOrder.paymentMethod || "").toLowerCase();
    const requierePaypal = 
      methodLower === "online" ||
      methodLower === "card";
    const subtotalConEnvio = subtotal + deliveryFee;
    const paymentFee = requierePaypal ? Math.round(subtotalConEnvio * 0.1) : 0;
    
    const discount = editedOrder.totals?.discounts?.amount || 0;
    const returnDiscount = editedOrder.returnsPackaging?.returned ? (editedOrder.returnsPackaging.discountAmount || 0) : 0;
    const tip = editedOrder.totals?.tip?.amount || editedOrder.tip?.amount || 0;

    return {
      subtotal,
      deliveryFee,
      paymentFee,
      discount,
      returnDiscount,
      tip,
      total: subtotal + deliveryFee + paymentFee - discount + tip,
    };
  }, [editedOrder]);

  const stockWarningItems = useMemo(() => {
    const items = editedOrder?.stockValidation?.items;
    if (!Array.isArray(items)) return [];
    return items.filter((item) => typeof item?.requested === "number" && typeof item?.available === "number");
  }, [editedOrder?.stockValidation?.items]);

  const hasStockWarning = Boolean(editedOrder?.stockValidation?.hasInsufficientStock && stockWarningItems.length > 0);

  const productLabelMap = useMemo<ProductLabelMap>(() => {
    const map: ProductLabelMap = new Map();
    products.forEach((product) => {
      if (product.id) map.set(product.id, product.name);
      if ((product as any).slug) map.set((product as any).slug, product.name);
    });
    return map;
  }, [products]);

  const resolveItemProductId = useCallback((item: OrderItem) => {
    const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata : {};
    const candidates = [
      (item as any).productId,
      metadata.productId,
      item.referenceId,
      item.id,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
    return item.id;
  }, []);

  const handleAddItem = (product: Product) => {
    if (!editedOrder) return;
    const productType: OrderItem["type"] = (product as any).type === "box" ? "box" : "product";
    const variant = (product as any).variant ?? (product as any).configuration?.variant ?? null;
    const productId = product.id;

    const existingIdx = editedOrder.items.findIndex((item) => {
      const itemProductId = (item as any).productId ?? item.metadata?.productId ?? item.referenceId;
      const itemVariant = (item as any).variant ?? item.metadata?.variant ?? null;
      if (item.type !== productType) return false;
      return itemProductId === productId && itemVariant === variant;
    });

    if (existingIdx >= 0) {
      const nextItems = [...editedOrder.items];
      nextItems[existingIdx] = { ...nextItems[existingIdx], quantity: nextItems[existingIdx].quantity + 1 };
      setEditedOrder({ ...editedOrder, items: nextItems });
      setProductSearchQuery("");
      toast.success("Producto agregado");
      return;
    }

    const nameEs = typeof product.name === "string" ? product.name : product.name.es;
    const nameEn = typeof product.name === "string" ? product.name : product.name.en || product.name.es;
    const uniqueRef =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newItem: OrderItem = {
      id: uniqueRef,
      referenceId: uniqueRef,
      name: { es: nameEs, en: nameEn },
      quantity: 1,
      unitPrice: { amount: product.price, currency: "DOP" },
      type: productType,
      metadata: {
        productId,
        variant,
        unit: typeof product.unit === "string" ? product.unit : product.unit?.es,
      },
    };

    setEditedOrder({ ...editedOrder, items: [...editedOrder.items, newItem] });
    setProductSearchQuery("");
    toast.success("Producto agregado");
  };

  const handleRemoveItem = (index: number) => {
    if (!editedOrder) return;
    if (!window.confirm("¿Eliminar este item?")) return;
    const newItems = [...editedOrder.items];
    newItems.splice(index, 1);
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const handleQuantityChange = (index: number, val: number) => {
    if (!editedOrder) return;
    const newItems = [...editedOrder.items];
    newItems[index].quantity = Math.max(0, val);
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const handleSaveChanges = async () => {
    if (!editedOrder) return;
    setIsSaving(true);
    const loadingToast = toast.loading("Guardando...");

    try {
      const payload = {
        items: editedOrder.items,
        delivery: editedOrder.delivery,
        paymentMethod: editedOrder.paymentMethod,
        paymentStatus: editedOrder.paymentStatus,
        status: editedOrder.status,
      };

      const response = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Error al guardar");
      }

      await loadData();
      toast.success("Cambios guardados", { id: loadingToast });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      toast.error(message, { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    const loadingToast = toast.loading("Actualizando estado...");
    try {
      await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadData();
      toast.success(`Estado: ${newStatus}`, { id: loadingToast });
    } catch {
      toast.error("Error actualizando estado", { id: loadingToast });
    }
  };

  const executeFinalize = async (data: ConfirmationData) => {
    if (!editedOrder) return;
    setIsFinalizing(true);
    try {
      await adminFetch(`/api/admin/orders/${orderId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editedOrder.items,
          delivery: data.delivery,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          language: data.language,
        }),
      });
      setShowConfirmModal(false);
      await loadData();
      toast.success("¡Pedido Finalizado y Stock descontado!");

      const phone = data.customerPhone.replace(/\D/g, "");
      const msg = buildOrderConfirmationMessage({
        order: editedOrder,
        language: data.language,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        delivery: data.delivery,
        timeWindow: data.timeWindow,
        totals: calculations,
        productLabelMap,
      });
      const whatsappUrl = `https://wa.me/1${phone}?text=${encodeURIComponent(msg)}`;
      if (whatsappUrl.length > 4000) {
        toast.error("El mensaje es muy largo. Abriremos WhatsApp sin mensaje prellenado.");
        window.open(`https://wa.me/1${phone}`, "_blank");
      } else {
        window.open(whatsappUrl, "_blank");
      }
    } catch {
      toast.error("Error al finalizar");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleGenerateShoppingList = useCallback(async () => {
    if (!order?.id) return;

    try {
      const db = getFirestoreDb();
      const docRef = doc(db, "orders", order.id, "market_costs", "summary");

      await setDoc(docRef, {
        items: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setHasShoppingList(true);
      toast.success("Lista de compras generada");
      router.push(`/admin/orders/${order.id}/shopping`);
    } catch (err) {
      console.error("Error generating shopping list:", err);
      toast.error("Error al generar lista");
    }
  }, [order?.id, router]);

  if (authLoading || loading || !editedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center text-emerald-600 font-medium">
        Loading...
      </div>
    );
  }

  const isPaid = editedOrder.paymentStatus === "paid";
  const requiresPreparationChecklist = checklistProgress.totalCount > 0;
  const canFinalizeOrder = !requiresPreparationChecklist || checklistProgress.isComplete;
  const preparationProgressLabel = `${checklistProgress.checkedCount}/${checklistProgress.totalCount}`;
  const searchQuery = productSearchQuery.toLowerCase();
  const filteredProducts = products
    .filter(
      (p) =>
        getLocalizedText(p.name, "").toLowerCase().includes(searchQuery) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery)),
    )
    .slice(0, 8);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 pb-20 font-sans">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/orders")}
              className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Pedido #{editedOrder.id.slice(0, 8)}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs uppercase tracking-wider ${
                    editedOrder.status === "confirmed"
                      ? "bg-blue-100 text-blue-700"
                      : editedOrder.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {editedOrder.status}
                </span>
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-[1680px] mx-auto p-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-6">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Leaf className="w-40 h-40 text-emerald-600" />
              </div>

              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm shrink-0">
                {editedOrder.delivery.address.contactName.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 z-10 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-slate-900">{editedOrder.delivery.address.contactName}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-slate-600">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm">
                    <Phone className="w-4 h-4 text-emerald-600" /> {editedOrder.delivery.address.phone || "—"}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm">
                    <Mail className="w-4 h-4 text-emerald-600" /> {customer?.email || editedOrder.guestEmail || "Sin correo"}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600" /> {editedOrder.delivery.address.zone || editedOrder.delivery.address.city || "Sin zona"}
                  </div>
                </div>
                {(customer?.likes || customer?.dislikes) && (
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                    {customer.likes?.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"
                      >
                        👍 {tag}
                      </span>
                    ))}
                    {customer.dislikes?.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100"
                      >
                        🚫 {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 uppercase tracking-wide">Pedido Creado</p>
                    <p className="font-semibold text-slate-800">{formatDateLabel(editedOrder.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 uppercase tracking-wide">Ultimo Pedido</p>
                    <p className="font-semibold text-slate-800">{formatDateLabel(customer?.lastOrderDate as any)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 uppercase tracking-wide">Historial</p>
                    <p className="font-semibold text-slate-800">
                      {customer?.totalOrders || 0} pedidos · RD$ {(customer?.totalSpent || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500 uppercase tracking-wide">Pago / Entrega</p>
                    <p className="font-semibold text-slate-800">{editedOrder.paymentMethod || "—"} · {editedOrder.paymentStatus || "unpaid"}</p>
                    <p className="text-slate-600">
                      {editedOrder.delivery.window?.day || "Sin dia"} {editedOrder.delivery.window?.slot ? `· ${editedOrder.delivery.window.slot}` : ""}
                    </p>
                  </div>
                </div>
                {(customer?.variant || customer?.userId || editedOrder.userId) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customer?.variant && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        Variante: {customer.variant}
                      </span>
                    )}
                    {(customer?.userId || editedOrder.userId) && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        User: {customer?.userId || editedOrder.userId}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {hasStockWarning && (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-amber-800">Pedido creado con stock insuficiente</p>
                    <p className="text-sm text-amber-700">
                      El pedido se envio correctamente, pero algunos productos estaban por debajo del stock disponible.
                    </p>
                    <div className="space-y-1 text-sm text-amber-900">
                      {stockWarningItems.map((item) => (
                        <p key={item.id}>
                          {getLocalizedText(item.name, item.id)}: solicitado {item.requested}, disponible {item.available}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Package className="w-5 h-5 text-slate-400" /> Items ({editedOrder.items.length})
                </h3>

                <div className="relative w-full sm:w-auto">
                  {showProductSearch ? (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "300px", opacity: 1 }}
                      className="relative"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Buscar producto..."
                        className="w-full pl-10 pr-10 py-2 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none shadow-sm"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        onBlur={() => setTimeout(() => setShowProductSearch(false), 200)}
                      />
                      <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />

                      {productSearchQuery.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                          {filteredProducts.map((product) => {
                            const isBox = (product as any).type === "box";
                            const productId = (product.id || "").toString();
                            return (
                              <button
                                key={product.id}
                                onMouseDown={() => handleAddItem(product)}
                                className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-gray-50 flex justify-between items-center group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <OrderItemThumbnail
                                    productId={productId}
                                    itemType={isBox ? "box" : "product"}
                                    alt={getLocalizedText(product.name, "Producto")}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-slate-800 group-hover:text-emerald-700 truncate">
                                        {getLocalizedText(product.name, "Producto")}
                                      </p>
                                      {isBox && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase">
                                          Box
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400">{getLocalizedText(product.unit, "Unidad")}</p>
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-slate-600">RD$ {product.price}</span>
                              </button>
                            );
                          })}
                          {filteredProducts.length === 0 && (
                            <div className="p-4 text-center text-sm text-slate-400">No encontrado</div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setShowProductSearch(true)}
                      className="flex items-center gap-2 bg-white border border-gray-200 text-slate-600 px-4 py-2 rounded-xl hover:border-emerald-400 hover:text-emerald-700 hover:shadow-sm transition text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> Agregar Producto
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold tracking-wide border-b border-gray-100">
                    <tr>
                      <th className="pl-6 py-4">Producto</th>
                      <th className="py-4 text-center">Cantidad</th>
                      <th className="py-4 text-right">Precio</th>
                      <th className="pr-6 py-4 text-right">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {editedOrder.items.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-gray-50/80 transition-colors">
                        <td className="pl-6 py-3">
                          <div className="flex items-center gap-3">
                            <OrderItemThumbnail
                              productId={resolveItemProductId(item)}
                              itemType={item.type}
                              alt={getLocalizedText(item.name, "Producto")}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-700 truncate">{getLocalizedText(item.name, "Producto")}</div>
                              {Boolean(item.metadata?.unit) && (
                                <div className="text-xs text-slate-400">{getLocalizedText(item.metadata?.unit, "")}</div>
                              )}
                              <div className="text-[11px] text-slate-400">{resolveItemProductId(item)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="inline-flex items-center border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(idx, Math.max(0, item.quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              className="w-12 h-8 text-center border-x border-gray-100 outline-none font-bold text-slate-700 remove-arrow"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10) || 0)}
                            />
                            <button
                              onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right py-3 text-slate-500 font-medium tracking-tight">
                          {item.unitPrice.amount.toLocaleString()}
                        </td>
                        <td className="pr-6 text-right py-3 font-bold text-slate-800 tracking-tight">
                          {(item.unitPrice.amount * item.quantity).toLocaleString()}
                        </td>
                        <td className="pr-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {editedOrder.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                          El carrito esta vacío. Agrega productos arriba.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col items-end gap-3">
                <div className="w-64 flex justify-between text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>RD$ {calculations.subtotal.toLocaleString()}</span>
                </div>
                <div className="w-64 flex justify-between text-slate-500 text-sm">
                  <span>Envío</span>
                  <span>RD$ {calculations.deliveryFee.toLocaleString()}</span>
                </div>
                {calculations.paymentFee > 0 && (
                  <div className="w-64 flex justify-between text-orange-600 text-sm font-semibold">
                    <span>Cargo Pago Digital (10%)</span>
                    <span>RD$ {calculations.paymentFee.toLocaleString()}</span>
                  </div>
                )}
                {calculations.returnDiscount > 0 && (
                  <div className="w-64 flex justify-between text-emerald-700 text-sm font-semibold">
                    <span>Descuento devolución envases</span>
                    <span>-RD$ {calculations.returnDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="w-64 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Descuento</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">RD$</span>
                    <input
                      type="number"
                      min="0"
                      value={editedOrder?.totals?.discounts?.amount || 0}
                      onChange={(e) => {
                        const value = Math.max(0, parseInt(e.target.value) || 0);
                        setEditedOrder((prev) => 
                          prev ? {
                            ...prev,
                            totals: {
                              ...prev.totals,
                              discounts: { amount: value, currency: "DOP" }
                            }
                          } : prev
                        );
                      }}
                      className="w-24 px-2 py-1 text-right border border-gray-200 rounded"
                    />
                  </div>
                </div>
                {calculations.tip > 0 && (
                  <div className="w-64 flex justify-between text-slate-600 text-sm">
                    <span>Propina</span>
                    <span>RD$ {calculations.tip.toLocaleString()}</span>
                  </div>
                )}
                <div className="w-64 h-px bg-gray-200 my-1" />
                <div className="w-64 flex justify-between font-black text-xl text-emerald-700">
                  <span>Total</span>
                  <span>RD$ {calculations.total.toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-12">
            <ShoppingChecklist 
              items={editedOrder.items as any}
              orderId={orderId}
              orderTotal={editedOrder.totals?.total?.amount ?? calculations.total}
              orderCurrency={editedOrder.totals?.total?.currency ?? "DOP"}
              customerLikes={customer?.likes}
              customerDislikes={customer?.dislikes}
              onChecklistStatusChange={setChecklistProgress}
            />
          </div>

          <div className="col-span-12 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Control de Estado</h3>

              <div
                className={`p-4 rounded-2xl border ${
                  editedOrder.status === "confirmed"
                    ? "bg-blue-50 border-blue-100"
                    : editedOrder.status === "pending"
                      ? "bg-amber-50 border-amber-100"
                      : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase opacity-60">Logística</span>
                  <select
                    value={editedOrder.status}
                    onChange={(e) =>
                      setEditedOrder((prev) => (prev ? { ...prev, status: e.target.value as OrderStatus } : prev))
                    }
                    className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="pending">🟡 Pendiente</option>
                    <option value="confirmed">🔵 Confirmado</option>
                    <option value="preparing">🟣 Preparando</option>
                    <option value="ready">🟢 Listo</option>
                    <option value="in_transit">🚚 En Ruta</option>
                    <option value="delivered">🏁 Entregado</option>
                    <option value="cancelled">🔴 Cancelado</option>
                  </select>
                </div>
                <div className="text-xl font-black uppercase text-slate-800">{editedOrder.status}</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isPaid ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase opacity-60">Pago</span>
                  {isPaid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <div className={`text-xl font-black uppercase ${isPaid ? "text-emerald-700" : "text-rose-600"}`}>
                  {isPaid ? "PAGADO" : "PENDIENTE"}
                </div>

                <div className="mt-3 flex gap-2">
                  <select
                    value={editedOrder.paymentMethod || "transfer_popular"}
                    onChange={(e) =>
                      setEditedOrder((prev) => (prev ? { ...prev, paymentMethod: e.target.value as any } : prev))
                    }
                    className="text-xs bg-white/50 border border-black/5 rounded-lg p-1 w-full"
                  >
                    <option value="transfer_popular">Popular</option>
                    <option value="transfer_qik">Qik</option>
                    <option value="transfer">Transferencia</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta (+10%)</option>
                    <option value="online">PayPal (+10%)</option>
                  </select>
                  <select
                    value={editedOrder.paymentStatus || "unpaid"}
                    onChange={(e) =>
                      setEditedOrder((prev) => (prev ? { ...prev, paymentStatus: e.target.value as any } : prev))
                    }
                    className="text-xs bg-white/50 border border-black/5 rounded-lg p-1 w-full"
                  >
                    <option value="unpaid">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <button
                type="button"
                onClick={() => setDeliveryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3"
              >
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entrega</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {editedOrder.delivery.address.contactName || "Sin nombre"} · {editedOrder.delivery.address.zone || editedOrder.delivery.address.city || "Sin zona"} · {editedOrder.delivery.window?.day || "Sin día"}{editedOrder.delivery.window?.slot ? ` (${editedOrder.delivery.window.slot})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <span>{deliveryExpanded ? "Ocultar" : "Mostrar"}</span>
                  {deliveryExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {deliveryExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">Nombre</label>
                    <input
                      value={editedOrder.delivery.address.contactName}
                      onChange={(e) =>
                        setEditedOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                delivery: {
                                  ...prev.delivery,
                                  address: { ...prev.delivery.address, contactName: e.target.value },
                                },
                              }
                            : prev,
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">Teléfono</label>
                    <input
                      value={editedOrder.delivery.address.phone}
                      onChange={(e) =>
                        setEditedOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                delivery: {
                                  ...prev.delivery,
                                  address: { ...prev.delivery.address, phone: e.target.value },
                                },
                              }
                            : prev,
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">Dirección</label>
                    <input
                      value={editedOrder.delivery.address.label}
                      onChange={(e) =>
                        setEditedOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                delivery: {
                                  ...prev.delivery,
                                  address: { ...prev.delivery.address, label: e.target.value },
                                },
                              }
                            : prev,
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Ciudad</label>
                      <input
                        value={editedOrder.delivery.address.city}
                        onChange={(e) =>
                          setEditedOrder((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  delivery: {
                                    ...prev.delivery,
                                    address: { ...prev.delivery.address, city: e.target.value },
                                  },
                                }
                              : prev,
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Zona</label>
                      <input
                        value={editedOrder.delivery.address.zone}
                        onChange={(e) =>
                          setEditedOrder((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  delivery: {
                                    ...prev.delivery,
                                    address: { ...prev.delivery.address, zone: e.target.value },
                                  },
                                }
                              : prev,
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Día</label>
                      <select
                        value={editedOrder.delivery.window?.day || ""}
                        onChange={(e) =>
                          setEditedOrder((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  delivery: {
                                    ...prev.delivery,
                                    window: { ...prev.delivery.window, day: e.target.value },
                                  },
                                }
                              : prev,
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                      >
                        <option value="">Selecciona</option>
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes (+RD$100)</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves (+RD$100)</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado (+RD$100)</option>
                        <option value="Domingo">Domingo</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">Horario</label>
                      <select
                        value={editedOrder.delivery.window?.slot || ""}
                        onChange={(e) =>
                          setEditedOrder((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  delivery: {
                                    ...prev.delivery,
                                    window: { day: prev.delivery.window?.day ?? "", slot: e.target.value },
                                  },
                                }
                              : prev,
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                      >
                        <option value="">Selecciona</option>
                        {DELIVERY_WINDOWS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">Notas</label>
                    <textarea
                      value={editedOrder.delivery.notes || ""}
                      onChange={(e) =>
                        setEditedOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                delivery: {
                                  ...prev.delivery,
                                  notes: e.target.value,
                                },
                              }
                            : prev,
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>

              {requiresPreparationChecklist && !canFinalizeOrder && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                  Preparar Pedido incompleto ({preparationProgressLabel}). Debes completar todos los items para confirmar.
                </p>
              )}

              <button
                onClick={() => {
                  if (!canFinalizeOrder) {
                    toast.error("Completa Preparar Pedido antes de confirmar");
                    return;
                  }
                  if (hasUnsavedChanges) {
                    toast.error("Guarda los cambios primero");
                    return;
                  }
                  setShowConfirmModal(true);
                }}
                disabled={isFinalizing || !canFinalizeOrder}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFinalizing ? "Procesando..." : "Confirmar y Finalizar"}
              </button>

              <button
                onClick={() => window.open(`/admin/orders/${orderId}/print`, "_blank")}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Ver Orden de Compra
              </button>

              {!hasShoppingList ? (
                <button
                  onClick={handleGenerateShoppingList}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  <ListChecks className="w-4 h-4" />
                  Generar Lista de Compras
                </button>
              ) : (
                <Link
                  href={`/admin/orders/${orderId}/shopping`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ver Lista de Compras
                </Link>
              )}

              <button
                onClick={() => window.open(`/admin/orders/${orderId}/invoice`, "_blank")}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir Factura
              </button>

              <button
                onClick={() => {
                  if (window.confirm("¿Seguro que deseas cancelar el pedido? Esto devolverá el stock.")) {
                    handleStatusUpdate("cancelled");
                  }
                }}
                className="w-full py-3 text-rose-500 hover:opacity-80 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Cancelar Pedido
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-2 text-sm text-slate-600">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata</h3>
              <div>User ID: {editedOrder.userId || "—"}</div>
              <div>Creado: {new Date(editedOrder.createdAt).toLocaleString()}</div>
              <div>
                Origen: {typeof editedOrder.metadata?.source === "string" ? editedOrder.metadata.source : "—"}
              </div>
            </div>
          </div>
        </main>

        <AnimatePresence>
          {showConfirmModal && editedOrder && (
            <OrderDetailsModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={executeFinalize}
              order={editedOrder}
              mode={"confirm"}
              totals={calculations}
              productLabelMap={productLabelMap}
            />
          )}
        </AnimatePresence>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          .remove-arrow::-webkit-inner-spin-button,
          .remove-arrow::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        `,
          }}
        />
      </div>
    </AdminGuard>
  );
}
