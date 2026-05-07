import PageHeader from "@/app/components/PageHeader";
import ProductsClient from "@/app/components/ProductsClient";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/supabase";

export default async function ProductsPage() {
  const { products } = await apiFetch<{ products: Product[] }>("/api/products");

  return (
    <>
      <PageHeader title="Products" subtitle="Manage your product catalog" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <ProductsClient products={products} />
      </main>
    </>
  );
}
