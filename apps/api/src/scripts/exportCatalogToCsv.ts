import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { getDb } from "../lib/firestore";

dotenv.config();

type ProductDoc = Record<string, any>;

function csvEscape(value: string): string {
  if (value.includes("\"") || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function toYesNo(value: boolean | undefined): string {
  return value ? "Sí" : "No";
}

function resolvePrice(price: unknown): number | "" {
  if (typeof price === "number") return price;
  if (price && typeof price === "object" && typeof (price as any).amount === "number") {
    return (price as any).amount;
  }
  return "";
}

function resolveUnit(unit: unknown): string {
  if (!unit) return "";
  if (typeof unit === "string") return unit;
  if (typeof unit === "object") {
    const localized = unit as Record<string, string>;
    return localized.es || localized.en || "";
  }
  return "";
}

function resolveLocalized(value: unknown, locale: "es" | "en"): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const localized = value as Record<string, string>;
    return localized[locale] || "";
  }
  return "";
}

function resolveTags(tags: unknown): string {
  if (!Array.isArray(tags)) return "";
  return tags.filter((tag) => typeof tag === "string").join(", ");
}

async function run() {
  const outputPath = path.resolve(__dirname, "../../../../database_backup/master_products_VERIFIED_V1.csv");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const headers = [
    "SKU",
    "Nombre_Producto",
    "Marketing_Tier",
    "Duration",
    "Unit_Size",
    "Nombre_Producto_EN",
    "Categoria",
    "Subcategoria",
    "Dimensiones_Caja",
    "Precio_DOP",
    "Unidad_Venta",
    "Peso_En_Libras",
    "Precio_Por_Libra",
    "Precio_Calculado_Por_Peso",
    "Origen",
    "Proveedor_Principal",
    "Proveedor_Alternativo",
    "Precio_Compra",
    "Margen_Ganancia_%",
    "Frecuencia_Compra",
    "Contacto_Proveedor",
    "Organico",
    "Temporada",
    "Stock_Disponible",
    "Descripcion_Corta",
    "Descripcion_Corta_EN",
    "Valor_Nutricional",
    "Vida_Util",
    "Almacenamiento",
    "Empaque",
    "Apto_Vegano",
    "Libre_Gluten",
    "URL_Imagen",
    "Destacado_Web",
    "Orden_Prioridad",
    "Tags",
    "Notas_Internas",
    "Activo",
    "Fecha_Actualizacion",
  ];

  const snapshot = await getDb().collection("catalog_products").get();
  const rows: string[] = [];
  rows.push(headers.join(","));

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as ProductDoc;
    const weightKg = data?.logistics?.weightKg;
    const weightLb = typeof weightKg === "number" ? (weightKg * 2.20462).toFixed(3) : "";

    const record: Record<string, string> = {
      SKU: doc.id,
      Nombre_Producto: resolveLocalized(data.name, "es"),
      Marketing_Tier: data?.attributes?.marketingTier ?? "",
      Duration: data?.attributes?.duration ?? "",
      Unit_Size: data?.attributes?.unitSize ?? "",
      Nombre_Producto_EN: resolveLocalized(data.name, "en"),
      Categoria: data?.categoryId ?? "",
      Subcategoria: "",
      Dimensiones_Caja: "",
      Precio_DOP: String(resolvePrice(data.price)),
      Unidad_Venta: resolveUnit(data.unit),
      Peso_En_Libras: weightLb,
      Precio_Por_Libra: "",
      Precio_Calculado_Por_Peso: "",
      Origen: "",
      Proveedor_Principal: "",
      Proveedor_Alternativo: "",
      Precio_Compra: data?.metadata?.wholesaleCost ? String(data.metadata.wholesaleCost) : "",
      "Margen_Ganancia_%": "",
      Frecuencia_Compra: "",
      Contacto_Proveedor: "",
      Organico: toYesNo(!!data?.nutrition?.organic),
      Temporada: "",
      Stock_Disponible: "",
      Descripcion_Corta: resolveLocalized(data.description, "es"),
      Descripcion_Corta_EN: resolveLocalized(data.description, "en"),
      Valor_Nutricional: "",
      Vida_Util: "",
      Almacenamiento: resolveLocalized(data?.logistics?.storage, "es"),
      Empaque: "",
      Apto_Vegano: toYesNo(!!data?.nutrition?.vegan),
      Libre_Gluten: toYesNo(!!data?.nutrition?.glutenFree),
      URL_Imagen: data?.image ?? data?.image_url ?? "",
      Destacado_Web: toYesNo(!!data?.isFeatured),
      Orden_Prioridad: "",
      Tags: resolveTags(data?.tags),
      Notas_Internas: "",
      Activo: data?.status === "active" ? "Sí" : "No",
      Fecha_Actualizacion: new Date().toISOString(),
    };

    const line = headers
      .map((header) => {
        const value = record[header] ?? "";
        return csvEscape(String(value));
      })
      .join(",");
    rows.push(line);
  });

  fs.writeFileSync(outputPath, rows.join("\n"), "utf-8");
  console.log(`Exported ${snapshot.size} products to ${outputPath}`);
}

run().catch((error) => {
  console.error("Failed to export catalog to CSV:", error);
  process.exit(1);
});
