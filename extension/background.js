/*  Mirra — background service worker (MV3)
 *
 *  Responsibilities:
 *   1. Proxy the ElevenLabs signed-URL fetch (avoids CORS from content scripts)
 *   2. Inject content script on-demand for "Test on this page" demo mode
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── Signed URL fetch ──────────────────────────────
  if (message.type === 'GET_SIGNED_URL') {
    getSignedUrl(message.agentId, message.apiKey)
      .then(url  => sendResponse({ signedUrl: url }))
      .catch(err => sendResponse({ error: err.message }))
    return true // keep channel open for async response
  }

  // ── Close / navigate away from tab ────────────────
  if (message.type === 'CLOSE_TAB') {
    const tabId = sender.tab?.id
    if (!tabId) return false
    chrome.tabs.goBack(tabId, () => {
      // If goBack fails (no history), open new tab page instead
      if (chrome.runtime.lastError) {
        chrome.tabs.update(tabId, { url: 'chrome://newtab' })
      }
    })
    return false
  }

  // ── Demo: inject overlay on arbitrary page ────────
  if (message.type === 'TRIGGER_OVERLAY') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js'],
      })
    })
    return false
  }
})

async function getSignedUrl(agentId, apiKey) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    { headers: { 'xi-api-key': apiKey } }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.signed_url
}