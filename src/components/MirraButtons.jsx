import { motion } from 'framer-motion'

export default function MirraButtons({ buttons, onSelect }) {
  if (!buttons || buttons.length === 0) return null

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3 mt-6 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      {buttons.map((btn, i) => (
        <motion.button
          key={btn.id}
          onClick={() => onSelect(btn.id)}
          className={`px-5 py-2.5 rounded-full text-[14px] font-medium tracking-wide
                     transition-all duration-300 border
                     ${btn.primary
                       ? 'bg-mirra-accent/15 border-mirra-accent/30 text-mirra-accentGlow hover:bg-mirra-accent/25 hover:border-mirra-accent/50'
                       : 'bg-mirra-surface/60 border-mirra-border/40 text-mirra-textMuted hover:bg-mirra-surface hover:border-mirra-border hover:text-mirra-text'
                     }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {btn.label}
        </motion.button>
      ))}
    </motion.div>
  )
}