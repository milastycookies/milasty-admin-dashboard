// =====================
// app.js
// =====================

import {
  loadOrders,
  isLoading,
  checkAuth
} from "./data.js"

import * as ui from "./ui.js"
import * as actions from "./actions.js"

// =====================
// GLOBAL EXPOSURE (for inline onclick)
// =====================
window._actions = actions
window._ui = ui

// =====================
// APP STATE
// =====================
let currentTab = "production"

// =====================
// MAIN RENDER
// =====================
export function render() {
  const app = document.getElementById("app")
  if (!app) return

  // =====================
  // LOADING STATE
  // =====================
  if (isLoading) {
    app.innerHTML = `
      <div style="padding:20px;text-align:center;">
        ⏳ Loading orders...
      </div>
    `
    return
  }

  // =====================
  // TAB RENDERING
  // =====================
  let content = ""

  if (currentTab === "production") {
    content = ui.renderProduction()
  }

  else if (currentTab === "orders") {
    content = ui.renderOrders()
  }

  else if (currentTab === "dispatch") {
    content = ui.renderDispatch()
  }

  else if (currentTab === "analytics") {
    content = ui.renderAnalytics()
  }

  else if (currentTab === "customers") {
    content = ui.renderCustomers()
  }

 

  // =====================
  // POST RENDER (Charts)
  // =====================
  if (currentTab === "analytics") {
    setTimeout(() => {
      ui.renderCharts()
    }, 0)
  }
}

// =====================
// NAV BUTTON
// =====================
function navButton(tab, icon) {
  const active = currentTab === tab

  return `
    <div 
      onclick="window.setTab('${tab}')"
      style="
        flex:1;
        text-align:center;
        cursor:pointer;
        font-size:18px;
        padding:6px 0;
        color:${active ? "#000" : "#999"};
      "
    >
      ${icon}
    </div>
  `
}

// =====================
// TAB SWITCH
// =====================
window.setTab = function(tab) {
  currentTab = tab
  render()
}

// =====================
// AUTO REFRESH (10s)
// =====================
setInterval(() => {
  if (!document.hidden) {
    loadOrders(render)
  }
}, 10000)

// =====================
// INIT
// =====================
checkAuth()

window._render = render

loadOrders(render)
