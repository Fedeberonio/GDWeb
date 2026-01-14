import { notFound } from "next/navigation";
import { fetchProducts, fetchProductCategories } from "@/modules/catalog/api";
import { CategoryProductGrid } from "./_components/category-product-grid";
import { PrimaryNav } from "@/app/_components/primary-nav";


export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const [products, categories] = await Promise.all([
    fetchProducts(),
    fetchProductCategories(),
  ]);

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

// Generate static params for all categories
export async function generateStaticParams() {
  const categories = await fetchProductCategories();

  return categories
    .filter((cat) => cat.id !== "cajas")
    .map((category) => ({
      slug: category.slug,
    }));
}
