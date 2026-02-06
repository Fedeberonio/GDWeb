"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { adminFetch } from "@/modules/admin/api/client";
import { Eye, Mail, Phone, MapPin, X, Trash2 } from "lucide-react";

type CustomerStatus = "active" | "inactive";

type CustomerOrder = {
  id: string;
  date: string;
  status: string;
  total: number;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  sector?: string;
  ordersCount: number;
  totalSpent: number;
  status: CustomerStatus;
  avatarUrl?: string;
  orders: CustomerOrder[];
  addresses: string[];
};

type StatusState = "idle" | "loading" | "ready" | "error";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-DO", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function CustomersContent() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleDeleteCustomer = useCallback(
    async (customerId: string) => {
      const confirmed = window.confirm(
        "¿Estás seguro de que quieres eliminar este cliente y todos sus datos de acceso?",
      );
      if (!confirmed) return;

      try {
        const response = await adminFetch(`/api/admin/customers/${customerId}`, {
          method: "DELETE",
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(json?.error ?? "No se pudo eliminar el cliente");
        }
        setCustomers((prev) => prev.filter((customer) => customer.id !== customerId));
        setSelectedCustomer((prev) => (prev?.id === customerId ? null : prev));
        toast.success("Cliente eliminado correctamente");
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo eliminar el cliente";
        toast.error(message);
      }
    },
    [],
  );

  const loadCustomers = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);
      const response = await adminFetch("/api/admin/customers", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudieron cargar los clientes");
      }
      setCustomers(Array.isArray(json.data) ? json.data : []);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--gd-color-forest)]">Clientes</h1>
          <p className="text-sm text-[var(--gd-color-text-muted)]">
            Vista general de tu base de clientes, pedidos y valor total.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/60">
        {status === "loading" && (
          <div className="flex items-center justify-center p-12 text-sm text-[var(--gd-color-text-muted)]">
            Cargando clientes...
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center justify-center p-12 text-sm text-red-600">
            {error ?? "Error al cargar clientes"}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/60 border-b border-white/60">
              <tr>
                <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Cliente</th>
                <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Teléfono</th>
                <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Ubicación</th>
                <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Historial</th>
                <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Total Gastado</th>
                <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Estado</th>
                <th className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {customers.map((customer) => {
                const initials = customer.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();
                return (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer transition-colors hover:bg-white/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.avatarUrl ? (
                          <img
                            src={customer.avatarUrl}
                            alt={customer.name}
                            className="h-10 w-10 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--gd-color-sprout)]/50 text-sm font-semibold text-[var(--gd-color-forest)]">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[var(--gd-color-forest)]">{customer.name}</p>
                          <p className="text-xs text-[var(--gd-color-text-muted)]">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--gd-color-text-muted)]">
                      {customer.phone ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-[var(--gd-color-text-muted)]">
                      {customer.city ? `${customer.city}${customer.sector ? ` • ${customer.sector}` : ""}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-[var(--gd-color-text-muted)]">
                      {customer.ordersCount} Órdenes
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--gd-color-forest)]">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          customer.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {customer.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--gd-color-leaf)]/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--gd-color-forest)] hover:bg-[var(--gd-color-leaf)]/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteCustomer(customer.id);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {status === "ready" && customers.length === 0 && (
          <div className="flex items-center justify-center p-12 text-sm text-[var(--gd-color-text-muted)]">
            No hay clientes registrados todavía.
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-[10060]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedCustomer(null)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--gd-color-forest)]">Detalle de cliente</h2>
                <p className="text-xs text-[var(--gd-color-text-muted)]">{selectedCustomer.id}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{selectedCustomer.name}</p>
                <div className="flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                  <Mail className="h-4 w-4" />
                  {selectedCustomer.email}
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                    <Phone className="h-4 w-4" />
                    {selectedCustomer.phone}
                  </div>
                )}
                {(selectedCustomer.city || selectedCustomer.sector) && (
                  <div className="flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                    <MapPin className="h-4 w-4" />
                    {selectedCustomer.city}
                    {selectedCustomer.sector ? ` • ${selectedCustomer.sector}` : ""}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                  Historial de órdenes
                </h3>
                <div className="mt-3 space-y-3">
                  {selectedCustomer.orders.length === 0 ? (
                    <p className="text-sm text-[var(--gd-color-text-muted)]">
                      Sin órdenes registradas.
                    </p>
                  ) : (
                    selectedCustomer.orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{order.id}</p>
                          <p className="text-xs text-[var(--gd-color-text-muted)]">{formatDate(order.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--gd-color-text-muted)]">{order.status}</p>
                          <p className="text-sm font-semibold text-[var(--gd-color-forest)]">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                  Direcciones
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--gd-color-text-muted)]">
                  {selectedCustomer.addresses.length === 0 ? (
                    <li className="rounded-2xl border border-slate-200 bg-white p-3">
                      Sin direcciones registradas.
                    </li>
                  ) : (
                    selectedCustomer.addresses.map((address, index) => (
                      <li
                        key={`${selectedCustomer.id}-address-${index}`}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        {address}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default function CustomersPage() {
  return (
    <AdminGuard>
      <CustomersContent />
    </AdminGuard>
  );
}
