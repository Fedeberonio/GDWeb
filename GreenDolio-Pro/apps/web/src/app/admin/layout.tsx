import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

import { Container } from "@/app/_components/container";
import { AdminUserBadge } from "@/modules/admin/components/admin-user-badge";

export const metadata: Metadata = {
  title: "Panel Admin | Green Dolio",
};

const LINKS = [
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/boxes", label: "Cajas" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/requests", label: "Solicitudes" },
  { href: "/admin/history", label: "Historial" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 font-sans text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <Container className="flex items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg">
              <Image
                src="/images/boxes/box-3-allgreenxclusive-2-semanas.jpg"
                alt="Green Dolio"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-green-600">Green Dolio</p>
              <h1 className="text-lg font-semibold text-slate-900">Panel de administración</h1>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-3 py-1 transition hover:bg-green-100 hover:text-green-700">
                {link.label}
              </Link>
            ))}
          </nav>
          <AdminUserBadge />
        </Container>
      </header>
      <main className="py-10">
        <Container className="space-y-8">{children}</Container>
      </main>
    </div>
  );
}
