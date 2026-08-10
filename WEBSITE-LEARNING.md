# Learning to Make Award-Winning Websites

This is the study path behind the `dark-motion-site` skill. Four links, each with a different job:

## The 4 resources

### 1. https://www.dark.design — the taste library
A curated gallery of the best **dark-themed** websites on the internet. This is where the whole aesthetic comes from: near-black backgrounds, one saturated accent color, cinematic motion.
**How to use it:** browse 10–15 sites, save the ones that make you go "whoa". Don't try to copy the whole site — identify the *one* effect that impressed you (a hero animation, a hover effect, a scroll transition) and study just that.

### 2. https://supahero.io — the hero-section library
A gallery of just **hero sections** (the first screen of a landing page). The hero is 80% of a site's first impression, so this is the highest-value section to study.
**How to use it:** when starting a new site, pick 3 heroes you like here and note what they share — type scale, layout, motion on load.

### 3. https://calltoinspiration.com — the component library
Inspiration organized by **UI component/pattern** — buttons, 404 pages, pricing tables, sliders, etc.
**How to use it:** when one specific part of your page feels boring, look up that exact component here instead of redesigning everything.

### 4. https://www.durves.com — the pattern-asset tool
Not a gallery — a **tool** that generates dotted/halftone wave patterns you can export and use as background textures in your own designs.
**How to use it:** generate subtle background patterns for sections that feel empty. Dark sites live on texture (grain, dots, gradients) — flat black looks cheap.

## What the "dark motion" genre actually is

We inspected the standout sites featured in these galleries (108.supply, landonorris.com, trionn.com) and the recipe is remarkably consistent:

- **Near-black, never pure black** backgrounds (`#050505`–`#0a0a0c`) + one saturated accent color.
- **Smooth inertia scroll** (the Lenis library, or a hand-coded lerp equivalent).
- **Scroll-driven animation** — sections pin and "scrub" as you scroll (GSAP ScrollTrigger, or hand-coded).
- **Pointer-driven life** — custom cursor, magnetic buttons, parallax that follows the mouse, 3D card tilt, cursor spotlight. This is the "everything responds when you move the mouse" feel.
- **Distinctive typography** — a display font with personality + a monospace font for small technical labels. Never default Arial/Inter as the star.
- **Texture** — film grain, video, or canvas effects so nothing feels flat.

Pro sites build this with Webflow + GSAP + Lenis, or Framer. **We rebuild ~90% of it with zero dependencies** — one `pointermove` listener + one `requestAnimationFrame` lerp loop + CSS — in a single HTML file. That's what the skill and the demos teach.

## The demos (your pattern library)

Open these in a browser, then open them in an editor — every technique is self-contained:

1. **`demos/mouse-effects-demo.html`** — the pointer suite: custom cursor, magnetic buttons, pointer parallax, 3D tilt with glare, cursor spotlight.
2. **`demos/dark-motion-techniques.html`** — the scroll suite: split-text reveals, scroll-scrubbed SVG drawing, parallax, marquees, counter roll-ups, sticky stacking cards, grain overlay.
3. **`demos/dark-motion-slides.html`** — the same vocabulary as a keyboard/wheel/swipe presentation deck.

## The learning loop

1. Find a site you love on dark.design or supahero.io.
2. Pick ONE effect from it.
3. Ask Claude (with the `dark-motion-site` skill installed): *"Rebuild the [effect] from [site URL] as a zero-dependency demo"* — the skill contains the method for reverse-engineering a live reference site.
4. Read the code it produces. The demos are small on purpose — every effect is ~30–60 lines.
5. Combine effects into your own page.

Repeat until the techniques are yours.
