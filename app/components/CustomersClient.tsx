"use client";

import { useState } from "react";
import { formatDate, type Customer } from "@/lib/supabase";

export type CustomerRow = Customer & { order_count: number; total_spent: number };

type Props = { customers: CustomerRow[] };

export default function CustomersClient({ customers }: Props) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.pincode.includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const statCards = [
    { label: "Total Customers", value: customers.length,                                   color: "bg-terracotta-500" },
    { label: "With Orders",     value: customers.filter((c) => c.order_count > 0).length,  color: "bg-olive-500"      },
    { label: "No Orders Yet",   value: customers.filter((c) => c.order_count === 0).length,color: "bg-amber-warm"     },
  ];

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-sand-200 shadow-sm flex items-center gap-3">
            <div className={`${s.color} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <svg className="w-4 h-4 text-sand-50" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-espresso-800">{s.value}</p>
              <p className="text-xs text-espresso-600/60">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-100 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-sand-50 rounded-xl px-3 py-2 border border-sand-200 w-full sm:w-64">
            <svg className="w-4 h-4 text-espresso-600/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, pincode…"
              className="bg-transparent text-sm text-espresso-800 placeholder:text-espresso-600/40 outline-none w-full"
            />
          </div>
          <span className="text-xs text-espresso-600/40 ml-auto flex-shrink-0">{filtered.length} customers</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-espresso-600/40 text-sm">
            {search ? "No customers match your search." : "No customers yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50/80">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden lg:table-cell">Pincode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden sm:table-cell">Orders</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((customer, i) => (
                  <tr key={customer.id} className={["hover:bg-sand-50/60 transition-colors cursor-pointer", i % 2 !== 0 ? "bg-sand-50/30" : ""].join(" ")}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sand-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-espresso-800 font-semibold text-[10px]">
                            {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-espresso-800 truncate max-w-[140px]">{customer.name}</p>
                          <p className="text-[11px] text-espresso-600/50 truncate max-w-[140px] hidden sm:block">{customer.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-espresso-600/70 hidden md:table-cell">{customer.phone}</td>
                    <td className="px-4 py-3.5 text-xs text-espresso-600/60 hidden lg:table-cell">{customer.pincode}</td>
                    <td className="px-4 py-3.5 text-xs text-espresso-600/60 hidden md:table-cell whitespace-nowrap">{formatDate(customer.created_at)}</td>
                    <td className="px-4 py-3.5 text-center text-xs text-espresso-700 hidden sm:table-cell">{customer.order_count}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-semibold text-espresso-800 whitespace-nowrap">
                      {customer.total_spent > 0 ? "₹" + customer.total_spent.toLocaleString("en-IN") : "—"}
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
