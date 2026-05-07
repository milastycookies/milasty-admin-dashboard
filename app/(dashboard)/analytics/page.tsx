import PageHeader from "@/app/components/PageHeader";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/supabase";

type AnalyticsData = {
  monthlyRevenue: { month: string; value: number; key: string }[];
  maxRevenue: number;
  last5Weeks: { week: string; orders: number }[];
  maxWeekOrders: number;
  orderStatusMap: Record<string, number>;
  paymentStatusMap: Record<string, number>;
  topProducts: { name: string; rev: number; pct: number }[];
  totalRevenue: number;
  totalOrders: number;
  fulfillmentRate: string;
  cancellationRate: string;
  paymentRate: string;
  avgOrderValue: number;
};

const orderStatusColors: Record<string, string> = {
  placed:     "bg-amber-warm",
  dispatched: "bg-teal-muted",
  delivered:  "bg-olive-500",
  cancelled:  "bg-terracotta-500",
};
const paymentStatusColors: Record<string, string> = {
  paid:     "bg-olive-500",
  pending:  "bg-amber-warm",
  failed:   "bg-terracotta-500",
  refunded: "bg-sand-400",
};

export default async function AnalyticsPage() {
  const d = await apiFetch<AnalyticsData>("/api/analytics");

  const kpis = [
    { label: "Total Revenue",    value: formatCurrency(d.totalRevenue), positive: true  },
    { label: "Fulfillment Rate", value: d.fulfillmentRate,              positive: true  },
    { label: "Cancellation Rate",value: d.cancellationRate,             positive: false },
    { label: "Avg. Order Value", value: formatCurrency(d.avgOrderValue),positive: true  },
  ];

  const orderStatusEntries  = Object.entries(d.orderStatusMap).sort((a, b) => b[1] - a[1]);
  const paymentStatusEntries = Object.entries(d.paymentStatusMap).sort((a, b) => b[1] - a[1]);
  const maxStatusCount = Math.max(...orderStatusEntries.map(([, v]) => v), 1);

  return (
    <>
      <PageHeader title="Analytics" subtitle="Revenue & performance overview" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl p-5 border border-sand-200 shadow-sm">
              <p className="text-xs font-medium text-espresso-600/70 uppercase tracking-wider">{k.label}</p>
              <p className="text-2xl font-bold text-espresso-800 mt-1.5">{k.value}</p>
              <div className={[
                "mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                k.positive ? "bg-olive-500/10 text-olive-600" : "bg-terracotta-500/10 text-terracotta-600",
              ].join(" ")}>
                {k.positive ? "▲ Good" : "▼ Watch"}
              </div>
            </div>
          ))}
        </div>

        {/* Monthly revenue + top products */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-sand-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-espresso-800">Monthly Revenue</h2>
                <p className="text-xs text-espresso-600/50 mt-0.5">Last {d.monthlyRevenue.length} active months</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-espresso-800">{formatCurrency(d.totalRevenue)}</p>
                <p className="text-xs text-espresso-600/50 font-medium">{d.totalOrders} orders total</p>
              </div>
            </div>
            {d.monthlyRevenue.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-espresso-600/30 text-sm">No revenue data yet.</div>
            ) : (
              <div className="flex items-end gap-2" style={{ height: "10rem" }}>
                {d.monthlyRevenue.map((m, idx) => {
                  const heightPct = (m.value / d.maxRevenue) * 100;
                  const isCurrent = idx === d.monthlyRevenue.length - 1;
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] text-espresso-600/60">{formatCurrency(m.value)}</span>
                      <div
                        className={`w-full rounded-t-lg transition-all ${isCurrent ? "bg-terracotta-500" : "bg-sand-300 hover:bg-sand-400"}`}
                        style={{ height: `${heightPct * 0.72}rem` }}
                      />
                      <span className={`text-[10px] font-medium ${isCurrent ? "text-terracotta-500" : "text-espresso-600/60"}`}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-espresso-800 mb-5">Top Products by Revenue</h2>
            {d.topProducts.length === 0 ? (
              <p className="text-xs text-espresso-600/40">No order item data yet.</p>
            ) : (
              <div className="space-y-4">
                {d.topProducts.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-espresso-700 font-medium truncate max-w-[58%]">{p.name}</span>
                      <div className="text-right ml-2">
                        <span className="text-xs font-semibold text-espresso-800">{formatCurrency(p.rev)}</span>
                        <span className="text-[10px] text-espresso-600/50 ml-1.5">{p.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden">
                      <div className="h-full bg-terracotta-500 rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-sand-100 grid grid-cols-2 gap-3">
              <div className="bg-espresso-900 rounded-xl p-3">
                <p className="text-lg font-bold text-sand-100">{d.totalOrders}</p>
                <p className="text-[11px] text-sand-400 mt-0.5">Total Orders</p>
              </div>
              <div className="bg-sand-100 rounded-xl p-3">
                <p className="text-lg font-bold text-espresso-800">{formatCurrency(d.avgOrderValue)}</p>
                <p className="text-[11px] text-espresso-600/60 mt-0.5">Avg. Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly orders chart */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-espresso-800">Weekly Orders</h2>
              <p className="text-xs text-espresso-600/50 mt-0.5">Last {d.last5Weeks.length} weeks</p>
            </div>
            <span className="text-xs text-espresso-600/50">Total: {d.totalOrders} orders</span>
          </div>
          {d.last5Weeks.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-espresso-600/30 text-sm">No weekly data yet.</div>
          ) : (
            <div className="flex items-end gap-3" style={{ height: "8rem" }}>
              {d.last5Weeks.map((w) => {
                const heightPct = (w.orders / d.maxWeekOrders) * 100;
                return (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] text-espresso-600/60">{w.orders}</span>
                    <div className="w-full rounded-t-lg bg-olive-500/70 hover:bg-olive-500 transition-colors" style={{ height: `${heightPct * 0.57}rem` }} />
                    <span className="text-[10px] font-medium text-espresso-700 whitespace-nowrap">{w.week}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status breakdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-espresso-900 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-sand-400 uppercase tracking-wider mb-4">Order Status</h3>
            {orderStatusEntries.length === 0 ? (
              <p className="text-xs text-sand-500">No data.</p>
            ) : (
              <div className="space-y-2.5">
                {orderStatusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-sand-300 capitalize">{status}</span>
                    <div className="flex-1 h-1 bg-espresso-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${orderStatusColors[status] ?? "bg-sand-400"}`}
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-sand-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-espresso-600/60 uppercase tracking-wider mb-4">Payment Status</h3>
            {paymentStatusEntries.length === 0 ? (
              <p className="text-xs text-espresso-600/40">No data.</p>
            ) : (
              <div className="space-y-3">
                {paymentStatusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${paymentStatusColors[status] ?? "bg-sand-400"}`} />
                    <span className="text-xs text-espresso-700 flex-1 capitalize">{status}</span>
                    <span className="text-xs font-semibold text-espresso-800">{count}</span>
                    <span className="text-[10px] text-espresso-600/40 w-10 text-right">
                      {d.totalOrders > 0 ? Math.round((count / d.totalOrders) * 100) + "%" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </>
  );
}
