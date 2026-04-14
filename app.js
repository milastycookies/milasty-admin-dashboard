// =====================
// CONFIG
// =====================
const API_BASE = "https://admin-dashboard-production-2711.up.railway.app"
const AUTH_TOKEN = "Bearer milasty_ops_2026_secure"

// =====================
// STATE
// =====================
let ordersData = []
let uiStateDB = {}
let currentTab = "production"
let isLoading = true
let lastDataHash = ""
let isFirstLoad = true
let isFetching = false
let lastRenderedTab = ""
let lastRenderedHTML = ""

// =====================
// AUTH CHECK
// =====================
if (!localStorage.getItem("admin_logged_in")) {
  window.location.href = "/login.html"
}

// =====================
// LOGOUT
// =====================
window.logout = function () {
  localStorage.removeItem("admin_logged_in")
  window.location.href = "/login.html"
}

// =====================
// LOCAL STATE
// =====================
function getLocalState() {
  return JSON.parse(localStorage.getItem("milasty_ui")) || {}
}

function saveLocalState(state) {
  localStorage.setItem("milasty_ui", JSON.stringify(state))
}

// =====================
// LOAD ORDERS
// =====================
async function loadOrders() {
  if (isFetching) return
  isFetching = true
  
  try {
    if (isFirstLoad) {
      isLoading = true
      render()
    }
    
    const res = await fetch(`${API_BASE}/get-orders`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": AUTH_TOKEN
      }
    })

    if (!res.ok) throw new Error("Fetch failed")

    const data = await res.json()

    const newOrders = data.orders || []
    const newUI = data.uiState || {}
  
    
    // Only update if data changed
    ordersData = newOrders
    uiStateDB = newUI

    // Create hash to detect changes
    const newHash = JSON.stringify({ newOrders, newUI })

    // Update state BEFORE render
    isLoading = false
    
    // Always update hash
    lastDataHash = newHash

    // Always render after fetch
    render()
    
    isFirstLoad = false

  } catch (err) {
    console.error(err)
  
    isLoading = false   // 🔥 VERY IMPORTANT
    render()
  
    if (isFirstLoad) {
      document.getElementById("app").innerHTML = `
        <div class="card">⚠️ Failed to load. Retrying...</div>
      `
    }
  
    setTimeout(loadOrders, 3000)
  } finally {
    isFetching = false
  }
}

// =====================
// UPDATE STATUS
// =====================
window.updateStatus = async function (orderId, field) {
  orderId = String(orderId)
  if (!window._updatingMap) window._updatingMap = {}

  const key = `${orderId}_${field}`
  if (window._updatingMap[key]) return
  window._updatingMap[key] = true

  const local = getLocalState()

  const current =
    uiStateDB[orderId]?.[field] ||
    local[orderId]?.[field]

  let newValue

  if (field === "payment_status") {
    newValue = current === "complete" ? "pending" : "complete"
  }

  if (field === "production_status") {
    newValue = current === "prepared" ? "not_prepared" : "prepared"
  }

  if (field === "delivery_status") {
    if (!current || current === "pending") newValue = "dispatched"
    else if (current === "dispatched") newValue = "delivered"
    else newValue = "pending"
  }

  // Instant UI update
  if (!local[orderId]) local[orderId] = {}
  local[orderId][field] = newValue

  if (!uiStateDB[orderId]) uiStateDB[orderId] = {}
  uiStateDB[orderId][field] = newValue

  saveLocalState(local)
  render()

  try {
    const res = await fetch(`${API_BASE}/update-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": AUTH_TOKEN
      },
      body: JSON.stringify({
        id: orderId,
        field,
        value: newValue
      })
    })

    if (!res.ok) throw new Error("Update failed")

  } catch (err) {
    alert("❌ Update failed. Syncing...")
    loadOrders()
  }

  window._updatingMap[key] = false
}

// =====================
// APPLY STATE
// =====================
function applyUIState(order) {
  const local = getLocalState()
  const db = uiStateDB[String(order.id)] || {}

  return {
    ...order,
    payment_status:
      db.payment_status ||
      local[String(order.id)]?.payment_status ||
      order.payment_status ||
      "pending",

    production_status:
      db.production_status ||
      local[String(order.id)]?.production_status ||
      "not_prepared",

    delivery_status:
      db.delivery_status ||
      local[String(order.id)]?.delivery_status ||
      "pending"
  }
}

// =====================
// PRODUCTION
// =====================
function renderProduction() {
  let totalCookies = 0

  ordersData.forEach(order => {
    const o = applyUIState(order)
    if (o.production_status === "prepared") return

    (order.order_items || []).forEach(item => {
      const name = (item.product_name || "").toLowerCase()
      let cookies = 0

      if (name.includes("trial")) cookies = 6
      if (name.includes("regular")) cookies = 8
      if (name.includes("couple")) cookies = 10
      if (name.includes("family")) cookies = 15

      totalCookies += cookies * item.quantity
    })
  })

  return `
    <h3>Production</h3>
    <div class="card">🍪 Total Cookies: <b>${totalCookies}</b></div>
  `
}

// =====================
// ORDERS
// =====================
function renderOrders() {
  let html = "<h3>Orders</h3>"

  ordersData.forEach(order => {
    const o = applyUIState(order)

    const items = (order.order_items || []).map(i =>
      `${i.product_name} x${i.quantity}`
    ).join(", ")

    // ✅ MOVE LOGIC HERE (OUTSIDE HTML)
    const paymentClass =
      o.payment_status === "complete" ? "btn-paid" : "btn-pending"

    const productionClass =
      o.production_status === "prepared" ? "btn-prepared" : "btn-not-prepared"

    let deliveryClass = "btn-pending"
    if (o.delivery_status === "dispatched") deliveryClass = "btn-dispatched"
    if (o.delivery_status === "delivered") deliveryClass = "btn-delivered"

    // ✅ ONLY HTML BELOW
    html += `
      <div class="card">
        <h4>${order.customers?.name || "Unknown"}</h4>
        <p>${items}</p>
        <p>₹${order.total_amount}</p>

        <div style="margin-top:10px;">
          <button class="status-btn ${paymentClass}"
            onclick="updateStatus('${order.id}','payment_status')">
            💰 ${o.payment_status}
          </button>

          <button class="status-btn ${productionClass}"
            onclick="updateStatus('${order.id}','production_status')">
            🍪 ${o.production_status}
          </button>

          <button class="status-btn ${deliveryClass}"
            onclick="updateStatus('${order.id}','delivery_status')">
            🚚 ${o.delivery_status}
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
function renderDispatch() {
  let html = "<h3>Dispatch</h3>"

  ordersData.forEach(order => {
    const o = applyUIState(order)

    if (o.production_status === "prepared" && o.delivery_status !== "delivered") {
      html += `
        <div class="card">
          <h4>${order.customers?.name || "Unknown"}</h4>
          <button onclick="updateStatus('${order.id}','delivery_status')">
            Dispatch
          </button>
        </div>
      `
    }
  })

  return html
}

// =====================
// ANALYTICS
// =====================
function renderAnalytics() {
  let totalRevenue = 0
  let totalOrders = ordersData.length

  const monthly = {}
  const weekly = {}
  const skuMap = {}
  const dailyRevenue = {}
  const repeatCustomers = {}

  ordersData.forEach(order => {
    const date = new Date(order.created_at)
    const amount = Number(order.total_amount)

    totalRevenue += amount

    // MONTH
    const month = date.toLocaleString("default", { month: "short" })
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

  // Top SKU
  const topSKU = Object.entries(skuMap).sort((a,b)=>b[1]-a[1])[0]

  return `
    <h3>📊 Business Analytics</h3>

    <!-- KPI CARDS -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
      <div class="card">
        <div style="font-size:12px;color:#777;">Revenue</div>
        <div style="font-size:18px;font-weight:600;">₹${totalRevenue}</div>
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
    </div>

    <!-- INSIGHTS -->
    <div class="card">
      <b>🔥 Insights</b><br><br>
      🏆 Top SKU: ${topSKU ? topSKU[0] : "-"}<br>
      🔁 Repeat Customers: ${repeatCount}<br>
    </div>

    <!-- CHARTS -->
    <div class="card">
      <b>Monthly Sales</b>
      <canvas id="monthlyChart"></canvas>
    </div>

    <div class="card">
      <b>Revenue Trend</b>
      <canvas id="revenueChart"></canvas>
    </div>

    <div class="card">
      <b>Weekly Sales</b>
      <canvas id="weeklyChart"></canvas>
    </div>

    <div class="card">
      <b>SKU Performance</b>
      <canvas id="skuChart"></canvas>
    </div>
  `
}



function renderCharts() {
  if (!window.Chart) return

  const monthly = {}
  const weekly = {}
  const skuMap = {}
  const dailyRevenue = {}

  ordersData.forEach(order => {
    const date = new Date(order.created_at)
    const amount = Number(order.total_amount)

    const month = date.toLocaleString("default", { month: "short" })
    monthly[month] = (monthly[month] || 0) + amount

    const week = `W${Math.ceil(date.getDate() / 7)}`
    weekly[week] = (weekly[week] || 0) + amount

    const day = date.toISOString().split("T")[0]
    dailyRevenue[day] = (dailyRevenue[day] || 0) + amount

    ;(order.order_items || []).forEach(item => {
      skuMap[item.product_name] = (skuMap[item.product_name] || 0) + item.quantity
    })
  })

  // destroy previous charts (important)
  if (window._charts && window._charts.length) {
    window._charts.forEach(chart => chart.destroy())
  }
  window._charts = []

  // MONTHLY
  new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: Object.keys(monthly),
      datasets: [{
        label: "₹ Sales",
        data: Object.values(monthly)
      }]
    }
  })

  // REVENUE LINE
  new Chart(document.getElementById("revenueChart"), {
    type: "line",
    data: {
      labels: Object.keys(dailyRevenue),
      datasets: [{
        label: "Revenue",
        data: Object.values(dailyRevenue),
        tension: 0.3
      }]
    }
  })

  // WEEKLY
  new Chart(document.getElementById("weeklyChart"), {
    type: "bar",
    data: {
      labels: Object.keys(weekly),
      datasets: [{
        label: "Weekly",
        data: Object.values(weekly)
      }]
    }
  })

  // SKU
  new Chart(document.getElementById("skuChart"), {
    type: "bar",
    data: {
      labels: Object.keys(skuMap),
      datasets: [{
        label: "Units Sold",
        data: Object.values(skuMap)
      }]
    }
  })
}

// =====================
// CUSTOMERS
// =====================
function renderCustomers() {
  let html = "<h3>Customers</h3>"

  const map = {}

  ordersData.forEach(order => {
    const phone = order.customers?.phone
    if (!phone) return

    if (!map[phone]) {
      map[phone] = {
        name: order.customers?.name || "Unknown",
        phone,
        orders: 0,
        spend: 0
      }
    }

    map[phone].orders++
    map[phone].spend += Number(order.total_amount)
  })

  Object.values(map).forEach(c => {
    html += `
      <div class="card">
        <h4>${c.name}</h4>
        <p>${c.phone}</p>
        <p>Orders: ${c.orders}</p>
        <p>₹${c.spend}</p>
      </div>
    `
  })

  return html
}

// =====================
// NAVIGATION
// =====================
window.setTab = function (tab) {
  currentTab = tab

  // 🔥 update active tab UI
  document.querySelectorAll(".nav button").forEach(btn => {
    btn.classList.remove("active")
  })

  const activeBtn = document.getElementById(`tab-${tab}`)
  if (activeBtn) activeBtn.classList.add("active")

  render()
}

// =====================
// RENDER
// =====================
function render() {
  if (document.hidden) return

  const app = document.getElementById("app")

  if (isLoading) {
    if (lastRenderedHTML !== "loading") {
      app.innerHTML = "<div class='card'>Loading...</div>"
      lastRenderedHTML = "loading"
    }
    return
  }

  let newHTML = ""

  if (currentTab === "production") newHTML = renderProduction()
  if (currentTab === "orders") newHTML = renderOrders()
  if (currentTab === "dispatch") newHTML = renderDispatch()
  if (currentTab === "analytics") newHTML = renderAnalytics()
  if (currentTab === "analytics") {
    setTimeout(renderCharts, 100)
  }
  if (currentTab === "customers") newHTML = renderCustomers()

  // fallback
  if (!newHTML) {
    newHTML = "<div class='card'>No data available</div>"
  }

  // update DOM only if changed
  if (newHTML !== lastRenderedHTML || currentTab !== lastRenderedTab) {
    app.innerHTML = newHTML
    lastRenderedHTML = newHTML
    lastRenderedTab = currentTab
  }
}

// =====================
// AUTO REFRESH
// =====================
setInterval(() => {
  if (!document.hidden) loadOrders()
}, 15000)

// =====================
// INIT
// =====================
loadOrders()

// set default active tab
document.getElementById("tab-production")?.classList.add("active")
