import { motion } from 'framer-motion'

const palette = {
  idle:      { inner: '#7c6bf0', outer: 'rgba(124, 107, 240, 0.15)' },
  speaking:  { inner: '#9d8df7', outer: 'rgba(157, 141, 247, 0.20)' },
  listening: { inner: '#7c6bf0', outer: 'rgba(124, 107, 240, 0.18)' },
  connecting:{ inner: '#8b8898', outer: 'rgba(139, 136, 152, 0.10)' },
  error:     { inner: '#f07474', outer: 'rgba(240, 116, 116, 0.12)' },
}

export default function PulsingOrb({ status = 'idle' }) {
  const colors = palette[status] || palette.idle
  const isSpeaking  = status === 'speaking'
  const isListening = status === 'listening'
  const isConnecting = status === 'connecting'

  const outerAnim = isSpeaking
    ? { scale: [1, 1.4, 1.1, 1.35, 1], opacity: [0.3, 0.9, 0.5, 0.85, 0.3] }
    : isListening
    ? { scale: [1, 1.25, 1], opacity: [0.4, 0.75, 0.4] }
    : isConnecting
    ? { scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }
    : { scale: [1, 1.12, 1], opacity: [0.3, 0.55, 0.3] }

  const outerDur = isSpeaking ? 1.2 : isListening ? 2.2 : isConnecting ? 2.5 : 4

  const innerAnim = isSpeaking
    ? { scale: [1, 1.12, 0.97, 1.1, 1] }
    : isListening
    ? { scale: [1, 1.06, 1] }
    : { scale: [1, 1.03, 1] }

  const innerDur = isSpeaking ? 0.8 : isListening ? 1.5 : 3

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 170,
          height: 170,
          background: `radial-gradient(circle, ${colors.outer} 0%, transparent 70%)`,
        }}
        animate={outerAnim}
        transition={{ duration: outerDur, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Mid ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${colors.outer} 0%, transparent 70%)`,
        }}
        animate={{
          scale: isSpeaking ? [1, 1.25, 1] : [1, 1.1, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: outerDur * 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
      {/* Core orb */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: 64,
          height: 64,
          background: `radial-gradient(circle at 35% 35%, ${colors.inner}dd, ${colors.inner}88)`,
          boxShadow: `0 0 40px ${colors.inner}44, 0 0 80px ${colors.inner}22`,
        }}
        animate={innerAnim}
        transition={{ duration: innerDur, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}