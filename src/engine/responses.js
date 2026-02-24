import { isLateNight } from './moodClassifier'

export function getEntryMessage() {
  return "Hey — you're about to open Instagram.\nWhat's going on right now?"
}

export function getStressedResponse() {
  return "That sounds like a lot to carry right now.\nMaybe take 3 slow breaths with me first.\nDo you still want to open Instagram, or pause a moment?"
}

export function getLowMoodResponse() {
  return "Hey — thanks for saying that.\nHow have you been holding up today?"
}

export function getLowMoodDistressResponse() {
  return "You don't have to sit with that alone.\nWant me to help you reach someone you trust?"
}

export function getNeutralResponse() {
  return "Got it — makes sense to want that.\nWant a quick intentional check, or just go in?"
}

export function getHostileResponse() {
  return "Fair enough — I'll get out of your way."
}

export function getSilentFirstResponse() {
  return "Take your time — what's going on?"
}

export function getSilentSecondResponse() {
  return "No pressure at all. You can go ahead whenever you're ready."
}

export function getIntentionalAskResponse() {
  return "What do you want to do on Instagram?"
}

export function getIntentionalSetResponse() {
  return "Okay — go do that. I'll check back in a few minutes."
}

export function getSessionClosureResponse() {
  return "Welcome back — what pulled you there just now?"
}

export function getClosureCheckResponse() {
  return "Did you get what you needed?"
}

export function getClosureYesResponse() {
  return "Nice — sounds like that scroll did its job.\nLet's leave it there so it stays intentional."
}

export function getClosureNoResponse() {
  return "That happens — scrolling often doesn't give what we're looking for.\nWant to stop here or try one intentional minute?"
}

export function getReopenFirstResponse() {
  return "You were just there — still want to go back?"
}

export function getReopenSecondResponse() {
  return "Looks like today's pull is strong.\nWant a short break from Instagram?"
}

export function getRepeatSessionResponse() {
  return "You've reached for Instagram a few times today —\nwhat's been going on?"
}

export function getLateNightResponse() {
  return "Late nights can feel heavy.\nWhat's pulling you to scroll right now?"
}

export function getContextualEntry(sessionCount, lastSessionEnd, reopenCount) {
  if (isLateNight()) {
    return getLateNightResponse()
  }

  if (lastSessionEnd) {
    const minutesSince = (Date.now() - lastSessionEnd) / 60000
    if (minutesSince < 20) {
      if (reopenCount >= 2) return getReopenSecondResponse()
      return getReopenFirstResponse()
    }
  }

  if (sessionCount >= 3) {
    return getRepeatSessionResponse()
  }

  return getEntryMessage()
}