---
name: study-deck
description: Build a rigorous, animation-rich educational explainer the way this user likes them — especially STEM/biology concept lessons. Use when the user asks for a "study deck", "explainer", "concept deck", a scroll-driven teaching site, or to "explain/teach <topic> as slides", or to turn their hand-drawn notes / vault concept notes into an animated lesson. Pulls source material from Downloads PDFs and the Obsidian vault, applies the user's specific visual conventions, and builds either a zoom-step deck OR a scroll-driven (scrollytelling) page — both single zero-dependency HTML files.
---

# Study Deck

Build **educational concept lessons** for a detail-oriented Thai STEM/olympiad student: scientifically precise, visually clear, animated step-by-step, single self-contained HTML file. This is an opinionated wrapper over the `frontend-slides` engine.

## Two build modes — pick one up front

The user has asked for both formats. **Confirm which they want before building** (it changes the whole engine):

1. **Zoom-step deck** — discrete full-screen slides, one idea per slide, cinematic scale-based zoom transitions, keyboard/wheel/swipe navigation. Best for a linear "lecture" they click through. Deliberately deviates from `frontend-slides`' fixed 16:9 arrow deck. Engine = **"Zoom + step pattern"** below.
2. **Scroll-driven page (scrollytelling)** — one long page the user *scrolls*; content reveals on entry (IntersectionObserver) and key diagrams are **scroll-scrubbed** (a graph draws itself / an animation advances as you scroll through a sticky section). Best for self-study revision they read at their own pace. This is what the nervous-system exam-prep site used and is the user's stated preference for "a presentation-like thing where I scroll down and it shows me information." Engine = **"Scrollytelling pattern"** below.

If the user says "slides / deck / click through" → mode 1. If they say "scroll down / presentation website / study site / revision page" → mode 2. When in doubt, ask in one line.

## When to use

- "Make a study deck / explainer / concept deck for <topic>"
- "Explain / teach <topic> as slides"
- "Turn my biology notes (or this PDF) into an animated lesson"
- Any rigorous teaching deck where accuracy + stepped animation matter more than pitch-deck polish.

For a generic talk/pitch deck, use `frontend-slides` instead. For ingesting a PDF into the vault (not making a deck), use `vault-pdf-ingest`.

## Workflow

1. **Gather sources first — do not invent content.**
   - **Hand-drawn references (highest priority):** check `<DOWNLOADS>\` for the user's own diagrams (e.g. `Biology-1*.pdf`). When they exist they **define the visual conventions to match** — strand colors, per-enzyme colors, tRNA cloverleaf, ribosome shape, etc. Read them (Read tool handles PDFs). These files may be cleaned up over time — confirm they exist; don't assume.
   - **Durable backbone:** the Obsidian vault concept notes, e.g. `<VAULT_ROOT>\wiki\concepts\molecular-genetics.md` and `topics\molecular-cell-biology.md`, for quantitative facts. Search the vault for the topic before writing prose.
   - If no source exists, say so and ask, or build to olympiad-level rigor and flag what to verify.
   - **Before shipping, hard-gate the prose the way `scientific-model` gates diagrams.** List every numeric claim, threshold, constant and named mechanism in the deck; mark each *sourced* (naming the file it came from) or *unsourced*; then surface the unsourced list to the user explicitly, not just as an inline flag. A wrong diagram gets caught when someone looks at it. A wrong constant in revision prose gets **memorised** — which is the exact opposite of what the deck is for.

2. **Plan the lesson as a sequence.** List the components to introduce, then the process steps. Write a short outline and confirm scope/length with the user before building a long deck.

3. **Apply the user's visual conventions** (see below) — these are confirmed preferences, not suggestions.

4. **Build incrementally in chunks.** The user's connection drops on very long single responses — build/emit in sections, not one giant blob.

5. **Verify before declaring done:** no overlapping text; every component is labeled before use; complex animations are stepped (one element per step, never a clump); zoom transitions actually scale (not a fade). If possible, open it (playwright/chrome-devtools) and check a couple of slides.

## Visual conventions (confirmed — apply by default)

- **Match the user's OWN drawings when they exist** — copy their colors/conventions, not generic textbook ones.
- **DNA strands must be different colors** (template = blue, partner/sense = red). Same-colored strands were explicitly rejected.
- **Every enzyme gets its own color + a visible legend.** Example palette that worked: helicase orange, topoisomerase yellow, SSB blue, primase purple, Pol III maroon, Pol I cyan, ligase green, RNA polymerase pink, spliceosome violet.
- **Introduce/label each component before it is used** — e.g. a slide showing "this is the ribosome (80S), this is tRNA" before translation runs.
- **Animate processes step-by-step, never all-at-once** — amino acids appear one per elongation cycle, not in a clump.
- **Discrete full-screen slides with cinematic ZOOM transitions** for complex topics, over one continuous scroll. The zoom must be real (scale-based): zooming OUT reveals the larger structure (protein → cell); going deeper zooms IN. A plain fade was rejected.
- **Aesthetic that worked:** dark "bioluminescent" theme; fonts **Fraunces + Hanken Grotesk + JetBrains Mono**; color-coded molecules (DNA teal / RNA amber / Protein rose). Avoid generic AI fonts (Inter, Space Grotesk, Roboto).
- **High scientific precision AND visual clarity:** arrows + technical terms (codon, base, H-bond, 5'/3') with labels.
- Molecular art as **clean schematic inline SVG** (color-coded, labeled) — scales well, stays single-file, no external images.

## Engine: zoom + step pattern

Single self-contained HTML file, inline CSS/JS, fonts from Google Fonts. (Full reference in the `frontend-slides` skill; the educational specifics:)

- **Generic step engine** — each slide declares `data-steps="N"`. The engine tracks `(slide, step)`; advancing increments `step` to the last, then moves to the next slide (reverse mirrors). For the active slide it:
  - sets `slide.dataset.step = step` (CSS positions things per step),
  - toggles `.capstep` (caption) and `.pips` (progress dots) by `index === step`,
  - reveals any `[data-from="k"]` element when `step >= k` (add `.show`; `.fade{opacity:0;transition}` + `.show{opacity:1}`).
- **Declarative animation, minimal JS** — drive transforms per step with CSS attribute selectors, e.g. `#slide[data-step="2"] #thing{transform:translateX(96px)}`. Reveals via `[data-from]`. Almost no per-slide JS.
- **Cinematic zoom transitions (scale-based):** `.ahead{scale(.82);opacity:0}` (waiting), `.active{scale(1);opacity:1}`, `.past{scale(1.22);opacity:0}` (zoom through). Add `.zoom-out` to a scene so the engine puts the PREVIOUS slide into `.recede{scale(.7)}` — reads as the camera pulling back. Use `transition: …, visibility 0s linear <dur>` on inactive slides so outgoing ones finish fading before they hide.
- **Input:** debounced wheel + arrow/space/PageUp-Down keys + touch swipe; Home/End jump.

## Thai typography on screen

Thai has no spaces between words, so a wrong font stack or a missing language attribute yields either tofu boxes or line breaks in the middle of a word — and it looks *almost* right in a desktop screenshot, which is how it ships broken.

- Set `<html lang="th">`, or `lang="th"` on the Thai container in a bilingual deck. Browsers use it to select line-breaking rules.
- Font stack puts a Thai-capable family first, Latin fallback after: `font-family: 'Noto Sans Thai', 'Sarabun', system-ui, sans-serif;`. Load only the weights you actually use.
- Give Thai body copy a taller `line-height` than Latin — **1.7–1.9**. Thai stacks vowel and tone marks above and below the baseline, and they collide at 1.4.
- Wrapping: `overflow-wrap: break-word` with `word-break: normal`. **Never `word-break: break-all` on Thai** — it breaks mid-syllable.
- QA at **360px and 1440px**. Desktop-width screenshots hide every wrapping bug worth catching.

## Engine: scrollytelling pattern (mode 2 — verified on the nervous-system site)

One long scrolling page, zero dependencies. Three mechanisms, all proven in `demos/study-deck/scrollytelling-nervous-system-th.html` (shipped with this package):

- **Reveal on entry** — give content blocks `class="reveal"` (CSS: `opacity:0;transform:translateY(24px);transition`; `.vis` sets them visible). One IntersectionObserver adds `.vis`:
  ```js
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  ```
- **Progress bar + nav dots** — one `scroll` listener sets a top progress bar width to `scrollTop/(scrollHeight-clientHeight)` and lights the dot whose `section` straddles mid-viewport (`r.top<=mid&&r.bottom>=mid`). Dots are generated from `[...document.querySelectorAll('section')]`, each `scrollIntoView({behavior:'smooth'})` on click.
- **Scroll-scrubbed sticky diagram (the signature move)** — wrap a tall spacer (`#apwrap`, e.g. `height:400vh`) around a `position:sticky;top:0;height:100vh` stage. A `scroll`/`resize` `tick()` computes progress **from the wrapper's own rect**, then drives the SVG:
  ```js
  const len=curve.getTotalLength();
  curve.style.strokeDasharray=len; curve.style.strokeDashoffset=len;   // start hidden
  function tick(){
    const r=wrap.getBoundingClientRect();
    const total=wrap.offsetHeight-innerHeight;      // wrapper progress, NOT documentElement
    let p=Math.max(0,Math.min(1,(-r.top)/total));
    curve.style.strokeDashoffset=len*(1-p);         // draw the line as you scroll
    const pt=curve.getPointAtLength(len*p);          // move a marker dot along it
    dot.setAttribute('cx',pt.x); dot.setAttribute('cy',pt.y);
    const i=Math.min(phases.length-1,Math.floor(p*phases.length+1e-6)); // discrete phase from p
    /* swap caption text, channel-state LEDs, highlight active marker for phase i */
  }
  addEventListener('scroll',tick,{passive:true}); addEventListener('resize',tick); tick();
  ```
  This same rig teaches any staged process (AP curve phases, reaction-coordinate diagram, a titration curve, an orbit) — a `phases[]` array carries per-step name/color/state, and `p` both scrubs the drawing and selects the current step.

- Keep the interactive mock-exam / clickable-diagram pattern too: an answer-key array in JS + instant feedback (correct/incorrect classes), a clickable labeled SVG whose parts light up. Verify answer keys against the source PDF before shipping.

## Pacing & scroll-QA — apply UP FRONT (hard-won on neuron-to-brain)

"The whole thing is too fast" was raised **three separate times** on the neuron-to-brain build because pacing was patched locally (nudge one keyframe) instead of fixed systemically. Do it right the first time:

- **Decouple animation timeline from section count.** Map physical scroll → a virtual morph value where each content section is an **equal virtual slot** regardless of its pixel height (the `physToVirtG` remap). Then giving a beat more runway = making its section taller; it does **not** shift any downstream keyframe.
- **Give every content beat a scroll runway.** Wrap each teaching section in a `.tall` variant (`min-height:var(--tall,200vh)` + a `position:sticky` inner panel). Slowing a beat or pinning its copy then costs zero keyframe math. New sections inherit the runway and can't re-introduce the rush.
- **Append, don't insert.** Divide the morph value by a FIXED denominator (the original section span), not `(nSec-1)`. Appended chapters push the value past 1.0 and shift no earlier keyframe; inserting mid-sequence still re-indexes everything, so add new topics at the end.
- **Confirm target length/pace with the user before building** a long scroll deck — one line ("~how many screens of scroll, and how slow should each beat read?"). Cheaper than three rounds of "too fast."
- The `00/100` HUD readout is a cosmetic scroll-% number — raising its max does **nothing** for pacing. Pacing = scroll distance per beat.

**Automated scroll-QA traps (all cost real time before being written down):**
- Playwright/MCP resets `window.scrollTo` at each tool-call boundary. Drive scroll with **native key presses (Home/PageDown)**, which persist, or set `scrollBehavior='auto'`, scrollTo, dispatch a scroll event, and screenshot as the *very next* call.
- Background-tab timer clamping stretches all animation/`setTimeout` timing — **poll a condition** (active-section id / transition idle), never a fixed wait.
- To prove motion actually happens, **diff two frames captured at the same scroll position** (e.g. "34.6% of membrane pixels changed") rather than trusting a single screenshot.
- `transitionend` is unreliable twice over: it bubbles from children (filter by `e.target`+`e.propertyName`) and fires seconds late in throttled tabs — always race it against `setTimeout(duration+80ms)`.

## Pitfalls (learned)

- **Scrollytelling QA:** `html{scroll-behavior:smooth}` fights programmatic `scrollTo` during automated (playwright) testing and makes scrubbed sections look stuck at step 0 — that's a **test artifact, not a bug**. Disable smooth-scroll in the test harness (or scroll in small real steps) to verify phase advance; real wheel-scrolling is unaffected.
- **Scrub progress must come from the sticky wrapper's rect** (`(-wrap.getBoundingClientRect().top)/(wrap.offsetHeight-innerHeight)`), NOT from `documentElement.scrollTop` — otherwise every sticky section shares one global progress and they desync.

- Do **not** reuse the `.capstep` class for both captions AND SVG reveal-groups in one slide — the engine indexes all `.capstep` together and the counts desync. Use `[data-from]` for SVG step reveals; keep `.capstep` for captions only.
- The base `frontend-slides` skill defaults to a FIXED 16:9 arrow deck — for these zoom/step explainers you are deviating deliberately; say so.
- Build in chunks (connection drops on very long responses).

## Source map

| What | Where |
|---|---|
| Hand-drawn diagrams (convention source) | `<DOWNLOADS>\Biology-1*.pdf` (re-confirm they exist) |
| Quantitative concept facts | `<VAULT_ROOT>\wiki\concepts\molecular-genetics.md`, `topics\molecular-cell-biology.md` |
| Base engine + style presets | `frontend-slides` skill (`SKILL.md`, `html-template.md`, `animation-patterns.md`) |
| Zoom-step reference build | `demos/study-deck/central-dogma-replication.html` (DNA, glass+zoom) |
| Scrollytelling reference build | `demos/study-deck/scrollytelling-nervous-system-th.html` (scroll-scrubbed AP curve, reveals, mock exam) |
| Audience context | vault `CLAUDE.md` (Thai STEM/olympiad student) |
