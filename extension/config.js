/**
 * ================================================================
 *  MIRRA — FEATURE FLAGS
 * ================================================================
 */

const CONFIG = {
  // Master toggle for Hume AI emotion detection
  // When false: keyword classifier runs (current behavior)
  // When true: Hume prosody analysis replaces classifier entirely
  HUME_ENABLED: false,

  // Timer durations (in seconds) — change here for demo vs production
  INTENTIONAL_MODE_DURATION: 10,       // 300 for production
  CHECK_IN_TIMER_DURATION: 10,         // 180 for production

  // Bypass count before breakup mode triggers
  BREAKUP_TRIGGER_COUNT: 3,
}
