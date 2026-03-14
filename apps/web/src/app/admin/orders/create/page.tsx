"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { adminFetch } from "@/modules/admin/api/client";
import { ArrowLeft, Search, Plus, Trash2, AlertTriangle } from "lucide-react";

const DEFAULT_DELIVERY_ZONE = "Zona Metropolitana";

type CatalogItem = {
  id: string;
  name: string;
  price: number;
  type: "product" | "box" | "salad";
  image?: string;
  stock?: number;
};

type CartItem = {
  id: string;
  name: string;
  type: "product" | "box" | "salad";
  quantity: number;
  unitPrice: number;
  stock?: number;
};

type CustomerOption = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  sector?: string;
  addresses?: string[];
};

function formatCurrency(amount: number, currency = "DOP") {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeName(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.es || value.en || "";
  return "";
}

export default function AdminCreateOrderPage() {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerMode, setCustomerMode] = useState<"existing" | "guest">("existing");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryDay, setDeliveryDay] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [deliveryZone, setDeliveryZone] = useState(DEFAULT_DELIVERY_ZONE);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, customersRes] = await Promise.all([
        adminFetch("/api/admin/catalog/products", { cache: "no-store" }),
        adminFetch("/api/admin/customers", { cache: "no-store" }),
      ]);

      const [productsJson, customersJson] = await Promise.all([
        productsRes.json(),
        customersRes.json(),
      ]);

      const products = Array.isArray(productsJson.data) ? productsJson.data : [];
      const customerList = Array.isArray(customersJson.data) ? customersJson.data : [];

      const normalizedProducts: CatalogItem[] = products.map((item: any) => ({
        id: item.id,
        name: normalizeName(item.name) || item.name || item.slug || item.id,
        price: Number(item.price ?? item.price?.amount ?? 0),
        type: item.type === "box" ? "box" : "product",
        image: item.image,
        stock: item?.metadata?.stock,
      }));

      setCatalogItems([...normalizedProducts]);
      setCustomers(
        customerList.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? undefined,
          city: customer.city ?? undefined,
          sector: customer.sector ?? undefined,
          addresses: customer.addresses ?? [],
        })),
      );
    } catch (error) {
      console.error("Error loading catalog:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredCatalog = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return catalogItems;
    return catalogItems.filter((item) => item.name.toLowerCase().includes(term));
  }, [catalogItems, searchTerm]);

  const customerSearchList = useMemo(() => {
    const term = (contactName.trim() || contactEmail.trim()).toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(term) || customer.email.toLowerCase().includes(term),
    );
  }, [customers, contactName, contactEmail]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal + deliveryFee;

  const hasStockWarnings = cartItems.some(
    (item) => typeof item.stock === "number" && item.stock >= 0 && item.quantity > item.stock,
  );

  const handleAddItem = (item: CatalogItem) => {
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id && entry.type === item.type);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id && entry.type === item.type
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        );
      }
      return [...prev, { id: item.id, name: item.name, type: item.type, quantity: 1, unitPrice: item.price, stock: item.stock }];
    });
  };

  const handleQuantityChange = (id: string, type: CartItem["type"], value: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.type === type ? { ...item, quantity: Math.max(1, value) } : item,
      ),
    );
  };

  const handlePriceChange = (id: string, type: CartItem["type"], value: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.type === type ? { ...item, unitPrice: Math.max(0, value) } : item,
      ),
    );
  };

  const handleRemoveItem = (id: string, type: CartItem["type"]) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
  };

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setContactName(customer.name);
    setContactEmail(customer.email);
    setContactPhone(customer.phone ?? "");
    setAddress(customer.addresses?.[0] ?? "");
  };

  const handleSubmit = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      window.alert("Nombre y teléfono son requeridos.");
      return;
    }
    if (cartItems.length === 0) {
      window.alert("Agrega al menos un item.");
      return;
    }

    if (hasStockWarnings) {
      const proceed = window.confirm("Algunos productos están por encima del stock. ¿Deseas continuar?");
      if (!proceed) return;
    }

    try {
      const payload = {
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        deliveryDay,
        deliveryWindow,
        deliveryZone,
        deliveryFee,
        paymentMethod,
        paymentStatus,
        userId: customerMode === "existing" ? selectedCustomer?.id ?? null : null,
        items: cartItems.map((item) => ({
          id: item.id,
          productId: item.id,
          type: item.type === "box" ? "box" : "product",
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const response = await adminFetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo crear el pedido");
      }

      window.location.href = `/admin/orders/${json?.data?.id}`;
    } catch (error) {
      console.error("Error creating order:", error);
      window.alert(error instanceof Error ? error.message : "Error al crear el pedido");
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a pedidos
              </Link>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--gd-color-forest)]">Crear Pedido Manual</h1>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              Crea órdenes para clientes existentes o invitados con control total del carrito.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Guardar Pedido
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left column */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar productos, cajas o ensaladas..."
                  className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                Catálogo
              </h3>
              {loading ? (
                <div className="py-8 text-sm text-slate-400">Cargando catálogo...</div>
              ) : (
                <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-2">
                  {filteredCatalog.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className="w-full flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.type === "box" ? "Caja" : item.type === "salad" ? "Ensalada" : "Producto"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">{formatCurrency(item.price)}</p>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Plus className="h-3 w-3" />
                          Agregar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                Carrito Manual
              </h3>
              {cartItems.length === 0 ? (
                <div className="py-6 text-sm text-slate-400">Agrega productos desde el catálogo.</div>
              ) : (
                <div className="mt-4 space-y-4">
                  {cartItems.map((item) => {
                    const showWarning = typeof item.stock === "number" && item.stock >= 0 && item.quantity > item.stock;
                    return (
                      <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.type === "box" ? "Caja" : item.type === "salad" ? "Ensalada" : "Producto"}</p>
                            {showWarning && (
                              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Stock insuficiente ({item.stock ?? 0})
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id, item.type)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="text-xs text-slate-500">
                            Cantidad
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(event) => handleQuantityChange(item.id, item.type, Number(event.target.value))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="text-xs text-slate-500">
                            Precio unitario
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(event) => handlePriceChange(item.id, item.type, Number(event.target.value))}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                          </label>
                          <div className="text-xs text-slate-500 flex flex-col justify-end">
                            <span>Total</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                Cliente
              </h3>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                    customerMode === "existing"
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 text-slate-600"
                  }`}
                >
                  Buscar Cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("guest");
                    setSelectedCustomer(null);
                  }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                    customerMode === "guest"
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 text-slate-600"
                  }`}
                >
                  Invitado / Nuevo
                </button>
              </div>

              {customerMode === "existing" && (
                <div className="mt-4 space-y-3">
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Buscar por nombre"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="Buscar por email"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200">
                    {customerSearchList.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                          selectedCustomer?.id === customer.id ? "bg-slate-50" : ""
                        }`}
                      >
                        <p className="font-semibold text-slate-800">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Nombre completo"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="Email"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="Teléfono"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Dirección"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                Entrega & Pago
              </h3>
              <div className="grid gap-3">
                <input
                  value={deliveryDay}
                  onChange={(event) => setDeliveryDay(event.target.value)}
                  placeholder="Día de entrega"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={deliveryWindow}
                  onChange={(event) => setDeliveryWindow(event.target.value)}
                  placeholder="Horario de entrega"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={deliveryZone}
                  onChange={(event) => setDeliveryZone(event.target.value)}
                  placeholder="Zona"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={deliveryFee}
                  onChange={(event) => setDeliveryFee(Number(event.target.value))}
                  placeholder="Costo de delivery"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="online">Online</option>
                </select>
                <select
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="unpaid">Pendiente</option>
                  <option value="paid">Pagado</option>
                </select>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              {hasStockWarnings && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Hay productos con stock insuficiente. Puedes continuar bajo tu responsabilidad.
                </div>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Crear Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
