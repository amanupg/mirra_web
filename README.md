# Not Your Mom 🫶

> Not your standard app blocker. Just checking in.

Not Your Mom is a Chrome extension that intercepts impulsive social media use with a warm, emotionally intelligent voice conversation — before you even see the feed.

Built at the Columbia AI for Good Hackathon 2026.

---

## Why it exists

The average person picks up their phone 96 times a day. Most of those times, they have no idea why.

Every existing solution tries to fix this with willpower — hard blocks, screen time limits, guilt notifications. Willpower depletes. Resentment builds. The apps win.

Not Your Mom is built on **implementation intention theory** — 94 peer-reviewed studies from NYU showing that asking *why* you're doing something before you do it measurably reduces impulsive follow-through. You don't need to be blocked. You just need to be asked.

---

## What it does

**Four emotional paths:**

| You say | Not Your Mom does |
|---|---|
| "I'm stressed / overwhelmed" | Acknowledges stress, offers grounding, asks if you still want in |
| "I'm tired / lonely / sad" | Responds with warmth, no redirect, offers real support if needed |
| "I need to check my DMs" | Lets you in with a 5-minute timer. Checks back after. |
| "Just let me in" | "Fair enough — I'll get out of your way." No guilt. |

**Other features:**
- 🕐 **Intentional Use Mode** — state your goal, get a timer, get checked in on
- 💔 **Breakup Mode** — after repeated returns, gently asks if the app is actually serving you
- 📊 **Analytics Dashboard** — emotional patterns, session insights, suggestion impact
- 🧠 **Hume AI Emotion Detection** — real-time prosody analysis (toggle in config.js)

---

## How it works

Built on:
- **ElevenLabs Conversational AI** — real-time voice agent with full emotional context
- **Hume AI EVI** — emotion detection from voice tone and prosody (Phase 2, toggle off by default)
- **Chrome Extension Manifest V3** — intercepts navigation at the browser level
- **Implementation Intention Theory** — the behavioral science backbone

---

## Install for development

1. Clone the repo
```bash
git clone https://github.com/amanupg/not-your-mom.git
cd not-your-mom
```

2. Add your API keys to the extension popup after loading (never commit keys)

3. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable **Developer Mode**
   - Click **Load unpacked**
   - Select the `/extension` folder

4. Enter your API keys in the extension popup:
   - ElevenLabs API Key
   - ElevenLabs Agent ID
   - Hume API Key (optional, for Phase 2)

5. Navigate to instagram.com and say hi to Not Your Mom 👋

---

## Configuration

All feature flags live in `extension/config.js`:
```javascript
const CONFIG = {
  HUME_ENABLED: false,              // toggle Hume emotion detection
  INTENTIONAL_MODE_DURATION: 300,   // seconds (10 for demo)
  CHECK_IN_TIMER_DURATION: 180,     // seconds (10 for demo)
  BREAKUP_TRIGGER_COUNT: 3,         // bypasses before breakup mode
}
```

---

## The science

Implementation intention theory (Gollwitzer, NYU) — 94 studies, average effect size 0.65.

The mechanism: asking "what's going on right now?" before an impulsive action activates the prefrontal cortex instead of the habit loop. The question doesn't need to be answered correctly. It just needs to be asked.

This is why the opening line is fixed and non-negotiable:
> *"Hey — you're about to open Instagram. What's going on right now?"*

---

## Team

Built in 48 hours at the Columbia AI for Good Hackathon 2026.

---

## Roadmap

- [ ] Hume AI emotion detection (Phase 2)
- [ ] User accounts and persistent analytics
- [ ] iOS Safari extension
- [ ] Android app (accessibility service overlay)
- [ ] Weekly insight emails
- [ ] Breakup Mode v2 — pattern-based triggers

---

## License

MIT — use it, build on it, make it better.

---

*Not your mom. Just checking in. 🫶*
