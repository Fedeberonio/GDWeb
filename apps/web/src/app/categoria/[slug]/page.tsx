import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CategoryProductGrid } from "./_components/category-product-grid";
import { PrimaryNav } from "@/app/_components/primary-nav";
import type { Product, ProductCategory } from "@/modules/catalog/types";


export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";
  const [productsRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/api/catalog/products`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/catalog/categories`, { cache: "no-store" }),
  ]);
  const [productsJson, categoriesJson] = await Promise.all([
    productsRes.json(),
    categoriesRes.json(),
  ]);
  const products = (productsJson?.data ?? []) as Product[];
  const categories = (categoriesJson?.data ?? []) as ProductCategory[];

  // Find category by slug
  const category = categories.find((cat) => cat.slug === slug);

  if (!category) {
    notFound();
  }

  // Filter products by category
  const categoryProducts = products.filter((p) => p.categoryId === category.id);

  return (
    <div className="relative">
      <PrimaryNav />
      <main className="min-h-screen bg-gradient-to-b from-white via-[var(--gd-color-leaf)]/5 to-white pt-20">
        <CategoryProductGrid
          category={category}
          products={categoryProducts}
          allCategories={categories}
        />
      </main>
    </div>
  );
}
