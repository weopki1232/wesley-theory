---
name: dark-motion-site
description: Build premium, award-winning-style dark motion websites and presentation pages — the "dark.design gallery" aesthetic (landonorris.com, trionn.com, 108.supply): near-black art direction, smooth inertia scroll, and pointer-driven effects (custom cursor, magnetic buttons, parallax, 3D tilt, cursor spotlight). Use when the user asks for a site/landing/hero "like dark.design", a site with cool mouse-move effects, a cinematic scroll site, or references an awarded dark studio/portfolio site. Also holds the method to reverse-engineer any specific reference site the user links.
---

# Dark Motion Site

The house recipe for the **premium dark motion web** aesthetic the user collects from `dark.design` / `supahero.io` and admires (especially the "when you move the mouse, everything responds" feel). This is the design + technique library so the user does **not** need to re-send inspiration links for the general style — only for matching one specific site exactly.

## What the genre actually is (verified by inspecting live sites, 2026-07)

`dark.design`, `supahero.io`, `calltoinspiration.com` are **galleries**; `durves.com` is a pattern-asset **tool**. The style lives in the sites they feature. Fingerprinting five standouts revealed the recipe:

| Site | Build route | Motion stack | Signature |
|---|---|---|---|
| 108.supply | Webflow + jQuery | **GSAP + ScrollTrigger + Lenis** + 48 video | the canonical recipe |
| landonorris.com | Webflow + jQuery | Lenis + **Rive** state-machines + WebGL + **Taxi.js** transitions | the "alive on mouse-move" one — see below |
| trionn.com | bundled/React | Lenis + WebGL `<canvas>` | hand-coded shader hero |
| danilosierra.com | **Framer** (no-code) | 16 hover-play `<video>` | video-reel portfolio |
| dark.design | Webflow + Supabase | — | Aeonik, the gallery itself |

**Invariant threads:**
- **Near-black, never pure black** background (`#050505`–`#0a0a0c`). One saturated accent (Lando = volt-lime, McLaren-ish).
- **Lenis smooth/inertia scroll** is near-universal.
- **GSAP + ScrollTrigger** (or a hand-coded equivalent) for pinned + scroll-scrubbed sections.
- Heavy **video/canvas** for the "alive" feeling.
- **Distinctive type, almost always with a mono for technical labels** (Geist Mono / Martian Mono / Aeonik Fono) + a condensed/editorial display (GT Alpina Condensed, Familjen Grotesk, Brier). Never Inter/Arial as the star.
- Two build routes: **Webflow + GSAP + Lenis** (most) or **Framer + video** (no-code).

## Our translation — zero-dependency by default

The user's house style is single-file, zero-dep. We can reproduce ~90% of this look with **one `pointermove` + one `requestAnimationFrame` lerp loop** and CSS. Reserve libraries for the last 10% (buttery inertia, heavy WebGL). **Ask which the user wants per project:** pure zero-dep, or may-use-tiny-libs (Lenis ~3kb, GSAP). Never `npx`/install without the user's OK (supply-chain caution).

### Reference implementations (all QA-verified, zero-dep)
Four working single-file references, all shipped in this package's `demos/` folder — copy their patterns directly:
1. **`demos/mouse-effects-demo.html`** — the **pointer suite**: custom cursor, magnetic buttons, pointer parallax, 3D tilt+glare, cursor spotlight.
2. **`demos/dark-motion-techniques.html`** — the **scroll/reveal suite**, each verified by Playwright: split-text reveal, scroll-scrubbed SVG draw (sticky), scroll parallax, marquee (pause-on-hover), counter roll-ups, sticky stacking cards, theme-aware nav (`mix-blend-mode:difference` + `data-theme` observer), IntersectionObserver reveals, grain.
3. **`demos/dark-motion-slides.html`** — the **deck translation** (lesson 3): the whole vocabulary inside a keyboard/wheel/swipe-driven presentation engine. See "Dark-motion slide decks" below.
4. **`demos/neuron-to-brain/index.html`** — **three.js particle-morph scrollytelling** (lesson 4): a point cloud that forms "nothing → neuron → network → brain" on scroll, applied to a real biology lesson. See "three.js particle-morph scrollytelling" below. (Needs the vendored `three.min.js` beside it.)

Together these cover the whole **verified tier**. Untested/approximate tier (WebGL shader hero, fluid distortion, true Lenis inertia, real Rive/Framer) is documented below but NOT yet proven — build+QA it when a project needs it, don't claim it works sight-unseen.

### three.js particle-morph scrollytelling (verified in reference 4)
**`demos/neuron-to-brain/index.html`** (built 2026-07-03) — a scroll-driven biology explainer that morphs one point cloud "from nothing → neuron → network → brain." This is the go-to technique when the user wants a subject to *form/evolve/assemble* on scroll, or any "realistic 3D that transforms." The realism honesty (see [[realistic-art-needs-reference]]): a point-cloud morph reads as *stylized-but-3D and stunning*, which teaches better than photoreal and sidesteps needing a scanned model.
- **The core trick:** you CANNOT literally morph mesh A into mesh B (topologically different → goo). Instead, build several **equal-count** target clouds (each a `Float32Array(N*3)`), keep ONE live `BufferGeometry`, and lerp point *i* from `cloudA[i]→cloudB[i]` by scroll progress. Same for a `color` attribute. Keyframe schedule `[{at, cloud, col}]`; find the bracketing pair for global scroll `g∈[0,1]`, ease the local t, write positions+colors each frame. Create "holds" by repeating a cloud at two `at` values.
- **Procedural clouds beat downloaded .glb** for portability/offline/precision: sample points on parametric shapes. Neuron = soma sphere + recursive-jitter dendrite branches + a long axon with periodic myelin bands (`Math.sin(t*22)>k` thickens the sheath) + terminal spray, partitioned by index fraction. Brain = two ellipsoid hemispheres with a longitudinal-fissure z-gap + sinusoidal fold displacement (`1+a*sin(t*9)*sin(p*7)`) for fake gyri, plus a cerebellum blob (tighter folds) + brainstem stalk. Both read convincingly as point clouds on near-black.
- **Overlays ride on the color attribute during "hold" windows:** an action-potential pulse = a moving bright-red band along the axon's index range; a synapse shimmer = terminal points cycling toward blue. Cheap, no extra geometry.
- **Rendering:** `THREE.Points` + `PointsMaterial{size, map:<soft radial canvas sprite>, vertexColors, transparent, depthWrite:false, blending:AdditiveBlending}`. The canvas-generated round sprite is what makes points read as glowing dots not squares. Additive blending gives the bioluminescent glow.
- **Camera** dollies per keyframe (z + fov + target-y) to frame each station; gentle auto-spin + pointer-parallax + drag-to-rotate on the Points group.
- **Vendor three.js locally** (`curl` a pinned `three@0.128/build/three.min.js`, ~590KB, global `THREE`, MIT) so the file works offline with no runtime CDN — the supply-chain-safe way to honor a "libraries OK" grant.
- **Legibility over particles:** copy needs a per-panel scrim — a `.panel::before` radial-gradient of the bg color, anchored to the panel's side (left/right/center variants). Without it, drifting particles shred text.
- **Pitfall that bit me:** a brace-less outer arrow in `new IntersectionObserver(es=>es.forEach(e=>{…}),{opts})` swallows the options object as a `forEach` arg and leaves the observer paren unclosed ("missing ) after argument list"). Always give the callback a block body. QA a big inline `<script>` with `node --check` on the extracted script BEFORE Playwright — a parse error means nothing runs at all.
- **v2 (2026-07-03) — part-by-part ASSEMBLY, not just A→B morph:** to *farm/build a thing region by region* (e.g. a brain assembling from hindbrain→midbrain→forebrain→cortex), tag every point with a **region id** (`Uint8Array`) at cloud-build time, and give each region metadata `{col, rs, re}` (its own scroll arrival window). A dedicated `writeBrainAssembly(g)` replaces the generic lerp above `BRAIN_START`: for each point, `a = ease(clamp((g-rs)/(re-rs)))`, lerp its position from the *previous* cloud (network) → its brain position by `a`, and its color from a dim base → the region's own color by `a`. A final `UNIFY` window blends every region color → one unified color so the finale is coherent. Result: each part flies in and lights its own color while you read its panel, then they resolve into one object. Stagger sibling windows (the 4 cortical lobes) for a wrap-on cascade. Assign region by rejection-sampling a surface direction into an angular zone (frontal `nx>.32`, occipital `nx<-.42`, temporal `nz²>.34 & ny<.15`, parietal = the rest on top). Order arrivals oldest→newest = an evolution/development narrative for free.
- **v2 — inline SVG diagrams synced to the 3D, for precision the particle field can't show:** a point cloud can't legibly render a Na⁺/K⁺ pump, a labeled voltage curve, or distinct glia. So layer **zero-dep animated inline SVG cards** (`.card` with a glassy bg + backdrop-blur, revealed by the same IntersectionObserver via a `.in` class) opposite the copy in a two-column `.split2` station. Techniques: (a) **AP voltage-vs-time graph** = a hand-authored `<path>` (rest→threshold→spike→repol→undershoot), draw it with `stroke-dashoffset`, run a tracer `<circle>` along it with `getPointAtLength(s*totalLength)` in a rAF loop, light phase labels by the tracer fraction; (b) **membrane cross-section** = two JS-generated rows of lipid circles+tails (skip x-slots where proteins sit), protein rects for pump + voltage-gated channels, ions as `<circle>`+`<text>` animated by CSS `@keyframes translateY` (pure-translate is transform-origin-independent, so no `transform-box` needed) with per-ion `animation-delay`; (c) **glia spawn** = each glial cell a small iconic `<g class="glia">` that scales+fades in on `.card.in` with staggered delays, a dashed connector line to the axon, and a myelin "wrap" arc drawn via `stroke-dashoffset`. Set the camera to **push way in** (small z, low fov) on the matching station so the enlarged bloomy points read as "zoomed inside" behind the diagram.

### Dark-motion slide decks (verified in reference 3)
Fuse the `frontend-slides` step engine (`data-steps` on slides, `[data-from="k"]` reveals, `(s, step)` state) with the effect vocabulary. Deck-specific patterns that are NOT in the site demos:
- **Curtain-wipe slide transition** — the zero-dep translation of Taxi.js page transitions: a fixed full-screen panel at `translateY(102%)`; phase 1 add `.move.cover` (→ `translateY(0)`, ease `cubic-bezier(.65,0,.35,1)`), **swap the active slide while covered**, phase 2 `.exit` (→ `translateY(-102%)`), then remove classes with no transition so it snaps silently back below. A mono slide-number tag on the curtain sells it.
- **`transitionend` is a trap, twice**: (a) it **bubbles** — a child's opacity transition (the curtain's tag) fires the parent's listener early and desyncs the wipe; filter `e.target===el && e.propertyName==='transform'`. (b) an occluded/backgrounded tab throttles rendering, so `transitionend` can arrive seconds late. Sequence phases with a **race**: `transitionend` (filtered) OR `setTimeout(duration+80ms)`, whichever first.
- **Re-triggerable reveals**: IntersectionObserver one-shots don't fit decks. On slide entry: remove `.in` from `.split`, `void el.offsetWidth` (forced reflow), re-add on the next rAF. Counters: store a roll token per element (`el._tok++` cancels an in-flight rAF roll), reset text to 0 on entry, roll when their `data-from` step first shows.
- **Backward navigation lands on the LAST step** (PowerPoint convention) with counters set instantly to final values — nobody wants to re-click through a slide they're backing into. Forward entry starts at step 0.
- **Deck chrome**: mono HUD (`01 / 06` counter, key hints), clickable side pips (`aria-label`, active pip glows), and a step progress bar animated with `transform:scaleX()` (never `width` — layout thrash).
- Slides are `position:fixed;inset:0` with `visibility:hidden` when inactive; input = debounced wheel (~650ms lock + min delta), arrows/space/PageUp-Down/Home/End, touch swipe. Drop inputs while the wipe is `busy`.
- QA note: drive it with Playwright via a local HTTP server (file:// is blocked); use condition-polling (`active slide id`, curtain class back to idle) instead of fixed waits — background-tab timer clamping makes fixed waits flaky.

Pointer-suite core architecture:

```js
// ONE pointer state, ONE rAF loop drives everything. mouse = raw, sm/rp = smoothed (lerp).
const mouse={x:innerWidth/2,y:innerHeight/2}, sm={...mouse}, rp={...mouse};
addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;},{passive:true});
const lerp=(a,b,n)=>a+(b-a)*n;
function frame(){
  sm.x=lerp(sm.x,mouse.x,.15); sm.y=lerp(sm.y,mouse.y,.15);   // smoothed screen offset for parallax
  rp.x=lerp(rp.x,mouse.x,.22); rp.y=lerp(rp.y,mouse.y,.22);   // slightly faster for the cursor ring
  /* ...apply transforms below... */ requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

### The effect vocabulary (all zero-dep)
- **Custom cursor** — a big ring (lerped, trails slightly) + a small dot (exact pointer). Grow the ring on interactive hover via **smoothed `scale()` in the loop, NOT animating width/height** (layout thrash — impeccable flags it). Hide native cursor only on `@media (hover:hover) and (pointer:fine)`; never hide it on touch.
- **Magnetic buttons** — within ~120px, translate the button toward the pointer by ~0.3× the delta, lerp back to 0 outside. Store per-button state (`el._m`).
- **Pointer parallax** — layers carry `data-par="k"`; translate each by `(sm/vw-0.5)*k*260`. Foreground negative k, background positive → depth.
- **3D tilt + glare card** — on `pointermove` over a card, `rotateY((px-.5)*14deg) rotateX((.5-py)*14deg)` with `transform-style:preserve-3d`; a radial-gradient `.glare` follows `--gx/--gy`; reset transform on `pointerleave`. Inner content gets `translateZ()` for real depth.
- **Cursor spotlight reveal** — a colored layer masked by `radial-gradient(... at var(--mx) var(--my))`; update the mask center from the section's local pointer coords. Reveals hidden text under the "dark".
- **Scroll reveals** — one IntersectionObserver adds `.vis` (opacity+translateY). (Same engine as `study-deck` scrollytelling.)
- **Grain + vignette** — fixed SVG `feTurbulence` overlay at low opacity + a radial vignette. Cheap premium texture.
- Always include `@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`.

### Art-direction defaults
- Tokens: `--bg:#08090c; --ink:#eef1f6; --muted:#878d9a; --line:rgba(255,255,255,.09);` + ONE accent.
- Type: a distinctive display (Familjen Grotesk / a condensed serif) + clean grotesk body (Hanken Grotesk) + a **mono for eyebrows/labels** (Space Mono / JetBrains Mono). Avoid the impeccable overused-font list.
- Hairline borders, generous negative space, mono micro-labels, one volt accent. **No numbered 01/02/03 scaffold, no gradient text** — both are AI-slop tells in this landing-page register (verified against the impeccable detector; see [[cinematic-glass-style]]).

## How landonorris.com actually works (the user's favourite — dissected)

The "everything reacts when I move the mouse" feel is **not** a custom cursor. Inspection showed:
- **Rive** (`rive.app`) interactive vector runtime everywhere (`data-rive-state-machine`, `data-rive-file`, `data-rive-color-input`, `data-btn-rive-hover`, `data-btn-rive-rotate`, `data-rive-nav-hamburger`). The floating LN cap, the logo, the buttons, and the hamburger are **Rive state machines fed live inputs** (pointer position, hover, scroll) — that's what makes vector objects deform/rotate/animate fluidly under the cursor.
- **One WebGL canvas** for the hero (portrait / topographic reveal) + several small 2D canvases.
- **Taxi.js** (`data-taxi`, `unseenco/taxi`) for SPA-style **page transitions** (curtain/fade between routes, no full reload).
- **Lenis** smooth scroll + **Webflow** build; ~16-viewport scroll with 25 sticky/fixed layers.

**Our translation:** we don't need Rive — a hand-coded inline **SVG fed pointer values in the rAF loop** (rotate/skew/translate a group by cursor offset, like the demo's `#orb`) reproduces the mouse-reactive-object feel zero-dep. Reserve real Rive only if the user wants complex character-style vector animation and accepts the `.riv` asset + runtime.

## Full technique catalog (real tool → our zero-dep equivalent)

Each entry: the effect, how these sites do it, and how we do it single-file. Prefer the zero-dep column unless the user OKs libs.

| Technique | How the pro sites do it | Our zero-dep equivalent |
|---|---|---|
| **Smooth/inertia scroll** | Lenis (`lenis` on `<html>`) | rAF loop lerping `scrollY` → `transform:translateY` on a fixed content wrapper; or just accept native + `scroll-behavior`. True inertia really wants Lenis (~3kb) — offer it. |
| **Scroll-scrubbed reveal / draw** | GSAP ScrollTrigger scrub | IntersectionObserver for on/off; for *scrub*, compute progress from a sticky wrapper's rect (`(-wrap.top)/(wrap.offsetHeight-innerHeight)`) and drive stroke-dashoffset / transforms. (Same engine as `study-deck`.) |
| **Pinned sections** | ScrollTrigger `pin:true` | `position:sticky;top:0;height:100vh` inside a taller spacer. |
| **Image-sequence hero** (frame-by-frame on scroll, Apple-style) | preload N frames → draw current frame to `<canvas>` by scroll progress | same, zero-dep: `imgs[Math.floor(p*(N-1))]` drawn to canvas in the scroll handler. Keep frames ≤~60, sized for web. |
| **WebGL shader/portrait hero** | Three.js / OGL / raw WebGL | raw WebGL fragment shader in ~40 lines for gradient/noise/distortion; or fake it with layered CSS conic/radial gradients + grain (cheaper, often enough). |
| **Mouse-reactive vector object** | **Rive** state machine | inline SVG group transformed by pointer offset each frame (demo `#orb`). |
| **Custom cursor** | div follows pointer (lerp) | demo: ring (lerped) + dot (exact), scale on hover via `scale()` not width/height. |
| **Magnetic buttons** | GSAP quickTo | demo: within ~120px translate ~0.3× delta, lerp back. |
| **Pointer parallax** | data-speed + rAF | demo: `data-par="k"`, translate by `(sm/vw-.5)*k*260`. |
| **3D tilt + glare** | vanilla-tilt.js | demo: `rotateX/Y` from local pointer + radial-gradient glare following `--gx/--gy`; inner `translateZ`. |
| **Split-text reveal** (words/letters rise & fade in) | GSAP SplitText / Splitting.js | wrap each word in `<span class="w"><span class="i">word</span></span>`; the outer clips (`overflow:hidden`), the inner `translateY(110%)→0` with staggered `transition-delay:calc(var(--i)*40ms)`, triggered by IntersectionObserver. |
| **Marquee / infinite ticker** | GSAP / CSS | duplicate the track, `@keyframes` translateX -50%, `will-change:transform`; pause on hover. |
| **Sticky stacking cards** | ScrollTrigger | each card `position:sticky;top:Xpx` with increasing top offsets → they stack as you scroll. |
| **Page transitions** (curtain/fade between routes) | Taxi.js / Barba.js | for single-file we don't route; for multi-page, a full-screen overlay that wipes in on click, navigate on transitionend, wipe out on load. |
| **Hover image distortion / RGB split** | WebGL (hover shaders) | CSS: `filter` + `mix-blend-mode` + a duplicated layer offset a few px in `translate` for a cheap RGB-split; true fluid distortion needs WebGL. |
| **Grain + vignette** | video grain / SVG | fixed SVG `feTurbulence` overlay low-opacity + radial vignette (demo). |
| **Theme-aware nav** (color flips over light/dark sections) | `data-nav-theme` + ScrollTrigger | IntersectionObserver on sections carrying `data-theme`; toggle a class on the nav. |

### Hero-pattern taxonomy (from supahero.io — the shapes that recur)
Centered kinetic headline · big cutout portrait/product on plain field (Lando) · fullscreen looping video with overlay type · WebGL/shader field · split-screen (type vs media) · horizontal-scroll gallery · oversized condensed-serif statement. Pick one and commit; don't stack three.

### Micro-interaction checklist (the "small details" from calltoinspiration.com)
Magnetic + state-change buttons · link underline wipes · number/counter roll-ups on reveal · cursor-following labels ("view", "drag") · hover-play video thumbs · sticky section labels · easing everywhere (`cubic-bezier(.2,.8,.2,1)`), never linear · everything gated behind `prefers-reduced-motion`.

## Reverse-engineering a specific site the user links
When the user sends a specific reference, don't guess — read it. Serve nothing; just Playwright-navigate and run this fingerprint:
```js
() => { const w=window; return {
  title:document.title,
  libs:{GSAP:!!w.gsap,ScrollTrigger:!!w.ScrollTrigger,
        Lenis:!!(w.Lenis||w.lenis||document.documentElement.classList.contains('lenis')),
        Three:!!w.THREE,Webflow:!!w.Webflow,jQuery:!!w.jQuery,
        Framer:!!document.querySelector('[data-framer-name]'),
        canvas:document.querySelectorAll('canvas').length,
        video:document.querySelectorAll('video').length},
  fonts:[...new Set([...document.querySelectorAll('h1,h2,h3,a,p')].map(e=>getComputedStyle(e).fontFamily))].slice(0,6),
  bg:getComputedStyle(document.body).backgroundColor }; }
```
Then screenshot for art direction, and (if motion is the point) dispatch `pointermove` / scroll and read back applied transforms to infer the exact effect. Translate the findings into the zero-dep vocabulary above.

## Related
- `study-deck` (scrollytelling engine — same IntersectionObserver + scroll-scrub), `frontend-slides` (base engine).
- Memories: [[cinematic-glass-style]] (glass technique + impeccable register lesson), [[cinematic-flythrough-technique]] (scroll camera), [[downloading-ig-reels]] (grab reference motion).
- `durves.com` generates exportable dot-matrix pattern assets for these backgrounds.
