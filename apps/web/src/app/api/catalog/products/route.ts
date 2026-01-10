import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/config/env";
import productMetadata from "@/data/productMetadata.json";

// Mapeo completo de slugs a rutas de imagen
const IMAGE_MAPPING: Record<string, string> = {
  'baba-ganoush-16-oz': '/images/products/baba-ganoush-16-oz.jpg',
  'hummus-16-oz': '/images/products/hummus-16-oz.jpg',
  'guacamole-16-oz': '/images/products/guacamole-16-oz.jpg',
  'chimichurri-9-5-oz': '/images/products/chimichurri-95-oz.png',
  'pepinada-1-porcion': '/images/products/Pepinada.jpg',
  'tropicalote-1-porcion': '/images/products/Tropicalote.jpg',
  'rosa-maravillosa-1-porcion': '/images/products/Rosa Maravillosa.jpg',
  'china-chinola-1-porcion': '/images/products/China Chinola.jpg',
  'huevos-blancos-12-unidades': '/images/products/huevos-blancos-12-unidades.png',
  'huevos-de-color-12-unidades': '/images/products/huevos-de-color-12-unidades.png',
  'huevos-de-campo-organicos-12-unidades': '/images/products/huevos-de-campo-organicos-12-unidades.jpg',
  'miel-pura-de-abejas-6-5-oz': '/images/products/miel-pura-de-abejas-65-oz.png',
  'miel-organica-con-panal-12-oz': '/images/products/miel-organica-con-panal-12-oz.png',
  'aceite-de-oliva-sabor-ajo-400-cc': '/images/products/aceite-de-oliva-sabor-ajo-400-cc.jpg',
  'aceite-de-oliva-extra-virgen-importado-3-litros': '/images/products/aceite-de-oliva-extra-virgen-importado-3-litros.jpg',
  'quinoa-16-oz': '/images/products/quinoa-16-oz.jpg',
  'arroz-blanco-400-gr': '/images/products/arroz-blanco-400-gr.jpg',
  'arroz-integral-1-libra': '/images/products/arroz-integral-1-libra.jpg',
  'lentejas-400-gr': '/images/products/lentejas-400-gr.jpg',
  'habichuelas-rojas-negras-blancas-400-gr': '/images/products/habichuelas-rojasnegrasblancas-400-gr.jpg',
  'aguacate': '/images/products/aguacate.jpg',
  'mandarina': '/images/products/Mandarinas.jpg',
  'chinola': '/images/products/chinola.jpg',
  'platano-maduro': '/images/products/Platano maduro.jpg',
  'pina-pequena': '/images/products/Pina pequena.jpg',
  'fresas-aprox-14-15': '/images/products/fresas-aprox-14-15.jpg',
  'mango': '/images/products/mango.jpg',
  'coco': '/images/products/coco.jpg',
  'lechosa': '/images/products/lechosa.jpg',
  'banana': '/images/products/banana.jpg',
  'cerezas': '/images/products/cerezas.jpg',
  'manzana': '/images/products/Manzanas.jpg',
  'sandia': '/images/products/sandia.jpg',
  'melon': '/images/products/melon.jpg',
  'melon-frances': '/images/products/Melon frances.jpg',
  'pitahaya': '/images/products/pitahaya.jpg',
  'uvas-blancas': '/images/products/Uvas blancas.jpg',
  'uvas-moradas': '/images/products/Uvas moradas.jpg',
  'naranja': '/images/products/Naranjas.jpg',
  'carambola': '/images/products/carambola.jpg',
  'tomate-bugalu': '/images/products/Tomate bugalu.jpg',
  'papas': '/images/products/papas.jpg',
  'platano-verde': '/images/products/Platano verde.jpg',
  'lechuga-rizada': '/images/products/Lechuga rizada.jpg',
  'calabaza': '/images/products/calabaza.jpg',
  'berenjena': '/images/products/berenjena.jpg',
  'lechuga-repollada': '/images/products/Lechuga repollada.jpg',
  'lechuga-romana': '/images/products/Lechuga romana.jpg',
  'rabano': '/images/products/rabano.jpg',
  'pepino': '/images/products/pepino.jpg',
  'guineo-verde': '/images/products/Guineo verde.jpg',
  'yuca': '/images/products/yuca.jpg',
  'repollo-blanco': '/images/products/Repollo blanco.jpg',
  'repollo-morado': '/images/products/Repollo morado.jpg',
  'tomate-redondo': '/images/products/Tomate redondo.jpg',
  'coliflor': '/images/products/coliflor.jpg',
  'brocoli': '/images/products/brocoli.jpg',
  'ajo': '/images/products/ajo.jpg',
  'cebolla-morada-amarilla': '/images/products/Cebolla morada amarilla.jpg',
  'zanahoria': '/images/products/zanahoria.jpg',
  'batata': '/images/products/batata.jpg',
  'aji-morron': '/images/products/Aji morron.jpg',
  'maiz': '/images/products/maiz.jpg',
  'limon': '/images/products/limon.jpg',
  'zucchini': '/images/products/zucchini.jpg',
  'cilantro': '/images/products/cilantro.jpg',
  'jengibre': '/images/products/jengibre.jpg',
  'oregano': '/images/products/oregano.jpg',
  'perejil': '/images/products/perejil.jpg',
  'romero': '/images/products/romero.jpg',
  'apio': '/images/products/apio.jpg',
  'anis-estrellado': '/images/products/Anis estrellado.jpg',
  'laurel': '/images/products/laurel.jpg',
  'pimienta-negra-entera': '/images/products/Pimienta negra entera.jpg',
  'clavo-dulce': '/images/products/Clavo dulce.jpg',
};

// Función helper para generar rutas de imagen con múltiples variaciones
function getImagePath(slug: string, name?: string): string {
  // Buscar en el mapeo primero
  if (IMAGE_MAPPING[slug]) {
    return IMAGE_MAPPING[slug];
  }
  
  // Generar variaciones del nombre si está disponible
  if (name) {
    const nameNormalized = name
      .replace(/\(.*?\)/g, "") // Remover paréntesis y su contenido
      .trim();
    const nameCapitalized = nameNormalized
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    // Intentar con el nombre capitalizado
    const nameVariations = [
      `/images/products/${nameCapitalized}.jpg`,
      `/images/products/${nameNormalized.toLowerCase()}.jpg`,
      `/images/products/${nameNormalized.toLowerCase().replace(/\s+/g, "-")}.jpg`,
    ];
    
    // El componente ProductImageFallback intentará todas estas variaciones
    return nameVariations[0];
  }
  
  // Fallback: intentar con el slug directamente
  // El componente Image manejará el error si no existe y mostrará fallback
  return `/images/products/${slug}.jpg`;
}

// Convertir productMetadata a formato Product
const staticProducts = productMetadata.map((item) => {
  return {
    id: item.slug,
    slug: item.slug,
    sku: item.slug, // Usar slug como SKU ya que no existe en productMetadata
    name: {
      es: item.name,
      en: item.name,
    },
    description: {
      es: `${item.name} frescos de alta calidad.`,
      en: `Fresh high quality ${item.name}.`,
    },
    unit: {
      es: "unidad",
      en: "unit",
    },
    categoryId: item.category,
    price: {
      amount: item.wholesaleCost || 0,
      currency: "DOP",
    },
    status: "active" as const,
    // Generar ruta de imagen basada en el slug
    image: getImagePath(item.slug, item.name),
    tags: [],
    isFeatured: false,
    nutrition: {
      vegan: true,
      glutenFree: true,
      organic: false,
    },
    logistics: {
      weightKg: item.weightKg,
      storage: {
        es: "Refrigerado",
        en: "Refrigerated",
      },
    },
  };
});

export async function GET() {
  // Durante build time, usar datos estáticos directamente
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
    return NextResponse.json({ data: staticProducts });
  }

  try {
    const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

    // Si no hay URL de API configurada, usar datos estáticos
    if (!NEXT_PUBLIC_API_BASE_URL || NEXT_PUBLIC_API_BASE_URL.includes("localhost")) {
      return NextResponse.json({ data: staticProducts });
    }

    const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/catalog/products`, {
      cache: "force-cache",
      signal: AbortSignal.timeout(2000), // Timeout de 2 segundos
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // Si falla, usar datos estáticos
    console.warn("Failed to fetch products from API, using static data:", error);
    return NextResponse.json({ data: staticProducts });
  }
}

