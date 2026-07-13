# No Reply — Project Context & Handoff

> **Purpose of this file.** This is the single source of truth for the No Reply
> app as it stands today. It merges the original design brief with every design
> decision, value, interaction, and deviation made during development. If you're
> a new session (or a new person) picking this up: read this top to bottom and
> you'll understand the whole app without needing the chat history.

---

## 1. What this app is

A **quiet, private journaling tool that looks like a chat interface but isn't
one.** No AI, no reply, no bot. You type into what looks like a message box, hit
Enter, and it just saves — silently. That mismatch (looks like chat, behaves
like a diary) is the whole hook — hence the name, *No Reply*.

**Core loop**
1. A prompt appears center-screen (e.g. *"what did i notice today?"*).
2. You type your answer into a chat-style input below it.
3. You hit Enter — it saves. No send confirmation, no reply, no bot avatar.
4. Scrolling (or ↑/↓) rotates to a different prompt.
5. An archive view lets you look back at past entries, search and filter them,
   edit them, or delete them.
6. Each saved entry has its own "blog" page with an optional header photo.

The three pages that exist:
- **Home** (`/`) — the journaling screen.
- **Archive** (`/archive`) — all entries as cards, searchable/filterable.
- **Entry / blog page** (`/entry/:id`) — one entry, full view, editable.

---

## 2. Tech stack & architecture

| Concern | Choice |
|---|---|
| Framework | **React 18** |
| Build tool | **Vite 5** |
| Routing | **react-router-dom v6** (`BrowserRouter`) |
| Persistence | **localStorage only** (no backend) |
| Fonts | Google Fonts via `<link>` in `index.html` |
| Language | Plain JS + JSX (no TypeScript) |

**Why these:** local-only keeps the app private and backend-free (matches the
"quiet, personal" intent). React + Vite gives fast HMR and easy multi-page
routing. No component library — everything is hand-rolled CSS to keep the exact
"cutting-mat" look.

### File map
```
index.html               ← fonts + #root
src/
  main.jsx               ← mounts <App/> inside <BrowserRouter>
  App.jsx                ← <Routes>: / , /archive , /entry/:id
  index.css              ← body: cutting-mat background + grid, base reset
  App.css                ← ALL component/page styling lives here
  lib/
    storage.js           ← entry model + all localStorage read/write + helpers
  components/
    icons.jsx            ← every SVG icon (see §9)
  pages/
    Home.jsx             ← journaling screen + prompt reel + composer
    Archive.jsx          ← cards grid + search + filter tabs + delete
    Entry.jsx            ← single blog page + full edit mode
  assets/
    star1.png, star2.png ← the two metallic-silver star photos
```

### Routing notes
- Clean URLs (`/archive`, `/entry/:id`) via `BrowserRouter`.
- **Deployment caveat:** a static host must fall back to `index.html` for
  unknown routes (SPA rewrite), or a hard refresh on `/archive` 404s. Vite's dev
  server already handles this. On Netlify add a `_redirects` (`/* /index.html
  200`); on Vercel a rewrite; on GitHub Pages a `404.html` copy of `index.html`.

---

## 3. Data model

One entry:
```js
{
  id: string,          // crypto.randomUUID() (fallback: timestamp-random)
  prompt: string,      // the question/title shown for this entry
  text: string,        // the journal body (newlines/indents preserved verbatim)
  images: string[],    // data-URL images (pasted or file-picked)
  cover: number,       // index into images[] used as the header/cover photo
  timestamp: number,   // Date.now() at creation
}
```

- **Storage key:** `localStorage["no-reply-entries"]` — a JSON array.
- **Migration:** older entries stored a single `image` field. `loadEntries()`
  normalizes these on read into `{ images: [image], cover: 0 }`, so nothing
  breaks. Never re-introduce a bare `image` field.
- Entries are always returned **newest-first** (sorted by `timestamp` desc).

### `storage.js` API (import from `../lib/storage`)
| Function | What it does |
|---|---|
| `loadEntries()` | All entries, normalized, newest-first |
| `saveEntries(list)` | Overwrite the whole list |
| `addEntry({prompt, text, images})` | Create + prepend a new entry |
| `updateEntry(id, patch)` | Shallow-merge a patch into one entry |
| `getEntry(id)` | One entry or `null` |
| `deleteEntry(id)` | Remove one entry |
| `coverImage(entry)` | The chosen cover data-URL, or first image, or `null` |
| `weekCount(entries)` | Count since the start of this week (Sun) |
| `loggedToday(entries)` | Boolean — is there an entry dated today? |
| `streak(entries)` | Consecutive-day streak (see §7 for the rule) |
| `withinRange(entry, range)` | `'all' \| 'week' \| 'month' \| 'year'` filter |
| `formatDate(ts)` | e.g. `"Jul 12, 2026"` |

---

## 4. Visual identity — the "cutting mat" aesthetic

The background is styled like a real fabric/craft cutting mat: flat color,
precise grid, **no gradients, no glassmorphism, no frosted/blurred panels**
anywhere except the one ghost-text blur (§6). It's a crafting surface, not a
generic app background.

### Exact colors (final — do not substitute)
| Purpose | Hex | Where used |
|---|---|---|
| Background | `#0A3323` | Flat page background, no gradient |
| Grid lines | `#336B55` @ 8% opacity | Fine grid (20px) + bold grid (100px) |
| Accent pink | `#FFABE7` | Corner sparkle, send star, active flame, active filter tab, cover badge, delete accents, focus borders |
| Main text (cream) | `#F7F4D5` | Headers, prompts, labels, body text |
| Highlight word | `#77FF94` | The glowing word inside a prompt; card subtitles |
| Highlight glow | `#007E13` | `text-shadow: 0 0 6px, 0 0 14px` behind the highlight word |

**Supporting tones used in build (derived, not in original brief):**
| Purpose | Hex |
|---|---|
| Muted green (dashed borders, dot-star, placeholders, card borders) | `#6B8C76` |
| Muted flame — "haven't journaled today" state | `#7E8B84` |
| Editable-title selection (blue, iOS/Figma-style) | `#4C9FFE` (white square handles) |
| Card / input surface | `rgba(255,255,255,0.03)` |

### Typography
- **Young Serif** — warm, quirky serif. Used for: header prompt, editable title,
  archive title, card titles, entry/blog title. **Weight 400 only.**
  Young Serif ships a single 400 weight; we deliberately use 400 (not a
  faux-bold 600) so it renders as designed. Don't apply `font-weight: 600` to it.
- **Space Grotesk** — body/UI font. Used for: composer, placeholders, labels,
  small text, entry body, search/inputs, buttons.
- Loaded from Google Fonts in `index.html`. **Note:** if a build/preview
  environment blocks `fonts.googleapis.com`, you'll see fallback serif/sans — in
  a normal browser they load fine. (During dev screenshots we temporarily
  bundled the fonts from `@fontsource/*`; that is **not** a project dependency.)

### Layout principles
- Everything is **center-aligned** (header, composer, counts).
- The prompt / ghost / composer block is intentionally pushed **down** from the
  top (`prompt-wrap { margin: 210px auto 44px }`) to sit more centered.
- Max content width ~620px for the journaling column; ~1040px for the archive.

---

## 5. Home page — journaling screen (`src/pages/Home.jsx`)

### Top bar
- **Left:** streak — flame icon + "N day streak".
- **Right:** archive icon button → navigates to `/archive`.

### Prompt reel (the rotating question)
- `PROMPTS` is an array of `{ text, glow }`. `glow` is the single word rendered
  in the green highlight for that prompt. **Swap these freely** — they're dummy
  prompts; the intent is the owner adds their own later.
  Current set: notice / proud / future(self) / therapy / heavy / laugh / keeping.
- **Scroll wheel** or **↑ / ↓ arrow keys** move between prompts, one per gesture.
- Prompts are kept short so they stay on one line during the slide animation
  (the animating layer is `white-space: nowrap`). Longer real prompts will still
  work but may wrap.

### Ghost text (next-prompt preview)
Sits **above** the header and previews the *next* prompt in the rotation,
hinting that scrolling reveals a new one.
- A fixed, short strip (`height: 34px`, `width: 760px`) with `overflow: hidden`.
- Single uniform `filter: blur(4px)`, `opacity: 0.55`.
- A mask fades it: `mask-image: linear-gradient(to top, black 0%, black 26%,
  transparent 100%)` — bottom visible, fading to transparent at the top.
- The ghost text is lifted `bottom: 6px` off the clip edge so descenders (p, y)
  and their blur halo aren't sliced flat.
- `margin-bottom: 18px` gives clear separation from the header.
- **Design note:** CSS has no native *progressive* (variable-radius) blur like
  Figma's layer blur. At this sliver size a single blur + transparency mask is
  visually equivalent. If a true progressive blur is ever wanted, stack a few
  blurred copies with increasing radius + banded masks.

### Editable title
- **Click the header** to type your own title instead of using a prompt.
- Rendered as a `contentEditable` span styled like the Figma selection state:
  blue outline (`#4C9FFE`), **white square handles on all four corners**, blue
  text. On entering edit it focuses and selects-all.
- **Enter** commits, **Escape** cancels.
- A custom title **overrides** the rotation for the next saved entry, shows **no
  green glow word**, and resets after you save or scroll to another prompt.

### Composer (the chat-style input)
- Dashed border, slim, no bubble, no avatar — reads as "not a chatbot".
- **Auto-growing textarea:** grows with content up to `max-height: 40vh`, then
  scrolls internally (like a chat composer).
- **Enter saves** the entry; **Shift+Enter** inserts a newline.
- **Paste an image** into it → it attaches as a removable thumbnail preview and
  becomes the entry's **cover photo** on save.
- Send control is a pink **stitched-star** SVG; hover spins it (90° + scale).

### Entry count
- "N entries this week" with a small pink **sparkle icon**, centered. Real
  rolling weekly count via `weekCount()`.

### Decorations
- Two **metallic-silver star** PNGs (`star1.png`, `star2.png`, extracted from the
  original reference file's base64), placed at slightly different rotations with
  drop-shadows.
- Top-right **corner asterisk** — a 6-point SVG (see §9), pink, with a glow.

---

## 6. The scroll / reel behavior & its lock rules

This is the most nuanced interaction, so it's spelled out fully.

**Normal state:** scrolling or ↑/↓ advances the prompt with a smooth two-layer
cross-slide (see §8). The ghost above always previews the next prompt.

**The reel LOCKS (scrolling no longer changes the prompt) when any is true:**
1. **You're editing the title.**
2. **A custom title is set** — because you've committed to your own question,
   scroll now scrolls the textarea content instead of switching prompts.
3. **You've written 10+ lines** (`LINE_LOCK = 10`). Past this the reel locks
   **and the ghost text disappears**, so only your chosen question shows while
   you write a long entry. The title is still editable.

When locked, the wheel is **not** intercepted, so it scrolls the (now
overflowing) textarea natively. Line count is measured from the textarea's real
rendered height (`scrollHeight / lineHeight`), so wrapped lines count too.

---

## 7. Streak logic (`streak()` + `loggedToday()`)

The streak does **not** reset to 0 just because today isn't logged yet:
- **Logged today** → streak counts today + consecutive prior days; **flame is
  pink** (`#FFABE7`) = active.
- **Not logged today but logged yesterday** → streak still counts (from
  yesterday back); **flame is muted grey** (`#7E8B84`) = "you haven't journaled
  today yet."
- **Neither today nor yesterday logged** → streak is 0, flame grey.

The flame color is driven by `loggedToday(entries)` and passed to `<FireIcon
color=… />`.

---

## 8. Animations & motion (exact specs)

| Element | Trigger | Motion | Timing |
|---|---|---|---|
| **Metallic stars** | hover | rotate +30° from base + `scale(1.08)` | `0.8s cubic-bezier(.25,.8,.3,1)` |
| **Corner asterisk** | hover | `rotate(120deg)` **in place** (centered SVG + `transform-origin:50% 50%`, no scale → no positional drift) | `0.7s cubic-bezier(.25,.8,.3,1)` |
| **Send star** | hover (on `.send-wrap`) | `rotate(90deg) scale(1.2)` | `0.3s ease` |
| **Prompt reel** | scroll / arrows | two layers cross-slide: incoming enters from top/bottom with fade + `blur(4px)→0`, outgoing leaves the opposite way (`translateY 52px`) | `0.5s cubic-bezier(.22,.61,.36,1)`, ~520ms lock between gestures |
| **Archive card** | hover | `translateY(-4px)` + border → pink | `0.2s ease` |
| **Card delete btn** | card hover | fades/scales in | `0.18s ease` |

**Why the corner asterisk was reworked:** it used to be a `*` text glyph that
rotated around the element's box center — because the glyph sits high in its line
box it appeared to *orbit/shift*. It's now a symmetric SVG so hover rotation
spins cleanly in place.

**Why the reel uses two layers:** a single keyed remount only animates the
incoming text (the old one vanishes), which reads as a snap. Rendering the
outgoing prompt as a second layer with an exit animation makes it glide.

---

## 9. Icon inventory (`src/components/icons.jsx`)

| Component | Shape / use |
|---|---|
| `FireIcon({color})` | Streak flame; color swaps pink/grey (§7) |
| `ArchiveIcon` | Calendar/folder outline → opens archive |
| `BackIcon` | Chevron for back buttons |
| `SendStar` | 8-point stitched star; the composer send control |
| `DotStar({size,color})` | Stippled dot-matrix star; card placeholders, empty states |
| `SparkleMini({size,color})` | 4-point sparkle, centered; the weekly-count icon |
| `CornerSparkle` | 6-point asterisk SVG, centered; top-right decoration (spins in place) |
| `SearchIcon` | Magnifier for the archive search field |
| `TrashIcon` | Delete affordance on cards + entry page |

---

## 10. Archive page (`src/pages/Archive.jsx`)

- **Title:** "the **archive**" (archive glows green).
- **Toolbar:** search field on the **left** (matches entry text *and* prompt,
  case-insensitive) + a **filter tab group** on the right: **all / this week /
  this month / this year** (active tab is pink). Filtering combines range +
  search.
- **Cards grid** (`auto-fill, minmax(260px, 1fr)`). Each card mirrors the
  Substack-style reference, adapted to the cutting-mat theme:
  - **Media:** the cover photo, or a hatched placeholder with a dot-star if no
    image.
  - **Title:** the entry text, truncated (~90 chars, whitespace collapsed).
  - **Subtitle:** the prompt (green).
  - **Footer:** the formatted date (uppercase).
  - **Delete:** trash button appears on hover; confirms before deleting.
  - Clicking the card → `/entry/:id`.
- **Empty states:** distinct copy for "no entries yet" vs "nothing matches your
  search/filter."

---

## 11. Entry / blog page (`src/pages/Entry.jsx`)

**View mode**
- Cover photo as a hero image (if any).
- Prompt as the Young Serif title, date beneath.
- Body rendered with **`white-space: pre-wrap`**, so the writer's **indents,
  paragraph breaks, and blank lines are preserved exactly** as typed.
- Top-right: **delete** (trash, confirms) + **edit** buttons.

**Edit mode** (everything is editable)
- **Photos:** add via file picker *or* paste; remove any; **click a photo to set
  it as the cover** (pink border + "cover" badge).
- **Title:** an input (Young Serif).
- **Body:** a textarea (preserves formatting, `tab-size: 4`).
- **Save** writes back via `updateEntry`; **Cancel** discards.

---

## 12. Design decisions & deviations from the original brief

These are intentional; keep them unless there's a reason to revisit.

1. **Save-on-Enter, not continuous autosave.** The brief mentioned "autosave as
   you type." We instead save a discrete entry on **Enter / send-star click**,
   which fits the chat metaphor (each Enter = one "message") and gives a clear
   commit point. There is no partial-draft autosave.
2. **Per-prompt draft memory is NOT implemented.** The brief wanted each prompt
   to remember its own in-progress draft as you scroll between them. Currently
   there's a single shared composer; scrolling doesn't stash a per-prompt draft.
   (Listed as a TODO in the checklist.)
3. **Young Serif at weight 400**, not synthesized bold.
4. **Ghost blur is a single uniform blur + mask**, not a true progressive blur
   (CSS limitation; visually equivalent at this size).
5. **Custom titles don't glow a word** (freeform text has no obvious highlight
   word). Could add a picker later.
6. **Dummy prompts were shortened** to stay single-line during the slide.
7. **Streak holds from yesterday with a grey flame** rather than resetting to 0
   before today's entry (explicit product decision).

---

## 13. Local dev workflow

```bash
npm install      # first time, or after a dependency changes
npm run dev      # start Vite; open http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

- Editing components/CSS/JS hot-reloads instantly. Journal entries live in
  localStorage and survive reloads.
- Adding a dependency or editing `vite.config.js` requires a dev-server restart.
- Fonts: see §4 — Google Fonts may be blocked in sandboxes but load in real
  browsers.

---

## 14. What's done ✅ vs. open ⏳ (summary — see CHECKLIST.md for detail)

**Done**
- All three pages + routing.
- Cutting-mat visual system, exact colors, both fonts, decorations.
- Prompt reel with smooth transition + lock rules + ghost preview.
- Editable title (blue selection UI).
- Composer: auto-grow textarea, Enter/Shift+Enter, image paste → cover.
- Streak (holds-from-yesterday + grey/pink flame), rolling weekly count.
- Archive: cards, search, this week/month/year filters, delete.
- Entry/blog page: hero, preserved formatting, full edit (title/text/photos/
  cover), delete.
- Hover motion on stars, corner asterisk (in-place), send star.

**Open / not yet built**
- Per-prompt in-progress draft memory.
- Green-glow-word picker for custom titles.
- Mobile / responsive layout (everything is desktop-width so far).
- Deployment + SPA fallback config; live URL.
- Lightweight usage analytics (Phase 4 in the checklist).
- Any backend / account-based sync (currently local-only by design).

---

## 15. Explicitly out of scope for v1 (don't scope-creep)

- Team Radio Notes / F1 Pomodoro integration (separate project).
- Push notifications / reminders.
- Multi-device sync beyond what the storage choice naturally gives.
- Rich-text formatting in entries (plain text with preserved whitespace only).
