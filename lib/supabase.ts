// Types only — Supabase client removed.
// All database access now goes through the backend API.

export type Order = {
  id: number;
  order_number: string;
  customer_id: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  tracking_id: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  pincode: string;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_name: string;
  quantity: number;
  price: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  slug: string;
  is_active: boolean;
  type: string;
};

export type OrderWithCustomer = Order & {
  customers: Pick<Customer, "name" | "phone"> | null;
  order_items: { id: number }[];
};

// ── Formatting helpers (no server dependencies — safe for all runtimes) ──────

export function formatCurrency(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}
