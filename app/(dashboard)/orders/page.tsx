import PageHeader from "@/app/components/PageHeader";
import OrdersClient, { type OrderRow } from "@/app/components/OrdersClient";
import { apiFetch } from "@/lib/api";

export default async function OrdersPage() {
  const { orders, totalRevenue } = await apiFetch<{
    orders: OrderRow[];
    totalRevenue: number;
  }>("/api/orders");

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
        actions={
          <button className="hidden sm:flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-sand-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <OrdersClient orders={orders} totalRevenue={totalRevenue} />
      </main>
    </>
  );
}
