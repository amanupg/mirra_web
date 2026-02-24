import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PHASES = [
  { label: 'Breathe in', duration: 4000, scale: 1.4 },
  { label: 'Hold', duration: 2000, scale: 1.4 },
  { label: 'Breathe out', duration: 4000, scale: 1.0 },
]

export default function BreathingExercise({ cycles = 3, onComplete }) {
  const [phase, setPhase] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return

    const timer = setTimeout(() => {
      const nextPhase = (phase + 1) % PHASES.length
      if (nextPhase === 0) {
        const nextCycle = cycle + 1
        if (nextCycle >= cycles) {
          setDone(true)
          setTimeout(onComplete, 1000)
          return
        }
        setCycle(nextCycle)
      }
      setPhase(nextPhase)
    }, PHASES[phase].duration)

    return () => clearTimeout(timer)
  }, [phase, cycle, done, cycles, onComplete])

  const current = PHASES[phase]

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <motion.div
        className="w-20 h-20 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(124, 107, 240, 0.6), rgba(124, 107, 240, 0.2))',
          boxShadow: '0 0 60px rgba(124, 107, 240, 0.2)',
        }}
        animate={{ scale: done ? 1 : current.scale }}
        transition={{ duration: current.duration / 1000, ease: 'easeInOut' }}
      />
      <AnimatePresence mode="wait">
        <motion.p
          key={done ? 'done' : current.label}
          className="text-mirra-text/70 text-sm font-light tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {done ? 'Nice work.' : current.label}
        </motion.p>
      </AnimatePresence>
      {!done && (
        <p className="text-mirra-textMuted/40 text-[11px] tracking-wider">
          {cycle + 1} / {cycles}
        </p>
      )}
    </div>
  )
}