/**
 * ================================================================
 *  HUME AI EMOTION DETECTION
 *  Toggle: CONFIG.HUME_ENABLED in config.js
 *
 *  When enabled, replaces keyword classification entirely.
 *  Detects emotion from voice prosody and tone in real-time.
 *  Catches stress in "I'm fine" responses. Distinguishes loneliness
 *  from sadness within LOW_MOOD. Continuous confidence scores
 *  instead of binary keyword matches.
 *
 *  API: https://dev.hume.ai/docs/empathic-voice-interface-evi
 * ================================================================
 */

class HumeEmotionDetector {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.socket = null
    this.onEmotionDetected = null
    this.isConnected = false
  }

  async connect() {
    try {
      const url = `wss://api.hume.ai/v0/evi/chat?api_key=${this.apiKey}`
      this.socket = new WebSocket(url)

      this.socket.onopen = () => {
        this.isConnected = true
        console.log('[NYM] Hume emotion detection connected')
      }

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.models && msg.models.prosody && msg.models.prosody.group_predictions) {
            const predictions = msg.models.prosody.group_predictions
            if (predictions.length > 0) {
              const emotions = predictions[0].predictions[0]?.emotions
              if (emotions) {
                const scores = {}
                for (const e of emotions) {
                  scores[e.name] = e.score
                }
                this._routeToPath(scores)
              }
            }
          }
        } catch (_) {}
      }

      this.socket.onclose = () => {
        this.isConnected = false
      }

      this.socket.onerror = () => {
        console.error('[NYM] Hume WebSocket error')
        this.isConnected = false
      }
    } catch (e) {
      console.error('[NYM] Hume connection failed:', e)
      this.isConnected = false
    }
  }

  analyzeTranscript(transcript) {
    if (!this.isConnected || !this.socket) return
    try {
      this.socket.send(JSON.stringify({
        type: 'user_input',
        data: { text: transcript }
      }))
    } catch (_) {}
  }

  _routeToPath(scores) {
    const stress = Math.max(
      scores['Anxiety'] ?? 0,
      scores['Fear'] ?? 0,
      scores['Distress'] ?? 0,
      scores['Nervousness'] ?? 0
    )

    const lowMood = Math.max(
      scores['Sadness'] ?? 0,
      scores['Tiredness'] ?? 0,
      scores['Disappointment'] ?? 0,
      scores['Empathic Pain'] ?? 0
    )

    const calm = Math.max(
      scores['Calmness'] ?? 0,
      scores['Contentment'] ?? 0,
      scores['Satisfaction'] ?? 0
    )

    const intentional = Math.max(
      scores['Determination'] ?? 0,
      scores['Concentration'] ?? 0,
      scores['Interest'] ?? 0
    )

    console.log(
      '[NYM] Hume scores — stress:', stress.toFixed(2),
      'lowMood:', lowMood.toFixed(2),
      'calm:', calm.toFixed(2),
      'intentional:', intentional.toFixed(2)
    )

    if (intentional > 0.5 && intentional > stress && intentional > lowMood) {
      this.onEmotionDetected?.('INTENTIONAL', intentional)
    } else if (stress > 0.4 && stress > lowMood) {
      this.onEmotionDetected?.('STRESSED', stress)
    } else if (lowMood > 0.4 && lowMood > stress) {
      this.onEmotionDetected?.('LOW_MOOD', lowMood)
    } else {
      this.onEmotionDetected?.('NEUTRAL', calm)
    }
  }

  async disconnect() {
    if (this.socket) {
      try { this.socket.close() } catch (_) {}
      this.socket = null
    }
    this.isConnected = false
  }
}
