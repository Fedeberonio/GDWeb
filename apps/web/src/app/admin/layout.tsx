"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Settings,
  LayoutDashboard,
  Warehouse,
  DollarSign,
  Truck,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AdminUserBadge } from "@/modules/admin/components/admin-user-badge";
import { AdminBreadcrumbs } from "@/modules/admin/components/breadcrumbs";
import { AdminGuard } from "@/modules/admin/components/admin-guard";

const SIDEBAR_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Pedidos", icon: Truck },
  { href: "/admin/shopping", label: "Preparación Pedidos", icon: ShoppingCart },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/supplies", label: "Insumos", icon: Warehouse },
  { href: "/admin/customers", label: "Clientes", icon: Users },
  { href: "/admin/finances", label: "Finanzas", icon: DollarSign },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPrintView =
    !!pathname &&
    pathname.includes("/admin/orders/") &&
    (pathname.endsWith("/invoice") || pathname.endsWith("/print"));

  useEffect(() => {
    if (isPrintView) return;
    if (typeof window === "undefined") return;
    const flagKey = "gd_admin_welcome_shown";
    if (window.sessionStorage.getItem(flagKey)) return;
    toast.success("Bienvenid@s! Pupi/Fede!");
    window.sessionStorage.setItem(flagKey, "1");
  }, [isPrintView]);

  if (isPrintView) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-white">{children}</div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[var(--gd-color-beige)] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/60 backdrop-blur-xl border-r border-white/40 shadow-lg">
        {/* Logo */}
        <div className="p-6 border-b border-white/40">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-md">
              <Image
                src="/assets/images/boxes/GD-CAJA-003.png"
                alt="Green Dolio"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">
                Green Dolio
              </p>
              <p className="text-sm font-medium text-[var(--gd-color-text)]">ERP Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
                    ? "bg-[var(--gd-color-sprout)]/50 text-[var(--gd-color-forest)] shadow-md border border-[var(--gd-color-leaf)]/30"
                    : "text-[var(--gd-color-text-muted)] hover:bg-white/50 hover:text-[var(--gd-color-forest)]"
                  }`}
              >
                {isActive && (
                  <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--gd-color-leaf)]" />
                )}
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium text-sm">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Badge */}
        <div className="p-4 border-t border-white/40">
          <AdminUserBadge />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-white/40 shadow-2xl z-50 lg:hidden flex flex-col">
            <div className="p-6 border-b border-white/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-md">
                  <Image
                    src="/assets/images/boxes/GD-CAJA-003.png"
                    alt="Green Dolio"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gd-color-forest)]">
                    Green Dolio
                  </p>
                  <p className="text-xs font-medium text-[var(--gd-color-text)]">ERP Admin</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-white/50 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5 text-[var(--gd-color-text-muted)]" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {SIDEBAR_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
                        ? "bg-[var(--gd-color-sprout)]/50 text-[var(--gd-color-forest)] shadow-md border border-[var(--gd-color-leaf)]/30"
                        : "text-[var(--gd-color-text-muted)] hover:bg-white/50 hover:text-[var(--gd-color-forest)]"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[var(--gd-color-leaf)]" />
                    )}
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="font-medium text-sm">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/40">
              <AdminUserBadge />
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden glass-panel border-b border-white/40 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6 text-[var(--gd-color-forest)]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                <Image
                  src="/assets/images/boxes/GD-CAJA-003.png"
                  alt="Green Dolio"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gd-color-forest)]">
                Green Dolio ERP
              </p>
            </div>
            <AdminUserBadge />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="hidden lg:flex justify-end mb-4">
              <div className="glass-panel rounded-2xl border border-white/60 px-4 py-2 shadow-sm">
                <AdminUserBadge />
              </div>
            </div>
            <AdminBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
      </div>
    </AdminGuard>
  );
}
