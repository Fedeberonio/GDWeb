"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  FileText,
  Plus,
  TrendingUp,
  ShoppingCart,
  Calendar,
  AlertCircle,
} from "lucide-react";

import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { adminFetch } from "@/modules/admin/api/client";
import { ManualSaleWizard } from "@/modules/admin/finances/components/manual-sale-wizard";
import { InvoiceGenerator } from "@/modules/admin/finances/components/invoice-generator";

type FinancialSummary = {
  totalWebSales: number;
  totalManualSales: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
};

function FinancesContent() {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalWebSales: 0,
    totalManualSales: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showManualSale, setShowManualSale] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      const summaryRes = await adminFetch("/api/admin/finances/summary", { cache: "no-store" });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        const data = summaryData?.data ?? {};
        setSummary({
          totalWebSales: data.totalWebSales ?? 0,
          totalManualSales: data.totalManualSales ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
          pendingInvoices: data.pendingInvoices ?? 0,
          paidInvoices: data.paidInvoices ?? 0,
        });
      }
    } catch (err) {
      console.error("Error cargando datos financieros:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--gd-color-forest)] mb-1">Finanzas y Facturación</h2>
            <p className="text-sm text-[var(--gd-color-text-muted)]">
              Gestión de ventas, facturas y contabilidad
            </p>
          </div>
          <button
            onClick={() => setShowManualSale(true)}
            className="px-6 py-3 rounded-xl bg-[var(--gd-color-leaf)] text-white font-medium text-sm hover:bg-[var(--gd-color-forest)] transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Venta Manual
          </button>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[var(--gd-color-text-muted)]">Ventas Web</p>
            <ShoppingCart className="h-5 w-5 text-[var(--gd-color-leaf)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
            {formatCurrency(summary.totalWebSales)}
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[var(--gd-color-text-muted)]">Ventas Manuales</p>
            <FileText className="h-5 w-5 text-[var(--gd-color-leaf)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
            {formatCurrency(summary.totalManualSales)}
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[var(--gd-color-text-muted)]">Ingresos Totales</p>
            <TrendingUp className="h-5 w-5 text-[var(--gd-color-leaf)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--gd-color-forest)]">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[var(--gd-color-text-muted)]">Facturas Pendientes</p>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{summary.pendingInvoices}</p>
        </div>
      </div>

      {/* Sección de Facturas */}
      <div className="glass-panel rounded-3xl p-6 shadow-lg border border-white/60">
        <h2 className="text-lg font-semibold text-[var(--gd-color-forest)] mb-4">Generar Factura</h2>
        <p className="text-sm text-[var(--gd-color-text-muted)] mb-4">
          Selecciona un pedido para generar su factura en PDF
        </p>
        <InvoiceGenerator orderId={selectedOrder} onOrderSelect={setSelectedOrder} />
      </div>

      {/* Wizard de Venta Manual */}
      {showManualSale && (
        <ManualSaleWizard
          isOpen={showManualSale}
          onClose={() => setShowManualSale(false)}
          onSaleCreated={loadFinancialData}
        />
      )}
    </div>
  );
}

export default function AdminFinancesPage() {
  return (
    <AdminGuard>
      <FinancesContent />
    </AdminGuard>
  );
}
