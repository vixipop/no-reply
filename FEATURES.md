# No Reply — Feature Build List

Living checklist (yours + mine, merged). We build **one at a time**, in order;
after every couple of features I show this back with items checked off.

**Status:** `[x]` done · `[~]` partial / needs upgrade · `[ ]` not started · `▶` building now

> **North-star reward:** the only reply you ever get is from *yourself, later.*
> **Motif:** letters. You *send* a letter into the void; sometimes *a letter
> comes back* — from past-you.

---

## 1. Capture & the exhale — "it's out of my head, and it's safe"
- [x] Frictionless chat-style input (no blank-page cursor)
- [x] Choose a prompt or write your own title
- ▶ **Envelope send animation** — a tiny letter flies from the box into the void
- [ ] Rotating save microcopy ("sealed. no one will ever read this." etc.)
- [ ] Reassuring placeholder ("start typing… no one's reading")

## 2. Letters — the reply from yourself
- [ ] **"a letter came in" toast** — envelope, bottom-right, ephemeral (not saved, gone in 24h)
- [ ] Toast copy: time-ago + mood ("you seemed tired 3 days ago. still true?", "one year ago today")
- [ ] Tap a toast → opens that past entry
- [ ] **Reply-to-past-you thread** ⭐ — write back to an old entry; a conversation with your old self
- [ ] Resurfacing engine (on-this-day / N-days-ago) that feeds the toasts

## 3. Kind streak & grace days
- [~] Streak counter (exists; needs reframe)
- [ ] **Earned grace days** — journal 3 days/week → earn a grace day ("2 grace days remaining")
- [ ] Streak copy set: active / not-yet-today / after-miss / grace-used / milestone
- [ ] Anti-AI milestone copy ("30 days you didn't let a chatbot think for you")

## 4. Moods — the key to analytics
- [ ] Mood set (final): **happy · sad · angry · tired · chill**
- [ ] Tag each entry with a mood (via the prompt chosen, or a manual pick)
- [ ] Prompts organized under moods (choosing one tags the entry)

## 5. Analytics / the mirror — stats, never verdicts (two tabs)
- [ ] Tab 1 — **contribution grid** (GitHub-style green squares) + calendar of days written
- [ ] Tab 2 — **moodboard of the month** (from mood tags)
- [ ] Weekly recap numbers (hours written, days shown up, top prompt, a repeated word)
- [ ] "we won't tell you what it means — that's your job" framing
- [ ] "Today" header element (e.g. Saturday · 18 July 2026 · Week 29 · dot grid)
- [~] Rolling weekly entry count (exists) · [ ] hours-written tracking

## 6. Archive / time machine
- [x] Archive of entries · [x] search + week/month/year filters · [x] delete
- [x] Fully editable entries · [x] preserved indents/paragraphs/blank lines
- [ ] Content-state copy — title "everything you've told no one", empty, "you've kept 47 thoughts safe"
- [ ] Flag on-this-day entries in the archive

## 7. First week — where people are lost
- [ ] 60-second first-write onboarding
- [ ] Day-2 forward hook (after first save)
- [ ] Self-set gentle nudge — the one opt-in notification ("i'll whisper, not shout")

## 8. Voice & content
- [ ] Manifesto / hero line
- [ ] In-voice microcopy pass across the app (lowercase, honest, no corporate)

## 9. Delight & paid tier — later
- [ ] Turn an entry into a shareable image/card
- [ ] Stickers + backgrounds (paid) · [ ] background removal for uploads

## 10. North star — v2
- [ ] Hivemind whiteboard — you connect your own notes into a visual web

---

## Already shipped (foundation)
- [x] React + Vite + routing; three pages (home / archive / entry)
- [x] Cutting-mat visual system, exact colors, fonts, decorations
- [x] Smooth prompt reel + ghost preview + lock rules
- [x] Editable title (blue selection UI) · auto-grow composer · image paste → cover
- [x] Streak (holds-from-yesterday, grey/pink flame) · hover motion

---

## Build order (current)
1. ▶ **Envelope send animation + rotating microcopy** (feature 1)
2. **"a letter came in" toast + resurfacing engine** (feature 2)
3. Reply-to-past-you thread
4. Kind streak + earned grace days
5. Moods + mood tagging
6. Analytics (contribution grid + moodboard) + weekly mirror
7. Archive content states + on-this-day flags
8. Onboarding + day-2 hook + self-set nudge
9. Voice pass · then delight/paid · then hivemind
