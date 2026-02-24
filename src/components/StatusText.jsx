import { motion, AnimatePresence } from 'framer-motion'

export default function StatusText({ text }) {
  return (
    <AnimatePresence mode="wait">
      {text && (
        <motion.p
          key={text}
          className="text-mirra-textMuted/60 text-[11px] uppercase tracking-[0.2em] font-medium text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  )
}