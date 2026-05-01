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
          <select id="agg-ORDER_ID">
            <option value="">Select Courier</option>
            <option value="shiprocket">Shiprocket</option>
            <option value="delhivery">Delhivery</option>
            <option value="bluedart">BlueDart</option>
            <option value="india_post">India Post</option>
            <option value="shiprath">Shiprath</option>
          </select>
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
              onclick="window._actions.openTracking('${o.tracking_id}', '${o.aggregator}')">
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



// =====================
// ANALYTICS
// =====================
export function renderAnalytics() {
  let totalRevenue = 0

  let totalOrders = filteredOrders.filter(order => {
    const o = applyUIState(order)
    return !o.cancelled
  }).length

  const monthly = {}
  const weekly = {}
  const skuMap = {}
  const dailyRevenue = {}
  const repeatCustomers = {}

  const now = new Date()

  const previousOrders = ordersData.filter(order => {
    const date = new Date(order.created_at)
    const diff = (now - date) / (1000 * 60 * 60 * 24)
    return diff > analyticsRange && diff <= analyticsRange * 2
  })

  let currentRevenue = 0
  let previousRevenue = 0
  let gross = 0
  let refunds = 0

  filteredOrders.forEach(order => {
    const o = applyUIState(order)

    if (o.cancelled) return

    const amount = Number(order.total_amount)

    if (o.payment_status === "complete") {
      gross += amount
      currentRevenue += amount
    }
    else if (o.payment_status === "refunded") {
      refunds += amount
      currentRevenue -= amount
    }
  })

  previousOrders.forEach(order => {
    const o = applyUIState(order)
    if (o.cancelled) return

    const amount = Number(order.total_amount)

    if (o.payment_status === "complete") {
      previousRevenue += amount
    }
    else if (o.payment_status === "refunded") {
      previousRevenue -= amount
    }
  })

  totalRevenue = currentRevenue

  const refundRate = gross ? Math.round((refunds / gross) * 100) : 0

  const growth = previousRevenue
    ? Math.round(((currentRevenue - previousRevenue) / Math.abs(previousRevenue)) * 100)
    : 0

  filteredOrders.forEach(order => {
    const o = applyUIState(order)
    if (o.cancelled) return

    let amount = Number(order.total_amount)

    if (o.payment_status === "refunded") {
      amount = -amount
    }

    if (o.payment_status !== "complete" && o.payment_status !== "refunded") {
      return
    }

    const date = new Date(order.created_at)

    // MONTH
    const month = date.toLocaleString("en-IN", {
      month: "short",
      year: "2-digit"
    })
    monthly[month] = (monthly[month] || 0) + amount

    // WEEK
    const week = `W${Math.ceil(date.getDate() / 7)}`
    weekly[week] = (weekly[week] || 0) + amount

    // DAY
    const day = date.toISOString().split("T")[0]
    dailyRevenue[day] = (dailyRevenue[day] || 0) + amount

    // CUSTOMER
    const phone = order.customers?.phone
    if (phone) {
      repeatCustomers[phone] = (repeatCustomers[phone] || 0) + 1
    }

    // SKU
    ;(order.order_items || []).forEach(item => {
      skuMap[item.product_name] = (skuMap[item.product_name] || 0) + item.quantity
    })
  })

  const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
  const repeatCount = Object.values(repeatCustomers).filter(c => c > 1).length
  const repeatRate = totalOrders ? Math.round((repeatCount / totalOrders) * 100) : 0

  const topSKU = Object.entries(skuMap).sort((a,b)=>b[1]-a[1])[0]

  return `
    <h3>📊 Business Analytics</h3>

    <div style="display:flex;gap:6px;margin-bottom:10px;">
      ${[7,30,180,365].map(d => `
        <button 
          onclick="window._ui.setAnalyticsRange(${d})"
          style="
            padding:6px 10px;
            border-radius:6px;
            border:none;
            cursor:pointer;
            background:${analyticsRange===d ? '#333' : '#eee'};
            color:${analyticsRange===d ? '#fff' : '#333'};
          ">
          ${d}d
        </button>
      `).join("")}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div class="card">
        <div style="font-size:12px;color:#777;">Net Revenue</div>
        <div style="font-size:18px;font-weight:600;">₹${totalRevenue}</div>
        <div style="font-size:11px;color:#888;">
          Gross: ₹${gross} • Refunds: ₹${refunds}
        </div>
      </div>

      <div class="card">
        <div style="font-size:12px;color:#777;">Orders</div>
        <div style="font-size:18px;font-weight:600;">${totalOrders}</div>
      </div>

      <div class="card">
        <div style="font-size:12px;color:#777;">Avg Order</div>
        <div style="font-size:18px;font-weight:600;">₹${avgOrder}</div>
      </div>

      <div class="card">
        <div style="font-size:12px;color:#777;">Repeat Rate</div>
        <div style="font-size:18px;font-weight:600;">${repeatRate}%</div>
      </div>

      <div class="card">
        <div style="font-size:12px;color:#777;">Growth</div>
        <div style="font-size:18px;font-weight:600;color:${growth > 10 ? 'green' : growth >= 0 ? '#888' : 'red'};">
          ${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth)}%
        </div>
      </div>
    </div>

    <div class="card">
      <div style="font-size:12px;color:#777;">Refund %</div>
      <div style="font-size:18px;font-weight:600;color:${
        refundRate > 15 ? '#dc2626' : 
        refundRate > 8 ? '#f59e0b' : 
        '#16a34a'
      };">
        ${refundRate}%
      </div>
      <div style="font-size:11px;color:#888;">
        ₹${refunds} refunded
      </div>
    </div>

    <div class="card">
      <b>🔥 Insights</b><br><br>
      🏆 Top SKU: ${topSKU ? topSKU[0] : "-"}<br>
      🔁 Repeat Customers: ${repeatCount}<br>
    </div>

    <div class="card"><b>Monthly Sales</b><canvas id="monthlyChart"></canvas></div>
    <div class="card"><b>Revenue Trend</b><canvas id="revenueChart"></canvas></div>
    <div class="card"><b>Weekly Sales</b><canvas id="weeklyChart"></canvas></div>
    <div class="card"><b>SKU Performance</b><canvas id="skuChart"></canvas></div>
  `
}


// =====================
// CHARTS
// =====================
export function renderCharts() {
  if (!window.Chart) return

  const monthly = {}
  const weekly = {}
  const skuMap = {}
  const dailyRevenue = {}

  filteredOrders.forEach(order => {
    const o = applyUIState(order)
    if (o.cancelled) return

    let amount = Number(order.total_amount)

    if (o.payment_status === "refunded") {
      amount = -amount
    }

    if (o.payment_status !== "complete" && o.payment_status !== "refunded") return

    const date = new Date(order.created_at)

    const month = date.toLocaleString("en-IN",{month:"short",year:"2-digit"})
    monthly[month]=(monthly[month]||0)+amount

    const week = `W${Math.ceil(date.getDate()/7)}`
    weekly[week]=(weekly[week]||0)+amount

    const day = date.toISOString().split("T")[0]
    dailyRevenue[day]=(dailyRevenue[day]||0)+amount

    ;(order.order_items||[]).forEach(item=>{
      skuMap[item.product_name]=(skuMap[item.product_name]||0)+item.quantity
    })
  })

  if (window._charts) window._charts.forEach(c=>c.destroy())
  window._charts=[]

  window._charts.push(new Chart(document.getElementById("monthlyChart"),{
    type:"bar",
    data:{labels:Object.keys(monthly),datasets:[{data:Object.values(monthly)}]}
  }))

  window._charts.push(new Chart(document.getElementById("revenueChart"),{
    type:"line",
    data:{labels:Object.keys(dailyRevenue),datasets:[{data:Object.values(dailyRevenue)}]}
  }))

  window._charts.push(new Chart(document.getElementById("weeklyChart"),{
    type:"bar",
    data:{labels:Object.keys(weekly),datasets:[{data:Object.values(weekly)}]}
  }))

  window._charts.push(new Chart(document.getElementById("skuChart"),{
    type:"bar",
    data:{labels:Object.keys(skuMap),datasets:[{data:Object.values(skuMap)}]}
  }))
}


// =====================
// CUSTOMERS
// =====================
export function renderCustomers() {
  let html = "<h3>Customers</h3>"
  const map = {}

  filteredOrders.forEach(order => {
    const o = applyUIState(order)
    if (o.cancelled) return

    const phone = order.customers?.phone
    if (!phone) return

    if (!map[phone]) {
      map[phone] = {
        name: order.customers?.name || "Unknown",
        phone,
        orders: 0,
        spend: 0,
        lastOrder: null
      }
    }

    let amount = Number(order.total_amount)

    if (o.payment_status === "refunded") amount = -amount
    if (o.payment_status !== "complete" && o.payment_status !== "refunded") return

    map[phone].orders++
    map[phone].spend += amount

    const d = new Date(order.created_at)
    if (!map[phone].lastOrder || d > map[phone].lastOrder) {
      map[phone].lastOrder = d
    }
  })

  const sorted = Object.values(map).sort((a,b)=>b.spend-a.spend)

  sorted.forEach((c,i)=>{
    const initials=c.name.split(" ").map(w=>w[0]).join("").toUpperCase()
    const repeat=c.orders>1?Math.round(((c.orders-1)/c.orders)*100):0
    const last=c.lastOrder?new Date(c.lastOrder).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"-"
    const phoneClean=c.phone.replace(/\D/g,"")

    html+=`
      <div class="customer-card ${i<3?"top":""}">
        <div class="customer-left">
          <div class="avatar">${initials}</div>
          <div>
            <h4>${c.name}</h4>
            <p class="phone">${c.phone}</p>
            <p class="last">Last order: ${last}</p>
          </div>
        </div>

        <div class="customer-right">
          <p class="spend">₹${c.spend}</p>
          <p class="orders">${c.orders} orders • ${repeat}% repeat</p>
          <a href="https://wa.me/91${phoneClean}" target="_blank" class="wa-btn">💬 WhatsApp</a>
        </div>
      </div>
    `
  })

  return html
}


// =====================
// NAVIGATION
// =====================
export function setAnalyticsRange(days, render) {
  window.analyticsRange = days
  updateFilteredOrders()
  render()
}
