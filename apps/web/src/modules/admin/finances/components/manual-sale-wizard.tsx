"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ShoppingCart, Save, Loader2 } from "lucide-react";

import { adminFetch } from "@/modules/admin/api/client";
import type { Product } from "@/modules/catalog/types";

type ManualSaleWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: () => void;
};

type SaleItem = {
  productId: string;
  productSku?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export function ManualSaleWizard({ isOpen, onClose, onSaleCreated }: ManualSaleWizardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = useCallback(async () => {
    try {
      const response = await adminFetch("/api/admin/catalog/products", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  }, []);

  const handleAddItem = useCallback(() => {
    if (!selectedProductId || !quantity) return;

    const product = products.find((p) => p.id === selectedProductId || p.sku === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    const unitPrice = product.price;
    const total = unitPrice * qty;

    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productSku: product.sku,
        productName: product.name.es,
        quantity: qty,
        unitPrice,
        total,
      },
    ]);

    setSelectedProductId("");
    setQuantity("1");
  }, [selectedProductId, quantity, products]);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = useCallback(async () => {
    if (!customerName || !customerPhone || items.length === 0) {
      setError("Completa todos los campos requeridos");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saleData = {
        type: "manual",
        customer: {
          name: customerName,
          phone: customerPhone,
        },
        items: items.map((item) => ({
          productId: item.productId,
          productSku: item.productSku,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        total: totalAmount,
        currency: "DOP",
        notes,
        createdAt: new Date().toISOString(),
      };

      // TODO: Guardar en Firestore collection "manual_sales"
      const response = await adminFetch("/api/admin/finances/manual-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error("Error al guardar la venta manual");
      }

      onSaleCreated();
      onClose();
      // Reset form
      setItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }, [customerName, customerPhone, items, totalAmount, notes, onClose, onSaleCreated]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[9999] h-full w-full max-w-2xl bg-[var(--gd-color-beige)] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="glass-panel border-b border-white/40 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--gd-color-forest)]">Venta Manual</h2>
                <p className="text-xs text-[var(--gd-color-text-muted)]">WhatsApp / Directo</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6 text-[var(--gd-color-text-muted)]" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="glass-panel rounded-2xl p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Información del Cliente */}
              <div className="glass-panel rounded-2xl p-4 border border-white/60">
                <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] mb-3">
                  Información del Cliente
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--gd-color-text-muted)] mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Agregar Productos */}
              <div className="glass-panel rounded-2xl p-4 border border-white/60">
                <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] mb-3">
                  Agregar Productos
                </h3>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products
                      .filter((p) => p.status === "active")
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name.es} - {product.price} DOP
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Cant."
                    className="w-20 px-3 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                  />
                  <button
                    onClick={handleAddItem}
                    disabled={!selectedProductId}
                    className="px-4 py-2.5 rounded-xl bg-[var(--gd-color-leaf)] text-white font-medium text-sm hover:bg-[var(--gd-color-forest)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Items Agregados */}
              {items.length > 0 && (
                <div className="glass-panel rounded-2xl p-4 border border-white/60">
                  <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] mb-3">Items</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/30 rounded-xl border border-white/40"
                      >
                        <div>
                          <p className="font-medium text-sm text-[var(--gd-color-forest)]">
                            {item.quantity}× {item.productName}
                          </p>
                          <p className="text-xs text-[var(--gd-color-text-muted)]">
                            {item.unitPrice} DOP c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-[var(--gd-color-forest)]">
                            {item.total.toLocaleString("es-DO")} DOP
                          </p>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/40 flex justify-between items-center">
                    <span className="font-semibold text-[var(--gd-color-forest)]">Total</span>
                    <span className="text-xl font-bold text-[var(--gd-color-forest)]">
                      {totalAmount.toLocaleString("es-DO")} DOP
                    </span>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div className="glass-panel rounded-2xl p-4 border border-white/60">
                <label className="block text-sm font-semibold text-[var(--gd-color-forest)] mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm resize-none"
                  placeholder="Notas adicionales sobre la venta..."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-white/40">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-sm text-[var(--gd-color-text-muted)] font-medium text-sm hover:bg-white/70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || items.length === 0 || !customerName || !customerPhone}
                  className="flex-1 px-6 py-3 rounded-xl bg-[var(--gd-color-leaf)] text-white font-medium text-sm hover:bg-[var(--gd-color-forest)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
