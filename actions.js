// =====================
// actions.js
// =====================

import {
  API_BASE,
  uiStateDB,
  loadOrders,
  getLocalState,
  saveLocalState
} from "./data.js"

// =====================
// UPDATE STATUS
// =====================
export async function updateStatus(orderId, field, render, btn = null, forceValue = null) {
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
  // VALUE LOGIC
  // =====================
  if (forceValue !== null) {
    newValue = forceValue
  } else {
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

    else if (field === "cancelled") {
      newValue = current === true ? false : true
    }
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
    loadOrders(render)
  }

  window._updatingMap[key] = false

  document.body.style.opacity = "1"
  document.body.style.pointerEvents = "auto"

  if (btn) btn.disabled = false
}


// =====================
// DISPATCH + SAVE TRACKING
// =====================
export async function handleDispatch(orderId, render) {
  const input = document.getElementById(`track-${orderId}`)

  if (!input) {
    alert("Input not found")
    return
  }

  const trackingId = input.value.trim()
  const aggregatorSelect = document.getElementById(`agg-${orderId}`)
  const aggregator = aggregatorSelect?.value

  if (!trackingId) {
    alert("Enter tracking ID first")
    return
  }

  // Save tracking ID
  const res = await fetch(`${API_BASE}/update-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({
      id: orderId,
      field: "tracking_id",
      value: trackingId
    })
  })

  // Save aggregator
  await fetch(`${API_BASE}/update-order`, {
    method: "POST",
    headers: {...},
    body: JSON.stringify({
      id: orderId,
      field: "aggregator",
      value: aggregator
    })
  })

  if (!res.ok) {
    alert("Failed to save tracking ID")
    return
  }

  // update delivery status
  await updateStatus(orderId, "delivery_status", render, null, "dispatched")

  loadOrders(render)
}


// =====================
// WHATSAPP MESSAGE
// =====================
export function sendWhatsApp(orderId, phone, name, trackingFromState = null) {
  let trackingId = ""

  // 1. Try from state
  if (trackingFromState) {
    trackingId = trackingFromState
  }

  // 2. Else from input
  else {
    const input = document.getElementById(`track-${orderId}`)
    if (input) {
      trackingId = input.value.trim()
    }
  }

  if (!trackingId) {
    alert("Tracking ID missing")
    return
  }

  const cleanPhone = phone.replace(/\D/g, "")

  const message = `Hi ${name},

Your MILASTY order has been shipped 🚚

Tracking ID: ${trackingId}

Track here:
https://shiprocket.co/tracking/${trackingId}

Thank you ❤️`

  const encoded = encodeURIComponent(message)

  const win = window.open(
    `https://wa.me/91${cleanPhone}?text=${encoded}`,
    "_blank"
  )

  if (!win) {
    alert("Popup blocked. Please allow popups.")
  }
}


// =====================
// TRACKING HELPERS
// =====================
export function openTracking(id) {
  if (!id) return
  window.open(`https://shiprocket.co/tracking/${id}`, "_blank")
}

export function copyTracking(trackingId) {
  if (!trackingId) {
    alert("No tracking ID")
    return
  }

  navigator.clipboard.writeText(trackingId)
    .then(() => alert("Copied ✅"))
    .catch(() => alert("Copy failed"))
}


// =====================
// CANCEL TOGGLE
// =====================
export async function toggleCancel(id, current, render) {
  const isCancelled = current === "true"

  const confirmMsg = isCancelled
    ? "Undo cancellation?"
    : "Cancel this order?"

  if (!confirm(confirmMsg)) return

  await updateStatus(id, "cancelled", render, null, !isCancelled)
}
