"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const LABELS: Record<string, string> = {
  admin: "Admin",
  products: "Productos",
  boxes: "Cajas",
  "box-rules": "Reglas de Cajas",
  supplies: "Insumos",
  orders: "Pedidos",
  finances: "Finanzas",
  history: "Historial",
  settings: "Configuración",
  requests: "Solicitudes",
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const items = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const label = LABELS[segment] ?? segment;
      return { href, label };
    });
    return items;
  }, [pathname]);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-[var(--gd-color-text-muted)]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-[var(--gd-color-forest)] font-semibold">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-[var(--gd-color-forest)] transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
              {!isLast && <span className="text-[var(--gd-color-text-muted)]">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
