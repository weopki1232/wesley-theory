---
name: scientific-model
description: Build scientifically and anatomically CORRECT pictures, diagrams, and 3D models — biology, anatomy, molecular, physics, any technical illustration. Use whenever the user asks to draw/model/illustrate a real thing (a neuron, a cell, the spine, an organ, a molecule, a mechanism) as SVG, CSS, three.js, or a generated image, OR when a study-deck / explainer / infographic contains such a diagram. Enforces reference-first grounding, a structural-spec checklist, and a visual self-QA pass so the geometry matches reality — not just my memory of it.
---

# Scientific Model

Make illustrations of real things **correct**, not just plausible. The recurring failure this skill exists to kill: I draw anatomy/science from my *mental image* with no ground truth and no check, so I produce parts that each look fine but are structurally wrong (e.g. Schwann cells floating *outside* the myelin sheath, a spinal cord running the full length of the vertebral column). See `pitfalls.md` for the running catalogue of real errors caught — **read it before starting.**

The fix is a discipline, not a one-off. Two things must happen every single build:
1. **Ground truth in, before drawing** — fetch a real reference and write a structural spec from it.
2. **Eyes on the result, before shipping** — render it, look at the image, check it against the spec.

And the skill gets **better over time** by two append-only habits at the end of every build (see "Compound" below): cache the reference, and log any error you caught.

---

## When to use

- "Draw / model / illustrate a <neuron / cell / spine / heart / molecule / mechanism>"
- Any SVG, CSS-shape, three.js, or image-generated depiction of a real biological / anatomical / molecular / physical structure.
- A diagram *inside* a bigger deliverable — a slide deck, a worksheet, a PDF handout, an explainer page — where correctness matters.

Not for: abstract UI illustration, logos, decorative art, or diagrams with no real-world ground truth (flowcharts, made-up concepts).

---

## The 5-step discipline (do in order, do not skip)

### 1. Reference first — never draw anatomy from memory
Before one line of geometry, pull an authoritative reference. Sources are curated in `sources.md` (openly-licensed / public-domain, safe to reference). Priority order:
- **OpenStax Anatomy & Physiology** (CC BY) — clean teaching diagrams + verified text in one place.
- **Wikimedia Commons** (CC / public domain) — searchable, downloadable images.
- **The user's own notes** — if they keep a vault or notes folder, search it first; it may already hold the facts (and their phrasing).
- 3D work: **BodyParts3D / Z-Anatomy** meshes. Molecular: **RCSB PDB**.

**To actually SEE a reference (this is the key capability):** WebFetch returns text, not pixels. To view an image, download it and Read it:
```bash
# Save into this skill's own cache folder so it is reused next time.
# <skills-dir> = ~/.claude/skills on macOS/Linux, %USERPROFILE%\.claude\skills on Windows.
curl -L -o "<skills-dir>/scientific-model/references/<topic>-<desc>.png" "<image-url>"
```
Then `Read` that file — I can see images. This is the difference between guessing and checking.

### 2. Write a structural spec BEFORE code
A short plain-language list of the relationships that MUST hold — not visuals. This is the checklist step 4 verifies against, and it catches errors before any pixels exist. Capture:
- **Containment / identity**: what IS what. ("Myelin sheath = the Schwann cell's own membrane wrapped in layers around the axon — they are the SAME object; only the nucleus + thin outer collar sit on the outer surface.")
- **Counts**: exact numbers. ("31 pairs of spinal nerves.")
- **Extent / start-stop**: where things begin and end. ("Spinal cord ends ~L1–L2; cauda equina below.")
- **Order & adjacency**: sequence and what touches what. ("Nodes of Ranvier = bare gaps BETWEEN consecutive Schwann cells.")

Verify each line against the reference from step 1. If a line rests only on my memory, mark it and check it against `sources.md` or the user's own notes.

### 3. Decide correct-vs-pretty up front
"Anatomically correct" is non-negotiable. "Photorealistic" is a style choice — and usually NOT what a teaching deck needs (a clean, correct schematic teaches better than a muddy realistic render). Pick the target, then the tool:
- **2D schematic (SVG/CSS)** — best default for clarity in explainers.
- **three.js 3D** — when spatial relationships / rotation matter. Get proportions from a 3D reference mesh, not intuition.
- **Generated image** — only when true realism is the actual goal; then work FROM a reference, and never ship it as a real photo/record.

### 4. Self-QA — render it and LOOK
Nothing ships unverified. Render and screenshot, then Read the screenshot and check off every spec line from step 2.
- HTML/SVG/three.js: open with headless Chrome, then `Read` the PNG it writes:
  ```bash
  chrome --headless --disable-gpu --screenshot="out.png" --window-size=1600,1000 "file:///abs/path/to/page.html"
  ```
  Or use the Playwright MCP (`browser_navigate` a `file://` URL, then `browser_take_screenshot`). Note: Playwright can be blocked on `file://` — serve with a quick local http server if so. A WebGL page needs a real GL stack: use `channel='chrome'`, not the bundled headless shell.
- Go line by line: "Is the neurilemma on the outside? ✓/✗  Are nodes between cells? ✓/✗  Does the cord stop at L1? ✓/✗". Fix every ✗ and re-render. Loop until clean.

### 5. Domain cross-check
Confirm the factual claims against an authoritative source in `sources.md` (or the user's own notes), so correctness never rests on my memory alone. For a teaching deliverable, also check the claim matches the level being taught — a correct fact stated at the wrong grain still confuses.

---

## Compound — make this better every time (append-only, do at the end)

This is what makes the skill improve. After each build:

1. **Cache the reference.** Leave the downloaded reference image(s) in `references/` with a clear name (`<topic>-<what>.png`). Next build on that topic starts with ground truth already on disk — no re-fetch.
2. **Log what you caught.** Append to `pitfalls.md`: the structural fact, the wrong version, the right version, and the date. The Schwann-cell and spinal-cord errors seed it. Over time this becomes a pre-flight checklist of "mistakes I am known to make on this topic" — read it at step 2.

Do NOT delete or overwrite entries in these files — they are the accumulated learning. Add only.

---

## Fast path for a repeat topic
If `references/` and `pitfalls.md` already cover the topic: read the pitfalls entries, reuse the cached reference, write the spec, build, self-QA. The reference fetch is skipped but steps 2 and 4 are never skipped.
