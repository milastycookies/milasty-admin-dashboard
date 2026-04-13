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
    
    // Create hash to detect changes
    const newHash = JSON.stringify({ newOrders, newUI })
    
    // Only update if data changed
    if (newHash !== lastDataHash) {
      ordersData = newOrders
      uiStateDB = newUI
      lastDataHash = newHash
    
      render()
    }
    
    isLoading = false
    isFirstLoad = false

  } catch (err) {
    console.error(err)

    document.getElementById("app").innerHTML = `
      <div class="card">⚠️ Failed to load. Retrying...</div>
    `

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

  if (window._updatingMap[orderId]) return
  window._updatingMap[orderId] = true

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

  window._updatingMap[orderId] = false
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

    const isUpdating = window._updatingMap?.[String(order.id)]

    html += `
      <div class="card">
        <h4>${order.customers?.name || "Unknown"}</h4>
        <p>${items}</p>
        <p>₹${order.total_amount}</p>

        <p style="color:${o.payment_status === 'complete' ? 'green' : 'red'}">
          💰 ${o.payment_status}
        </p>

        <p style="color:${o.production_status === 'prepared' ? 'green' : 'red'}">
          🍪 ${o.production_status}
        </p>

        <p>🚚 ${o.delivery_status}</p>

        <button ${isUpdating ? "disabled" : ""} onclick="updateStatus('${order.id}','payment_status')">💰</button>
        <button ${isUpdating ? "disabled" : ""} onclick="updateStatus('${order.id}','production_status')">🍪</button>
        <button ${isUpdating ? "disabled" : ""} onclick="updateStatus('${order.id}','delivery_status')">🚚</button>
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
  let total = 0
  ordersData.forEach(o => total += Number(o.total_amount))

  return `<div class="card">💰 Total: ₹${total}</div>`
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
  render()
}

// =====================
// RENDER
// =====================
function render() {
  const app = document.getElementById("app")

  if (isLoading) {
    app.innerHTML = "<div class='card'>Loading...</div>"
    return
  }

  if (!ordersData.length && !isLoading) {
    app.innerHTML = "<div class='card'>No orders</div>"
    return
  }

  if (currentTab === "production") app.innerHTML = renderProduction()
  if (currentTab === "orders") app.innerHTML = renderOrders()
  if (currentTab === "dispatch") app.innerHTML = renderDispatch()
  if (currentTab === "analytics") app.innerHTML = renderAnalytics()
  if (currentTab === "customers") app.innerHTML = renderCustomers()
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
