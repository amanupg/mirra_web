const $id   = (id) => document.getElementById(id)
const $agentId = $id('agentId')
const $apiKey  = $id('apiKey')
const $demo    = $id('demoApp')
const $save    = $id('save')
const $test    = $id('test')
const $status  = $id('status')

// ── Load saved values ───────────────────
chrome.storage.sync.get(['agentId', 'apiKey', 'demoApp'], (data) => {
  if (data.agentId) $agentId.value = data.agentId
  if (data.apiKey)  $apiKey.value  = data.apiKey
  if (data.demoApp) $demo.value    = data.demoApp
})

// ── Save ────────────────────────────────
$save.addEventListener('click', () => {
  const agentId = $agentId.value.trim()
  const apiKey  = $apiKey.value.trim()
  const demoApp = $demo.value

  if (!agentId) {
    flash('Agent ID is required', true)
    return
  }

  chrome.storage.sync.set({ agentId, apiKey, demoApp }, () => {
    flash('Saved ✓')
  })
})

// ── Test on current page ────────────────
$test.addEventListener('click', () => {
  const agentId = $agentId.value.trim()
  if (!agentId) {
    flash('Save an Agent ID first', true)
    return
  }
  // Save first, then trigger
  chrome.storage.sync.set(
    { agentId, apiKey: $apiKey.value.trim(), demoApp: $demo.value },
    () => {
      chrome.runtime.sendMessage({ type: 'TRIGGER_OVERLAY' })
      flash('Overlay injected')
      setTimeout(() => window.close(), 600)
    }
  )
})

// ── Open Dashboard ──────────────────────
$id('dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
})

function flash(msg, isError = false) {
  $status.textContent = msg
  $status.className = 'status' + (isError ? ' error' : '')
  setTimeout(() => { $status.textContent = '' }, 2500)
}