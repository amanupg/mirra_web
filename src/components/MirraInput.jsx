import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function MirraInput({ onSubmit, placeholder = "Type here...", autoFocus = true }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 600)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) {
      onSubmit(value.trim())
      setValue('')
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto px-4 mt-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-mirra-surface/80 border border-mirra-border/60 rounded-2xl px-5 py-3.5 
                     text-mirra-text text-[15px] font-light placeholder-mirra-textMuted/50
                     focus:outline-none focus:border-mirra-accent/40 focus:ring-1 focus:ring-mirra-accent/20
                     transition-all duration-300"
        />
        <motion.button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full 
                     bg-mirra-accent/20 flex items-center justify-center
                     hover:bg-mirra-accent/30 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ opacity: value.trim() ? 1 : 0.3 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mirra-accent">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </motion.button>
      </div>
    </motion.form>
  )
}