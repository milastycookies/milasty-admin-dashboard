// data.js

export const API_BASE = "https://admin-dashboard-production-2711.up.railway.app"

export let ordersData = []
export let uiStateDB = {}
export let filteredOrders = []

export let isLoading = true
export let isFetching = false
export let isFirstLoad = true
export let lastDataHash = ""

export let analyticsRange = 30

export function updateFilteredOrders() {
  const now = new Date()

  filteredOrders = ordersData.filter(order => {
    const date = new Date(order.created_at)
    const diff = (now - date) / (1000 * 60 * 60 * 24)
    return diff <= analyticsRange
  })
}

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
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })

    if (!res.ok) throw new Error("Fetch failed")

    const data = await res.json()

    ordersData = data.orders || {}
    updateFilteredOrders()

    Object.assign(uiStateDB, data.uiState || {})

    const newHash = JSON.stringify(data)

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
  } finally {
    isFetching = false
  }
}
