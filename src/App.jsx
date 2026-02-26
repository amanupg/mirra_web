import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PulsingOrb from './components/PulsingOrb'
import StatusText from './components/StatusText'
import Transcript from './components/Transcript'
import ElevenLabsClient from './engine/elevenlabsClient'

// ─── Conversation status labels ──────────────────────
const STATUS_LABELS = {
  connecting: 'Connecting…',
  connected:  'Connected',
  speaking:   'Mirra is speaking…',
  listening:  'Mirra is listening…',
  error:      'Connection error',
  idle:       '',
}

// ─── App ─────────────────────────────────────────────
export default function App() {
  // API key state (memory only)
  const [apiKey, setApiKey]     = useState('')
  const [agentId, setAgentId]   = useState('')
  const [showConfig, setShowConfig] = useState(true)

  // Overlay / conversation state
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [status, setStatus]   = useState('idle')
  const [messages, setMessages] = useState([])
  const [appName, setAppName]   = useState('Instagram')

  const clientRef = useRef(null)
  const msgIdRef  = useRef(0)

  // ── Helpers ─────────────────────────────────────

  const addMessage = useCallback((role, text) => {
    setMessages(prev => [...prev, { id: ++msgIdRef.current, role, text }])
  }, [])

  // ── Start conversation ──────────────────────────

  const handleTrigger = useCallback((app) => {
    if (!agentId) {
      alert('Please enter your ElevenLabs Agent ID first.')
      return
    }

    setAppName(app)
    setOverlayOpen(true)
    setMessages([])
    setStatus('connecting')
    setShowConfig(false)

    const client = new ElevenLabsClient({
      agentId,
      apiKey: apiKey || undefined,
      onStatusChange: (s) => setStatus(s),
      onAgentMessage: (text) => addMessage('agent', text),
      onUserTranscript: (text) => addMessage('user', text),
      onError: (err) => {
        console.error('[NYM]', err)
        setStatus('error')
      },
      onDisconnect: () => {
        setStatus('idle')
      },
    })

    clientRef.current = client
    client.start(app)
  }, [agentId, apiKey, addMessage])

  // ── Stop / bypass ───────────────────────────────

  const handleBypass = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stop()
      clientRef.current = null
    }
    setOverlayOpen(false)
    setStatus('idle')
  }, [])

  // ── Cleanup on unmount ──────────────────────────

  useEffect(() => {
    return () => {
      if (clientRef.current) clientRef.current.stop()
    }
  }, [])

  // ── Instagram icon SVG ──────────────────────────

  const InstagramIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
    </svg>
  )

  // ── YouTube icon SVG ────────────────────────────

  const YouTubeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 9l5 3-5 3V9z" fill="currentColor"/>
    </svg>
  )

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-mirra-bg">

      {/* ── Background ambient glow ─────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(124, 107, 240, 0.06) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── API Key Config Bar ──────────────────── */}
      <AnimatePresence>
        {showConfig && !overlayOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 mx-auto mt-6 w-full max-w-lg px-4"
          >
            <div className="bg-mirra-surface/70 border border-mirra-border/40 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-mirra-textMuted/60 text-[11px] uppercase tracking-[0.2em] font-medium">
                  Configuration
                </p>
                <div className={`w-2 h-2 rounded-full ${agentId ? 'bg-emerald-400/80' : 'bg-mirra-textMuted/30'}`} />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-mirra-textMuted/50 text-[11px] mb-1.5 tracking-wider">
                    ELEVENLABS AGENT ID
                  </label>
                  <input
                    type="text"
                    value={agentId}
                    onChange={e => setAgentId(e.target.value.trim())}
                    placeholder="paste agent id…"
                    className="w-full bg-mirra-bg/80 border border-mirra-border/40 rounded-xl px-4 py-2.5
                               text-mirra-text text-[13px] font-light placeholder-mirra-textMuted/30
                               focus:outline-none focus:border-mirra-accent/40 focus:ring-1 focus:ring-mirra-accent/15
                               transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-mirra-textMuted/50 text-[11px] mb-1.5 tracking-wider">
                    ELEVENLABS API KEY <span className="text-mirra-textMuted/30">(optional for public agents)</span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value.trim())}
                    placeholder="paste api key…"
                    className="w-full bg-mirra-bg/80 border border-mirra-border/40 rounded-xl px-4 py-2.5
                               text-mirra-text text-[13px] font-light placeholder-mirra-textMuted/30
                               focus:outline-none focus:border-mirra-accent/40 focus:ring-1 focus:ring-mirra-accent/15
                               transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger screen (home) ───────────────── */}
      <AnimatePresence>
        {!overlayOpen && (
          <motion.div
            key="home"
            className="flex-1 flex flex-col items-center justify-center relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
          >
            <PulsingOrb status="idle" />

            <p className="text-mirra-textMuted/40 text-[11px] uppercase tracking-[0.3em] mt-2 mb-10">
              mirra
            </p>

            <div className="flex flex-col gap-3 items-center">
              {/* Instagram trigger */}
              <motion.button
                onClick={() => handleTrigger('Instagram')}
                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl
                           bg-gradient-to-r from-[#E1306C]/10 to-[#F77737]/10
                           border border-[#E1306C]/20 hover:border-[#E1306C]/40
                           text-[#E1306C]/60 hover:text-[#E1306C]/90
                           transition-all duration-300 group w-56 justify-center"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <InstagramIcon />
                <span className="text-[14px] font-light tracking-wide">
                  Open Instagram
                </span>
              </motion.button>

              {/* YouTube trigger */}
              <motion.button
                onClick={() => handleTrigger('YouTube')}
                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl
                           bg-gradient-to-r from-[#FF0000]/8 to-[#FF4444]/8
                           border border-[#FF0000]/15 hover:border-[#FF0000]/35
                           text-[#FF4444]/55 hover:text-[#FF4444]/85
                           transition-all duration-300 group w-56 justify-center"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <YouTubeIcon />
                <span className="text-[14px] font-light tracking-wide">
                  Open YouTube
                </span>
              </motion.button>
            </div>

            {/* Config toggle when hidden */}
            {!showConfig && (
              <motion.button
                onClick={() => setShowConfig(true)}
                className="mt-8 text-mirra-textMuted/25 text-[11px] tracking-wider hover:text-mirra-textMuted/50 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                show config
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Conversation overlay ────────────────── */}
      <AnimatePresence>
        {overlayOpen && (
          <motion.div
            key="overlay"
            className="absolute inset-0 z-30 flex flex-col items-center bg-mirra-bg/[0.98]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Ambient glow — shifts with status */}
            <div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-1000"
              style={{
                background: status === 'speaking'
                  ? 'radial-gradient(circle, rgba(157, 141, 247, 0.10) 0%, transparent 70%)'
                  : status === 'listening'
                  ? 'radial-gradient(circle, rgba(124, 107, 240, 0.08) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(139, 136, 152, 0.05) 0%, transparent 70%)'
              }}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-4 relative z-10">
              {/* Orb */}
              <PulsingOrb status={status} />

              {/* Status text */}
              <StatusText text={STATUS_LABELS[status] || ''} />

              {/* Transcript */}
              <Transcript messages={messages} />
            </div>

            {/* Bypass button — always visible at bottom */}
            <div className="relative z-10 pb-10 pt-4 flex flex-col items-center gap-3">
              <motion.button
                onClick={handleBypass}
                className="px-6 py-2.5 rounded-full text-[13px] font-medium tracking-wide
                           bg-mirra-surface/50 border border-mirra-border/30
                           text-mirra-textMuted/50 hover:text-mirra-textMuted/80
                           hover:bg-mirra-surface/80 hover:border-mirra-border/50
                           transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Just let me in
              </motion.button>
              <p className="text-mirra-textMuted/20 text-[10px] tracking-[0.2em]">
                {appName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer branding ─────────────────────── */}
      {!overlayOpen && (
        <div className="relative z-10 pb-6 text-center">
          <p className="text-mirra-textMuted/15 text-[10px] tracking-[0.3em] uppercase">
            mirra
          </p>
        </div>
      )}
    </div>
  )
}