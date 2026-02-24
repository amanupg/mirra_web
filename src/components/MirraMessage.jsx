import { motion } from 'framer-motion'

export default function MirraMessage({ text, delay = 0 }) {
  if (!text) return null

  const lines = text.split('\n')

  return (
    <motion.div
      className="w-full max-w-md mx-auto px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className="text-mirra-text/90 text-center text-[15px] leading-relaxed font-light tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: delay + i * 0.15 }}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </motion.div>
  )
}