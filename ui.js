// =====================
// ui.js
// =====================

import {
  filteredOrders,
  ordersData,
  analyticsRange,
  applyUIState,
  updateFilteredOrders
} from "./data.js"

import {
  updateStatus,
  handleDispatch,
  sendWhatsApp,
  openTracking,
  copyTracking,
  toggleCancel
} from "./actions.js"

// =====================
// PRODUCT DEFINITIONS
// =====================
const PRODUCT_MAP = {
  "Signature Trio Box": [
    { name: "Cocoa Ragi", qty: 8 },
    { name: "Cardamom Bajra", qty: 8 },
    { name: "Coconut Jowar", qty: 8 }
  ],
  "Elegant Gifting Ritual": [
    { name: "Cocoa Ragi", qty: 10 },
    { name: "Cardamom Bajra", qty: 10 },
    { name: "Coconut Jowar", qty: 10 }
  ],
  "Imperial Wedding Ritual": [
    { name: "Cocoa Ragi", qty: 15 },
    { name: "Cardamom Bajra", qty: 15 },
    { name: "Coconut Jowar", qty: 15 }
  ]
}

// =====================
// PRODUCTION
// =====================
export function renderProduction() {
  const flavourTotals = {}
  const flavourOrders = {}

  filteredOrders.forEach(order => {
    const o = applyUIState(order)

    if (o.cancelled) return
    if (o.production_status === "prepared") return

    ;(order.order_items || []).forEach(item => {
      const name = (item.product_name || "").toLowerCase()
      const product = item.product_name.replace(/ x\d+$/i, "").trim()
      const quantity = Number(item.quantity)

      const normalizedProduct = product.toLowerCase()

      const recipeKey = Object.keys(PRODUCT_MAP).find(p =>
        normalizedProduct.includes(p.toLowerCase())
      )

      const recipe = recipeKey ? PRODUCT_MAP[recipeKey] : null

      if (recipe) {
        recipe.forEach(f => {
          flavourTotals[f.name] = (flavourTotals[f.name] || 0) + f.qty * quantity

          if (!flavourOrders[f.name]) flavourOrders[f.name] = []
          flavourOrders[f.name].push({ product, quantity })
        })
        return
      }

      let flavour = null
      if (name.includes("cocoa")) flavour = "Cocoa Ragi"
      else if (name.includes("cardamom")) flavour = "Cardamom Bajra"
      else if (name.includes("coconut")) flavour = "Coconut Jowar"

      if (!flavour) return

      let cookies = 0
      if (name.includes("trial")) cookies = 6
      else if (name.includes("regular")) cookies = 8
      else if (name.includes("couple")) cookies = 10
      else if (name.includes("family")) cookies = 15

      if (!cookies) return

      flavourTotals[flavour] = (flavourTotals[flavour] || 0) + cookies * quantity

      if (!flavourOrders[flavour]) flavourOrders[flavour] = []
      flavourOrders[flavour].push({ product, quantity })
    })
  })

  let html = `
    <div style="padding:16px;">
      <h3 style="text-align:center; margin-bottom:16px;">
        🍪 Production Required
      </h3>
  `

  if (Object.keys(flavourTotals).length === 0) {
    html += `<div class="card" style="text-align:center;">No production required 🎉</div>`
    return html
  }

  const total = Object.values(flavourTotals).reduce((a,b)=>a+b,0)

  html += `
    <div style="background:#000;color:#fff;border-radius:14px;padding:14px;text-align:center;margin-bottom:16px;font-weight:600;">
      Total: ${total} cookies
    </div>
  `

  Object.entries(flavourTotals).forEach(([flavour, qty]) => {

    let emoji = "🍪"
    if (flavour === "Cocoa Ragi") emoji = "🍫"
    else if (flavour === "Cardamom Bajra") emoji = "🌿"
    else if (flavour === "Coconut Jowar") emoji = "🥥"

    let bg = "#fff"
    if (flavour === "Cocoa Ragi") bg = "#fdf6f3"
    else if (flavour === "Cardamom Bajra") bg = "#f3fdf5"
    else if (flavour === "Coconut Jowar") bg = "#f8f8f8"

    html += `
      <div style="background:${bg};border-radius:16px;padding:14px 16px;margin-bottom:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px; font-size:15px;">
            <span style="font-size:18px;">${emoji}</span>
            <span style="font-weight:500;">${flavour}</span>
          </div>

          <div style="font-weight:600;font-size:14px;background:#f3f4f6;padding:6px 10px;border-radius:10px;">
            ${qty} cookies
          </div>
        </div>

        <div style="margin-top:12px;background:rgba(255,255,255,0.6);border-radius:10px;padding:8px 10px;">
          ${(flavourOrders[flavour] || []).map(item => `
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;">
              <span style="font-size:12px;">${item.product}</span>
              <span style="font-size:12px;font-weight:600;">${item.quantity}</span>
            </div>
          `).join("")}
        </div>

      </div>
    `
  })

  return html
}
