import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Transcript({ messages }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) return null

  return (
    <div className="w-full max-w-md mx-auto mt-4 max-h-48 overflow-y-auto px-4 scrollbar-thin">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className="mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-[10px] uppercase tracking-[0.15em] text-mirra-textMuted/40 mb-0.5">
              {msg.role === 'agent' ? 'mirra' : 'you'}
            </p>
            <p className={`text-[14px] leading-relaxed font-light ${
              msg.role === 'agent'
                ? 'text-mirra-text/85'
                : 'text-mirra-accentGlow/70 italic'
            }`}>
              {msg.text}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  )
}