// =====================
// data.js
// =====================

// =====================
// CONFIG
// =====================
export const API_BASE = "https://admin-dashboard-production-2711.up.railway.app"

// =====================
// STATE
// =====================
export let ordersData = []
export let uiStateDB = {}

export let filteredOrders = []

export let isLoading = true
export let lastDataHash = ""
export let isFirstLoad = true
export let isFetching = false

export let analyticsRange = 30 // default 30 days

// =====================
// AUTH CHECK
// =====================
export function checkAuth() {
  if (!localStorage.getItem("token")) {
    window.location.href = "/login.html"
  }
}

// =====================
// LOGOUT
// =====================
export function logout() {
  localStorage.removeItem("token")
  window.location.href = "/login.html"
}

// =====================
// LOCAL STATE
// =====================
export function getLocalState() {
  return JSON.parse(localStorage.getItem("milasty_ui")) || {}
}

export function saveLocalState(state) {
  localStorage.setItem("milasty_ui", JSON.stringify(state))
}

// =====================
// FILTER ORDERS
// =====================
export function updateFilteredOrders() {
  const now = new Date()

  filteredOrders = ordersData.filter(order => {
    const date = new Date(order.created_at)
    const diff = (now - date) / (1000 * 60 * 60 * 24)
    return diff <= analyticsRange
  })
}

// =====================
// APPLY UI STATE
// =====================
export function applyUIState(order) {
  const local = getLocalState()
  const db = uiStateDB[String(order.id)] || {}

  return {
    ...order,

    tracking_id:
      order.tracking_id ??
      db.tracking_id ??
      local[String(order.id)]?.tracking_id ??
      "",

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
// LOAD ORDERS
// =====================
export async function loadOrders(render) {
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

    // 🔒 Auth fail
    if (res.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login.html"
      return
    }

    if (!res.ok) throw new Error("Fetch failed")

    const data = await res.json()

    const newOrders = data.orders || []
    const newUI = data.uiState || {}

    // =====================
    // UPDATE DATA
    // =====================
    ordersData = newOrders

    updateFilteredOrders()

    // =====================
    // MERGE UI STATE
    // =====================
    Object.keys(newUI).forEach(id => {
      if (!uiStateDB[id]) uiStateDB[id] = {}

      uiStateDB[id] = {
        ...uiStateDB[id],
        ...newUI[id]
      }
    })

    // =====================
    // HASH CHECK
    // =====================
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

    isLoading = false
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

    setTimeout(() => loadOrders(render), 3000)

  } finally {
    isFetching = false
  }
}
