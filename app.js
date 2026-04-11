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

  // 🔥 UPDATE UI STATE IMMEDIATELY
  if (!uiStateDB[orderId]) uiStateDB[orderId] = {}
  uiStateDB[orderId][field] = newValue
  
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
  let totalCookies = 0

  let flavourMap = {
    cocoa_ragi: 0,
    coconut_jowar: 0,
    cardamom_bajra: 0
  }

  function getCookies(productName, qty) {
    const name = productName.toLowerCase()

    // 🎁 Special combos
    if (name.includes("signature trio")) return 24 * qty
    if (name.includes("elegant celebration")) return 30 * qty
    if (name.includes("imperial wedding")) return 45 * qty

    // 📦 Normal packs
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

    // 🚨 Skip already prepared orders
    if (o.production_status === "prepared") return
    
    order.order_items.forEach(item => {
      const cookies = getCookies(item.product_name, item.quantity)
      const flavour = detectFlavour(item.product_name)

      totalCookies += cookies

      // 🎁 Handle combo products (split equally into 3 flavours)
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

  let html = `<h3>Production Pending</h3>`

  html += `
    <div class="card">
      🍪 Total Cookies Required: <b>${totalCookies}</b>
    </div>
  `

  html += `<h4 style="margin-left:10px;">Flavour Breakdown</h4>`

  html += `
    <div class="card">🍫 Cocoa Ragi: <b>${flavourMap.cocoa_ragi}</b></div>
    <div class="card">🌾 Coconut Jowar: <b>${flavourMap.coconut_jowar}</b></div>
    <div class="card">🌿 Cardamom Bajra: <b>${flavourMap.cardamom_bajra}</b></div>
  `

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
  let daily = {}

  ordersData.forEach(order => {
    total += Number(order.total_amount)

    const day = new Date(order.created_at).toDateString()
    daily[day] = (daily[day] || 0) + Number(order.total_amount)
  })

  let chart = Object.entries(daily).map(([d,v]) =>
    `<div>${d}: ₹${v}</div>`
  ).join("")

  return `
    <div class="card">💰 Total: ₹${total}</div>
    <div class="card">${chart}</div>
  `
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

    if (daysInactive > 60) segment = "at_risk"

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
function toggleFlag(phone, flag) {
  let flags = JSON.parse(localStorage.getItem("customerFlags") || "{}")

  if (!flags[phone]) {
    flags[phone] = []
  }

  if (flags[phone].includes(flag)) {
    flags[phone] = flags[phone].filter(f => f !== flag)
  } else {
    flags[phone].push(flag)
  }

  localStorage.setItem("customerFlags", JSON.stringify(flags))

  // 🔥 FIX: always regenerate customers
  const customers = getCustomersData()
  renderCustomers(customers)
}


function renderFlagButton(label, key, phone, userFlags) {
  const active = userFlags.includes(key)

  return `
    <button 
      onclick="toggleFlag('${phone}', '${key}')"
      style="
        margin-right:5px;
        background:${active ? 'black' : '#eee'};
        color:${active ? 'white' : 'black'};
        transform:${active ? 'scale(1.05)' : 'scale(1)'};
        transition: all 0.15s ease;
      "
    >
      ${label}
    </button>
  `
}


function normalizePhone(phone) {
  if (!phone) return ""

  phone = phone.toString().replace(/\D/g, "")
  phone = phone.replace(/^0+/, "")

  if (phone.length > 10 && phone.startsWith("91")) {
    phone = phone.slice(-10)
  }

  return phone
}

function renderCustomers(customers) {
  const container = document.getElementById("app")

  let flags = JSON.parse(localStorage.getItem("customerFlags") || "{}")

  container.innerHTML = "<h3>Customers</h3>" + customers.map(c => {
    const phone = normalizePhone(c.phone)
    const userFlags = flags[phone] || []

    return `
      <div class="card">
        <h3>
          ${c.name}
          ${c.segment === "super_vip" ? "👑" : ""}
          ${c.segment === "vip" ? "⭐" : ""}
          ${c.segment === "at_risk" ? "⚠️" : ""}
        </h3>
        <p>${phone}</p>
        <p>₹${c.spend}</p>
        <p>Last: ${c.lastOrder}</p>

        <div style="margin-top:10px;">
          ${renderFlagButton("VIP", "vip", phone, userFlags)}
          ${renderFlagButton("Repeat", "repeat", phone, userFlags)}
          ${renderFlagButton("Promoter", "promoter", phone, userFlags)}
        </div>

        <div style="margin-top:10px;">
          <a href="https://wa.me/${phone}" target="_blank">
            <button>WhatsApp</button>
          </a>
        </div>
      </div>
    `
  }).join("")
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
  if (currentTab === "customers") {
    const customers = getCustomersData()
    window.cachedCustomers = customers
    renderCustomers(customers)
  }
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

function showToast(msg) {
  const div = document.createElement("div")
  div.innerText = msg
  div.style = `
    position:fixed;
    top:20px;
    right:20px;
    background:black;
    color:white;
    padding:10px 20px;
    border-radius:8px;
    z-index:999;
  `
  document.body.appendChild(div)

  setTimeout(() => div.remove(), 3000)
}

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
        showToast("🚨 New Order Received!")
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
