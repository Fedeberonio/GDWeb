"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Save, ShoppingCart, Square, TrendingDown, TrendingUp } from "lucide-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { adminFetch } from "@/modules/admin/api/client";
import { getFirestoreDb } from "@/lib/firebase/client";

type ShoppingItem = {
  id: string;
  name: string;
  estimated_price: number;
  quantity: number;
  actual_quantity?: number;
  actual_price?: number;
  unit?: string;
  category?: string;
  checked?: boolean;
  replaced_with?: string;
};

interface MarketShoppingListProps {
  orderId: string;
  orderTotal: number;
}

type SavedMarketCosts = {
  items?: Record<
    string,
    {
      actual_quantity?: number;
      actual_price?: number;
      checked?: boolean;
      replaced_with?: string | null;
    }
  >;
};

const MARKET_COSTS_DOC_ID = "summary";

export function MarketShoppingList({ orderId, orderTotal }: MarketShoppingListProps) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load shopping list on mount
  useEffect(() => {
    let isMounted = true;
    async function loadList() {
      setLoading(true);
      try {
        const res = await adminFetch(`/api/admin/orders/${orderId}/shopping-list`);
        const json = await res.json();
        let baseItems: ShoppingItem[] = [];

        if (res.ok && Array.isArray(json.data)) {
          baseItems = json.data.map((item: any) => ({
            ...item,
            actual_quantity: item.quantity,
            actual_price: item.estimated_price,
            checked: false,
          }));
        }

        try {
          const db = getFirestoreDb();
          const docRef = doc(db, "orders", orderId, "market_costs", MARKET_COSTS_DOC_ID);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const saved = snap.data() as SavedMarketCosts;
            const savedItems = saved.items ?? {};
            baseItems = baseItems.map((item) => {
              const savedItem = savedItems[item.id];
              if (!savedItem) return item;
              return {
                ...item,
                actual_quantity:
                  typeof savedItem.actual_quantity === "number"
                    ? savedItem.actual_quantity
                    : item.actual_quantity,
                actual_price:
                  typeof savedItem.actual_price === "number"
                    ? savedItem.actual_price
                    : item.actual_price,
                checked:
                  typeof savedItem.checked === "boolean"
                    ? savedItem.checked
                    : item.checked,
                replaced_with:
                  typeof savedItem.replaced_with === "string"
                    ? savedItem.replaced_with
                    : item.replaced_with,
              };
            });
          }
        } catch (err) {
          console.warn("Error loading saved market costs:", err);
        }

        if (isMounted) {
          setItems(baseItems);
        }
      } catch (err) {
        console.error("Error loading shopping list:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadList();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Calculations
  const estimatedCost = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.estimated_price, 0),
    [items],
  );

  const actualCost = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.actual_quantity || 0) * (item.actual_price || 0),
        0,
      ),
    [items],
  );

  const profit = orderTotal - actualCost;
  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);

  // Handlers
  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const updateQuantity = (id: string, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, actual_quantity: Math.max(0, value) } : item,
      ),
    );
  };

  const updatePrice = (id: string, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, actual_price: Math.max(0, value) } : item,
      ),
    );
  };

  const saveCosts = async () => {
    setSaving(true);
    try {
      const db = getFirestoreDb();
      const docRef = doc(db, "orders", orderId, "market_costs", MARKET_COSTS_DOC_ID);
      const payload = items.reduce((acc, item) => {
        acc[item.id] = {
          actual_quantity: item.actual_quantity ?? item.quantity,
          actual_price: item.actual_price ?? 0,
          checked: Boolean(item.checked),
          replaced_with: item.replaced_with ?? null,
        };
        return acc;
      }, {} as Record<string, unknown>);

      await setDoc(
        docRef,
        {
          items: payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      console.log("Saved costs:", items);
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando lista...</div>;
  }

  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-emerald-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lista de Compras</h3>
            <p className="text-sm text-gray-500">
              {checkedCount} de {items.length} comprados
            </p>
          </div>
        </div>
        <button
          onClick={saveCosts}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar Costos"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Costo Estimado</p>
          <p className="text-2xl font-bold text-gray-900">RD${estimatedCost.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Costo Real</p>
          <p className="text-2xl font-bold text-blue-600">RD${actualCost.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 uppercase">Precio Venta</p>
          <p className="text-2xl font-bold text-gray-900">RD${orderTotal.toLocaleString()}</p>
        </div>
        <div className={`bg-white rounded-xl p-4 border-2 ${profit >= 0 ? "border-green-500" : "border-red-500"}`}>
          <div className="flex items-center gap-2">
            {profit >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <p className="text-xs text-gray-500 uppercase">
              {profit >= 0 ? "Ganancia" : "Pérdida"}
            </p>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            RD${Math.abs(profit).toLocaleString()}
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide px-2">
            {category}
          </h4>
          {categoryItems.map((item) => (
            <div
              key={item.id}
              className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl border-2 transition ${
                item.checked
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <button
                onClick={() => toggleCheck(item.id)}
                className="col-span-1 flex items-center justify-center"
              >
                {item.checked ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <div className="col-span-4">
                <p className={`font-medium ${item.checked ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {item.name}
                </p>
                {item.unit && (
                  <p className="text-xs text-gray-500">{item.unit}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500 block">Cantidad</label>
                <input
                  type="number"
                  value={item.actual_quantity || 0}
                  onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  step="0.1"
                />
              </div>

              <div className="col-span-2 text-center">
                <p className="text-xs text-gray-500">Est.</p>
                <p className="text-sm font-medium text-gray-600">
                  RD${item.estimated_price.toFixed(0)}
                </p>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500 block">Real</label>
                <input
                  type="number"
                  value={item.actual_price || 0}
                  onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-semibold"
                  step="1"
                />
              </div>

              <div className="col-span-1 text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-bold text-emerald-600">
                  RD${((item.actual_quantity || 0) * (item.actual_price || 0)).toFixed(0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
