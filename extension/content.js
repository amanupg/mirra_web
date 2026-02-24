(function () {
  'use strict'

  // Prevent double-injection
  if (document.getElementById('mirra-root')) return

  /* ================================================================
   *  §1 — OVERLAY CSS (injected into shadow DOM)
   * ================================================================ */

  const OVERLAY_CSS = `
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

    :host {
      all: initial;
      font-family: 'Segoe UI', Inter, system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .mirra {
      position: fixed; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(10, 10, 15, 0.97);
      color: #e8e6f0;
      z-index: 999999;
    }

    /* ── Ambient glow ────────────────────── */
    .mirra-ambient {
      position: absolute;
      top: 25%; left: 50%;
      transform: translate(-50%, -50%);
      width: 600px; height: 600px;
      border-radius: 50%;
      pointer-events: none;
      transition: background 1s ease;
    }
    .mirra-ambient.speaking {
      background: radial-gradient(circle, rgba(157,141,247,0.10) 0%, transparent 70%);
    }
    .mirra-ambient.listening {
      background: radial-gradient(circle, rgba(124,107,240,0.08) 0%, transparent 70%);
    }
    .mirra-ambient.connecting, .mirra-ambient.idle {
      background: radial-gradient(circle, rgba(139,136,152,0.05) 0%, transparent 70%);
    }

    /* ── Orb container ───────────────────── */
    .mirra-orb-wrap {
      position: relative;
      width: 180px; height: 180px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }

    /* Outer glow ring */
    .mirra-orb-glow {
      position: absolute;
      width: 170px; height: 170px;
      border-radius: 50%;
      animation: orb-glow-idle 4s ease-in-out infinite;
    }
    .speaking .mirra-orb-glow { animation: orb-glow-speak 1.2s ease-in-out infinite; }
    .listening .mirra-orb-glow { animation: orb-glow-listen 2.2s ease-in-out infinite; }
    .connecting .mirra-orb-glow { animation: orb-glow-idle 2.5s ease-in-out infinite; }

    /* Mid ring */
    .mirra-orb-mid {
      position: absolute;
      width: 120px; height: 120px;
      border-radius: 50%;
      animation: orb-mid-idle 3.2s ease-in-out infinite 0.3s;
    }
    .speaking .mirra-orb-mid { animation: orb-mid-speak 1s ease-in-out infinite 0.15s; }
    .listening .mirra-orb-mid { animation: orb-mid-listen 2s ease-in-out infinite 0.2s; }

    /* Core orb */
    .mirra-orb-core {
      position: relative;
      width: 64px; height: 64px;
      border-radius: 50%;
      animation: orb-core-idle 3s ease-in-out infinite;
    }
    .speaking .mirra-orb-core { animation: orb-core-speak 0.8s ease-in-out infinite; }
    .listening .mirra-orb-core { animation: orb-core-listen 1.5s ease-in-out infinite; }

    /* ── Color variables per state ────────── */
    .idle .mirra-orb-glow,
    .listening .mirra-orb-glow { background: radial-gradient(circle, rgba(124,107,240,0.18) 0%, transparent 70%); }
    .idle .mirra-orb-mid,
    .listening .mirra-orb-mid { background: radial-gradient(circle, rgba(124,107,240,0.15) 0%, transparent 70%); }
    .idle .mirra-orb-core,
    .listening .mirra-orb-core {
      background: radial-gradient(circle at 35% 35%, #7c6bf0dd, #7c6bf088);
      box-shadow: 0 0 40px rgba(124,107,240,0.25), 0 0 80px rgba(124,107,240,0.12);
    }

    .speaking .mirra-orb-glow { background: radial-gradient(circle, rgba(157,141,247,0.22) 0%, transparent 70%); }
    .speaking .mirra-orb-mid  { background: radial-gradient(circle, rgba(157,141,247,0.18) 0%, transparent 70%); }
    .speaking .mirra-orb-core {
      background: radial-gradient(circle at 35% 35%, #9d8df7dd, #9d8df788);
      box-shadow: 0 0 50px rgba(157,141,247,0.3), 0 0 100px rgba(157,141,247,0.15);
    }

    .connecting .mirra-orb-glow { background: radial-gradient(circle, rgba(139,136,152,0.10) 0%, transparent 70%); }
    .connecting .mirra-orb-mid  { background: radial-gradient(circle, rgba(139,136,152,0.08) 0%, transparent 70%); }
    .connecting .mirra-orb-core {
      background: radial-gradient(circle at 35% 35%, #8b8898dd, #8b889888);
      box-shadow: 0 0 30px rgba(139,136,152,0.2);
    }

    .error .mirra-orb-core {
      background: radial-gradient(circle at 35% 35%, #f07474dd, #f0747488);
      box-shadow: 0 0 40px rgba(240,116,116,0.25);
    }

    /* ── Keyframes ────────────────────────── */
    @keyframes orb-glow-idle {
      0%,100% { transform:scale(1); opacity:0.3; }
      50%     { transform:scale(1.12); opacity:0.55; }
    }
    @keyframes orb-glow-speak {
      0%,100% { transform:scale(1); opacity:0.3; }
      25%     { transform:scale(1.4); opacity:0.9; }
      50%     { transform:scale(1.1); opacity:0.5; }
      75%     { transform:scale(1.35); opacity:0.85; }
    }
    @keyframes orb-glow-listen {
      0%,100% { transform:scale(1); opacity:0.4; }
      50%     { transform:scale(1.25); opacity:0.75; }
    }

    @keyframes orb-mid-idle {
      0%,100% { transform:scale(1); opacity:0.4; }
      50%     { transform:scale(1.1); opacity:0.7; }
    }
    @keyframes orb-mid-speak {
      0%,100% { transform:scale(1); opacity:0.4; }
      50%     { transform:scale(1.25); opacity:0.8; }
    }
    @keyframes orb-mid-listen {
      0%,100% { transform:scale(1); opacity:0.4; }
      50%     { transform:scale(1.15); opacity:0.65; }
    }

    @keyframes orb-core-idle {
      0%,100% { transform:scale(1); }
      50%     { transform:scale(1.03); }
    }
    @keyframes orb-core-speak {
      0%,100% { transform:scale(1); }
      25%     { transform:scale(1.12); }
      50%     { transform:scale(0.97); }
      75%     { transform:scale(1.1); }
    }
    @keyframes orb-core-listen {
      0%,100% { transform:scale(1); }
      50%     { transform:scale(1.06); }
    }

    /* ── Status text ─────────────────────── */
    .mirra-status {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-weight: 500;
      color: rgba(139,136,152,0.55);
      text-align: center;
      margin-top: 4px;
      min-height: 18px;
      transition: color 0.3s;
    }
    .speaking .mirra-status { color: rgba(157,141,247,0.7); }
    .listening .mirra-status { color: rgba(124,107,240,0.6); }

    /* ── Transcript ──────────────────────── */
    .mirra-transcript {
      width: 100%; max-width: 420px;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 20px;
      padding: 0 20px;
      scrollbar-width: thin;
      scrollbar-color: rgba(30,30,46,0.6) transparent;
    }
    .mirra-transcript::-webkit-scrollbar { width: 4px; }
    .mirra-transcript::-webkit-scrollbar-track { background: transparent; }
    .mirra-transcript::-webkit-scrollbar-thumb { background: rgba(42,42,62,0.6); border-radius: 4px; }

    .mirra-msg {
      margin-bottom: 14px;
      animation: msg-in 0.35s ease-out;
    }
    .mirra-msg-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: rgba(139,136,152,0.35);
      margin-bottom: 2px;
    }
    .mirra-msg-text {
      font-size: 14px;
      line-height: 1.55;
      font-weight: 300;
    }
    .mirra-msg-text.agent { color: rgba(232,230,240,0.85); }
    .mirra-msg-text.user  { color: rgba(157,141,247,0.65); font-style: italic; }

    @keyframes msg-in {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ── Bypass button ───────────────────── */
    .mirra-bypass {
      position: absolute;
      bottom: 36px;
      padding: 10px 28px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.04em;
      font-family: inherit;
      cursor: pointer;
      background: rgba(18,18,26,0.5);
      border: 1px solid rgba(30,30,46,0.3);
      color: rgba(139,136,152,0.45);
      transition: all 0.25s;
    }
    .mirra-bypass:hover {
      background: rgba(18,18,26,0.8);
      border-color: rgba(30,30,46,0.6);
      color: rgba(139,136,152,0.8);
    }

    .mirra-brand {
      position: absolute;
      bottom: 14px;
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: rgba(139,136,152,0.15);
    }

    /* ── Error banner ────────────────────── */
    .mirra-error {
      margin-top: 12px;
      padding: 8px 16px;
      border-radius: 10px;
      background: rgba(240,116,116,0.08);
      border: 1px solid rgba(240,116,116,0.15);
      font-size: 12px;
      color: rgba(240,116,116,0.7);
      text-align: center;
      max-width: 380px;
    }

    /* ── Config-missing prompt ────────────── */
    .mirra-setup {
      text-align: center;
      max-width: 300px;
    }
    .mirra-setup p {
      font-size: 14px;
      font-weight: 300;
      line-height: 1.6;
      color: rgba(232,230,240,0.7);
      margin-bottom: 16px;
    }
    .mirra-setup .hint {
      font-size: 11px;
      color: rgba(139,136,152,0.45);
    }
  `

  /* ================================================================
   *  §2 — AUDIO UTILITIES
   * ================================================================ */

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
    }
    return btoa(binary)
  }

  function base64ToArrayBuffer(b64) {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes.buffer
  }

  function float32ToInt16(f32) {
    const i16 = new Int16Array(f32.length)
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]))
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return i16
  }

  function int16ToFloat32(i16) {
    const f32 = new Float32Array(i16.length)
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768
    return f32
  }

  function downsample(buf, from, to) {
    if (from === to) return buf
    const ratio = from / to
    const len = Math.round(buf.length / ratio)
    const out = new Float32Array(len)
    for (let i = 0; i < len; i++) {
      const idx = i * ratio
      const lo = Math.floor(idx)
      const hi = Math.min(lo + 1, buf.length - 1)
      const frac = idx - lo
      out[i] = buf[lo] * (1 - frac) + buf[hi] * frac
    }
    return out
  }

  function parseSampleRate(fmt) {
    if (!fmt) return null
    const m = fmt.match(/pcm_(\d+)/)
    return m ? parseInt(m[1], 10) : null
  }

  /* ================================================================
   *  §3 — ELEVENLABS CONVERSATIONAL AI CLIENT
   * ================================================================ */

  class ElevenLabsClient {
    constructor({ agentId, apiKey, appName, onStatus, onAgent, onUser, onError, onEnd }) {
      this.agentId = agentId
      this.apiKey  = apiKey
      this.appName = appName || 'this app'

      this.onStatus = onStatus || (() => {})
      this.onAgent  = onAgent  || (() => {})
      this.onUser   = onUser   || (() => {})
      this.onError  = onError  || (() => {})
      this.onEnd    = onEnd    || (() => {})

      this.ws = null
      this.inputRate  = 16000
      this.outputRate = 16000
      this.micStream  = null
      this.micCtx     = null
      this.micProc    = null
      this.playCtx    = null
      this.nextPlay   = 0
      this.sources    = []
      this.speaking   = false
      this._dead      = false
    }

    /* ── public ─────────────────────── */

    async start() {
      if (this._dead) return
      this.onStatus('connecting')

      try {
        const url = await this._wsUrl()
        this._connect(url)
      } catch (e) {
        this.onError('Connection failed: ' + e.message)
        this.onStatus('error')
      }
    }

    stop() {
      this._dead = true
      this._closeMic()
      this._stopPlay()
      if (this.playCtx) { try { this.playCtx.close() } catch (_) {} this.playCtx = null }
      if (this.ws) { try { this.ws.close() } catch (_) {} this.ws = null }
    }

    /* ── connection ─────────────────── */

    async _wsUrl() {
      if (!this.apiKey) {
        return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`
      }
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'GET_SIGNED_URL', agentId: this.agentId, apiKey: this.apiKey },
          (resp) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
            if (resp.error) return reject(new Error(resp.error))
            resolve(resp.signedUrl)
          }
        )
      })
    }

    _connect(url) {
      this.ws = new WebSocket(url)
      this.ws.onopen = () => {
        if (this._dead) return
        this.onStatus('connected')
        this._send({
          type: 'conversation_initiation_client_data',
          conversation_initiation_client_data: {
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: `The user just tried to open ${this.appName}. Use "${this.appName}" instead of "Instagram" in your responses where applicable.`,
                },
                first_message: `Hey — you're about to open ${this.appName}. What's going on right now?`,
              },
            },
          },
        })
      }
      this.ws.onmessage = (e) => { if (!this._dead) this._route(JSON.parse(e.data)) }
      this.ws.onclose   = () => { if (!this._dead) this.onEnd() }
      this.ws.onerror   = () => { if (!this._dead) { this.onError('WebSocket error'); this.onStatus('error') } }
    }

    /* ── message router ─────────────── */

    _route(msg) {
      switch (msg.type) {
        case 'conversation_initiation_metadata': return this._onMeta(msg)
        case 'audio':          return this._onAudio(msg)
        case 'agent_response': return this._onAgentResp(msg)
        case 'user_transcript':return this._onUserTx(msg)
        case 'interruption':   return this._onInterrupt()
        case 'ping':           return this._onPing(msg)
      }
    }

    _onMeta(msg) {
      const m = msg.conversation_initiation_metadata_event
      if (!m) return
      const oRate = parseSampleRate(m.agent_output_audio_format)
      if (oRate) this.outputRate = oRate
      const iRate = parseSampleRate(m.user_input_audio_format)
      if (iRate) this.inputRate = iRate
      this.playCtx = new AudioContext({ sampleRate: this.outputRate })
      this._startMic()
    }

    _onAudio(msg) {
      const b64 = msg.audio_event?.audio_base_64
      if (!b64) return
      if (!this.speaking) { this.speaking = true; this.onStatus('speaking') }
      this._playChunk(b64)
    }

    _onAgentResp(msg) {
      const t = msg.agent_response_event?.agent_response
      if (t) this.onAgent(t)
    }

    _onUserTx(msg) {
      const t = msg.user_transcription_event?.user_transcript
      if (t) this.onUser(t)
    }

    _onInterrupt() {
      this._stopPlay()
      this.speaking = false
      this.onStatus('listening')
    }

    _onPing(msg) {
      this._send({ type: 'pong', event_id: msg.ping_event?.event_id })
    }

    /* ── microphone ─────────────────── */

    async _startMic() {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
      } catch (_) {
        this.onError('Microphone access denied')
        this.onStatus('error')
        return
      }

      this.micCtx = new AudioContext()
      const source = this.micCtx.createMediaStreamSource(this.micStream)
      const native = this.micCtx.sampleRate

      this.micProc = this.micCtx.createScriptProcessor(4096, 1, 1)
      this.micProc.onaudioprocess = (e) => {
        if (this._dead || !this.ws || this.ws.readyState !== WebSocket.OPEN) return
        const raw = e.inputBuffer.getChannelData(0)
        const re  = downsample(raw, native, this.inputRate)
        const pcm = float32ToInt16(re)
        this._send({ user_audio_chunk: arrayBufferToBase64(pcm.buffer) })
      }

      source.connect(this.micProc)
      this.micProc.connect(this.micCtx.destination)
      this.onStatus('listening')
    }

    _closeMic() {
      if (this.micProc) { try { this.micProc.disconnect() } catch (_) {} this.micProc = null }
      if (this.micCtx)  { try { this.micCtx.close() } catch (_) {} this.micCtx = null }
      if (this.micStream) { this.micStream.getTracks().forEach(t => t.stop()); this.micStream = null }
    }

    /* ── audio playback ─────────────── */

    _playChunk(b64) {
      if (!this.playCtx) return
      if (this.playCtx.state === 'suspended') this.playCtx.resume()

      const pcm16 = new Int16Array(base64ToArrayBuffer(b64))
      const f32   = int16ToFloat32(pcm16)

      const buf = this.playCtx.createBuffer(1, f32.length, this.outputRate)
      buf.getChannelData(0).set(f32)

      const src = this.playCtx.createBufferSource()
      src.buffer = buf
      src.connect(this.playCtx.destination)

      const now   = this.playCtx.currentTime
      const start = Math.max(now + 0.05, this.nextPlay)
      src.start(start)
      this.nextPlay = start + buf.duration

      this.sources.push(src)
      src.onended = () => {
        this.sources = this.sources.filter(s => s !== src)
        if (this.sources.length === 0 && this.playCtx) {
          const left = this.nextPlay - this.playCtx.currentTime
          if (left <= 0.1) { this.speaking = false; if (!this._dead) this.onStatus('listening') }
        }
      }
    }

    _stopPlay() {
      for (const s of this.sources) { try { s.stop() } catch (_) {} }
      this.sources = []
      this.nextPlay = 0
    }

    /* ── send helper ────────────────── */

    _send(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data))
    }
  }

  /* ================================================================
   *  §4 — MIRRA OVERLAY (vanilla DOM + shadow DOM)
   * ================================================================ */

  class MirraOverlay {
    constructor() {
      this.root      = null
      this.shadow    = null
      this.wrapper   = null
      this.statusEl  = null
      this.txEl      = null
      this.ambientEl = null
      this.errorEl   = null
      this.client    = null
      this.appName   = this._detectApp()
    }

    /* ── app detection ──────────────── */

    _detectApp() {
      const h = location.hostname
      if (h.includes('instagram')) return 'Instagram'
      if (h.includes('tiktok'))    return 'TikTok'
      if (h.includes('youtube'))   return 'YouTube'
      return 'this app'
    }

    /* ── init ───────────────────────── */

    async init() {
      let config
      try {
        config = await new Promise((res) => chrome.storage.sync.get(['agentId', 'apiKey', 'demoApp'], res))
      } catch (_) {
        return // storage not available
      }

      if (!config.agentId) {
        this._buildOverlay()
        this._showSetupPrompt()
        return
      }

      if (config.demoApp) this.appName = config.demoApp

      this._buildOverlay()
      this._blurPage()
      this._startConversation(config.agentId, config.apiKey)
    }

    /* ── build DOM ──────────────────── */

    _buildOverlay() {
      this.root = document.createElement('div')
      this.root.id = 'mirra-root'
      this.root.style.cssText = 'position:fixed;inset:0;z-index:999999;'

      this.shadow = this.root.attachShadow({ mode: 'closed' })

      const style = document.createElement('style')
      style.textContent = OVERLAY_CSS
      this.shadow.appendChild(style)

      this.wrapper = document.createElement('div')
      this.wrapper.className = 'mirra connecting'
      this.wrapper.innerHTML = `
        <div class="mirra-ambient connecting"></div>
        <div class="mirra-orb-wrap">
          <div class="mirra-orb-glow"></div>
          <div class="mirra-orb-mid"></div>
          <div class="mirra-orb-core"></div>
        </div>
        <div class="mirra-status">Connecting\u2026</div>
        <div class="mirra-transcript"></div>
        <button class="mirra-bypass">Just let me in</button>
        <div class="mirra-brand">mirra</div>
      `
      this.shadow.appendChild(this.wrapper)

      this.statusEl  = this.shadow.querySelector('.mirra-status')
      this.txEl      = this.shadow.querySelector('.mirra-transcript')
      this.ambientEl = this.shadow.querySelector('.mirra-ambient')

      this.shadow.querySelector('.mirra-bypass').addEventListener('click', () => this.remove())

      // Append to page
      ;(document.documentElement || document.body).appendChild(this.root)
    }

    _showSetupPrompt() {
      const div = document.createElement('div')
      div.className = 'mirra-setup'
      div.innerHTML = `
        <p>Mirra isn\u2019t configured yet.</p>
        <p class="hint">Click the Mirra extension icon and paste your<br/>ElevenLabs Agent ID to get started.</p>
      `
      this.wrapper.querySelector('.mirra-orb-wrap').insertAdjacentElement('afterend', div)
      this._setStatus('idle', '')
    }

    /* ── page blur ──────────────────── */

    _blurPage() {
      const apply = () => {
        document.body.style.filter = 'blur(8px)'
        document.body.style.overflow = 'hidden'
      }
      if (document.body) {
        apply()
      } else {
        const iv = setInterval(() => {
          if (document.body) { clearInterval(iv); apply() }
        }, 10)
      }
    }

    _unblurPage() {
      if (document.body) {
        document.body.style.filter = ''
        document.body.style.overflow = ''
      }
    }

    /* ── status ─────────────────────── */

    _setStatus(state, label) {
      const states = ['idle', 'connecting', 'connected', 'speaking', 'listening', 'error']
      states.forEach(s => {
        this.wrapper.classList.remove(s)
        this.ambientEl.classList.remove(s)
      })
      this.wrapper.classList.add(state)
      this.ambientEl.classList.add(state)
      this.statusEl.textContent = label
    }

    _statusFromCode(code) {
      const map = {
        connecting: 'Connecting\u2026',
        connected:  'Connected',
        speaking:   'Mirra is speaking\u2026',
        listening:  'Mirra is listening\u2026',
        error:      'Connection error',
      }
      this._setStatus(code, map[code] || '')
    }

    /* ── transcript ─────────────────── */

    _addMessage(role, text) {
      const msg = document.createElement('div')
      msg.className = 'mirra-msg'
      msg.innerHTML = `
        <div class="mirra-msg-label">${role === 'agent' ? 'mirra' : 'you'}</div>
        <div class="mirra-msg-text ${role}">${this._escHtml(text)}</div>
      `
      this.txEl.appendChild(msg)
      this.txEl.scrollTop = this.txEl.scrollHeight
    }

    _escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    }

    /* ── error display ──────────────── */

    _showError(text) {
      if (this.errorEl) this.errorEl.remove()
      this.errorEl = document.createElement('div')
      this.errorEl.className = 'mirra-error'
      this.errorEl.textContent = text
      this.txEl.insertAdjacentElement('beforebegin', this.errorEl)
    }

    /* ── ElevenLabs connection ──────── */

    _startConversation(agentId, apiKey) {
      this.client = new ElevenLabsClient({
        agentId,
        apiKey: apiKey || undefined,
        appName: this.appName,
        onStatus: (s) => this._statusFromCode(s),
        onAgent:  (t) => this._addMessage('agent', t),
        onUser:   (t) => this._addMessage('user', t),
        onError:  (e) => this._showError(e),
        onEnd:    ()  => this._statusFromCode('idle'),
      })
      this.client.start()
    }

    /* ── cleanup ────────────────────── */

    remove() {
      if (this.client) { this.client.stop(); this.client = null }
      this._unblurPage()
      if (this.root) { this.root.remove(); this.root = null }
    }
  }

  /* ================================================================
   *  §5 — BOOTSTRAP
   * ================================================================ */

  const overlay = new MirraOverlay()
  overlay.init()

})()
