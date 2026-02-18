"use client";

import { useState } from "react";

import { AdminGuard } from "@/modules/admin/components/admin-guard";
import { adminFetch } from "@/modules/admin/api/client";

export default function MigrateSaladsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function checkSalads() {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/migrate-salads-to-products");
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  async function runMigration() {
    if (!confirm("¿Estás seguro? Esto creará 47 productos ingredientes y convertirá 7 ensaladas.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/migrate-salads-to-products", {
        method: "POST",
      });
      const data = await res.json();
      setResult(data);

      if (data.success) {
        const r = data.results;
        const message = `✅ Migración completa!\n\nCategorías: ${r.categoryCreated ? "✅" : "❌"} ensaladas, ${r.ingredientCategoryCreated ? "✅" : "❌"} ingredientes\nIngredientes creados: ${r.ingredientsCreated}/47\nEnsaladas convertidas: ${r.saladsConverted}/7\n\n${r.errors.length > 0 ? `\n⚠️ ERRORES (${r.errors.length}):\n${r.errors.join("\n")}` : ""}`;
        alert(message);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult({ error: String(error) });
      alert(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Migrar Ensaladas → Productos Preparados</h1>
          <p className="text-gray-600 mb-6">Esta migración creará:</p>

          <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">
            <li>
              <strong>2 categorías:</strong> "ensaladas" e "ingredientes"
            </li>
            <li>
              <strong>47 productos ingredientes</strong> (Lechuga, Arroz, etc.)
            </li>
            <li>
              <strong>7 ensaladas como productos preparados</strong> con recetas completas
            </li>
            <li>
              <strong>Tipos:</strong> ensaladas = type:"prepared", ingredientes = type:"simple"
            </li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Nota:</strong> Esto NO borra la colección "salads" ni la página /admin/salads.
              Eso lo haremos en FASE 2 después de verificar que todo funciona.
            </p>
          </div>

          <button
            onClick={checkSalads}
            className="mr-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔍 Verificar Ensaladas en Firestore
          </button>
          <button
            onClick={runMigration}
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {loading ? "Migrando..." : "🚀 Ejecutar Migración FASE 1"}
          </button>

          {result && (
            <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
              <h2 className="text-xl font-bold mb-4">{result.success ? "✅ Resultado" : "❌ Error"}</h2>
              <pre className="text-sm overflow-auto bg-gray-50 p-4 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
