"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { ShoppingReadonlyList } from "../components/shopping-readonly-list";
import { adminFetch } from "@/modules/admin/api/client";
import { AdminGuard } from "@/modules/admin/components/admin-guard";

export default function ShoppingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await adminFetch(`/api/admin/orders/${orderId}`);
        const json = await res.json();
        if (res.ok) {
          setOrder(json.data);
        }
      } catch (err) {
        console.error("Error loading order:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-gray-500">Cargando...</p>
          </div>
        </div>
      </AdminGuard>
    );
  }

  if (!order) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-red-600">Pedido no encontrado</p>
          </div>
        </div>
      </AdminGuard>
    );
  }

  const customerName = order.delivery?.address?.contactName || "Cliente";

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 print:bg-white">
        {/* Header - hidden when printing */}
        <div className="bg-white border-b border-gray-200 print:hidden sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Lista de Compras - Mercado
                  </h1>
                  <p className="text-sm text-gray-500">
                    Pedido #{orderId} • {customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Print Header - only visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold mb-2">Lista de Compras - Mercado</h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Pedido:</strong> #{orderId}</p>
            <p><strong>Cliente:</strong> {customerName}</p>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-DO')}</p>
          </div>
          <hr className="my-4 border-gray-300" />
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-6 print:p-0">
          <ShoppingReadonlyList orderId={orderId} />
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    </AdminGuard>
  );
}
