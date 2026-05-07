import PageHeader from "@/app/components/PageHeader";
import { getOptionalSession } from "@/lib/dal";
import { apiFetch } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/supabase";
import type { OrderWithCustomer } from "@/lib/supabase";

type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  customersCount: number;
  productsCount: number;
  revenuePct: number;
  ordersPct: number;
  topProducts: { name: string; rev: number; pct: number }[];
  statusCounts: Record<string, number>;
};

type DashboardData = {
  stats: DashboardStats;
  recentOrders: (OrderWithCustomer & { order_items: { id: number }[] })[];
};

// ── Status style helpers ───────────────────────────────────────────────────

const orderStatusStyle: Record<string, string> = {
  placed:     "bg-amber-warm/15 text-amber-warm ring-1 ring-amber-warm/30",
  dispatched: "bg-teal-muted/15 text-teal-muted ring-1 ring-teal-muted/30",
  delivered:  "bg-olive-500/15 text-olive-600 ring-1 ring-olive-500/30",
  cancelled:  "bg-terracotta-500/15 text-terracotta-600 ring-1 ring-terracotta-500/30",
};

function statusClass(s: string) {
  return orderStatusStyle[s] ?? "bg-sand-200 text-espresso-600 ring-1 ring-sand-300";
}

export default async function DashboardPage() {
  const [session, { stats, recentOrders }] = await Promise.all([
    getOptionalSession(),
    apiFetch<DashboardData>("/api/dashboard"),
  ]);

  const name = session?.name ?? "Admin";
  const {
    totalRevenue, totalOrders, avgOrderValue, customersCount, productsCount,
    revenuePct, ordersPct, topProducts, statusCounts,
  } = stats;

  const pctLabel = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  const statCards = [
    {
      label: "Total Revenue", value: formatCurrency(totalRevenue),
      change: pctLabel(revenuePct), positive: revenuePct >= 0, accent: "bg-terracotta-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Orders", value: totalOrders.toLocaleString("en-IN"),
      change: pctLabel(ordersPct), positive: ordersPct >= 0, accent: "bg-olive-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Customers", value: customersCount.toLocaleString("en-IN"),
      change: "", positive: true, accent: "bg-teal-muted",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Avg. Order Value", value: formatCurrency(avgOrderValue),
      change: "", positive: true, accent: "bg-amber-warm",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 4h16v16H4V4z" />
        </svg>
      ),
    },
  ];

  // Suppress unused variable warning (productsCount available for future use)
  void productsCount;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${name} · May 7, 2026`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Stat cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-espresso-600/70 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-bold text-espresso-800 mt-1.5">{s.value}</p>
                  </div>
                  <div className={`${s.accent} w-10 h-10 rounded-xl flex items-center justify-center text-sand-50 flex-shrink-0`}>
                    {s.icon}
                  </div>
                </div>
                {s.change && (
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className={[
                      "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                      s.positive ? "bg-olive-500/10 text-olive-600" : "bg-terracotta-500/10 text-terracotta-600",
                    ].join(" ")}>
                      {s.positive ? "▲" : "▼"} {s.change}
                    </span>
                    <span className="text-xs text-espresso-600/50">vs last month</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Orders + side panel */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Recent orders table */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-espresso-800">Recent Orders</h2>
                <p className="text-xs text-espresso-600/50 mt-0.5">Latest {recentOrders.length} orders</p>
              </div>
              <a href="/orders" className="text-xs font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-terracotta-500/8">
                View all →
              </a>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-espresso-600/40 text-sm">No orders yet.</div>
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
                      <th className="text-center px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {recentOrders.map((order, i) => (
                      <tr key={order.id} className={["hover:bg-sand-50/60 transition-colors cursor-pointer", i % 2 !== 0 ? "bg-sand-50/30" : ""].join(" ")}>
                        <td className="px-6 py-3.5"><span className="font-mono text-xs font-medium text-terracotta-500">{order.order_number}</span></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-sand-300 flex items-center justify-center flex-shrink-0">
                              <span className="text-espresso-800 font-semibold text-[10px]">
                                {(order.customers?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-espresso-800 font-medium text-xs whitespace-nowrap">{order.customers?.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-espresso-600/60 text-xs hidden md:table-cell whitespace-nowrap">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3.5 text-center text-espresso-700 text-xs hidden sm:table-cell">{order.order_items.length}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-espresso-800 text-xs whitespace-nowrap">{formatCurrency(order.total_amount)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusClass(order.order_status)}`}>
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

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Top products */}
            <div className="bg-white rounded-2xl shadow-sm border border-sand-200 p-5 flex-1">
              <h2 className="text-sm font-semibold text-espresso-800 mb-4">Top Products</h2>
              {topProducts.length === 0 ? (
                <p className="text-xs text-espresso-600/40">No order items yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {topProducts.map((p) => (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-espresso-700 font-medium truncate max-w-[60%]">{p.name}</span>
                        <span className="text-xs text-espresso-600/60 ml-2 flex-shrink-0">{formatCurrency(p.rev)}</span>
                      </div>
                      <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden">
                        <div className="h-full bg-terracotta-500 rounded-full transition-all" style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order status summary */}
            <div className="bg-espresso-900 rounded-2xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-sand-100 mb-4">Order Status</h2>
              {Object.keys(statusCounts).length === 0 ? (
                <p className="text-xs text-sand-500">No orders yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "placed",     color: "text-amber-warm"     },
                    { key: "dispatched", color: "text-teal-muted"     },
                    { key: "delivered",  color: "text-olive-400"      },
                    { key: "cancelled",  color: "text-terracotta-400" },
                  ].map((s) => (
                    <div key={s.key} className="bg-espresso-800 rounded-xl p-3.5">
                      <p className={`text-xl font-bold ${s.color}`}>{statusCounts[s.key] ?? 0}</p>
                      <p className="text-sand-400 text-[11px] mt-0.5 capitalize">{s.key}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
