// utils.js

export function getLocalState() {
  return JSON.parse(localStorage.getItem("milasty_ui")) || {}
}

export function saveLocalState(state) {
  localStorage.setItem("milasty_ui", JSON.stringify(state))
}

export function formatDateShort(date) {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  })
}

export function cleanPhone(phone) {
  return (phone || "").replace(/\D/g, "")
}
