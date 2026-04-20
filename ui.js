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


// =====================
// ORDERS
// =====================
export function renderOrders() {
  let html = "<h3>Orders</h3>"

  filteredOrders.forEach(order => {
    const o = applyUIState(order)

    const items = (order.order_items || []).map(i =>
      `${i.product_name} x${i.quantity}`
    ).join(", ")

    // =====================
    // STATUS CLASSES
    // =====================
    let paymentClass = "btn-pending"
    if (o.payment_status === "complete") paymentClass = "btn-paid"
    if (o.payment_status === "refunded") paymentClass = "btn-refunded"

    const productionClass =
      o.production_status === "prepared" ? "btn-prepared" : "btn-not-prepared"

    let deliveryClass = "btn-pending"
    if (o.delivery_status === "dispatched") deliveryClass = "btn-dispatched"
    if (o.delivery_status === "delivered") deliveryClass = "btn-delivered"

    // =====================
    // CANCEL STATE
    // =====================
    const isCancelled = o.cancelled === true

    const cancelBtnText = isCancelled ? "↩ Undo" : "❌ Cancel"
    const cancelBtnClass = isCancelled ? "btn-prepared" : "btn-cancel"

    // =====================
    // CARD STYLE
    // =====================
    const cardStyle = isCancelled
      ? "opacity:0.5; text-decoration:line-through;"
      : ""

    html += `
      <div class="card" style="${cardStyle}">
        
        <h4>${order.customers?.name || "Unknown"}</h4>
        <p>${items}</p>
        <p>₹${order.total_amount}</p>

        ${
          isCancelled
            ? `<div style="color:#e11d48; font-size:12px; margin-top:6px;">
                 ❌ Cancelled
               </div>`
            : ""
        }

        <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:6px;">
          
          <button class="status-btn ${paymentClass}"
            onclick="window._actions.updateStatus('${order.id}','payment_status', window._render, this)">
            ${
              o.payment_status === "pending" ? "💰 pending" :
              o.payment_status === "complete" ? "✅ paid" :
              "↩️ refunded"
            }
          </button>

          <button class="status-btn ${productionClass}"
            onclick="window._actions.updateStatus('${order.id}','production_status', window._render, this)">
            🍪 ${o.production_status}
          </button>

          <button class="status-btn ${deliveryClass}"
            onclick="window._actions.updateStatus('${order.id}','delivery_status', window._render, this)">
            🚚 ${o.delivery_status}
          </button>

          <button class="status-btn ${cancelBtnClass}"
            style="margin-left:auto;"
            onclick="window._actions.toggleCancel('${order.id}', '${isCancelled}', window._render)">
            ${cancelBtnText}
          </button>

        </div>

      </div>
    `
  })

  return html
}


// =====================
// DISPATCH
// =====================
export function renderDispatch() {
  let html = `
    <div style="padding:12px;">
      <h3 style="text-align:center; margin-bottom:16px;">
        📦 Shipping Control
      </h3>
  `

  const ready = []
  const shipped = []
  const delivered = []

  filteredOrders.forEach(order => {
    const o = applyUIState(order)

    if (o.cancelled) return

    if (o.production_status === "prepared" && o.delivery_status === "pending") {
      ready.push({ order, o })
    }
    else if (o.delivery_status === "dispatched") {
      shipped.push({ order, o })
    }
    else if (o.delivery_status === "delivered") {
      delivered.push({ order, o })
    }
  })

  ready.sort((a, b) => new Date(a.order.created_at) - new Date(b.order.created_at))
  shipped.sort((a, b) => new Date(a.order.created_at) - new Date(b.order.created_at))
  delivered.sort((a, b) => new Date(a.order.created_at) - new Date(b.order.created_at))

  // =====================
  // READY TO SHIP
  // =====================
  html += `<h4 style="margin-top:16px;">🟡 Ready to Ship</h4>`

  if (ready.length === 0) {
    html += `<div class="card">No orders ready</div>`
  }

  ready.forEach(({ order, o }) => {
    const phone = order.customers?.phone || ""
    const name = order.customers?.name || "Customer"

    html += `
      <div class="card">

        <h4>${name}</h4>
        <p>${phone}</p>

        <input 
          id="track-${order.id}" 
          value="${o.tracking_id || ''}"
          placeholder="Enter Tracking ID"
          style="width:100%; padding:8px; margin:6px 0; border-radius:8px; border:1px solid #ddd;"
        />

        <button 
          onclick="window._actions.handleDispatch('${order.id}', window._render)"
          ${o.tracking_id ? "disabled" : ""}
        >
          ${o.tracking_id ? "✅ Dispatched" : "🚚 Dispatch"}
        </button>

        <button 
          onclick="window._actions.sendWhatsApp('${order.id}', '${phone}', '${name}')"
          ${!o.tracking_id ? "disabled" : ""}
          style="background:#25D366; color:white; margin-left:6px;">
          📲 WhatsApp
        </button>

      </div>
    `
  })

  // =====================
  // IN TRANSIT
  // =====================
  html += `<h4 style="margin-top:20px;font-size:14px;color:#666;font-weight:500;">
    🚚 In Transit
  </h4>`

  if (shipped.length === 0) {
    html += `<div class="card">No active shipments</div>`
  }

  shipped.forEach(({ order, o }) => {
    const days = order.dispatched_at
      ? (Date.now() - new Date(order.dispatched_at)) / (1000 * 60 * 60 * 24)
      : 0

    const isDelayed = days > 5

    const cardStyle = isDelayed
      ? "border:2px solid #dc2626; background:#fff7f7;"
      : ""

    const phone = order.customers?.phone || ""
    const name = order.customers?.name || "Customer"

    html += `
      <div class="card" style="${cardStyle}">

        <div style="font-weight:600; font-size:15px;">
          ${name}
        </div>

        ${isDelayed 
          ? `<div style="color:#dc2626; font-size:12px; font-weight:600;">
               🚨 Delayed (${Math.floor(days)} days)
             </div>`
          : ""
        }

        <div style="font-size:12px; color:#888;">
          ${phone}
        </div>

        <div style="background:#fafafa;border-radius:14px;padding:12px;margin-top:10px;border:1px solid #eee;">
        
          <div style="font-size:13px; color:#16a34a;">
            📦 ${o.tracking_id || "N/A"}
          </div>
        
          <div style="font-size:11px;color:#888;">
            Dispatched: ${
              order.dispatched_at
                ? new Date(order.dispatched_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short"
                  })
                : "-"
            }
          </div>
        
          ${
            order.dispatched_at
              ? `<div style="font-size:11px;color:#aaa;">
                   ${Math.floor((Date.now() - new Date(order.dispatched_at)) / (1000*60*60*24))} days in transit
                 </div>`
              : ""
          }
        
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="mini-btn" 
              onclick="window._actions.copyTracking('${o.tracking_id || ""}')">
              📋 Copy
            </button>
            
            <button class="mini-btn" 
              onclick="window._actions.openTracking('${o.tracking_id}')">
              🔗 Track
            </button>
          </div>
        
        </div>
      </div>
    `
  })

  // =====================
  // DELIVERED
  // =====================
  html += `<h4 style="margin-top:20px;">✅ Delivered</h4>`

  if (delivered.length === 0) {
    html += `<div class="card">No delivered orders</div>`
  }

  delivered.forEach(({ order, o }) => {
    const name = order.customers?.name || "Customer"

    html += `
      <div class="card" style="opacity:0.7;">
        <h4>${name}</h4>

        <div style="font-size:12px; color:green;">
          ✅ Delivered
        </div>

        ${
          o.tracking_id
            ? `<div style="font-size:12px;">📦 ${o.tracking_id}</div>`
            : ""
        }
      </div>
    `
  })

  return html
}
