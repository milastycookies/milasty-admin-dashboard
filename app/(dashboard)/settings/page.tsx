"use client";

import { useState } from "react";
import PageHeader from "@/app/components/PageHeader";

type Tab = "Profile" | "Store" | "Notifications" | "Security";

const tabs: Tab[] = ["Profile", "Store", "Notifications", "Security"];

function Field({
  label,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-espresso-700 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm text-espresso-800 placeholder:text-espresso-600/40 outline-none focus:border-sand-400 transition-colors"
      />
    </div>
  );
}

function SelectField({
  label,
  defaultValue,
  options,
}: {
  label: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-espresso-700 mb-1.5">{label}</label>
      <select
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm text-espresso-800 outline-none focus:border-sand-400 transition-colors"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  return (
    <button className="bg-terracotta-500 hover:bg-terracotta-600 text-sand-50 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm">
      {label}
    </button>
  );
}

function ProfileTab() {
  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6 space-y-5">
      <h3 className="text-sm font-semibold text-espresso-800">Personal Information</h3>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-espresso-800 flex items-center justify-center flex-shrink-0">
          <span className="text-sand-100 font-bold text-xl">MC</span>
        </div>
        <div>
          <button className="text-sm font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">
            Change avatar
          </button>
          <p className="text-xs text-espresso-600/50 mt-0.5">JPG, PNG or GIF · max 2 MB</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" defaultValue="Milasty" />
        <Field label="Last Name"  defaultValue="Cookies" />
        <Field label="Email" type="email" defaultValue="milasty.cookies@gmail.com" />
        <Field label="Phone" type="tel"   defaultValue="+1 (555) 000-0000" />
      </div>
      <div>
        <label className="block text-xs font-medium text-espresso-700 mb-1.5">Bio</label>
        <textarea
          defaultValue="Premium artisan cookie brand focused on quality ingredients and timeless recipes."
          rows={3}
          className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm text-espresso-800 outline-none focus:border-sand-400 resize-none transition-colors"
        />
      </div>
      <div className="flex justify-end pt-1">
        <SaveButton />
      </div>
    </div>
  );
}

function StoreTab() {
  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6 space-y-5">
      <h3 className="text-sm font-semibold text-espresso-800">Store Settings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Store Name"    defaultValue="Milasty Cookies" />
        <Field label="Support Email" type="email" defaultValue="support@milasty.com" />
        <SelectField
          label="Currency"
          defaultValue="USD — US Dollar"
          options={["USD — US Dollar", "EUR — Euro", "GBP — British Pound", "JPY — Japanese Yen"]}
        />
        <SelectField
          label="Timezone"
          defaultValue="America/New_York"
          options={["America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Tokyo"]}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-espresso-700 mb-1.5">Store Description</label>
        <textarea
          defaultValue="Milasty offers premium handcrafted cookies and baking kits, shipped worldwide."
          rows={3}
          className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm text-espresso-800 outline-none focus:border-sand-400 resize-none transition-colors"
        />
      </div>
      <div className="flex justify-end pt-1">
        <SaveButton />
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={[
        "relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
        on ? "bg-terracotta-500" : "bg-sand-300",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
          on ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    newOrders:        true,
    orderUpdates:     true,
    lowStock:         true,
    weeklySummary:    false,
    marketing:        false,
    customerMessages: true,
  });

  const toggle = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "newOrders",        label: "New Orders",        desc: "Get notified when a new order is placed"      },
    { key: "orderUpdates",     label: "Order Updates",     desc: "Shipping confirmations and delivery updates"  },
    { key: "lowStock",         label: "Low Stock Alerts",  desc: "Alert when a product drops below 10 units"   },
    { key: "weeklySummary",    label: "Weekly Summary",    desc: "Performance report delivered every Monday"   },
    { key: "marketing",        label: "Marketing Emails",  desc: "Tips and feature announcements from Milasty" },
    { key: "customerMessages", label: "Customer Messages", desc: "Direct messages from customers"              },
  ];

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-sm divide-y divide-sand-100">
      <div className="px-6 py-4">
        <h3 className="text-sm font-semibold text-espresso-800">Notification Preferences</h3>
        <p className="text-xs text-espresso-600/50 mt-0.5">Choose what you want to be notified about.</p>
      </div>
      {items.map(({ key, label, desc }) => (
        <div key={key} className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-espresso-800">{label}</p>
            <p className="text-xs text-espresso-600/50 mt-0.5">{desc}</p>
          </div>
          <Toggle on={prefs[key]} onToggle={() => toggle(key)} />
        </div>
      ))}
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-espresso-800">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <Field label="Current Password"    type="password" placeholder="Enter current password" />
          <Field label="New Password"         type="password" placeholder="At least 8 characters"  />
          <Field label="Confirm New Password" type="password" placeholder="Repeat new password"    />
        </div>
        <div className="flex justify-end pt-1">
          <SaveButton label="Update Password" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-espresso-800">Two-Factor Authentication</h3>
            <p className="text-xs text-espresso-600/50 mt-1">Add an extra layer of security to your account.</p>
          </div>
          <span className="text-[11px] font-semibold bg-sand-200 text-espresso-600 px-2.5 py-1 rounded-full flex-shrink-0">
            Not enabled
          </span>
        </div>
        <button className="mt-4 text-sm font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">
          Enable 2FA →
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-espresso-800 mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {[
            { device: "Chrome · macOS",  location: "Paris, FR",  time: "Now",         current: true  },
            { device: "Safari · iPhone", location: "Paris, FR",  time: "2 hours ago", current: false },
            { device: "Firefox · Linux", location: "Berlin, DE", time: "3 days ago",  current: false },
          ].map((s) => (
            <div key={s.device} className="flex items-center justify-between py-2.5 border-b border-sand-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-espresso-600/50" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-espresso-800">{s.device}</p>
                  <p className="text-[11px] text-espresso-600/50">{s.location} · {s.time}</p>
                </div>
              </div>
              {s.current ? (
                <span className="text-[11px] font-semibold bg-olive-500/15 text-olive-600 px-2.5 py-1 rounded-full">Current</span>
              ) : (
                <button className="text-xs text-terracotta-500 hover:text-terracotta-600 font-medium transition-colors">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="flex gap-1 bg-white rounded-2xl border border-sand-200 shadow-sm p-1.5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-espresso-800 text-sand-50 shadow-sm"
                  : "text-espresso-600/70 hover:text-espresso-800 hover:bg-sand-50",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Profile"       && <ProfileTab />}
        {activeTab === "Store"         && <StoreTab />}
        {activeTab === "Notifications" && <NotificationsTab />}
        {activeTab === "Security"      && <SecurityTab />}
      </main>
    </>
  );
}
