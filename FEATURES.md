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
- [x] **quick note ↔ journal toggle** (bottom-left); journal = open page,
      no box, left-aligned; prompt switching stays scroll-only in quick mode,
      journal carries the current title (still click-to-edit)
- [x] Composer bar: toggle left, tools right (mic placeholder for voice notes)
- [x] Archive entry edit is now an open page too (no bounding box)
- [ ] Voice notes (mic) — placeholder only, not wired
- [x] **Sticky-note toast** on save (yellow note, random tilt — design system §16)
- [x] Rotating save microcopy (via the toast: "sealed & saved." etc.)
- [ ] Envelope send animation — launches from the CURSOR now (awaiting pick: demos/send-anim-v2.html, A–D). First set (send-anim-demo.html) rejected.
- [ ] Reassuring placeholder ("start typing… no one's reading")
- [ ] Swap toast placeholder bottle icon for the real PNG

## 2. Letters — the reply from yourself
- [~] **"a letter from your past"** — kraft envelope, bottom-right; click to flip
      open the flap, note rises with name + date (prototype: demos/past-letter.html — awaiting approval)
- [ ] CTA on the risen note → "reply to your past self" (promotes the reply feature)
- [ ] Content/logic for what the peek shows (to be ideated once the animation is approved)
- [ ] Time-ago + mood label ("you seemed tired 3 days ago. still true?", "one year ago today")
- [ ] Tap → opens that past entry / the reply thread
> Note: two notification surfaces — **yellow sticky note** = quick toasts (§16);
> **kraft envelope** = the weightier "letter from your past" moment.
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
- [x] **Autosave** on entry edit (debounced, live saving…/saved indicator) — no guard needed
- [x] **Draft preservation** — unsaved home-composer writing survives navigation/refresh
- [x] **Ctrl/Cmd+S** → reassurance toast ("no reply saves your work automatically <3")
- [x] In-app sticky-note confirm (used for delete)
- [ ] Content-state copy — title "everything you've told no one", empty, "you've kept 47 thoughts safe"
- [ ] Flag on-this-day entries in the archive

## 7. First week — where people are lost
- [ ] 60-second first-write onboarding
- [ ] Day-2 forward hook (after first save)
- [ ] Self-set gentle nudge — the one opt-in notification ("i'll whisper, not shout")

## 7b. Ambience
- [x] Persistent ambient **rain** player (top-right, all screens; never pauses on
      navigation) with a volume slider that appears when playing
      — procedural Web Audio for now (swap in a real rain file later)
- [ ] Inline images anywhere in an entry + per-image "set as cover" (removes the
      top photo grid) — needs the block-based content model (next)

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
