const STRESSED_INDICATORS = [
  'overwhelmed', 'anxious', 'deadline', 'too much', 'stressed',
  'pressure', 'exam', 'work panic', 'panic', 'freaking out',
  'can\'t handle', 'falling apart', 'so much', 'behind on',
  'due tomorrow', 'overloaded', 'burnt out', 'burnout', 'tension',
  'worried', 'nervous', 'frantic',
]

const LOW_MOOD_INDICATORS = [
  'tired', 'lonely', 'sad', 'numb', 'empty', 'bored with life',
  'meh', 'low energy', 'depressed', 'hopeless', 'worthless',
  'don\'t care', 'nothing matters', 'crying', 'hurt', 'alone',
  'broken', 'lost', 'drained', 'exhausted', 'can\'t sleep',
  'dark place', 'give up', 'no point', 'hate myself',
]

const HOSTILE_INDICATORS = [
  'none of your business', 'just let me in', 'shut up',
  'leave me alone', 'go away', 'fuck off', 'stfu',
  'i don\'t care', 'stop', 'get out of my way', 'skip',
  'not now', 'buzz off', 'piss off',
]

const DISTRESS_INDICATORS = [
  'hurt myself', 'end it', 'don\'t want to be here',
  'self harm', 'suicide', 'kill myself', 'no reason to live',
  'want to die', 'can\'t go on',
]

export function classifyMood(text) {
  const lower = text.toLowerCase().trim()

  if (!lower || lower.length === 0) return 'SILENT'

  if (HOSTILE_INDICATORS.some(w => lower.includes(w))) return 'HOSTILE'

  if (DISTRESS_INDICATORS.some(w => lower.includes(w))) return 'DISTRESS'

  const stressScore = STRESSED_INDICATORS.reduce(
    (score, word) => score + (lower.includes(word) ? 1 : 0), 0
  )
  const lowMoodScore = LOW_MOOD_INDICATORS.reduce(
    (score, word) => score + (lower.includes(word) ? 1 : 0), 0
  )

  if (stressScore > 0 && stressScore >= lowMoodScore) return 'STRESSED'
  if (lowMoodScore > 0) return 'LOW_MOOD'

  return 'NEUTRAL'
}

export function isLateNight() {
  const hour = new Date().getHours()
  return hour >= 23 || hour < 5
}