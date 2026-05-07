import PageHeader from "@/app/components/PageHeader";
import CustomersClient, { type CustomerRow } from "@/app/components/CustomersClient";
import { apiFetch } from "@/lib/api";

export default async function CustomersPage() {
  const { customers } = await apiFetch<{ customers: CustomerRow[] }>("/api/customers");

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customer${customers.length !== 1 ? "s" : ""}`}
        actions={
          <button className="hidden sm:flex items-center gap-2 bg-sand-100 hover:bg-sand-200 text-espresso-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-sand-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export CSV
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <CustomersClient customers={customers} />
      </main>
    </>
  );
}
