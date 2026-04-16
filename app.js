// =====================
// CONFIG
// =====================
const API_BASE = "https://admin-dashboard-production-2711.up.railway.app"

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
let analyticsRange = 30 // default 30 days
let filteredOrders = []

// =====================
// AUTH CHECK
// =====================
if (!localStorage.getItem("token")) {
  window.location.href = "/login.html"
}

// =====================
// LOGOUT
// =====================
window.logout = function () {
  localStorage.removeItem("token")
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
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })

    if (res.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login.html"
      return
    }
    
    if (!res.ok) throw new Error("Fetch failed")

    const data = await res.json()

    const newOrders = data.orders || []
    const newUI = data.uiState || {}
  
    
    // Only update if data changed
    ordersData = newOrders

    updateFilteredOrders()

    // merge instead of overwrite
    Object.keys(newUI).forEach(id => {
      if (!uiStateDB[id]) uiStateDB[id] = {}
      uiStateDB[id] = {
        ...uiStateDB[id],
        ...newUI[id]
      }
    })

    // Create hash to detect changes
    const newHash = JSON.stringify({ newOrders, newUI })

    if (newHash === lastDataHash && !isFirstLoad) {
      isFetching = false
      return
    }

    if (newHash !== lastDataHash || isFirstLoad) {
      isLoading = false
      lastDataHash = newHash
      render()
    }
    
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

    if (err.message.includes("401")) {
      localStorage.removeItem("token")
      window.location.href = "/login.html"
    }
  
    setTimeout(loadOrders, 3000)
  } finally {
    isFetching = false
  }
}


function updateFilteredOrders() {
  const now = new Date()

  filteredOrders = ordersData.filter(order => {
    const date = new Date(order.created_at)
    const diff = (now - date) / (1000 * 60 * 60 * 24)
    return diff <= analyticsRange
  })
}

// =====================
// UPDATE STATUS
// =====================
window.updateStatus = async function (orderId, field, btn, forceValue = null) {
  if (btn) btn.disabled = true
  document.body.style.pointerEvents = "none"
  orderId = String(orderId)
  if (!window._updatingMap) window._updatingMap = {}

  const key = `${orderId}_${field}`
  if (window._updatingMap[key]) return
  window._updatingMap[key] = true

  const local = getLocalState()

  const current =
    local[orderId]?.[field] ??
    uiStateDB[orderId]?.[field]

  let newValue

  // =====================
  // FORCE VALUE (for cancel)
  // =====================
  if (forceValue !== null) {
    newValue = forceValue
  }

  // =====================
  // EXISTING LOGIC
  // =====================
  if (field === "payment_status") {
    if (current === "pending") newValue = "complete"
    else if (current === "complete") newValue = "refunded"
    else newValue = "pending"
  }

  else if (field === "production_status") {
    newValue = current === "prepared" ? "not_prepared" : "prepared"
  }

  else if (field === "delivery_status") {
    if (!current || current === "pending") newValue = "dispatched"
    else if (current === "dispatched") newValue = "delivered"
    else newValue = "pending"
  }

  // =====================
  // NEW: CANCEL LOGIC
  // =====================
  else if (field === "cancelled") {
    newValue = current === true ? false : true
  }

  // =====================
  // INSTANT UI UPDATE
  // =====================
  if (!local[orderId]) local[orderId] = {}
  local[orderId][field] = newValue

  if (!uiStateDB[orderId]) uiStateDB[orderId] = {}
  uiStateDB[orderId][field] = newValue

  saveLocalState(local)

  document.body.style.transition = "opacity 0.2s ease"
  document.body.style.opacity = "0.6"

  render()
  lastRenderedHTML = ""
  lastRenderedTab = ""

  try {
    const res = await fetch(`${API_BASE}/update-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
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

  document.body.style.opacity = "1"
  document.body.style.pointerEvents = "auto"

  if (btn) btn.disabled = false
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
      db.payment_status ??
      local[String(order.id)]?.payment_status ??
      order.payment_status ??
      "pending",

    production_status:
      db.production_status ??
      local[String(order.id)]?.production_status ??
      "not_prepared",

    delivery_status:
      db.delivery_status ??
      local[String(order.id)]?.delivery_status ??
      "pending",

    cancelled:
      db.cancelled ??
      local[String(order.id)]?.cancelled ??
      false
  }
}

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
function renderProduction() {
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

      // =====================
      // CASE 1: BUNDLES
      // =====================
      const normalizedProduct = product.toLowerCase()
      
      const recipeKey = Object.keys(PRODUCT_MAP).find(p =>
        normalizedProduct.includes(p.toLowerCase())
      )
      
      const recipe = recipeKey ? PRODUCT_MAP[recipeKey] : null

      if (recipe) {
        recipe.forEach(f => {
          if (!flavourTotals[f.name]) {
            flavourTotals[f.name] = 0
          }

          flavourTotals[f.name] += f.qty * quantity
          if (!flavourOrders[f.name]) {
            flavourOrders[f.name] = []
          }
          
          flavourOrders[f.name].push({
            product,
            quantity
          })
        })

        return // 🔥 important
      }

      // =====================
      // CASE 2: DAILY RITUAL (single SKU)
      // =====================

      // 👇 detect flavour
      let flavour = null

      if (name.includes("cocoa")) flavour = "Cocoa Ragi"
      else if (name.includes("cardamom")) flavour = "Cardamom Bajra"
      else if (name.includes("coconut")) flavour = "Coconut Jowar"

      if (!flavour) {
        console.warn("Unknown flavour:", product)
        return
      }

      // 👇 detect pack size
      let cookies = 0

      if (name.includes("trial")) cookies = 6
      else if (name.includes("regular")) cookies = 8
      else if (name.includes("couple")) cookies = 10
      else if (name.includes("family")) cookies = 15

      if (cookies === 0) {
        console.warn("Unknown pack size:", product)
        return
      }

      if (!flavourTotals[flavour]) {
        flavourTotals[flavour] = 0
      }

      flavourTotals[flavour] += cookies * quantity
      if (!flavourOrders[flavour]) {
        flavourOrders[flavour] = []
      }
      
      flavourOrders[flavour].push({
        product,
        quantity
      })
    })
  })

  // =====================
  // UI
  // =====================
  let html = `
      <div style="padding:16px;">
        <h3 style="text-align:center; margin-bottom:16px;">
          🍪 Production Required
        </h3>
    `
    
    if (Object.keys(flavourTotals).length === 0) {
      html += `
        <div class="card" style="text-align:center;">
          No production required 🎉
        </div>
      `
      return html
    }
    
    const total = Object.values(flavourTotals).reduce((a,b)=>a+b,0)
    
    html += `
      <div style="
        background:#000;
        color:#fff;
        border-radius:14px;
        padding:14px;
        text-align:center;
        margin-bottom:16px;
        font-weight:600;
      ">
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
        <div style="
          background:${bg};
          border-radius:16px;
          padding:14px 16px;
          margin-bottom:12px;
          box-shadow:0 4px 12px rgba(0,0,0,0.05);
        ">
      
          <!-- TOP ROW -->
          <div style="display:flex; justify-content:space-between; align-items:center;">
            
            <div style="display:flex; align-items:center; gap:8px; font-size:15px;">
              
              <span style="
                font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
                font-size:18px;
                line-height:1;
              ">
                ${emoji}
              </span>
      
              <span style="font-weight:500;">
                ${flavour}
              </span>
      
            </div>
      
            <div style="
              font-weight:600;
              font-size:14px;
              background:#f3f4f6;
              padding:6px 10px;
              border-radius:10px;
            ">
              ${qty} cookies
            </div>
      
          </div>
      
          <!-- 🔥 ORDER DETAILS (NEW) -->
          <div style="
            margin-top:12px;
            background:rgba(255,255,255,0.6);
            border-radius:10px;
            padding:8px 10px;
          ">
            ${(flavourOrders[flavour] || []).map(item => `
              <div style="
                display:flex;
                justify-content:space-between;
                padding:4px 0;
                border-bottom:1px solid #eee;
              ">
                <span style="font-size:12px; color:#444;">
                  ${item.product}
                </span>
          
                <span style="font-size:12px; font-weight:600;">
                  ${item.quantity}
                </span>
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
function renderOrders() {
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
    // CARD STYLE (premium UX)
    // =====================
    const cardStyle = isCancelled
      ? "opacity:0.5; text-decoration:line-through;"
      : ""

    // =====================
    // HTML
    // =====================
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
            onclick="updateStatus('${order.id}','payment_status', this)">
            💰 ${o.payment_status}
          </button>

          <button class="status-btn ${productionClass}"
            onclick="updateStatus('${order.id}','production_status', this)">
            🍪 ${o.production_status}
          </button>

          <button class="status-btn ${deliveryClass}"
            onclick="updateStatus('${order.id}','delivery_status', this)">
            🚚 ${o.delivery_status}
          </button>

          <!-- 🔥 NEW CANCEL BUTTON -->
          <button class="status-btn ${cancelBtnClass}"
            style="margin-left:auto;"
            onclick="toggleCancel('${order.id}', '${isCancelled}')">
            ${cancelBtnText}
          </button>

        </div>

      </div>
    `
  })

  return html
}



window.toggleCancel = async function (id, current){
  const isCancelled = current === "true"

  const confirmMsg = isCancelled
    ? "Undo cancellation?"
    : "Cancel this order?"

  if (!confirm(confirmMsg)) return

  await updateStatus(id, "cancelled", null, !isCancelled)
}


// =====================
// DISPATCH
// =====================
function renderDispatch() {
  let html = "<h3>Dispatch</h3>"

  filteredOrders.forEach(order => {
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
  let totalOrders = filteredOrders.length

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
  
  filteredOrders.forEach(o => currentRevenue += Number(o.total_amount))
  previousOrders.forEach(o => previousRevenue += Number(o.total_amount))

  totalRevenue = currentRevenue
  
  const growth = previousRevenue
    ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
    : 0


  filteredOrders.forEach(order => {
    const o = applyUIState(order)
    if (o.cancelled) return
    const date = new Date(order.created_at)
    const amount = Number(order.total_amount)


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

  // Top SKU
  const topSKU = Object.entries(skuMap).sort((a,b)=>b[1]-a[1])[0]

  return `
    <h3>📊 Business Analytics</h3>

    <div style="display:flex;gap:6px;margin-bottom:10px;">
      ${[7,30,180,365].map(d => `
        <button 
          onclick="setAnalyticsRange(${d})"
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

      <div class="card">
        <div style="font-size:12px;color:#777;">Growth</div>
        <div style="font-size:18px;font-weight:600;color:${growth > 10 ? 'green' : growth >= 0 ? '#888' : 'red'};">
          ${growth >= 0 ? '▲' : '▼'} ${Math.abs(growth)}%
        </div>
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


window.setAnalyticsRange = function(days) {
  analyticsRange = days
  updateFilteredOrders()
  render()
}


function renderCharts() {
  if (!window.Chart) return

  const monthly = {}
  const weekly = {}
  const skuMap = {}
  const dailyRevenue = {}

  filteredOrders.forEach(order => {
    const date = new Date(order.created_at)
    const amount = Number(order.total_amount)

    const month = date.toLocaleString("en-IN", {
      month: "short",
      year: "2-digit"
    })
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
  const sortedMonths = Object.keys(monthly).sort((a, b) => {
    const parse = (str) => {
      const [mon, yr] = str.split(" ")
      return new Date(`20${yr}-${mon}-01`)
    }
    return parse(a) - parse(b)
  })
  const sortedMonthlyValues = sortedMonths.map(m => monthly[m])
  
  window._charts.push(
    new Chart(document.getElementById("monthlyChart"), {
      type: "bar",
      data: {
        labels: sortedMonths.map(m => {
          const [mon, yr] = m.split(" ")
          const d = new Date(`20${yr}-${mon}-01`)
          return d.toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit"
          })
        }),
        datasets: [{
          label: "₹ Sales",
          data: sortedMonthlyValues
        }]
      }
    })
  )

  
  // REVENUE LINE
  const sortedDates = Object.keys(dailyRevenue).sort()
  const sortedRevenue = sortedDates.map(d => dailyRevenue[d])
  
  window._charts.push(
    new Chart(document.getElementById("revenueChart"), {
      type: "line",
      data: {
        labels: sortedDates.reverse(),
        datasets: [{
          label: "Revenue",
          data: sortedRevenue.reverse(),
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 6,   // 🔥 prevents clutter
              callback: function(value) {
                const label = this.getLabelForValue(value)
                return new Date(label).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short"
                })
              }
            }
          }
        }
      }
    })
  )

  // WEEKLY
  const sortedWeeks = Object.keys(weekly).sort()
  const weeklyValues = sortedWeeks.map(w => weekly[w])
  
  window._charts.push(
    new Chart(document.getElementById("weeklyChart"), {
      type: "bar",
      data: {
        labels: sortedWeeks.map(w => `Week ${w.replace("W","")}`),
        datasets: [{
          label: "Weekly",
          data: weeklyValues
        }]
      },
      options: {
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 6
            }
          }
        }
      }
    })
  )

  // SKU
  window._charts.push(
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
  )
}

// =====================
// CUSTOMERS
// =====================
function renderCustomers() {
  let html = "<h3>Customers</h3>"

  const map = {}

  filteredOrders.forEach(order => {
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
      app.innerHTML = `
        <div class="card" style="text-align:center;">
          <div style="font-size:14px;color:#777;">Loading dashboard...</div>
        </div>
      `
      lastRenderedHTML = "loading"
    }
    return
  }

  let newHTML = ""

  if (currentTab === "production") newHTML = renderProduction()
  if (currentTab === "orders") newHTML = renderOrders()
  if (currentTab === "dispatch") newHTML = renderDispatch()
  if (currentTab === "analytics") newHTML = renderAnalytics()
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
  
    // ✅ render charts AFTER DOM update
    if (currentTab === "analytics") {
      setTimeout(renderCharts, 50)
    }
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
