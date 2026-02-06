"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Heart,
  Mail,
  MapPin,
  Phone,
  ThumbsDown,
  User,
} from "lucide-react";
import { AdminGuard } from "@/modules/admin/components/admin-guard";

type CustomerOrder = {
  id: string;
  date: string;
  status: string;
  total: number;
  items: Array<{ name: string; qty: number }>;
};

type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  memberSince: string;
  referralSource: string;
  location: {
    address: string;
    sector: string;
    city: string;
  };
  totalSpent: number;
  totalOrders: number;
  likes: string[];
  dislikes: string[];
  orders: CustomerOrder[];
};

const mockCustomerProfile: CustomerProfile = {
  id: "cust-001",
  name: "María López",
  email: "maria.lopez@email.com",
  phone: "809-555-1144",
  memberSince: "2024-03-15",
  referralSource: "Instagram / Recomendación de amigos",
  location: {
    address: "Calle Max Henríquez Ureña #44",
    sector: "Naco",
    city: "Santo Domingo",
  },
  totalSpent: 45200,
  totalOrders: 24,
  likes: ["🥑 Aguacate", "🍓 Fresas", "🥬 Rúcula", "🍋 Limón"],
  dislikes: ["🧅 Cebolla", "🥕 Zanahoria"],
  orders: [
    {
      id: "ORD-1284",
      date: "2026-01-29",
      status: "Entregado",
      total: 1650,
      items: [
        { name: "Caja Mix", qty: 1 },
        { name: "Miel Orgánica", qty: 1 },
      ],
    },
    {
      id: "ORD-1271",
      date: "2026-01-21",
      status: "Entregado",
      total: 1890,
      items: [{ name: "Caja Mix", qty: 1 }],
    },
    {
      id: "ORD-1260",
      date: "2026-01-12",
      status: "Entregado",
      total: 1420,
      items: [
        { name: "Caja Frutas", qty: 1 },
        { name: "Granola Artesanal", qty: 1 },
      ],
    },
    {
      id: "ORD-1244",
      date: "2025-12-28",
      status: "Entregado",
      total: 1560,
      items: [{ name: "Caja Mix", qty: 1 }],
    },
  ],
};

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
    year: "numeric",
  }).format(date);
}

function getFavorites(orders: CustomerOrder[]) {
  const counts = new Map<string, number>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      counts.set(item.name, (counts.get(item.name) ?? 0) + item.qty);
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count], index) => `${index + 1}. ${name} (${count} veces)`);
}

function CustomerProfileContent({ customer }: { customer: CustomerProfile }) {
  const ticketPromedio = customer.totalOrders
    ? customer.totalSpent / customer.totalOrders
    : 0;
  const favorites = getFavorites(customer.orders);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">
            Perfil de cliente
          </p>
          <h1 className="text-2xl font-semibold text-[var(--gd-color-forest)]">
            {customer.name}
          </h1>
        </div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--gd-color-forest)] shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Left column */}
        <div className="space-y-6">
          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--gd-color-sprout)]/40 text-[var(--gd-color-forest)]">
                <User className="h-10 w-10" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--gd-color-forest)]">{customer.name}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-[var(--gd-color-text-muted)]">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-[var(--gd-color-text-muted)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Miembro desde {formatDate(customer.memberSince)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {customer.referralSource}
              </div>
            </div>
          </div>

          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
              Ubicación
            </h3>
            <div className="mt-4 space-y-2 text-sm text-[var(--gd-color-text-muted)]">
              <p>{customer.location.address}</p>
              <p>{customer.location.sector}</p>
              <p>{customer.location.city}</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-organic bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">
                Total Gastado
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
                {formatCurrency(customer.totalSpent)}
              </p>
            </div>
            <div className="rounded-organic bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">
                Total Órdenes
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
                {customer.totalOrders}
              </p>
            </div>
            <div className="rounded-organic bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--gd-color-text-muted)]">
                Ticket Promedio
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--gd-color-forest)]">
                {formatCurrency(ticketPromedio)}
              </p>
            </div>
          </div>

          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-[var(--gd-color-leaf)]" />
              <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                Preferencias
              </h3>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-[var(--gd-color-text-muted)]">Loves</p>
                {customer.likes.length === 0 ? (
                  <p className="text-sm text-[var(--gd-color-text-muted)]">Sin preferencias registradas</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customer.likes.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <p className="text-xs text-[var(--gd-color-text-muted)]">Hates</p>
                </div>
                {customer.dislikes.length === 0 ? (
                  <p className="text-sm text-[var(--gd-color-text-muted)]">Sin preferencias registradas</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customer.dislikes.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 line-through"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[var(--gd-color-forest)]" />
              <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
                Productos Favoritos
              </h3>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[var(--gd-color-text-muted)]">
              {favorites.length === 0 ? (
                <p>Sin historial suficiente para mostrar favoritos.</p>
              ) : (
                favorites.map((item) => <p key={item}>{item}</p>)
              )}
            </div>
          </div>

          <div className="rounded-organic bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-[var(--gd-color-forest)] uppercase tracking-[0.3em]">
              Órdenes recientes
            </h3>
            <div className="mt-4 space-y-3">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--gd-color-forest)]">{order.id}</p>
                    <p className="text-xs text-[var(--gd-color-text-muted)]">
                      {formatDate(order.date)} • {order.status}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--gd-color-forest)]">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CustomerProfilePage() {
  return (
    <AdminGuard>
      <CustomerProfileContent customer={mockCustomerProfile} />
    </AdminGuard>
  );
}
