import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function SessionTimer({ durationMs, onComplete, label = "Session active" }) {
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const diff = now - startTime
      setElapsed(diff)
      if (diff >= durationMs) {
        clearInterval(interval)
        onComplete()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, durationMs, onComplete])

  const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000))
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = Math.min(1, elapsed / durationMs)

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-mirra-textMuted/50 text-[11px] uppercase tracking-[0.2em]">
        {label}
      </p>

      {/* Circular progress */}
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="rgba(30, 30, 46, 0.6)"
            strokeWidth="3"
          />
          <motion.circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="rgba(124, 107, 240, 0.5)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={264}
            strokeDashoffset={264 * (1 - progress)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-mirra-text/70 text-lg font-light tabular-nums">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  )
}