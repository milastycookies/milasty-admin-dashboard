"use client";

import { useState } from "react";
import { formatCurrency, type Product } from "@/lib/supabase";

// Tabs are UI labels only — filtering always uses product.is_active
const TABS = ["All", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];

type Props = { products: Product[] };

export default function ProductsClient({ products }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const filtered: Product[] =
    activeTab === "Active"   ? products.filter((p) => p.is_active === true) :
    activeTab === "Inactive" ? products.filter((p) => p.is_active === false) :
                               products;

  const activeCount   = products.filter((p) => p.is_active === true).length;
  const inactiveCount = products.filter((p) => p.is_active === false).length;

  const statCards = [
    { label: "Total Products", value: products.length, color: "bg-terracotta-500" },
    { label: "Active",         value: activeCount,     color: "bg-olive-500"      },
    { label: "Inactive",       value: inactiveCount,   color: "bg-amber-warm"     },
  ];

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-sand-200 shadow-sm flex items-center gap-3">
            <div className={`${s.color} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <svg className="w-4 h-4 text-sand-50" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-espresso-800">{s.value}</p>
              <p className="text-xs text-espresso-600/60">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  activeTab === tab ? "bg-espresso-800 text-sand-50" : "text-espresso-600/70 hover:bg-sand-100",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs text-espresso-600/40 flex-shrink-0">{filtered.length} products</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-espresso-600/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-espresso-700">No products found</p>
            <p className="text-xs text-espresso-600/50 mt-1">Add your first product to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50/80">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Price</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider">Active</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-600/60 uppercase tracking-wider hidden lg:table-cell">Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((product, i) => (
                  <tr
                    key={product.id}
                    className={["hover:bg-sand-50/60 transition-colors cursor-pointer", i % 2 !== 0 ? "bg-sand-50/30" : ""].join(" ")}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sand-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-espresso-600/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-xs font-medium text-espresso-800">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {product.type ? (
                        <span className="text-xs text-espresso-600/70 bg-sand-100 px-2 py-1 rounded-md capitalize">
                          {product.type}
                        </span>
                      ) : (
                        <span className="text-xs text-espresso-600/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-semibold text-espresso-800">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        product.is_active
                          ? "bg-olive-500/15 text-olive-600 ring-1 ring-olive-500/30"
                          : "bg-sand-200 text-espresso-600 ring-1 ring-sand-300"
                      }`}>
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs font-mono text-espresso-600/50">{product.slug}</span>
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
