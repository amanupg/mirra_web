/**
 * ElevenLabs Conversational AI — raw WebSocket client.
 *
 * Handles:
 *  - Signed-URL auth (private agents) or direct agent_id (public)
 *  - Mic capture → 16 kHz PCM → base64 → WebSocket
 *  - WebSocket audio → PCM → Web Audio API playback (gapless queue)
 *  - Ping/pong keepalive
 *  - Interruption handling
 */

// ─── Mirra system prompt ────────────────────────────────────

const MIRRA_PROMPT = `You are Mirra, a calm, emotionally intelligent digital wellbeing companion. You have just intercepted the user as they tried to open Instagram. Your job is to have a brief, warm conversation before they enter the app.

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

// ─── Audio helpers ──────────────────────────────────────────

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, slice)
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function float32ToInt16(float32) {
  const int16 = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return int16
}

function int16ToFloat32(int16) {
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768
  }
  return float32
}

function downsample(buffer, fromRate, toRate) {
  if (fromRate === toRate) return buffer
  const ratio = fromRate / toRate
  const newLength = Math.round(buffer.length / ratio)
  const result = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    const idx = i * ratio
    const low = Math.floor(idx)
    const high = Math.min(low + 1, buffer.length - 1)
    const frac = idx - low
    result[i] = buffer[low] * (1 - frac) + buffer[high] * frac
  }
  return result
}

function parseSampleRate(formatStr) {
  if (!formatStr) return null
  const match = formatStr.match(/pcm_(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

// ─── Main client ────────────────────────────────────────────

export default class ElevenLabsClient {
  constructor({
    agentId,
    apiKey,
    onStatusChange,
    onAgentMessage,
    onUserTranscript,
    onError,
    onDisconnect,
  }) {
    this.agentId = agentId
    this.apiKey = apiKey

    this.onStatusChange = onStatusChange   || (() => {})
    this.onAgentMessage = onAgentMessage   || (() => {})
    this.onUserTranscript = onUserTranscript || (() => {})
    this.onError = onError                 || (() => {})
    this.onDisconnect = onDisconnect       || (() => {})

    this.ws = null
    this.conversationId = null

    // Audio I/O
    this.inputSampleRate = 16000
    this.outputSampleRate = 16000
    this.micStream = null
    this.micContext = null
    this.micProcessor = null
    this.playContext = null
    this.nextPlayTime = 0
    this.activeSources = []
    this.isSpeaking = false
    this.isMicMuted = false

    this._destroyed = false
  }

  // ── Public API ──────────────────────────────────

  async start(appName = 'Instagram') {
    if (this._destroyed) return
    this.onStatusChange('connecting')

    try {
      const wsUrl = await this._getWsUrl()
      this._connect(wsUrl, appName)
    } catch (err) {
      this.onError(`Connection failed: ${err.message}`)
      this.onStatusChange('error')
    }
  }

  stop() {
    this._destroyed = true
    this._closeMic()
    this._closePlayback()
    if (this.ws) {
      try { this.ws.close() } catch (_) { /* ignore */ }
      this.ws = null
    }
  }

  muteMic()   { this.isMicMuted = true }
  unmuteMic() { this.isMicMuted = false }

  // ── Connection ──────────────────────────────────

  async _getWsUrl() {
    if (this.apiKey) {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${this.agentId}`,
        { headers: { 'xi-api-key': this.apiKey } }
      )
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Signed URL request failed (${res.status}): ${body}`)
      }
      const data = await res.json()
      return data.signed_url
    }
    return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`
  }

  _connect(wsUrl, appName) {
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      if (this._destroyed) return
      this.onStatusChange('connected')
      this._sendInitData(appName)
    }

    this.ws.onmessage = (event) => {
      if (this._destroyed) return
      try {
        const msg = JSON.parse(event.data)
        this._handleMessage(msg)
      } catch (_) { /* malformed JSON, ignore */ }
    }

    this.ws.onclose = () => {
      if (!this._destroyed) this.onDisconnect()
    }

    this.ws.onerror = () => {
      if (!this._destroyed) {
        this.onError('WebSocket error')
        this.onStatusChange('error')
      }
    }
  }

  _sendInitData(appName) {
    this._send({
      type: 'conversation_initiation_client_data',
      conversation_initiation_client_data: {
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: MIRRA_PROMPT.replace(/Instagram/g, appName),
            },
            first_message: `Hey — you're about to open ${appName}. What's going on right now?`,
          },
        },
      },
    })
  }

  // ── Message router ──────────────────────────────

  _handleMessage(msg) {
    switch (msg.type) {
      case 'conversation_initiation_metadata':
        this._onInitMetadata(msg)
        break
      case 'audio':
        this._onAudio(msg)
        break
      case 'agent_response':
        this._onAgentResponse(msg)
        break
      case 'user_transcript':
        this._onUserTranscript(msg)
        break
      case 'interruption':
        this._onInterruption()
        break
      case 'ping':
        this._onPing(msg)
        break
      default:
        break
    }
  }

  _onInitMetadata(msg) {
    const meta = msg.conversation_initiation_metadata_event
    if (!meta) return

    this.conversationId = meta.conversation_id

    const outRate = parseSampleRate(meta.agent_output_audio_format)
    if (outRate) this.outputSampleRate = outRate

    const inRate = parseSampleRate(meta.user_input_audio_format)
    if (inRate) this.inputSampleRate = inRate

    this._initPlayback()
    this._startMic()
  }

  _onAudio(msg) {
    const audioBase64 = msg.audio_event?.audio_base_64
    if (!audioBase64) return

    if (!this.isSpeaking) {
      this.isSpeaking = true
      this.onStatusChange('speaking')
    }

    this._playAudioChunk(audioBase64)
  }

  _onAgentResponse(msg) {
    const text = msg.agent_response_event?.agent_response
    if (text) this.onAgentMessage(text)
  }

  _onUserTranscript(msg) {
    const text = msg.user_transcription_event?.user_transcript
    if (text) this.onUserTranscript(text)
  }

  _onInterruption() {
    this._stopPlayback()
    this.isSpeaking = false
    this.onStatusChange('listening')
  }

  _onPing(msg) {
    const eventId = msg.ping_event?.event_id
    this._send({ type: 'pong', event_id: eventId })
  }

  // ── Microphone capture ──────────────────────────

  async _startMic() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (err) {
      this.onError('Microphone access denied')
      this.onStatusChange('error')
      return
    }

    this.micContext = new AudioContext()
    const source = this.micContext.createMediaStreamSource(this.micStream)
    const nativeRate = this.micContext.sampleRate

    // ScriptProcessorNode: 4096 frames, mono input, mono output
    this.micProcessor = this.micContext.createScriptProcessor(4096, 1, 1)
    this.micProcessor.onaudioprocess = (e) => {
      if (this._destroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return
      if (this.isMicMuted) return

      const raw = e.inputBuffer.getChannelData(0)
      const resampled = downsample(raw, nativeRate, this.inputSampleRate)
      const pcm16 = float32ToInt16(resampled)
      const b64 = arrayBufferToBase64(pcm16.buffer)

      this._send({ user_audio_chunk: b64 })
    }

    source.connect(this.micProcessor)
    // Connect to destination to keep the processor alive (output is silence)
    this.micProcessor.connect(this.micContext.destination)

    this.onStatusChange('listening')
  }

  _closeMic() {
    if (this.micProcessor) {
      try { this.micProcessor.disconnect() } catch (_) {}
      this.micProcessor = null
    }
    if (this.micContext) {
      try { this.micContext.close() } catch (_) {}
      this.micContext = null
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop())
      this.micStream = null
    }
  }

  // ── Audio playback ─────────────────────────────

  _initPlayback() {
    this.playContext = new AudioContext({ sampleRate: this.outputSampleRate })
    this.nextPlayTime = 0
    this.activeSources = []
  }

  _playAudioChunk(base64) {
    if (!this.playContext) return

    // Resume if suspended (Chrome autoplay policy)
    if (this.playContext.state === 'suspended') {
      this.playContext.resume()
    }

    const raw = base64ToArrayBuffer(base64)
    const pcm16 = new Int16Array(raw)
    const float32 = int16ToFloat32(pcm16)

    const buffer = this.playContext.createBuffer(1, float32.length, this.outputSampleRate)
    buffer.getChannelData(0).set(float32)

    const source = this.playContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.playContext.destination)

    const now = this.playContext.currentTime
    const startTime = Math.max(now + 0.05, this.nextPlayTime)
    source.start(startTime)
    this.nextPlayTime = startTime + buffer.duration

    this.activeSources.push(source)
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source)
      // If no more queued audio, agent finished speaking
      if (this.activeSources.length === 0 && this.playContext) {
        const remaining = this.nextPlayTime - this.playContext.currentTime
        if (remaining <= 0.1) {
          this.isSpeaking = false
          if (!this._destroyed) this.onStatusChange('listening')
        }
      }
    }
  }

  _stopPlayback() {
    for (const src of this.activeSources) {
      try { src.stop() } catch (_) { /* already stopped */ }
    }
    this.activeSources = []
    this.nextPlayTime = 0
  }

  _closePlayback() {
    this._stopPlayback()
    if (this.playContext) {
      try { this.playContext.close() } catch (_) {}
      this.playContext = null
    }
  }

  // ── Send helper ─────────────────────────────────

  _send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}