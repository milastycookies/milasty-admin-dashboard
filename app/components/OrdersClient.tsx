"use client";

import { useState } from "react";
import { formatCurrency, formatDate, type Order, type Customer } from "@/lib/supabase";

export type OrderRow = Order & {
  customers: Pick<Customer, "name" | "phone"> | null;
  order_items: { id: number }[];
};

const orderStatusStyle: Record<string, string> = {
  placed:     "bg-amber-warm/15 text-amber-warm ring-1 ring-amber-warm/30",
  dispatched: "bg-teal-muted/15 text-teal-muted ring-1 ring-teal-muted/30",
  delivered:  "bg-olive-500/15 text-olive-600 ring-1 ring-olive-500/30",
  cancelled:  "bg-terracotta-500/15 text-terracotta-600 ring-1 ring-terracotta-500/30",
};
const paymentStatusStyle: Record<string, string> = {
  paid:     "bg-olive-500/15 text-olive-600 ring-1 ring-olive-500/30",
  pending:  "bg-amber-warm/15 text-amber-warm ring-1 ring-amber-warm/30",
  failed:   "bg-terracotta-500/15 text-terracotta-600 ring-1 ring-terracotta-500/30",
  refunded: "bg-sand-300/60 text-espresso-700 ring-1 ring-sand-400/50",
};

function badge(map: Record<string, string>, key: string) {
  return map[key] ?? "bg-sand-200 text-espresso-600 ring-1 ring-sand-300";
}

const ORDER_TABS = ["All", "placed", "dispatched", "delivered", "cancelled"] as const;
type OrderTab = (typeof ORDER_TABS)[number];

const statCards = [
  { key: "all",        label: "Total Orders", color: "bg-terracotta-500" },
  { key: "placed",     label: "Placed",       color: "bg-amber-warm"     },
  { key: "dispatched", label: "Dispatched",   color: "bg-teal-muted"     },
  { key: "delivered",  label: "Delivered",    color: "bg-olive-500"      },
];

type Props = { orders: OrderRow[]; totalRevenue: number };

export default function OrdersClient({ orders, totalRevenue }: Props) {
  const [activeTab, setActiveTab] = useState<OrderTab>("All");

  const filtered = activeTab === "All" ? orders : orders.filter((o) => o.order_status === activeTab);

  const countByStatus = (key: string) =>
    key === "all" ? orders.length : orders.filter((o) => o.order_status === key).length;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-sand-200 shadow-sm flex items-center gap-3">
            <div className={`${s.color} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <svg className="w-4 h-4 text-sand-50" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-espresso-800">{countByStatus(s.key)}</p>
              <p className="text-xs text-espresso-600/60">{s.label}</p>
            </div>
          </div>
        ))}
        {/* Revenue card */}
        <div className="bg-white rounded-2xl p-4 border border-sand-200 shadow-sm flex items-center gap-3 col-span-2 xl:col-span-4">
          <div className="bg-terracotta-500 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-sand-50" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-espresso-800">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-espresso-600/60">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize",
                  activeTab === tab ? "bg-espresso-800 text-sand-50" : "text-espresso-600/70 hover:bg-sand-100",
                ].join(" ")}
              >
                {tab}
                {tab !== "All" && (
                  <span className="ml-1.5 opacity-60">
                    {orders.filter((o) => o.order_status === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-espresso-600/40 flex-shrink-0">{filtered.length} results</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-espresso-600/40 text-sm">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50/80">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden sm:table-cell">Items</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden lg:table-cell">Payment</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((order, i) => (
                  <tr key={order.id} className={["hover:bg-sand-50/60 transition-colors cursor-pointer", i % 2 !== 0 ? "bg-sand-50/30" : ""].join(" ")}>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs font-medium text-terracotta-500">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-sand-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-espresso-800 font-semibold text-[10px]">
                            {(order.customers?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-espresso-800 font-medium text-xs whitespace-nowrap">{order.customers?.name ?? "—"}</p>
                          <p className="text-espresso-600/50 text-[11px] hidden sm:block">{order.customers?.phone ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-espresso-600/60 hidden md:table-cell whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3.5 text-center text-xs text-espresso-700 hidden sm:table-cell">{order.order_items.length}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-xs text-espresso-800 whitespace-nowrap">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${badge(paymentStatusStyle, order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${badge(orderStatusStyle, order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
