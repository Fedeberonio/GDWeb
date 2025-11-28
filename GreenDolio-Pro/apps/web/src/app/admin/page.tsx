"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";

type CountsState = {
  productCount: number;
  boxCount: number;
  requestCount: number;
  pendingRequests: number;
};

type StatusState = "idle" | "loading" | "ready" | "error";

function DashboardContent() {
  const [counts, setCounts] = useState<CountsState>({
    productCount: 0,
    boxCount: 0,
    requestCount: 0,
    pendingRequests: 0,
  });
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setStatus("loading");
        setError(null);

        const [productsRes, boxesRes, requestsRes] = await Promise.all([
          adminFetch("/api/admin/catalog/products", { cache: "no-store" }),
          adminFetch("/api/admin/catalog/boxes", { cache: "no-store" }),
          adminFetch("/api/admin/box-builder/requests?limit=100", { cache: "no-store" }),
        ]);

        if (!productsRes.ok || !boxesRes.ok || !requestsRes.ok) {
          throw new Error("No se pudo cargar el resumen del catálogo");
        }

        const [{ data: products }, { data: boxes }, { data: requests }] = await Promise.all([
          productsRes.json(),
          boxesRes.json(),
          requestsRes.json(),
        ]);

        const requestsArray = Array.isArray(requests) ? requests : [];
        const pending = requestsArray.filter((request) => request.status === "pending").length;

        setCounts({
          productCount: Array.isArray(products) ? products.length : 0,
          boxCount: Array.isArray(boxes) ? boxes.length : 0,
          requestCount: requestsArray.length,
          pendingRequests: pending,
        });
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
        setStatus("error");
      }
    }

    load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-white to-green-50 p-6 shadow-soft">
        <div className="absolute right-0 top-0 h-32 w-32 opacity-10">
          <Image
            src="/images/boxes/box-3-allgreenxclusive-2-semanas.jpg"
            alt=""
            fill
            className="object-cover"
            aria-hidden="true"
          />
        </div>
        <div className="relative">
          <h2 className="text-xl font-semibold text-slate-900">Resumen rápido</h2>
          <p className="mt-2 text-sm text-slate-600">
            Desde aquí puedes administrar el catálogo sin depender del Excel. Actualiza precios, descripciones e imágenes de
            productos y cajas.
          </p>

          {status === "loading" && <p className="mt-4 text-sm text-slate-500">Cargando métricas...</p>}
          {status === "error" && error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link
              href="/admin/products"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="absolute right-2 top-2 h-16 w-16 opacity-5 transition-opacity group-hover:opacity-10">
                <Image
                  src="/images/products/arroz-blanco.jpg"
                  alt=""
                  fill
                  className="object-cover rounded-lg"
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-500">Productos</p>
                <p className="text-3xl font-semibold text-slate-900">{counts.productCount}</p>
                <p className="mt-4 inline-flex text-sm font-semibold text-green-700 group-hover:underline">
                  Gestionar productos →
                </p>
              </div>
            </Link>
            <Link
              href="/admin/boxes"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="absolute right-2 top-2 h-16 w-16 opacity-5 transition-opacity group-hover:opacity-10">
                <Image
                  src="/images/boxes/box-1-caribbean-fresh-pack-3-dias.jpg"
                  alt=""
                  fill
                  className="object-cover rounded-lg"
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-500">Cajas</p>
                <p className="text-3xl font-semibold text-slate-900">{counts.boxCount}</p>
                <p className="mt-4 inline-flex text-sm font-semibold text-green-700 group-hover:underline">
                  Gestionar cajas →
                </p>
              </div>
            </Link>
            <Link
              href="/admin/requests"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="absolute right-2 top-2 h-16 w-16 opacity-5 transition-opacity group-hover:opacity-10">
                <Image
                  src="/images/boxes/box-2-island-weekssential-1-semana.jpg"
                  alt=""
                  fill
                  className="object-cover rounded-lg"
                  aria-hidden="true"
                />
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-slate-500">Solicitudes del builder</p>
                <p className="text-3xl font-semibold text-slate-900">{counts.requestCount}</p>
                <p className="text-xs text-slate-500">Pendientes: {counts.pendingRequests}</p>
                <p className="mt-4 inline-flex text-sm font-semibold text-green-700 group-hover:underline">
                  Revisar solicitudes →
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-green-200 bg-green-50 p-6 text-sm text-green-900">
        <p className="font-semibold">Próximos pasos recomendados</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Habilitar autenticación obligatoria antes de desplegar el panel en producción.</li>
          <li>Agregar subida de imágenes a Firebase Storage o Cloudinary desde este panel.</li>
          <li>Sumar historial de cambios y control de versiones de precios.</li>
        </ul>
      </div>
    </section>
  );
}

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
