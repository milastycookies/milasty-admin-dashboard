import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// =====================
// INIT
// =====================
const supabase = createClient(
  "https://qpdmonukpclrkakwwimb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZG1vbnVrcGNscmtha3d3aW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODM0NzMsImV4cCI6MjA4ODk1OTQ3M30.jwsmINxMw_i38a7F-0hwO62BGwoZHqfbmJlX-KMVpf4"
)

// =====================
// AUTH CHECK (VERY IMPORTANT)
// =====================
const { data: { session } } = await supabase.auth.getSession()

if (!session && !window.location.pathname.includes("login.html")) {
  window.location.href = "/login.html"
}

if (session && window.location.pathname.includes("login.html")) {
  window.location.href = "/"
}

// =====================
// AUTH STATE LISTENER
// =====================
supabase.auth.onAuthStateChange((event, session) => {
  if (!session) {
    window.location.href = "/login.html"
  }
})

// =====================
// LOGOUT
// =====================
window.logout = async function() {
  await supabase.auth.signOut()
  window.location.href = "/login.html"
}

// =====================
let ordersData = []
let uiStateDB = {}
let currentTab = "production"

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
// DB SYNC
// =====================
async function syncToDB(orderId, field, value) {
  await supabase
    .from('order_ui_state')
    .upsert({
      order_id: orderId,
      [field]: value,
      updated_at: new Date()
    })
}

// =====================
// STATUS UPDATE
// =====================
window.updateStatus = async function(orderId, field) {
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

  saveLocalState(local)
  await syncToDB(orderId, field, newValue)

  render()
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
// PRODUCTION
// =====================
function renderProduction() {
  const summary = {}
  const today = new Date().toDateString()

  ordersData.forEach(order => {
    if (new Date(order.created_at).toDateString() !== today) return

    order.order_items.forEach(item => {
      summary[item.product_name] =
        (summary[item.product_name] || 0) + item.quantity
    })
  })

  let html = "<h3>Today's Production</h3>"

  if (!Object.keys(summary).length) {
    return "<div class='card'>No orders today</div>"
  }

  for (let item in summary) {
    html += `<div class="card">${item}: <b>${summary[item]}</b></div>`
  }

  return html
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

        <p style="
          color:${
            o.delivery_status === 'delivered'
              ? 'green'
              : o.delivery_status === 'dispatched'
              ? 'blue'
              : 'orange'
          }
        ">
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
          <p>₹${order.total_amount}</p>

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

  return `<div class="card">💰 Total Revenue: ₹${total}</div>`
}

// =====================
// CRM LOGIC
// =====================
function getCustomersData() {
  const map = {}
  const now = new Date()

  ordersData.forEach(order => {
    let phone = order.customers.phone
    if (!phone) return

    phone = phone.toString().trim()
    phone = phone.replace(/\D/g, "")
    phone = phone.replace(/^0+/, "")

    if (phone.length > 10 && phone.startsWith("91")) {
      phone = phone.slice(-10)
    }

    if (phone.length !== 10) return

    const name = order.customers.name
    const date = new Date(order.created_at)

    if (!map[phone]) {
      map[phone] = {
        name,
        phone,
        orders: 0,
        spend: 0,
        cookies: 0,
        lastOrderDate: date
      }
    }

    map[phone].orders++
    map[phone].spend += Number(order.total_amount)

    order.order_items.forEach(i => {
      map[phone].cookies += i.quantity
    })

    if (date > map[phone].lastOrderDate) {
      map[phone].lastOrderDate = date
    }
  })

  return Object.values(map).map(c => {
    const daysInactive = (now - c.lastOrderDate) / (1000 * 60 * 60 * 24)

    let segment = "new"

    if (c.orders > 5 || c.spend > 3000) segment = "super_vip"
    else if (c.orders > 3 || c.spend > 1500) segment = "vip"
    else if (c.orders > 1) segment = "repeat"

    if (daysInactive > 14) segment = "at_risk"

    return {
      ...c,
      lastOrder: c.lastOrderDate.toDateString(),
      daysInactive: Math.floor(daysInactive),
      segment
    }
  })
}

// =====================
// WHATSAPP
// =====================
window.sendWhatsApp = function(phone, type) {
  let msg = ""

  if (type === "offer") msg = "Special offer for you 🍪"
  if (type === "reminder") msg = "We miss you! Order again 😊"
  if (type === "thankyou") msg = "Thank you ❤️"

  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`)
}

// =====================
// CUSTOMERS UI
// =====================
function renderCustomers() {
  const customers = getCustomersData()

  let html = `<h3>Customers</h3>`

  customers.forEach(c => {
    html += `
      <div class="card">
        <h4>${c.name}</h4>
        <p>${c.phone}</p>
        <p>₹${c.spend}</p>
        <p>${c.lastOrder}</p>

        <button onclick="sendWhatsApp('${c.phone}','offer')">🎁</button>
        <button onclick="sendWhatsApp('${c.phone}','reminder')">🔔</button>
        <button onclick="sendWhatsApp('${c.phone}','thankyou')">🙏</button>
      </div>
    `
  })

  return html
}

// =====================
// NAVIGATION
// =====================
window.setTab = function(tab) {
  currentTab = tab
  render()
}

// =====================
// RENDER
// =====================
function render() {
  const app = document.getElementById("app")

  if (!ordersData) {
    app.innerHTML = "Loading..."
    return
  }

  if (ordersData.length === 0) {
    app.innerHTML = "<div class='card'>No orders yet</div>"
    return
  }

  if (currentTab === "production") app.innerHTML = renderProduction()
  if (currentTab === "orders") app.innerHTML = renderOrders()
  if (currentTab === "dispatch") app.innerHTML = renderDispatch()
  if (currentTab === "analytics") app.innerHTML = renderAnalytics()
  if (currentTab === "customers") app.innerHTML = renderCustomers()
}

// =====================
// LOAD DATA
// =====================
async function loadOrders() {
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      customers ( name, phone ),
      order_items ( product_name, quantity )
    `)
    .order('created_at', { ascending: false })

  const { data: ui } = await supabase
    .from('order_ui_state')
    .select('*')

  uiStateDB = {}
  ui?.forEach(row => {
    uiStateDB[row.order_id] = row
  })

  ordersData = data || []
  render()
}

// =====================
// REAL-TIME
// =====================
let channel

function subscribeToOrders() {
  if (channel) {
    supabase.removeChannel(channel)
  }

  channel = supabase
    .channel('orders-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      () => {
        alert("🚨 New Order!")
        loadOrders()
      }
    )
    .subscribe()
}

// =====================
// INIT
// =====================
render()
loadOrders()
subscribeToOrders()
