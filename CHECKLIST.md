# No Reply — Build Checklist

Use alongside `CONTEXT.md` (the full design/architecture reference) and the
reference HTML. Status updated to reflect what's actually been built in the app
so far.

**Legend:** `[x]` done · `[~]` partially done · `[ ]` not started · 🆕 new task
discovered during the build.

---

## Phase 0 — Setup
- [x] Node.js + Claude Code installed
- [x] Project folder with design brief + reference HTML
- [x] Decision: went **straight to a standalone Vite + React project** (skipped
      the artifact-first route)
- [x] Scaffolded (Vite + React), git initialized, GitHub repo (`vixipop/no-reply`)
- [x] 🆕 Added `react-router-dom` for multi-page routing
- [x] 🆕 `CONTEXT.md` handoff doc written (single-file onboarding)

## Phase 1 — Core screens (components)
**Main journal screen**
- [x] Cutting-mat green background + grid
- [x] Top bar: streak (flame + count) left, archive icon right
- [x] Corner sparkle/asterisk decoration (now a centered SVG, spins in place)
- [x] Header prompt text (center, Young Serif, 48px, weight 400)
- [x] Ghost text preview of next prompt (blurred, clipped, masked)
- [x] Highlighted word styling (green `#77FF94` + glow)
- [x] Chatbox input (dashed, slim, no bubble/avatar)
- [x] Send icon (stitched-star, hover spin)
- [x] Entry count label below chatbox ("N entries this week", real count)
- [x] Two decorative metallic-star images, positioned per reference

**Archive screen**
- [x] Grid of past entries — date + prompt + answer (as blog cards)
- [x] Filter by time range — 🆕 **this week / this month / this year / all** tabs
      (implemented instead of prompt-type dropdown; see note below)
- [x] Empty state (understated lowercase copy) — plus a "no matches" state
- [x] Back button to main screen
- [x] 🆕 Search bar (matches entry text + prompt)
- [x] 🆕 Per-card delete (with confirm)
- [ ] Filter **by prompt type** specifically (currently filters by date range +
      free-text search; prompt-type tabs/dropdown still open if wanted)

**Scroll / prompt-rotation mechanic**
- [x] Full list of prompts defined (dummy set, easily swapped)
- [x] Scroll-down / ↓ advances, scroll-up / ↑ goes back
- [x] Ghost text always shows the next prompt, dynamically
- [x] 🆕 Reel locks past 10 lines (ghost hides) and when a custom title is set
- [ ] **Each prompt remembers its own in-progress draft** as you move between
      them — NOT implemented (single shared composer today)

## Phase 2 — Core functionality
- [x] Data model defined — `{id, prompt, text, images[], cover, timestamp}`
- [~] Save behavior — saves on **Enter / send click** (deliberate chat-style
      commit), **not** continuous keystroke autosave (deviation from brief)
- [x] Persistence decision — **local-only** (`localStorage`)
- [x] Streak logic — holds from yesterday, grey flame until today is logged
- [x] Entry count logic — real rolling weekly count
- [x] Archive read/filter logic — load all, filter by range + search
- [x] 🆕 Entry model migration (old single `image` → `images[]` + `cover`)
- [x] 🆕 Editable entries — edit title, text, photos, and cover; delete entries
- [x] 🆕 Preserve text formatting (indents, paragraphs, blank lines via pre-wrap)
- [x] 🆕 Image support — paste on home → cover photo; add/manage multiple on the
      entry page

## Phase 3 — Interactions & polish
- [x] Send-icon hover animation (spin/scale)
- [x] Scroll transition animation — smooth two-layer cross-slide (glide, not snap)
- [x] Ghost-text fate decided — static preview of next prompt (no scroll-linked
      reactivity)
- [x] Loading/empty states for archive
- [x] Keyboard behavior — Enter saves, Shift+Enter newline; ↑/↓ move the reel
- [x] 🆕 Editable-title UI (click header → blue selection box + corner handles)
- [x] 🆕 Hover motion on both metallic stars + corner asterisk (in place)
- [x] 🆕 Streak flame color state (pink active / grey = not journaled today)
- [~] Basic error handling — empty entries are ignored, delete confirms; broader
      storage-failure handling still light
- [ ] 🆕 Optional: let a custom title pick its own green glow word

## Phase 4 — Usage analytics (lightweight, self-built)
- [ ] Track total entries written
- [ ] Track which prompt type gets used/skipped most
- [ ] Track rough weekly active usage
- [ ] Simple hidden view to check the numbers
> Note: local-only + single-user right now, so cross-user analytics only becomes
> meaningful if a backend is added later.

## Phase 5 — Sharing / deployment
- [ ] Deploy to Vercel/Netlify free tier; confirm live URL
- [ ] 🆕 Add SPA fallback (`_redirects` / rewrite / `404.html`) so deep links to
      `/archive` and `/entry/:id` work on refresh
- [ ] Test on mobile width — **nothing checked at small screens yet**
- [ ] 🆕 Responsive/mobile layout pass (currently desktop-width only)
- [ ] Final calm/quiet pass — has feature creep made it busy?

## Explicitly NOT required for v1 (don't scope-creep)
- [ ] Team Radio Notes / F1 Pomodoro integration (separate project)
- [ ] Push notifications / reminders
- [ ] Multi-device sync beyond the storage choice
- [ ] Rich-text formatting in entries (plain text + preserved whitespace only)

---

### Biggest open items, ranked
1. **Mobile / responsive layout** — the app is desktop-width only.
2. **Per-prompt draft memory** — scrolling should stash the unsaved draft per prompt.
3. **Deployment** (+ SPA fallback) to get a live URL.
4. **Prompt-type filtering** in the archive (in addition to date/search).
5. **Analytics** (only meaningful with a backend).
