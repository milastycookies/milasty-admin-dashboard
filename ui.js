// ui.js

import { filteredOrders } from "./data.js"
import { formatDateShort, cleanPhone } from "./utils.js"

export function renderCustomers() {
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
        spend: 0,
        lastOrder: null
      }
    }

    map[phone].orders++
    map[phone].spend += Number(order.total_amount)

    const d = new Date(order.created_at)
    if (!map[phone].lastOrder || d > map[phone].lastOrder) {
      map[phone].lastOrder = d
    }
  })

  Object.values(map).forEach(c => {
    html += `
      <div class="customer-card">
        <div>
          <h4>${c.name}</h4>
          <p>${c.phone}</p>
          <p class="last">${formatDateShort(c.lastOrder)}</p>
        </div>

        <div>
          ₹${c.spend}
        </div>
      </div>
    `
  })

  return html
}
