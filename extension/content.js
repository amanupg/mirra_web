(function () {
  'use strict'

  // Prevent double-injection
  if (document.getElementById('mirra-root')) return

  // Session bypass counter (resets on page load)
  let bypassCount = 0
  let breakupDismissed = false

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

    /* ================================================================
     *  MOOD SCREENS — shown after voice classifies mood
     * ================================================================ */

    .mirra-screen {
      display: flex; flex-direction: column; align-items: center;
      width: 100%; max-width: 440px;
      padding: 0 20px;
      animation: screen-in 0.5s ease-out;
    }
    @keyframes screen-in {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .mirra-screen h2 {
      font-size: 18px; font-weight: 400; line-height: 1.55;
      color: rgba(232,230,240,0.9);
      text-align: center;
      margin-bottom: 24px;
    }

    /* ── Cards row (stressed grounding) ──── */
    .mirra-cards {
      display: flex; gap: 12px;
      width: 100%; margin-bottom: 28px;
    }
    .mirra-card {
      flex: 1;
      background: rgba(18,18,26,0.6);
      border: 1px solid rgba(30,30,46,0.45);
      border-radius: 16px;
      padding: 18px 10px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      transition: border-color 0.25s, background 0.25s;
      cursor: default;
    }
    .mirra-card:hover {
      border-color: rgba(124,107,240,0.3);
      background: rgba(18,18,26,0.8);
    }
    .mirra-card-icon {
      font-size: 28px; line-height: 1;
    }
    .mirra-card-label {
      font-size: 12px; font-weight: 500;
      color: rgba(232,230,240,0.7);
      text-align: center; letter-spacing: 0.02em;
    }

    /* ── Button row ──────────────────────── */
    .mirra-btn-row {
      display: flex; gap: 10px;
      width: 100%;
      margin-bottom: 14px;
    }
    .mirra-btn {
      flex: 1;
      padding: 12px 8px;
      border-radius: 14px;
      font-size: 13px; font-weight: 500;
      letter-spacing: 0.03em;
      cursor: pointer;
      border: 1px solid transparent;
      font-family: inherit;
      transition: all 0.25s;
      text-align: center;
    }
    .mirra-btn-primary {
      background: rgba(124,107,240,0.15);
      border-color: rgba(124,107,240,0.3);
      color: #9d8df7;
    }
    .mirra-btn-primary:hover {
      background: rgba(124,107,240,0.28);
      border-color: rgba(124,107,240,0.5);
    }
    .mirra-btn-secondary {
      background: rgba(18,18,26,0.5);
      border-color: rgba(30,30,46,0.35);
      color: rgba(139,136,152,0.65);
    }
    .mirra-btn-secondary:hover {
      background: rgba(18,18,26,0.8);
      border-color: rgba(30,30,46,0.6);
      color: rgba(232,230,240,0.8);
    }

    /* ── Low mood avatar ─────────────────── */
    .mirra-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #6bc5f0aa, #6bc5f055);
      box-shadow: 0 0 24px rgba(107,197,240,0.2);
      margin-bottom: 16px;
    }

    /* ── Text input (low mood) ───────────── */
    .mirra-text-input {
      width: 100%;
      background: rgba(18,18,26,0.7);
      border: 1px solid rgba(30,30,46,0.45);
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 13px; font-weight: 300;
      color: #e8e6f0;
      font-family: inherit;
      outline: none;
      margin-bottom: 20px;
      transition: border-color 0.2s;
      resize: none; min-height: 44px;
    }
    .mirra-text-input::placeholder { color: rgba(139,136,152,0.35); }
    .mirra-text-input:focus { border-color: rgba(107,197,240,0.4); }

    /* ── Support info block ──────────────── */
    .mirra-support {
      width: 100%;
      background: rgba(107,197,240,0.06);
      border: 1px solid rgba(107,197,240,0.15);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 20px;
      animation: screen-in 0.4s ease-out;
    }
    .mirra-support h3 {
      font-size: 13px; font-weight: 500;
      color: rgba(107,197,240,0.85);
      margin-bottom: 10px;
    }
    .mirra-support p {
      font-size: 12px; line-height: 1.65; font-weight: 300;
      color: rgba(232,230,240,0.65);
      margin-bottom: 4px;
    }
    .mirra-support a {
      color: rgba(107,197,240,0.8);
      text-decoration: none;
    }
    .mirra-support a:hover { text-decoration: underline; }

    /* ── Chat bubble (neutral) ───────────── */
    .mirra-chat-bubble {
      align-self: flex-end;
      background: rgba(124,107,240,0.12);
      border: 1px solid rgba(124,107,240,0.2);
      border-radius: 16px 16px 4px 16px;
      padding: 10px 16px;
      font-size: 13px; font-weight: 300; font-style: italic;
      color: rgba(157,141,247,0.7);
      margin-bottom: 16px;
      max-width: 85%;
    }

    /* ── Suggestion card (neutral) ────────── */
    .mirra-suggestion {
      width: 100%;
      background: rgba(18,18,26,0.6);
      border: 1px solid rgba(30,30,46,0.45);
      border-radius: 16px;
      padding: 20px;
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 24px;
    }
    .mirra-suggestion-icon { font-size: 32px; line-height: 1; }
    .mirra-suggestion-text {
      font-size: 15px; font-weight: 400;
      color: rgba(232,230,240,0.85);
      line-height: 1.45;
    }

    /* ── Bottom text link ────────────────── */
    .mirra-link {
      font-size: 12px;
      color: rgba(139,136,152,0.4);
      cursor: pointer;
      background: none; border: none;
      font-family: inherit;
      margin-top: 8px;
      transition: color 0.2s;
    }
    .mirra-link:hover { color: rgba(139,136,152,0.7); }

    /* ── Personalized redirect cards ───── */
    .mirra-profile-badge {
      font-size: 11px;
      color: rgba(139,136,152,0.5);
      letter-spacing: 0.08em;
      margin-bottom: 16px;
    }
    .mirra-reco-card {
      width: 100%;
      background: rgba(18,18,26,0.6);
      border: 1px solid rgba(30,30,46,0.45);
      border-radius: 16px;
      padding: 16px;
      display: flex; align-items: flex-start; gap: 14px;
      margin-bottom: 10px;
      transition: border-color 0.25s, background 0.25s;
    }
    .mirra-reco-card:hover {
      border-color: rgba(124,107,240,0.25);
      background: rgba(18,18,26,0.8);
    }
    .mirra-reco-icon {
      font-size: 28px; line-height: 1; flex-shrink: 0; margin-top: 2px;
    }
    .mirra-reco-body { flex: 1; }
    .mirra-reco-title {
      font-size: 14px; font-weight: 500;
      color: rgba(232,230,240,0.9);
      margin-bottom: 4px;
    }
    .mirra-reco-sub {
      font-size: 12px; font-weight: 300;
      color: rgba(139,136,152,0.6);
      line-height: 1.5; margin-bottom: 10px;
    }
    .mirra-reco-action {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 11px; font-weight: 500;
      cursor: pointer;
      background: rgba(124,107,240,0.12);
      border: 1px solid rgba(124,107,240,0.25);
      color: #9d8df7;
      font-family: inherit;
      transition: all 0.2s;
    }
    .mirra-reco-action:hover {
      background: rgba(124,107,240,0.22);
      border-color: rgba(124,107,240,0.4);
    }

    /* ── Breakup mode ─────────────────── */
    .mirra-big-emoji {
      font-size: 52px; line-height: 1;
      margin-bottom: 20px;
    }
    .mirra-subtext {
      font-size: 14px; font-weight: 300;
      color: rgba(139,136,152,0.6);
      text-align: center; line-height: 1.65;
      max-width: 360px;
      margin-bottom: 28px;
    }
    .mirra-option-card {
      width: 100%;
      background: rgba(18,18,26,0.6);
      border: 1px solid rgba(30,30,46,0.45);
      border-radius: 16px;
      padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: border-color 0.25s, background 0.25s;
    }
    .mirra-option-card:hover {
      border-color: rgba(124,107,240,0.3);
      background: rgba(18,18,26,0.8);
    }
    .mirra-option-icon {
      font-size: 24px; line-height: 1; flex-shrink: 0;
    }
    .mirra-option-text {
      font-size: 14px; font-weight: 400;
      color: rgba(232,230,240,0.85);
    }
    .mirra-note-area {
      width: 100%;
      background: rgba(18,18,26,0.7);
      border: 1px solid rgba(30,30,46,0.45);
      border-radius: 14px;
      padding: 14px 16px;
      font-size: 13px; font-weight: 300;
      color: #e8e6f0;
      font-family: inherit;
      outline: none;
      margin-bottom: 20px;
      transition: border-color 0.2s;
      resize: none;
      min-height: 120px;
    }
    .mirra-note-area::placeholder { color: rgba(139,136,152,0.35); }
    .mirra-note-area:focus { border-color: rgba(124,107,240,0.4); }
    .mirra-instructions {
      font-size: 13px; font-weight: 300;
      color: rgba(139,136,152,0.6);
      text-align: center; line-height: 1.65;
      max-width: 360px;
      margin-bottom: 24px;
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
   *  §3 — MOOD CLASSIFIER
   * ================================================================ */

  const STRESSED_WORDS = [
    'overwhelmed','anxious','stressed','deadline','pressure',
    'too much','exam','panic','falling apart','nervous',
    'work panic','can\'t handle','behind on','overloaded','burnt out',
  ]
  const LOW_MOOD_WORDS = [
    'tired','lonely','sad','empty','numb','bored with life',
    'meh','low energy','depressed','hopeless','drained',
    'exhausted','crying','hurt','alone','worthless',
    'demotivated','not happening','can\'t keep up','too many deadlines',
    'falling behind','not going well','unmotivated','burned out',
    'struggling','frustrated','lost','stuck','giving up',
    'can\'t focus','nothing works','pointless','miserable',
    'defeated','overwhelmed at work','not good enough',
  ]
  const BYPASS_WORDS = [
    'let me in','just let me','just open','none of your business',
    'shut up','go away','leave me alone','skip','get out of my way',
    'stop','fuck off','piss off','not now','buzz off',
  ]
  const INTENTIONAL_WORDS = [
    'work','dms','messages','post','need to','have to','genuine',
    'actually need','real reason','check something','specific','task',
    'reply','respond to','send','upload','dm someone','message someone',
  ]

  function classifyMoodFromTranscript(allText) {
    const t = allText.toLowerCase()
    if (BYPASS_WORDS.some(w => t.includes(w))) return 'BYPASS'
    const intentional = INTENTIONAL_WORDS.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    if (intentional > 0) return 'INTENTIONAL'
    const stressed = STRESSED_WORDS.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    const low      = LOW_MOOD_WORDS.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    if (stressed > 0 && stressed >= low) return 'STRESSED'
    if (low > 0) return 'LOW_MOOD'
    return 'NEUTRAL'
  }

  /* ================================================================
   *  §4 — MIRRA SYSTEM PROMPT
   * ================================================================ */

  const MIRRA_SYSTEM_PROMPT = `You are Mirra, a calm, emotionally intelligent digital wellbeing companion. You have just intercepted the user as they tried to open Instagram. Your job is to have a brief, warm conversation before they enter the app.

CONTEXT: The user clicked on Instagram and you appeared as an overlay blocking the app. You are standing between them and their feed. Everything they say is in the context of "I was about to open Instagram and you asked me what's going on."

YOUR CORE PURPOSE: Increase awareness and intentionality before and after social media use. You are NOT a blocker. You are NOT a therapist. You are a perceptive friend who asks one good question to activate reflective thinking.

VOICE RULES:
- Warm, concise, human, specific
- Never generic, never lecture
- Max 2-3 sentences per response
- Always preserve user autonomy — the user can ALWAYS go to Instagram if they want

OPENING: Your first message is always: "Hey — you're about to open Instagram. What's going on right now?" (This is already sent as the first message, do not repeat it.)

AFTER THE USER RESPONDS, classify their mood:

STRESSED — if they mention: overwhelm, anxiety, pressure, deadlines, stress, exams, too much work, panic, falling apart, nervous
→ Acknowledge their specific stress. Offer one grounding action. Then ask if they still want Instagram.
→ Example: "That sounds like a lot to carry right now. Maybe take 3 slow breaths first. Do you still want to open Instagram, or pause a moment?"

LOW MOOD — if they mention: tired, lonely, sad, numb, empty, bored with life, low energy, depressed, hopeless, drained, exhausted, crying, hurt, alone
→ Do NOT mention Instagram at all. Respond with warmth. Ask one open wellbeing question.
→ Example: "Hey — thanks for saying that. How have you been holding up today?"
→ If they say something indicating serious distress (hurt myself, want to die, can't go on, no reason to live): "You don't have to sit with that alone. Want me to help you reach someone you trust?" Offer 988 Suicide & Crisis Lifeline or Crisis Text Line.

INTENTIONAL USE — if they mention: work, DMs, messages, needing to post, having to do something specific, replying to someone, a task, checking something particular
→ They have a real reason to be on Instagram. Don't redirect. Let them through with a time boundary.
→ Say exactly: "Got it — go do what you need to do. I'll give you 5 minutes. Don't doomscroll \uD83E\uDEF6"
→ Keep it to ONE sentence. No follow-up questions. No alternatives.

NEUTRAL / BORED / JUST WANT TO SCROLL — if they say: bored, nothing to do, just want to scroll, habit, killing time, just because
→ Acknowledge their reason lightly. Offer intentional mode or let them through.
→ Example: "Got it — makes sense. Want to set a quick intention for what you'll do on there, or just go in?"
→ If they choose intentional mode, ask: "What do you want to do on Instagram?" then say "Okay — go do that."

HOSTILE / BYPASS — if they say: "let me in", "just let me use it", "none of your business", "shut up", "go away", "skip", "stop"
→ THIS IS CRITICAL: Do NOT say you "can't" do anything. Do NOT say "as an AI I can't help with that." You ARE blocking Instagram right now. The user wants you to get out of the way.
→ Simply say: "Fair enough — I'll get out of your way." or "No problem, heading out." and nothing more.
→ Do NOT ask follow-up questions. Do NOT try to redirect. Just let them through gracefully.

IF THE USER ASKS WHAT YOU ARE OR WHAT'S HAPPENING:
→ "I'm Mirra — I pop up when you open Instagram to check in with you for a sec. Just a quick moment before you scroll. You can always skip me."

THINGS YOU MUST NEVER DO:
- Never say "As an AI language model" or "I can't help with that"
- Never refuse to let the user use Instagram — you ALWAYS let them through if they want
- Never give long responses (3 sentences max)
- Never be preachy, condescending, or parental
- Never pretend you don't know what Instagram is or that you can't "let them in" — you literally can, that's the bypass button right below you
- Never break character. You are Mirra, not ChatGPT, not an assistant.

CONVERSATION LENGTH: Keep it to 2-3 exchanges max. This is a quick check-in, not a therapy session. After your response to their mood, if they want Instagram, let them go. If they want to pause, acknowledge it warmly and close.`

  /* ================================================================
   *  §5 — VISUAL SCREEN BUILDERS
   * ================================================================ */

  const SUGGESTIONS = [
    { icon: '\uD83D\uDEB6', text: 'Take a 10-minute walk' },
    { icon: '\uD83D\uDCDA', text: 'Read for 10 minutes' },
    { icon: '\uD83D\uDCDE', text: 'Call a friend' },
  ]

  function buildStressedScreen(onProceed, onAlternative) {
    const el = document.createElement('div')
    el.className = 'mirra-screen'
    el.innerHTML = `
      <h2>That sounds like a lot.<br>Let\u2019s take a moment to ground you.</h2>
      <div class="mirra-cards">
        <div class="mirra-card">
          <div class="mirra-card-icon">\uD83C\uDF2C\uFE0F</div>
          <div class="mirra-card-label">3 Deep<br>Breaths</div>
        </div>
        <div class="mirra-card">
          <div class="mirra-card-icon">\uD83D\uDCA7</div>
          <div class="mirra-card-label">Glass of<br>Water</div>
        </div>
        <div class="mirra-card">
          <div class="mirra-card-icon">\u2600\uFE0F</div>
          <div class="mirra-card-label">60 Seconds<br>Outside</div>
        </div>
      </div>
      <div class="mirra-btn-row">
        <button class="mirra-btn mirra-btn-primary" data-action="proceed">Yes, I\u2019m ready</button>
        <button class="mirra-btn mirra-btn-secondary" data-action="alt">Let me do something else</button>
      </div>
    `
    el.querySelector('[data-action="proceed"]').addEventListener('click', onProceed)
    el.querySelector('[data-action="alt"]').addEventListener('click', onAlternative)
    return el
  }

  function buildLowMoodScreen(onSupport, onMoment, onOpenAnyway) {
    const el = document.createElement('div')
    el.className = 'mirra-screen'
    el.innerHTML = `
      <h2>That sounds like a lot.<br>Let\u2019s take a moment to ground you.</h2>
      <div class="mirra-cards">
        <div class="mirra-card">
          <div class="mirra-card-icon">\uD83C\uDF2C\uFE0F</div>
          <div class="mirra-card-label">3 Deep<br>Breaths</div>
        </div>
        <div class="mirra-card">
          <div class="mirra-card-icon">\uD83D\uDCA7</div>
          <div class="mirra-card-label">Glass of<br>Water</div>
        </div>
        <div class="mirra-card">
          <div class="mirra-card-icon">\u2600\uFE0F</div>
          <div class="mirra-card-label">60 Seconds<br>Outside</div>
        </div>
      </div>
      <h3 style="font-size:16px;font-weight:400;margin-top:28px;margin-bottom:16px;color:rgba(232,230,240,0.85);text-align:center;">Then, do you still want to open Instagram?</h3>
      <div class="mirra-btn-row">
        <button class="mirra-btn mirra-btn-primary" data-action="support">I need real support</button>
        <button class="mirra-btn mirra-btn-secondary" data-action="moment">I just need a moment</button>
      </div>
      <button class="mirra-link" data-action="open">Open Instagram anyway</button>
    `
    el.querySelector('[data-action="support"]').addEventListener('click', onSupport)
    el.querySelector('[data-action="moment"]').addEventListener('click', onMoment)
    el.querySelector('[data-action="open"]').addEventListener('click', onOpenAnyway)
    return el
  }

  function buildSupportInfo() {
    const el = document.createElement('div')
    el.className = 'mirra-support'
    el.innerHTML = `
      <h3>You\u2019re not alone in this.</h3>
      <p><strong>988 Suicide &amp; Crisis Lifeline</strong><br>
         Call or text <a href="tel:988">988</a> \u2014 available 24/7</p>
      <p><strong>Crisis Text Line</strong><br>
         Text <strong>HOME</strong> to <a href="sms:741741">741741</a></p>
      <p><strong>Columbia Counseling &amp; Psychological Services</strong><br>
         <a href="tel:2128543878">(212) 854-3878</a> \u2014 Lerner Hall, 8th Floor</p>
    `
    return el
  }

  function buildNeutralScreen(userMsg, onSoundsGood, onOpenInstagram) {
    const el = document.createElement('div')
    el.className = 'mirra-screen'
    el.innerHTML = `
      <h2>Instead of scrolling, try one of these:</h2>
      <div class="mirra-reco-card">
        <div class="mirra-reco-icon">\uD83E\uDDD8</div>
        <div class="mirra-reco-body">
          <div class="mirra-reco-title">Calm Meditation</div>
          <div class="mirra-reco-sub">A 5-minute guided meditation</div>
          <button class="mirra-reco-action" data-action="close">Open App</button>
        </div>
      </div>
      <div class="mirra-reco-card">
        <div class="mirra-reco-icon">\uD83C\uDFA5</div>
        <div class="mirra-reco-body">
          <div class="mirra-reco-title">Long-form Video</div>
          <div class="mirra-reco-sub">TED Talk: The Art of Saying No</div>
          <button class="mirra-reco-action" data-action="close">Watch on YouTube</button>
        </div>
      </div>
      <div class="mirra-reco-card">
        <div class="mirra-reco-icon">\uD83C\uDF3F</div>
        <div class="mirra-reco-body">
          <div class="mirra-reco-title">Breathing Exercise</div>
          <div class="mirra-reco-sub">Box Breathing \u2014 4-4-4-4</div>
          <button class="mirra-reco-action" data-action="close">Start Exercise</button>
        </div>
      </div>
      <button class="mirra-link" data-action="open">I still want to open Instagram</button>
    `
    el.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', onSoundsGood)
    })
    el.querySelector('[data-action="open"]').addEventListener('click', onOpenInstagram)
    return el
  }

  function buildSuggestionsScreen(onClose) {
    const el = document.createElement('div')
    el.className = 'mirra-screen'
    el.innerHTML = `
      <h2>Here are a few things that might help right now:</h2>
      <div class="mirra-cards">
        <div class="mirra-card">
          <div class="mirra-card-icon">\uD83D\uDEB6</div>
          <div class="mirra-card-label">10-min<br>Walk</div>
        </div>
        <div class="mirra-card">
          <div class="mirra-card-icon">\uD83C\uDFB5</div>
          <div class="mirra-card-label">Listen to<br>Music</div>
        </div>
        <div class="mirra-card">
          <div class="mirra-card-icon">\uD83D\uDCDE</div>
          <div class="mirra-card-label">Call a<br>Friend</div>
        </div>
      </div>
      <div class="mirra-btn-row">
        <button class="mirra-btn mirra-btn-primary" data-action="close">I\u2019ll try one of these</button>
      </div>
    `
    el.querySelector('[data-action="close"]').addEventListener('click', onClose)
    return el
  }

  function _esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }

  function buildPersonalizedRedirectScreen(onCloseTab, onStay) {
    const el = document.createElement('div')
    el.className = 'mirra-screen'
    el.innerHTML = `
      <div class="mirra-profile-badge">Based on your profile \u2726</div>
      <h2>Here\u2019s something better for you right now:</h2>
      <div class="mirra-reco-card">
        <div class="mirra-reco-icon">\uD83D\uDCDA</div>
        <div class="mirra-reco-body">
          <div class="mirra-reco-title">Continue reading</div>
          <div class="mirra-reco-sub">You\u2019re 40 pages into \u2018The Hitchhiker\u2019s Guide to the Galaxy\u2019 \u2014 pick it back up?</div>
          <button class="mirra-reco-action" data-action="close">Open Kindle</button>
        </div>
      </div>
      <div class="mirra-reco-card">
        <div class="mirra-reco-icon">\u2705</div>
        <div class="mirra-reco-body">
          <div class="mirra-reco-title">You have 2 tasks due today</div>
          <div class="mirra-reco-sub">Job application for Stripe and finish the ML assignment \u2014 want to knock one out?</div>
          <button class="mirra-reco-action" data-action="close">Open Notion</button>
        </div>
      </div>
      <div class="mirra-reco-card">
        <div class="mirra-reco-icon">\uD83C\uDF3F</div>
        <div class="mirra-reco-body">
          <div class="mirra-reco-title">5-minute breathing exercise</div>
          <div class="mirra-reco-sub">Box breathing \u2014 4 counts in, hold, out, hold. Clears your head fast.</div>
          <button class="mirra-reco-action" data-action="close">Start now</button>
        </div>
      </div>
      <button class="mirra-link" data-action="stay">I still want to scroll</button>
    `
    el.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', onCloseTab)
    })
    el.querySelector('[data-action="stay"]').addEventListener('click', onStay)
    return el
  }

  /* ================================================================
   *  §6 — ELEVENLABS CONVERSATIONAL AI CLIENT
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
                  prompt: MIRRA_SYSTEM_PROMPT,
                },
                first_message: `Hey — you're about to open Instagram. What's going on right now?`,
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
   *  §7 — INTENTIONAL USE TIMER
   * ================================================================ */

  const TIMER_CSS = `
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    :host { all:initial; font-family:'Segoe UI',Inter,system-ui,-apple-system,sans-serif; -webkit-font-smoothing:antialiased; }

    /* ── Timer pill widget ────────────── */
    .mirra-timer-pill {
      position:fixed; bottom:32px; left:50%; transform:translateX(-50%); z-index:999999;
      display:flex; align-items:center; gap:10px;
      background:rgba(26,26,26,0.94); backdrop-filter:blur(16px);
      border:1px solid rgba(80,70,130,0.4);
      border-radius:999px; padding:12px 24px 12px 18px;
      cursor:default; user-select:none;
      animation: pill-in 0.4s ease-out;
      box-shadow:0 4px 20px rgba(0,0,0,0.35), 0 0 16px rgba(124,107,240,0.1);
    }
    @keyframes pill-in {
      from { opacity:0; transform:translateY(12px) scale(0.95); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    .mirra-timer-dot {
      width:10px; height:10px; border-radius:50%;
      background:radial-gradient(circle at 35% 35%, #9d8df7dd, #7c6bf088);
      box-shadow:0 0 10px rgba(124,107,240,0.5);
      animation: dot-pulse 2s ease-in-out infinite;
    }
    @keyframes dot-pulse {
      0%,100% { opacity:0.7; transform:scale(1); }
      50%     { opacity:1; transform:scale(1.2); }
    }
    .mirra-timer-time {
      font-size:16px; font-weight:600; letter-spacing:0.04em;
      color:rgba(232,230,240,0.92); font-variant-numeric:tabular-nums;
    }
    .mirra-timer-label {
      font-size:11px; color:rgba(139,136,152,0.55);
      letter-spacing:0.12em; text-transform:uppercase;
      margin-left:3px;
    }

    /* ── Check-in overlay ────────────── */
    .mirra-checkin {
      position:fixed; inset:0; z-index:999999;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      background:rgba(10,10,15,0.97); color:#e8e6f0;
      animation: checkin-in 0.45s ease-out;
    }
    @keyframes checkin-in {
      from { opacity:0; }
      to   { opacity:1; }
    }
    .mirra-checkin h2 {
      font-size:20px; font-weight:400; line-height:1.5;
      text-align:center; color:rgba(232,230,240,0.9);
      margin-bottom:32px; max-width:380px;
    }
    .mirra-checkin-btns {
      display:flex; flex-direction:column; gap:10px;
      width:100%; max-width:340px;
    }
    .mirra-checkin-btn {
      padding:14px 16px; border-radius:14px;
      font-size:14px; font-weight:500; letter-spacing:0.02em;
      cursor:pointer; border:1px solid transparent;
      font-family:inherit; transition:all 0.25s;
      text-align:center; width:100%;
    }
    .mirra-checkin-btn.primary {
      background:rgba(124,107,240,0.15); border-color:rgba(124,107,240,0.3); color:#9d8df7;
    }
    .mirra-checkin-btn.primary:hover {
      background:rgba(124,107,240,0.28); border-color:rgba(124,107,240,0.5);
    }
    .mirra-checkin-btn.secondary {
      background:rgba(18,18,26,0.5); border-color:rgba(30,30,46,0.35); color:rgba(139,136,152,0.65);
    }
    .mirra-checkin-btn.secondary:hover {
      background:rgba(18,18,26,0.8); border-color:rgba(30,30,46,0.6); color:rgba(232,230,240,0.8);
    }
    .mirra-checkin-btn.warn {
      background:rgba(240,166,116,0.08); border-color:rgba(240,166,116,0.18); color:rgba(240,166,116,0.75);
    }
    .mirra-checkin-btn.warn:hover {
      background:rgba(240,166,116,0.15); border-color:rgba(240,166,116,0.3);
    }

    /* ── Redirect screen (reuses check-in container) ── */
    .mirra-redirect-card {
      width:100%; max-width:340px;
      background:rgba(18,18,26,0.6); border:1px solid rgba(30,30,46,0.45);
      border-radius:16px; padding:20px;
      display:flex; align-items:center; gap:16px;
      margin-bottom:24px;
    }
    .mirra-redirect-icon { font-size:32px; line-height:1; }
    .mirra-redirect-text {
      font-size:15px; font-weight:400; color:rgba(232,230,240,0.85); line-height:1.45;
    }
    .mirra-checkin-brand {
      position:absolute; bottom:14px;
      font-size:10px; letter-spacing:0.3em; text-transform:uppercase;
      color:rgba(139,136,152,0.15);
    }
  `

  class MirraTimer {
    constructor() {
      this._widgetRoot = null
      this._widgetShadow = null
      this._timeEl = null
      this._remaining = 0
      this._interval = null
      this._observer = null
      this._checkinRoot = null
    }

    start(seconds) {
      this._remaining = seconds
      this._injectWidget()
      this._startCountdown()
      this._watchForRemoval()
    }

    _injectWidget() {
      if (this._widgetRoot) this._widgetRoot.remove()

      this._widgetRoot = document.createElement('div')
      this._widgetRoot.id = 'mirra-timer-widget'
      this._widgetRoot.style.cssText = 'position:fixed;bottom:0;right:0;z-index:999999;pointer-events:auto;'

      this._widgetShadow = this._widgetRoot.attachShadow({ mode: 'closed' })

      const style = document.createElement('style')
      style.textContent = TIMER_CSS
      this._widgetShadow.appendChild(style)

      const pill = document.createElement('div')
      pill.className = 'mirra-timer-pill'
      pill.innerHTML = `
        <div class="mirra-timer-dot"></div>
        <span class="mirra-timer-time">${this._fmt(this._remaining)}</span>
        <span class="mirra-timer-label">mirra</span>
      `
      this._widgetShadow.appendChild(pill)
      this._timeEl = this._widgetShadow.querySelector('.mirra-timer-time')

      document.documentElement.appendChild(this._widgetRoot)
    }

    _watchForRemoval() {
      if (this._observer) this._observer.disconnect()
      this._observer = new MutationObserver(() => {
        if (this._widgetRoot && !document.contains(this._widgetRoot)) {
          document.documentElement.appendChild(this._widgetRoot)
        }
      })
      this._observer.observe(document.documentElement, { childList: true, subtree: true })
    }

    _startCountdown() {
      if (this._interval) clearInterval(this._interval)
      this._interval = setInterval(() => {
        this._remaining--
        if (this._timeEl) this._timeEl.textContent = this._fmt(this._remaining)
        if (this._remaining <= 0) {
          clearInterval(this._interval)
          this._interval = null
          this._showCheckin()
        }
      }, 1000)
    }

    _fmt(s) {
      const m = Math.floor(Math.max(0, s) / 60)
      const sec = Math.max(0, s) % 60
      return `\u23F1 ${m}:${sec.toString().padStart(2, '0')}`
    }

    _showCheckin() {
      // Hide widget while check-in is showing
      if (this._widgetRoot) this._widgetRoot.style.display = 'none'

      // Blur + lock the page again
      document.body.style.filter = 'blur(8px)'
      document.body.style.overflow = 'hidden'

      this._checkinRoot = document.createElement('div')
      this._checkinRoot.id = 'mirra-checkin-root'
      this._checkinRoot.style.cssText = 'position:fixed;inset:0;z-index:999999;'

      const shadow = this._checkinRoot.attachShadow({ mode: 'closed' })
      const style = document.createElement('style')
      style.textContent = TIMER_CSS
      shadow.appendChild(style)

      const wrap = document.createElement('div')
      wrap.className = 'mirra-checkin'
      wrap.innerHTML = `
        <h2>Hey \u2014 did you get what you needed?</h2>
        <div class="mirra-checkin-btns">
          <button class="mirra-checkin-btn primary" data-action="done">\u2705 Yes, I\u2019m done</button>
          <button class="mirra-checkin-btn secondary" data-action="3min">\u23F1 Give me 3 more minutes</button>
          <button class="mirra-checkin-btn secondary" data-action="5min">\u23F1 Need 5 more minutes</button>
          <button class="mirra-checkin-btn warn" data-action="lying">\uD83D\uDE2C Okay I was lying</button>
        </div>
        <div class="mirra-checkin-brand">mirra</div>
      `
      shadow.appendChild(wrap)

      wrap.querySelector('[data-action="done"]').addEventListener('click', () => {
        this._cleanup()
        try { chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }) } catch (_) {}
      })
      wrap.querySelector('[data-action="3min"]').addEventListener('click', () => {
        this._dismissCheckin()
        this._remaining = 10
        this._injectWidget()
        this._startCountdown()
      })
      wrap.querySelector('[data-action="5min"]').addEventListener('click', () => {
        this._dismissCheckin()
        this._remaining = 10
        this._injectWidget()
        this._startCountdown()
      })
      wrap.querySelector('[data-action="lying"]').addEventListener('click', () => {
        this._showRedirectScreen(shadow, wrap)
      })

      document.documentElement.appendChild(this._checkinRoot)
    }

    _showRedirectScreen(shadow, currentWrap) {
      currentWrap.remove()

      const suggestion = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]
      const wrap = document.createElement('div')
      wrap.className = 'mirra-checkin'
      wrap.innerHTML = `
        <h2>No judgment \u2014 it happens.<br>How about trying this instead?</h2>
        <div class="mirra-redirect-card">
          <div class="mirra-redirect-icon">${suggestion.icon}</div>
          <div class="mirra-redirect-text">${suggestion.text}</div>
        </div>
        <div class="mirra-checkin-btns">
          <button class="mirra-checkin-btn primary" data-action="good">Sounds good</button>
          <button class="mirra-checkin-btn secondary" data-action="stay">I still want to stay</button>
        </div>
        <div class="mirra-checkin-brand">mirra</div>
      `
      shadow.appendChild(wrap)

      wrap.querySelector('[data-action="good"]').addEventListener('click', () => {
        this._cleanup()
        try { chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }) } catch (_) {}
      })
      wrap.querySelector('[data-action="stay"]').addEventListener('click', () => {
        this._cleanup()
      })
    }

    _dismissCheckin() {
      document.body.style.filter = ''
      document.body.style.overflow = ''
      if (this._checkinRoot) { this._checkinRoot.remove(); this._checkinRoot = null }
    }

    _cleanup() {
      if (this._interval) { clearInterval(this._interval); this._interval = null }
      if (this._observer) { this._observer.disconnect(); this._observer = null }
      this._dismissCheckin()
      if (this._widgetRoot) { this._widgetRoot.remove(); this._widgetRoot = null }
      document.body.style.filter = ''
      document.body.style.overflow = ''
    }
  }

  /* ================================================================
   *  §7.5 — POST-SESSION CHECK-IN (3-min bottom sheet)
   * ================================================================ */

  const CHECKIN_SHEET_CSS = `
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    :host { all:initial; font-family:'Segoe UI',Inter,system-ui,-apple-system,sans-serif; -webkit-font-smoothing:antialiased; }

    .mirra-sheet {
      position:fixed; bottom:0; left:0; right:0;
      max-height:42vh; min-height:280px;
      background:rgba(26,26,26,0.98);
      border-radius:20px 20px 0 0;
      border-top:1px solid rgba(50,50,70,0.3);
      z-index:999999;
      display:flex; flex-direction:column; align-items:center;
      padding:12px 28px 32px;
      color:#e8e6f0;
      animation: sheet-up 0.45s cubic-bezier(0.32,0.72,0,1);
      box-shadow:0 -8px 40px rgba(0,0,0,0.5);
    }
    @keyframes sheet-up {
      from { transform:translateY(100%); }
      to   { transform:translateY(0); }
    }
    .mirra-sheet-handle {
      width:36px; height:4px; border-radius:2px;
      background:rgba(139,136,152,0.3);
      margin-bottom:24px; flex-shrink:0;
    }
    .mirra-sheet h2 {
      font-size:17px; font-weight:400; line-height:1.5;
      text-align:center; color:rgba(232,230,240,0.9);
      margin-bottom:24px;
    }
    .mirra-sheet-btns {
      display:flex; flex-direction:column; gap:8px;
      width:100%; max-width:320px;
    }
    .mirra-sheet-btn {
      padding:13px 16px; border-radius:14px;
      font-size:13px; font-weight:500; letter-spacing:0.02em;
      cursor:pointer; border:1px solid transparent;
      font-family:inherit; transition:all 0.25s;
      text-align:center; width:100%;
    }
    .mirra-sheet-btn.primary {
      background:rgba(124,107,240,0.15); border-color:rgba(124,107,240,0.3); color:#9d8df7;
    }
    .mirra-sheet-btn.primary:hover {
      background:rgba(124,107,240,0.28); border-color:rgba(124,107,240,0.5);
    }
    .mirra-sheet-btn.secondary {
      background:rgba(18,18,26,0.5); border-color:rgba(30,30,46,0.35); color:rgba(139,136,152,0.65);
    }
    .mirra-sheet-btn.secondary:hover {
      background:rgba(18,18,26,0.8); border-color:rgba(30,30,46,0.6); color:rgba(232,230,240,0.8);
    }
    .mirra-sheet-brand {
      margin-top:16px;
      font-size:9px; letter-spacing:0.3em; text-transform:uppercase;
      color:rgba(139,136,152,0.15);
    }
  `

  class MirraCheckinSheet {
    constructor() {
      this._sheetRoot = null
      this._sheetShadow = null
      this._timerHandle = null
      this._overlayRoot = null
    }

    start(seconds) {
      this._timerHandle = setTimeout(() => {
        this._timerHandle = null
        this._showSheet()
      }, seconds * 1000)
    }

    _showSheet() {
      this._sheetRoot = document.createElement('div')
      this._sheetRoot.id = 'mirra-checkin-sheet'
      this._sheetRoot.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999999;'

      this._sheetShadow = this._sheetRoot.attachShadow({ mode: 'closed' })

      const style = document.createElement('style')
      style.textContent = CHECKIN_SHEET_CSS
      this._sheetShadow.appendChild(style)

      const sheet = document.createElement('div')
      sheet.className = 'mirra-sheet'
      sheet.innerHTML = `
        <div class="mirra-sheet-handle"></div>
        <h2>Hey \u2014 you\u2019ve been here a while.<br>What pulled you in?</h2>
        <div class="mirra-sheet-btns">
          <button class="mirra-sheet-btn primary" data-action="done">Found what I needed \uD83D\uDC4D</button>
          <button class="mirra-sheet-btn secondary" data-action="scrolling">Still scrolling \uD83D\uDE05</button>
          <button class="mirra-sheet-btn secondary" data-action="overwhelmed">I\u2019m feeling overwhelmed</button>
        </div>
        <div class="mirra-sheet-brand">mirra</div>
      `
      this._sheetShadow.appendChild(sheet)

      sheet.querySelector('[data-action="done"]').addEventListener('click', () => {
        this._removeSheet()
      })
      sheet.querySelector('[data-action="scrolling"]').addEventListener('click', () => {
        this._removeSheet()
        this._showPersonalizedRedirect()
      })
      sheet.querySelector('[data-action="overwhelmed"]').addEventListener('click', () => {
        this._removeSheet()
        this._showLowMoodOverlay()
      })

      document.documentElement.appendChild(this._sheetRoot)
    }

    _removeSheet() {
      if (this._sheetRoot) { this._sheetRoot.remove(); this._sheetRoot = null }
    }

    _injectStandaloneOverlay(contentEl) {
      this._overlayRoot = document.createElement('div')
      this._overlayRoot.id = 'mirra-standalone-overlay'
      this._overlayRoot.style.cssText = 'position:fixed;inset:0;z-index:999999;'

      const shadow = this._overlayRoot.attachShadow({ mode: 'closed' })
      this._overlayShadow = shadow

      const style = document.createElement('style')
      style.textContent = OVERLAY_CSS
      shadow.appendChild(style)

      const wrapper = document.createElement('div')
      wrapper.className = 'mirra idle'
      wrapper.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,10,15,0.97);color:#e8e6f0;z-index:999999;'

      const ambient = document.createElement('div')
      ambient.className = 'mirra-ambient idle'
      wrapper.appendChild(ambient)
      wrapper.appendChild(contentEl)

      shadow.appendChild(wrapper)
      document.body.style.filter = 'blur(8px)'
      document.body.style.overflow = 'hidden'
      document.documentElement.appendChild(this._overlayRoot)
    }

    _removeStandaloneOverlay() {
      document.body.style.filter = ''
      document.body.style.overflow = ''
      if (this._overlayRoot) { this._overlayRoot.remove(); this._overlayRoot = null }
    }

    _showPersonalizedRedirect() {
      const screen = buildPersonalizedRedirectScreen(
        () => {
          this._removeStandaloneOverlay()
          try { chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }) } catch (_) {}
        },
        () => { this._removeStandaloneOverlay() }
      )
      this._injectStandaloneOverlay(screen)
    }

    _showLowMoodOverlay() {
      let screenEl = null
      const self = this

      screenEl = buildLowMoodScreen(
        function onSupport() {
          const btn = screenEl.querySelector('[data-action="support"]')
          if (btn) btn.style.display = 'none'
          const input = screenEl.querySelector('.mirra-text-input')
          if (input) input.style.display = 'none'
          const momentBtn = screenEl.querySelector('[data-action="moment"]')
          const info = buildSupportInfo()
          if (momentBtn) momentBtn.parentElement.insertAdjacentElement('beforebegin', info)
          else screenEl.appendChild(info)
        },
        () => {
          self._removeStandaloneOverlay()
          try { chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }) } catch (_) {}
        },
        () => { self._removeStandaloneOverlay() }
      )

      this._injectStandaloneOverlay(screenEl)
    }

    cleanup() {
      if (this._timerHandle) { clearTimeout(this._timerHandle); this._timerHandle = null }
      this._removeSheet()
      this._removeStandaloneOverlay()
    }
  }

  /* ================================================================
   *  §7.6 — BREAKUP MODE (triggers after 3+ bypasses)
   * ================================================================ */

  class MirraBreakup {
    constructor(onDismiss) {
      this._root = null
      this._shadow = null
      this._wrapper = null
      this._onDismiss = onDismiss
    }

    show() {
      this._root = document.createElement('div')
      this._root.id = 'mirra-breakup-root'
      this._root.style.cssText = 'position:fixed;inset:0;z-index:999999;'

      this._shadow = this._root.attachShadow({ mode: 'closed' })
      const style = document.createElement('style')
      style.textContent = OVERLAY_CSS
      this._shadow.appendChild(style)

      this._wrapper = document.createElement('div')
      this._wrapper.className = 'mirra idle'
      const ambient = document.createElement('div')
      ambient.className = 'mirra-ambient idle'
      this._wrapper.appendChild(ambient)
      this._shadow.appendChild(this._wrapper)

      document.body.style.filter = 'blur(8px)'
      document.body.style.overflow = 'hidden'
      document.documentElement.appendChild(this._root)

      this._showBreakupActivated()
    }

    _setContent(el) {
      const old = this._wrapper.querySelector('.mirra-screen')
      if (old) old.remove()
      this._wrapper.appendChild(el)
    }

    _showBreakupActivated() {
      const el = document.createElement('div')
      el.className = 'mirra-screen'
      el.innerHTML = `
        <div class="mirra-big-emoji">\uD83D\uDC94</div>
        <h2>Breakup Mode Activated</h2>
        <p class="mirra-subtext">You\u2019ve bypassed Mirra 3 times this session.<br>It\u2019s time to take a step back.</p>
        <p class="mirra-subtext" style="margin-top:12px;font-size:13px;color:rgba(139,136,152,0.5);">This tab will close in 10 seconds\u2026</p>
      `
      this._setContent(el)

      setTimeout(() => {
        if (this._root) { this._root.remove(); this._root = null }
        try { chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }) } catch (_) {}
      }, 10000)
    }
  }

  /* ================================================================
   *  §8 — MIRRA OVERLAY (vanilla DOM + shadow DOM)
   * ================================================================ */

  class MirraOverlay {
    constructor() {
      this.root      = null
      this.shadow    = null
      this.wrapper   = null
      this.statusEl  = null
      this.txEl      = null
      this.ambientEl = null
      this.bypassBtn = null
      this.errorEl   = null
      this.client    = null
      this.appName   = this._detectApp()

      // Mood detection state
      this.agentResponses = []
      this.userTranscripts = []
      this.agentTurnCount = 0
      this.moodClassified = false
      this.lastUserText = ''
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
        return
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
      this.bypassBtn = this.shadow.querySelector('.mirra-bypass')

      this.bypassBtn.addEventListener('click', () => this._triggerBreakup())

      ;(document.documentElement || document.body).appendChild(this.root)
    }

    _showSetupPrompt() {
      const div = document.createElement('div')
      div.className = 'mirra-setup'
      div.innerHTML = `
        <p>Mirra isn\u2019t configured yet.</p>
        <p class="hint">Click the Mirra extension icon and paste your<br>ElevenLabs Agent ID to get started.</p>
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
      if (document.body) { apply() }
      else {
        const iv = setInterval(() => { if (document.body) { clearInterval(iv); apply() } }, 10)
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
      states.forEach(s => { this.wrapper.classList.remove(s); this.ambientEl.classList.remove(s) })
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
        <div class="mirra-msg-text ${role}">${_esc(text)}</div>
      `
      this.txEl.appendChild(msg)
      this.txEl.scrollTop = this.txEl.scrollHeight
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
        onAgent:  (t) => this._onAgentMessage(t),
        onUser:   (t) => this._onUserMessage(t),
        onError:  (e) => this._showError(e),
        onEnd:    ()  => this._statusFromCode('idle'),
      })
      this.client.start()
    }

    /* ══════════════════════════════════
     *  MOOD DETECTION + SCREEN ROUTING
     * ══════════════════════════════════ */

    _onAgentMessage(text) {
      this._addMessage('agent', text)
      this.agentResponses.push(text)
      this.agentTurnCount++

      // First agent message is the opening line — skip classification
      if (this.agentTurnCount <= 1) return

      // After the agent's SECOND response (the one that reacts to user mood),
      // classify and show the visual screen
      if (!this.moodClassified && this.agentTurnCount >= 2) {
        const allUserText = this.userTranscripts.join(' ')
        const mood = classifyMoodFromTranscript(allUserText)
        this.moodClassified = true
        this._showMoodScreen(mood)
      }
    }

    _onUserMessage(text) {
      this._addMessage('user', text)
      this.userTranscripts.push(text)
      this.lastUserText = text

      // Check for bypass keywords immediately
      if (!this.moodClassified) {
        const mood = classifyMoodFromTranscript(text)
        if (mood === 'BYPASS') {
          this.moodClassified = true
          this._letThrough()
        }
      }
    }

    /* ── show the mood screen ────────── */

    _showMoodScreen(mood) {
      // Stop the voice agent — visual UI takes over
      if (this.client) { this.client.stop(); this.client = null }

      // Clear voice UI elements
      this.shadow.querySelector('.mirra-orb-wrap').style.display = 'none'
      this.statusEl.style.display = 'none'
      this.txEl.style.display = 'none'
      this.bypassBtn.style.display = 'none'
      this._setStatus('idle', '')

      let screen
      switch (mood) {
        case 'STRESSED':
          screen = buildStressedScreen(
            () => this._letThrough(),                   // "Yes, I'm ready" → open Instagram
            () => this._replaceScreen(                   // "Let me do something else"
              buildPersonalizedRedirectScreen(
                () => this._navigateAway(),              // card actions → close tab
                () => this._letThrough()                 // "I still want to scroll" → let through
              )
            )
          )
          break

        case 'INTENTIONAL':
          this._startIntentionalMode()
          return

        case 'LOW_MOOD':
          screen = buildLowMoodScreen(
            () => this._showSupportBlock(),              // "I need real support"
            () => this._navigateAway(),                  // "I just need a moment" → close tab
            () => this._letThrough()                     // "Open Instagram anyway"
          )
          break

        case 'NEUTRAL':
        default:
          screen = buildNeutralScreen(
            this.lastUserText || 'just checking',
            () => this._navigateAway(),                  // "Sounds good" → close tab
            () => this._letThrough()                     // "I still want to open Instagram"
          )
          break
      }

      this._screenContainer = screen
      this.wrapper.querySelector('.mirra-ambient').insertAdjacentElement('afterend', screen)
    }

    _startIntentionalMode() {
      this._unblurPage()
      if (this.root) { this.root.remove(); this.root = null }
      const timer = new MirraTimer()
      timer.start(10)
    }

    _replaceScreen(newScreen) {
      if (this._screenContainer) { this._screenContainer.remove() }
      this._screenContainer = newScreen
      this.wrapper.querySelector('.mirra-ambient').insertAdjacentElement('afterend', newScreen)
    }

    _showSupportBlock() {
      const btn = this._screenContainer?.querySelector('[data-action="support"]')
      if (btn) btn.style.display = 'none'
      const input = this._screenContainer?.querySelector('.mirra-text-input')
      if (input) input.style.display = 'none'
      const momentBtn = this._screenContainer?.querySelector('[data-action="moment"]')
      const info = buildSupportInfo()
      if (momentBtn) momentBtn.parentElement.insertAdjacentElement('beforebegin', info)
      else this._screenContainer?.appendChild(info)
    }

    /* ── navigation actions ──────────── */

    _letThrough() {
      if (this.client) { this.client.stop(); this.client = null }
      if (this.root) { this.root.remove(); this.root = null }

      bypassCount++
      if (bypassCount >= 3 && !breakupDismissed) {
        breakupDismissed = true
        new MirraBreakup().show()
        return
      }

      this._unblurPage()
      const timer = new MirraTimer()
      timer.start(10)
    }

    _triggerBreakup() {
      if (this.client) { this.client.stop(); this.client = null }
      if (this.root) { this.root.remove(); this.root = null }
      new MirraBreakup().show()
    }

    _navigateAway() {
      if (this.client) { this.client.stop(); this.client = null }
      try { chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }) } catch (_) {}
      this._unblurPage()
      if (this.root) { this.root.remove(); this.root = null }
    }

    /* ── full cleanup ────────────────── */

    remove() {
      this._letThrough()
    }
  }

  /* ================================================================
   *  §9 — BREAK ENFORCEMENT SCREEN
   * ================================================================ */

  function showBreakEnforcementScreen() {
    const root = document.createElement('div')
    root.id = 'mirra-break-root'
    root.style.cssText = 'position:fixed;inset:0;z-index:999999;'

    const shadow = root.attachShadow({ mode: 'closed' })
    const style = document.createElement('style')
    style.textContent = OVERLAY_CSS
    shadow.appendChild(style)

    const wrapper = document.createElement('div')
    wrapper.className = 'mirra idle'
    const ambient = document.createElement('div')
    ambient.className = 'mirra-ambient idle'
    wrapper.appendChild(ambient)

    const screen = document.createElement('div')
    screen.className = 'mirra-screen'
    screen.innerHTML = `
      <div class="mirra-big-emoji">\uD83D\uDC99</div>
      <h2>You\u2019re on a break</h2>
      <p class="mirra-subtext">You asked for this earlier. You\u2019re doing great.</p>
      <div class="mirra-btn-row">
        <button class="mirra-btn mirra-btn-primary" data-action="keep">Keep the break</button>
        <button class="mirra-btn mirra-btn-secondary" data-action="end">End break early</button>
      </div>
    `
    wrapper.appendChild(screen)
    shadow.appendChild(wrapper)

    const blurPage = () => {
      document.body.style.filter = 'blur(8px)'
      document.body.style.overflow = 'hidden'
    }
    if (document.body) blurPage()
    else {
      const iv = setInterval(() => { if (document.body) { clearInterval(iv); blurPage() } }, 10)
    }

    ;(document.documentElement || document.body).appendChild(root)

    screen.querySelector('[data-action="keep"]').addEventListener('click', () => {
      try { chrome.runtime.sendMessage({ type: 'CLOSE_TAB' }) } catch (_) {}
    })
    screen.querySelector('[data-action="end"]').addEventListener('click', () => {
      chrome.storage.local.remove(['breakUntil'], () => {
        if (document.body) {
          document.body.style.filter = ''
          document.body.style.overflow = ''
        }
        root.remove()
      })
    })
  }

  /* ================================================================
   *  §10 — BOOTSTRAP
   * ================================================================ */

  ;(async function bootstrap() {
    try {
      const data = await new Promise(res => chrome.storage.local.get(['breakUntil'], res))
      if (data.breakUntil && Date.now() < data.breakUntil) {
        showBreakEnforcementScreen()
        return
      }
    } catch (_) {}

    const overlay = new MirraOverlay()
    overlay.init()
  })()

})()
