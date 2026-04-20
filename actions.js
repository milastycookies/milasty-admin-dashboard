// actions.js

import { API_BASE, uiStateDB } from "./data.js"
import { getLocalState, saveLocalState, cleanPhone } from "./utils.js"

export async function updateStatus(orderId, field, render) {
  const local = getLocalState()

  const current =
    local[orderId]?.[field] ??
    uiStateDB[orderId]?.[field]

  let newValue

  if (field === "payment_status") {
    if (current === "pending") newValue = "complete"
    else if (current === "complete") newValue = "refunded"
    else newValue = "pending"
  }

  if (!local[orderId]) local[orderId] = {}
  local[orderId][field] = newValue
  saveLocalState(local)

  render()

  try {
    await fetch(`${API_BASE}/update-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ id: orderId, field, value: newValue })
    })
  } catch (err) {
    console.error(err)
  }
}

export function sendWhatsApp(phone, name, trackingId) {
  const clean = cleanPhone(phone)

  const message = `Hi ${name}, Your MILASTY order is shipped 🚚
Tracking ID: ${trackingId}`

  const encoded = encodeURIComponent(message)

  window.open(`https://wa.me/91${clean}?text=${encoded}`, "_blank")
}
