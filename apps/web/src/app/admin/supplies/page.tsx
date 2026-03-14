"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { AlertTriangle, Search, Plus, X, Pencil, ImageIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { Supply } from "@/modules/supplies/types";
import { useAuth } from "@/modules/auth/context";
import { ImageUploadField } from "@/modules/admin/components/image-upload-field";

type StatusState = "idle" | "loading" | "ready" | "error";
type EditableField = "unitPrice" | "minStock";

const CATEGORY_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "Packaging", label: "Packaging" },
  { id: "Glass", label: "Botellas/Frascos" },
  { id: "Labels", label: "Etiquetas" },
  { id: "Ingredients", label: "Ingredientes" },
  { id: "Other", label: "Otros" },
];

const CATEGORY_LABELS: Record<string, string> = {
  Packaging: "Packaging",
  Glass: "Botellas/Frascos",
  Labels: "Etiquetas",
  Ingredients: "Ingredientes",
  Other: "Otros",
};

function normalizeCategory(raw?: string): keyof typeof CATEGORY_LABELS {
  const value = (raw ?? "").toLowerCase().trim();
  if (value === "packaging" || value === "empaque" || value === "empaques") return "Packaging";
  if (value === "glass" || value === "botellas" || value === "frascos" || value === "botellas/frascos") {
    return "Glass";
  }
  if (value === "labels" || value === "etiquetas" || value === "etiqueta") return "Labels";
  if (value === "other" || value === "otros" || value === "otro") return "Other";
  return "Other";
}

function formatCurrency(value?: number) {
  const numeric = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(numeric);
}

function slugifyId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-");
}

function SuppliesContent() {
  const { user } = useAuth();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [draftValue, setDraftValue] = useState<string>("");
  const [newSupplyOpen, setNewSupplyOpen] = useState(false);
  const [newSupply, setNewSupply] = useState({
    id: "",
    name: "",
    category: "Packaging",
    unit: "und",
    supplier: "",
    imageUrl: "",
    unitPrice: "",
    stock: "",
    minStock: "",
    isReturnable: false,
    notes: "",
  });
  const [stockAdjusting, setStockAdjusting] = useState<{ id: string; value: string } | null>(null);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [editingDraft, setEditingDraft] = useState({
    name: "",
    category: "Packaging",
    unit: "und",
    supplier: "",
    imageUrl: "",
    unitPrice: "",
    stock: "",
    minStock: "",
    isReturnable: false,
    notes: "",
  });

  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) {
      setStatus("error");
      setError("No se pudo inicializar Firestore.");
      return;
    }

    setStatus("loading");
    const unsubscribe = onSnapshot(
      collection(db, "catalog_supplies"),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Supply, "id">),
        }));
        setSupplies(data);
        setStatus("ready");
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Error al cargar insumos.");
        setStatus("error");
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredSupplies = useMemo(() => {
    let filtered = supplies;

    // Filtrar por categoría
    if (filter !== "all") {
      filtered = filtered.filter((supply) => normalizeCategory(supply.category) === filter);
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (supply) =>
          supply.name.toLowerCase().includes(query) ||
          supply.id.toLowerCase().includes(query) ||
          supply.supplier?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [filter, searchQuery, supplies]);

  const handleEditStart = useCallback((supply: Supply, field: EditableField) => {
    let currentValue: number | undefined;
    if (field === "unitPrice") {
      currentValue = supply.unitPrice;
    } else if (field === "minStock") {
      currentValue = typeof supply.minStock === "number" ? supply.minStock : 0;
    }
    setDraftValue(currentValue !== undefined ? String(currentValue) : "0");
    setEditing({ id: supply.id, field });
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditing(null);
    setDraftValue("");
  }, []);

  const handleEditCommit = useCallback(async () => {
    if (!editing) return;
    const numeric = Number(draftValue);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setError("Ingresa un valor numerico valido.");
      return;
    }

    let nextValue: number;
    if (editing.field === "minStock") {
      nextValue = Math.max(0, Math.floor(numeric));
    } else {
      nextValue = Math.max(0, numeric);
    }

    const db = getFirestoreDb();
    if (!db) {
      setError("No se pudo actualizar el insumo.");
      return;
    }

    try {
      await updateDoc(doc(db, "catalog_supplies", editing.id), {
        [editing.field]: nextValue,
        updatedAt: new Date(),
      });
      handleEditCancel();
      setError(null);
      toast.success("Stock actualizado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el cambio.";
      setError(message);
      toast.error(message);
    }
  }, [draftValue, editing, handleEditCancel]);

  const handleCreateSupply = useCallback(async () => {
    const db = getFirestoreDb();
    if (!db) {
      setError("No se pudo guardar el insumo.");
      return;
    }

    const supplyId = slugifyId(newSupply.id);
    if (!supplyId) {
      setError("El ID es obligatorio.");
      return;
    }
    if (!newSupply.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const unitPrice = Number(newSupply.unitPrice);
    const stock = Math.max(0, Math.floor(Number(newSupply.stock || 0)));
    const minStock = Math.max(0, Math.floor(Number(newSupply.minStock || 0)));

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError("Precio unitario inválido.");
      return;
    }

    try {
      await setDoc(doc(db, "catalog_supplies", supplyId), {
        id: supplyId,
        name: newSupply.name.trim(),
        category: newSupply.category,
        unit: newSupply.unit || "und",
        supplier: newSupply.supplier.trim() || null,
        imageUrl: newSupply.imageUrl.trim() || null,
        notes: newSupply.notes.trim() || null,
        unitPrice,
        stock,
        minStock,
        isReturnable: Boolean(newSupply.isReturnable),
        currency: "DOP",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setNewSupplyOpen(false);
      setNewSupply({
        id: "",
        name: "",
        category: "Packaging",
        unit: "und",
        supplier: "",
        imageUrl: "",
        unitPrice: "",
        stock: "",
        minStock: "",
        isReturnable: false,
        notes: "",
      });
      setError(null);
      toast.success("Nuevo insumo creado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el insumo.";
      setError(message);
      toast.error(message);
    }
  }, [newSupply]);

  const openEditModal = useCallback((supply: Supply) => {
    setEditingSupply(supply);
    setEditingDraft({
      name: supply.name ?? "",
      category: normalizeCategory(supply.category),
      unit: supply.unit ?? "und",
      supplier: supply.supplier ?? "",
      imageUrl: supply.imageUrl ?? "",
      unitPrice: typeof supply.unitPrice === "number" ? String(supply.unitPrice) : "",
      stock: typeof supply.stock === "number" ? String(supply.stock) : "",
      minStock: typeof supply.minStock === "number" ? String(supply.minStock) : "",
      isReturnable: Boolean(supply.isReturnable),
      notes: supply.notes ?? "",
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingSupply(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingSupply) return;
    const db = getFirestoreDb();
    if (!db) {
      setError("No se pudo actualizar el insumo.");
      return;
    }

    const nextUnitPrice = Number(editingDraft.unitPrice);
    const nextStock = Math.max(0, Math.floor(Number(editingDraft.stock || 0)));
    const nextMinStock = Math.max(0, Math.floor(Number(editingDraft.minStock || 0)));

    if (!editingDraft.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!Number.isFinite(nextUnitPrice) || nextUnitPrice < 0) {
      setError("Precio unitario inválido.");
      return;
    }
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setError("Stock inválido.");
      return;
    }

    try {
      await updateDoc(doc(db, "catalog_supplies", editingSupply.id), {
        name: editingDraft.name.trim(),
        category: editingDraft.category,
        unit: editingDraft.unit || "und",
        supplier: editingDraft.supplier.trim() || null,
        imageUrl: editingDraft.imageUrl.trim() || null,
        notes: editingDraft.notes.trim() || null,
        unitPrice: nextUnitPrice,
        stock: nextStock,
        minStock: nextMinStock,
        isReturnable: Boolean(editingDraft.isReturnable),
        updatedAt: serverTimestamp(),
      });
      setError(null);
      setEditingSupply(null);
      toast.success("Insumo actualizado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el insumo.";
      setError(message);
      toast.error(message);
    }
  }, [editingDraft, editingSupply]);

  const handleDelete = useCallback(async (supply: Supply) => {
    const confirmed = window.confirm(`¿Eliminar el insumo "${supply.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const db = getFirestoreDb();
    if (!db) {
      setError("No se pudo eliminar el insumo.");
      return;
    }

    try {
      await deleteDoc(doc(db, "catalog_supplies", supply.id));
      setSupplies((prev) => prev.filter((item) => item.id !== supply.id));
      setError(null);
      toast.success("Insumo eliminado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar el insumo.";
      setError(message);
      toast.error(message);
    }
  }, []);

  const handleStockIncrement = useCallback(async () => {
    if (!stockAdjusting) return;
    const added = Math.floor(Number(stockAdjusting.value));
    if (!Number.isFinite(added) || added <= 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }

    const db = getFirestoreDb();
    if (!db) {
      setError("No se pudo actualizar el stock.");
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const supplyRef = doc(db, "catalog_supplies", stockAdjusting.id);
        const snapshot = await transaction.get(supplyRef);
        if (!snapshot.exists()) {
          throw new Error("Insumo no encontrado.");
        }
        const data = snapshot.data() as Supply;
        const currentStock = typeof data.stock === "number" ? data.stock : 0;
        const nextStock = currentStock + added;

        transaction.update(supplyRef, {
          stock: nextStock,
          updatedAt: serverTimestamp(),
        });

        const logRef = doc(collection(db, "supply_logs"));
        transaction.set(logRef, {
          supplyId: stockAdjusting.id,
          delta: added,
          previousStock: currentStock,
          newStock: nextStock,
          actorEmail: user?.email ?? null,
          createdAt: serverTimestamp(),
        });
      });

      setStockAdjusting(null);
      setError(null);
      toast.success("Compra registrada");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar la compra.";
      setError(message);
      toast.error(message);
    }
  }, [stockAdjusting, user?.email]);

  // Contar alertas de stock bajo
  const lowStockCount = useMemo(() => {
    return supplies.filter((supply) => {
      const stock = typeof supply.stock === "number" ? supply.stock : 0;
      const minStock = typeof supply.minStock === "number" ? supply.minStock : 0;
      return stock <= minStock;
    }).length;
  }, [supplies]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--gd-color-forest)] mb-1">Gestión de Insumos</h2>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              {filteredSupplies.length} de {supplies.length} insumos
              {lowStockCount > 0 && (
                <span className="ml-2 text-red-600 font-semibold">
                  • {lowStockCount} con stock bajo
                </span>
              )}
            </p>
          </div>

          {/* Búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setNewSupplyOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--gd-color-forest)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--gd-color-leaf)]"
            >
              <Plus className="h-4 w-4" />
              Nuevo insumo
            </button>
            <div className="relative flex-1 lg:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--gd-color-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar por nombre, ID o proveedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 focus:border-[var(--gd-color-leaf)]/50 text-sm"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {CATEGORY_FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={`px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                    filter === option.id
                      ? "bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] border-[var(--gd-color-leaf)]/40 shadow-md"
                      : "border-white/60 bg-white/50 text-[var(--gd-color-text-muted)] hover:bg-white/70"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {status === "loading" && (
        <div className="glass-panel rounded-3xl p-12 text-center shadow-lg border border-white/60">
          <p className="text-[var(--gd-color-text-muted)]">Cargando insumos...</p>
        </div>
      )}

      {status === "error" && error && (
        <div className="glass-panel rounded-3xl p-6 border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {status === "ready" && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/50 border-b border-white/60">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Foto</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">ID</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Nombre</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Categoría</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Proveedor</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Stock</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Mínimo</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Precio Unit.</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Retornable</th>
                  <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredSupplies.map((supply) => {
                  const stockValue = typeof supply.stock === "number" ? supply.stock : 0;
                  const minStock = typeof supply.minStock === "number" ? supply.minStock : 0;
                  const isLowStock = stockValue <= minStock;
                  const isEditingPrice = editing?.id === supply.id && editing.field === "unitPrice";
                  const isEditingMinStock = editing?.id === supply.id && editing.field === "minStock";

                  return (
                    <tr
                      key={supply.id}
                      className={`transition-colors ${
                        isLowStock
                          ? "bg-red-50/50 border-l-4 border-l-red-500"
                          : "hover:bg-white/30"
                      }`}
                    >
                      <td className="px-6 py-4">
                        {supply.imageUrl ? (
                          <img
                            src={supply.imageUrl}
                            alt={supply.name}
                            className="h-10 w-10 rounded-xl object-cover border border-white/60 bg-white/60"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/50 text-[var(--gd-color-text-muted)]">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono text-[var(--gd-color-text-muted)]">
                          {supply.id}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--gd-color-forest)]">{supply.name}</div>
                        {isLowStock && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-red-700 border border-red-200">
                              Reabastecer
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              Stock bajo
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[var(--gd-color-sprout)]/30 text-[var(--gd-color-forest)] border border-[var(--gd-color-leaf)]/20">
                          {CATEGORY_LABELS[normalizeCategory(supply.category)]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--gd-color-text-muted)]">
                        {supply.supplier || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-flex items-center gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${
                              isLowStock
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "bg-white/30 text-[var(--gd-color-forest)] border border-white/60"
                            }`}
                          >
                            {stockValue}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStockAdjusting({ id: supply.id, value: "" })}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gd-color-leaf)]/40 bg-white/70 text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/20"
                            aria-label="Registrar compra"
                          >
                            <Plus className="h-4 w-4" />
                          </button>

                          {stockAdjusting?.id === supply.id && (
                            <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-white p-3 shadow-xl z-30">
                              <p className="text-xs font-semibold text-[var(--gd-color-forest)] mb-2">
                                Agregar unidades
                              </p>
                              <input
                                type="number"
                                min={1}
                                value={stockAdjusting.value}
                                onChange={(e) =>
                                  setStockAdjusting((prev) =>
                                    prev ? { ...prev, value: e.target.value } : null
                                  )
                                }
                                className="w-full px-3 py-1.5 rounded-xl border border-white/60 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                                placeholder="Cantidad"
                              />
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleStockIncrement}
                                  className="flex-1 rounded-full bg-[var(--gd-color-forest)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--gd-color-leaf)]"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStockAdjusting(null)}
                                  className="flex-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-background-muted)]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditingMinStock ? (
                          <input
                            type="number"
                            min={0}
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                            onBlur={handleEditCommit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditCommit();
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            className="w-20 px-3 py-1.5 rounded-xl border border-white/60 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditStart(supply, "minStock")}
                            className="px-3 py-1.5 rounded-xl text-sm font-medium text-[var(--gd-color-text-muted)] bg-white/30 border border-white/60 hover:bg-white/50 transition-colors"
                          >
                            {minStock}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditingPrice ? (
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                            onBlur={handleEditCommit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditCommit();
                              if (e.key === "Escape") handleEditCancel();
                            }}
                            className="w-28 px-3 py-1.5 rounded-xl border border-white/60 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 text-sm"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditStart(supply, "unitPrice")}
                            className="px-3 py-1.5 rounded-xl text-sm font-semibold text-[var(--gd-color-forest)] bg-white/30 border border-white/60 hover:bg-white/50 transition-colors"
                          >
                            {formatCurrency(supply.unitPrice)}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {supply.isReturnable ? (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[var(--gd-color-leaf)]/20 text-[var(--gd-color-forest)] border border-[var(--gd-color-leaf)]/40">
                            Sí
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(supply)}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)]/10"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(supply)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSupplies.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center text-[var(--gd-color-text-muted)]" colSpan={10}>
                      No se encontraron insumos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {newSupplyOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl border border-white/60">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">Nuevo insumo</h3>
              <button
                type="button"
                onClick={() => setNewSupplyOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ID (slug)
                  <input
                    value={newSupply.id}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, id: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="botella-jp-litro"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                  <input
                    value={newSupply.name}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Botella JP Litro"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Categoría
                  <select
                    value={newSupply.category}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, category: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Glass">Glass</option>
                    <option value="Labels">Labels</option>
                    <option value="Ingredients">Ingredientes</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unidad
                  <select
                    value={newSupply.unit}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, unit: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="und">und</option>
                    <option value="mts">mts</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Proveedor
                  <input
                    value={newSupply.supplier}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, supplier: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Casa Consuelo"
                  />
                </label>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Imagen (URL opcional)
                    <input
                      value={newSupply.imageUrl}
                      onChange={(e) => setNewSupply((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="/assets/images/supplies/botella-jp-litro.png"
                    />
                  </label>
                  <div className="mt-3">
                    <ImageUploadField
                      label="Subir imagen"
                      pathPrefix={`supplies/${slugifyId(newSupply.id) || "temp"}`}
                      onUploaded={(url) => setNewSupply((prev) => ({ ...prev, imageUrl: url }))}
                    />
                  </div>
                </div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Precio Unitario (DOP)
                  <input
                    type="number"
                    step="0.01"
                    value={newSupply.unitPrice}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock Inicial
                  <input
                    type="number"
                    value={newSupply.stock}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, stock: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock Mínimo
                  <input
                    type="number"
                    value={newSupply.minStock}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, minStock: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
                  Notas
                  <textarea
                    value={newSupply.notes}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Observaciones del insumo..."
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-3">
                  Retornable
                  <input
                    type="checkbox"
                    checked={newSupply.isReturnable}
                    onChange={(e) => setNewSupply((prev) => ({ ...prev, isReturnable: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setNewSupplyOpen(false)}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateSupply}
                className="rounded-full bg-[var(--gd-color-forest)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--gd-color-leaf)]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSupply && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl border border-white/60">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--gd-color-forest)]">Editar insumo</h3>
                <p className="text-xs text-slate-500">{editingSupply.id}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                  <input
                    value={editingDraft.name}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Categoría
                  <select
                    value={editingDraft.category}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, category: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Glass">Glass</option>
                    <option value="Labels">Labels</option>
                    <option value="Ingredients">Ingredientes</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unidad
                  <select
                    value={editingDraft.unit}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, unit: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="und">und</option>
                    <option value="mts">mts</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Proveedor
                  <input
                    value={editingDraft.supplier}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, supplier: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Precio Unitario (DOP)
                  <input
                    type="number"
                    step="0.01"
                    value={editingDraft.unitPrice}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock actual
                  <input
                    type="number"
                    value={editingDraft.stock}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, stock: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock mínimo
                  <input
                    type="number"
                    value={editingDraft.minStock}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, minStock: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
                  Notas
                  <textarea
                    value={editingDraft.notes}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-3">
                  Retornable
                  <input
                    type="checkbox"
                    checked={editingDraft.isReturnable}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, isReturnable: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
                  Imagen (URL)
                  <input
                    value={editingDraft.imageUrl}
                    onChange={(e) => setEditingDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="/assets/images/supplies/..."
                  />
                </label>
                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Subir nueva imagen"
                    pathPrefix={`supplies/${editingSupply.id}`}
                    onUploaded={(url) => setEditingDraft((prev) => ({ ...prev, imageUrl: url }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-full bg-[var(--gd-color-forest)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--gd-color-leaf)]"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSuppliesPage() {
  return (
    <AdminGuard>
      <SuppliesContent />
    </AdminGuard>
  );
}
