// =====================
// CONFIG
// =====================
const API_BASE = "https://admin-dashboard-production-03ea.up.railway.app"   // 🔥 CHANGE THIS
const AUTH_TOKEN = "milasty_ops_2026_secure"

// =====================
// STATE
// =====================
let ordersData = []
let uiStateDB = {}
let currentTab = "production"

// =====================
// AUTH CHECK (FRONTEND BASIC)
// =====================
if (!localStorage.getItem("admin_logged_in")) {
  if (!window.location.pathname.includes("login.html")) {
    window.location.href = "/login.html"
  }
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
// UPDATE STATUS (API)
// =====================
window.updateStatus = async function (orderId, field) {
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

  if (!local[orderId]) local[orderId] = {}
  local[orderId][field] = newValue

  if (!uiStateDB[orderId]) uiStateDB[orderId] = {}
  uiStateDB[orderId][field] = newValue

  saveLocalState(local)
  render()

  // 🔥 API CALL
  await fetch(`${API_BASE}/update-order`, {
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
}

// =====================
// MERGE STATE
// =====================
function applyUIState(order) {
  const local = getLocalState()
  const db = uiStateDB[order.id] || {}

  return {
    ...order,
    payment_status: db.payment_status || local[order.id]?.payment_status || order.payment_status || "pending",
    production_status: db.production_status || local[order.id]?.production_status || "not_prepared",
    delivery_status: db.delivery_status || local[order.id]?.delivery_status || "pending"
  }
}

// =====================
// LOAD ORDERS (API)
// =====================
async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/get-orders`, {
      headers: {
        "Authorization": AUTH_TOKEN
      }
    })

    const data = await res.json()

    ordersData = data.orders || []
    uiStateDB = data.uiState || {}

    render()
  } catch (err) {
    console.error("Error loading orders", err)
  }
}

// =====================
// PRODUCTION
// =====================
function renderProduction() {
  let totalCookies = 0

  let flavourMap = {
    cocoa_ragi: 0,
    coconut_jowar: 0,
    cardamom_bajra: 0
  }

  function getCookies(productName, qty) {
    const name = productName.toLowerCase()

    if (name.includes("signature trio")) return 24 * qty
    if (name.includes("elegant celebration")) return 30 * qty
    if (name.includes("imperial wedding")) return 45 * qty

    if (name.includes("trial")) return 6 * qty
    if (name.includes("regular")) return 8 * qty
    if (name.includes("couple")) return 10 * qty
    if (name.includes("family")) return 15 * qty

    return 0
  }

  function detectFlavour(productName) {
    const name = productName.toLowerCase()

    if (name.includes("ragi")) return "cocoa_ragi"
    if (name.includes("jowar")) return "coconut_jowar"
    if (name.includes("bajra")) return "cardamom_bajra"

    return "unknown"
  }

  ordersData.forEach(order => {
    const o = applyUIState(order)

    if (o.production_status === "prepared") return

    order.order_items.forEach(item => {
      const cookies = getCookies(item.product_name, item.quantity)
      const flavour = detectFlavour(item.product_name)

      totalCookies += cookies

      if (
        item.product_name.toLowerCase().includes("signature trio") ||
        item.product_name.toLowerCase().includes("elegant celebration") ||
        item.product_name.toLowerCase().includes("imperial wedding")
      ) {
        const perFlavour = cookies / 3
        flavourMap.cocoa_ragi += perFlavour
        flavourMap.coconut_jowar += perFlavour
        flavourMap.cardamom_bajra += perFlavour
      } else {
        if (flavourMap[flavour] !== undefined) {
          flavourMap[flavour] += cookies
        }
      }
    })
  })

  return `
    <h3>Production Pending</h3>
    <div class="card">🍪 Total Cookies: <b>${totalCookies}</b></div>
    <div class="card">🍫 Cocoa Ragi: <b>${flavourMap.cocoa_ragi}</b></div>
    <div class="card">🌾 Coconut Jowar: <b>${flavourMap.coconut_jowar}</b></div>
    <div class="card">🌿 Cardamom Bajra: <b>${flavourMap.cardamom_bajra}</b></div>
  `
}

// =====================
// ORDERS
// =====================
function renderOrders() {
  let html = "<h3>Orders</h3>"

  ordersData.forEach(order => {
    const o = applyUIState(order)

    const items = order.order_items.map(i =>
      `${i.product_name} x${i.quantity}`
    ).join(", ")

    html += `
      <div class="card">
        <h4>${order.customers.name}</h4>
        <p>${items}</p>
        <p>₹${order.total_amount}</p>

        <p style="color:${o.payment_status === 'complete' ? 'green' : 'red'}">
          💰 ${o.payment_status === 'complete' ? 'Paid' : 'Pending'}
        </p>

        <p style="color:${o.production_status === 'prepared' ? 'green' : 'red'}">
          🍪 ${o.production_status === 'prepared' ? 'Prepared' : 'Not Prepared'}
        </p>

        <p>
          🚚 ${o.delivery_status}
        </p>

        <button onclick="updateStatus('${order.id}','payment_status')">💰</button>
        <button onclick="updateStatus('${order.id}','production_status')">🍪</button>
        <button onclick="updateStatus('${order.id}','delivery_status')">🚚</button>
      </div>
    `
  })

  return html
}

// =====================
// DISPATCH
// =====================
function renderDispatch() {
  let html = "<h3>Ready to Dispatch</h3>"
  let count = 0

  ordersData.forEach(order => {
    const o = applyUIState(order)

    if (o.production_status === "prepared" && o.delivery_status !== "delivered") {
      count++

      html += `
        <div class="card">
          <h4>${order.customers.name}</h4>
          <button onclick="updateStatus('${order.id}','delivery_status')">
            ${o.delivery_status === "pending" ? "Dispatch" : "Delivered"}
          </button>
        </div>
      `
    }
  })

  if (!count) return "<div class='card'>No orders ready</div>"

  return html
}

// =====================
// ANALYTICS
// =====================
function renderAnalytics() {
  let total = 0

  ordersData.forEach(order => {
    total += Number(order.total_amount)
  })

  return `<div class="card">💰 Total: ₹${total}</div>`
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

  if (!ordersData.length) {
    app.innerHTML = "<div class='card'>No orders</div>"
    return
  }

  if (currentTab === "production") app.innerHTML = renderProduction()
  if (currentTab === "orders") app.innerHTML = renderOrders()
  if (currentTab === "dispatch") app.innerHTML = renderDispatch()
  if (currentTab === "analytics") app.innerHTML = renderAnalytics()
}

// =====================
// AUTO REFRESH (REAL-TIME)
// =====================
setInterval(loadOrders, 5000)

// =====================
// INIT
// =====================
loadOrders()
