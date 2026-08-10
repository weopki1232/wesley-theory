# pitfalls.md — measurements that lied, and why

Append-only. Rule first, story second: the story only helps if the rule is
findable *before* the same mistake repeats.

Seeded 2026-07-26 from the neuron-to-brain v13 build (three.js scroll explainer,
~220k point sprites, Playwright + Chrome gates). Every case below actually
happened and every number below was actually measured.

**The through-line:** a check that asks whether the machinery ran will pass while
the thing the machinery exists for is absent.

---

## 1. A blank picture is perfectly reproducible

A pixel-diff gate reported 0.0000% across all 14 samples and "passed" — while
comparing two **blank** images, because Chrome's CLI `--screenshot` never
composited the WebGL canvas.

**Rule.** Liveness before comparison. A gate that cannot distinguish "identical
because correct" from "identical because nothing rendered" manufactures
confidence, which is worse than no gate.

---

## 2. Assert on pixels or populations, never on the uniform that drives them

A synapse flash was keyed to a value window that no point fell inside. It lit
**exactly zero points**, and every uniform-level assertion passed, because the
uniform was correct and there was simply nothing for it to light.

**Corollary.** A name-matched population needs its count checked against the
total it claims to represent. A cost estimate selected muscle points with
`/bicep|brachii|muscle|deltoid|endplate/` and matched 13,601 points — about a
third of the layer, because most pieces are named for the muscle itself
(*pectoralis major*, *latissimus dorsi*). The regex returned a plausible number
and never announced it was partial, so the estimate under-predicted by ~4x.

**Rule.** Two separate questions for every effect: did the driver produce a
value, and how many elements did it reach. Only the second is the effect.

---

## 3. A silent failure surfaces several layers away

A backtick inside a `/* comment */` inside a GLSL template literal closes the JS
string. The shader then fails to compile, which does **not** throw: WebGL logs
and draws nothing, and the symptom appears as `G_DEN is not defined`.

**Rule.** Run the dumbest, cheapest console/pageerror check FIRST in any gate
sequence. It is the only one that reports the actual cause.

---

## 4. To wait for a thing to settle, observe the thing that must settle

Two settle rules were tried and both were wrong the same way. `SETTLE = 3000ms`
is a bet on machine speed: it lost, measuring 7.96% median self-jitter inside a
busy run against 0.002% in a quiet browser. `SETTLE = 240 frames` reasoned that
the camera converges per frame — measured, it was *worse*.

Probing the live scene settled it: everything the deck was told was identical
across six captures, and `camera.position.y` still read 4.797762 / 4.797568 /
4.797941. An asymptotic lerp never arrives, and with 200k hard-edged sprites a
sub-pixel shift flips a very large number of pixels.

**Rule.** Screenshot, advance, screenshot, accept only when consecutive frames
agree. A page that never stabilises raises rather than quietly returning a
half-settled frame.

---

## 5. Index-keyed effects break silently when the data is regenerated

A myelin sheath walked an index range, assuming index tracked distance along the
fibre. True of the old procedural axon, false once resampled scan data replaced
it: the sheath scattered over a random 44% of the fibre and nothing errored.
Separately, a threshold edit updated 5 of 8 boundaries, leaving a dead branch
that rendered one brain region in another's colour.

**Rule.** Prefer a measured property over an index. Update *all* boundaries, not
the ones near the change. Never keep a threshold list in two files without a
check that parses both and compares.

---

## 6. A QA sampling point is an assumption, and it fails silently too

A sweep sampled every station at a fixed `MID=0.55`. That is wrong for the one
station whose effect deliberately ends at 0.54, so the contact sheet rendered
"One synapse" with no synapse. The first draft of the new gate borrowed the same
0.55 and reported a defect in the deck that was a defect in the gate.

**Rule.** A gate testing an *effect* must locate the effect, scanning for its
driver's peak. A fixed sample answers "does this render at all" and is not
evidence about anything timed.

---

## 7. Read a value a frame after setting the state, not in the same tick

Uniforms are written during render. Reading one in the same synchronous
`evaluate` that set the state samples the *previous* frame. A peak scan built
this way reported every driver peaking at 0.000, and all the numbers looked like
real readings.

**Rule.** Await real frames between setting and reading. Measure the app's actual
frame progress rather than assuming a frame rate.

---

## 8. Blocked designs credit warm-up to whichever condition ran first

A point-size clamp sweep run as 24 -> 16 -> 12 -> 8 px showed a clean 34 -> 40 fps
"improvement" at every value, **including ones physically too loose to change
anything**. Re-run interleaved, the effect vanished: the first sample after
settling simply reads slow.

**Rule.** Never run all of A then all of B. Also: the determinism harness is
poison for timing (it freezes the rAF timestamp), vsync hides regressions, and
the mean hides the stalls a viewer feels. p50 and p05.

---

## 9. Verify a live patch applied before believing "no effect"

A clamp sweep produced an identical 0.01% pixel diff at every value, which is
impossible if the clamp does anything. First hypothesis: the shader never
recompiled, which would make every number meaningless. A 1px clamp as a control
moved 35.5% of pixels, proving the patch applied — the real explanation was that
points at that framing are already only 5-10px.

**Rule.** When a manipulation shows no effect, first prove the manipulation
happened, with a setting so extreme it cannot fail to show.

---

## 10. Scroll-driven or time-driven work needs one measurement in motion

Everything was checked with the timeline pinned: 12 uniform assertions, 43 sweep
frames, two pixel tests, two new gates, all green. None of it could see that at
an ordinary 900 px/s scroll the synapse lasted 0.64s and the contraction 0.47s,
against roughly 1.5s for a beat to read as an event. The single most important
moment in the deck was a flicker and every gate was green.

**Rule.** Drive the real interaction at several rates and report seconds each
driver is non-idle. Static assertions cannot see pacing.

---

## 11. Check whether the DEFAULT is doing a job before optimising what you wrote

An fps floor was chased for a whole session as a point-budget problem. Two
fill-side levers were measured and rejected, and a densify was walked back. The
actual cost was `antialias:true` in the `WebGLRenderer` constructor, carried
unexamined from the previous version: a 4x multisampled framebuffer
(`gl.SAMPLES` reported 4) multiplying per-fragment bandwidth across the canvas.

**The scene contained no `THREE.Line` and no `THREE.Mesh`.** Every visible thing
was a point sprite whose edge is soft because its alpha channel makes it soft.
MSAA resolves *geometric* coverage, and there was none to resolve. Off: one
station went p50 7.8 -> 119.0, p05 5.7 -> 55.2; in real motion the chapter went
from 106 frames in 10s to 766 frames in 16s. Visual cost at 4x zoom: invisible.

**Rule.** The generalisation is not "turn off antialiasing". It is that a default
inherited from an earlier version is an unmeasured assumption, and the cheapest
question about an expensive setting is whether the thing it does is a thing this
scene needs at all. Ask that before optimising the things you wrote yourself.

---

## 12. A comparison gate must hold every other variable equal

The moment MSAA came off the new build, the gate flipped to PASS — floor 46.7 fps
against the baseline's 17.7 — and printed that the architecture claim was
supported. It was not. The new build was measured without MSAA against a backup
that still had it on. **The gate certified the wrong cause, in the exact words of
the claim it existed to test.**

Patched on both sides, the real answer is the opposite:

| | old, 48k pts, CPU lerp | new, 193k pts, GPU lerp |
|---|---|---|
| median p50 fps | 251.4 | 127.1 |
| worst p05 fps | 55.1 | 49.5 |

What the GPU lerp bought is that 193k points are *possible*, not that they are
cheap.

**Rules.** (a) Patch the baseline the same way you patched the challenger.
(b) Stage the patched baseline in TEMP, never in `backups/` — a doctored file in
the rollback directory is indistinguishable from the real thing at exactly the
moment somebody needs the real thing. (c) Separate the one-time hypothesis from
the regression guard, and write the answer where the wrong claim was made;
deleting the assertion alone is the quiet revert the gate warns against.

---

## 13. Anything that settles per FRAME cannot be waited out by the clock

The first antialias A/B reported "47% of pixels differ" and nearly buried a change
that moves almost none. Cause: `camera.position.y = lerp(..., 0.08)` converges by
a fixed fraction **per frame**. After a 2.5s wait the 56fps page had converged and
the 10fps page was still 14% short, so the screenshots compared two different
camera positions and charged the difference to the change under test. Real answer:
8.065%.

Same run, second confound: holding both pages open and alternating put two Chrome
instances on one GPU, and a station read 9.8 fps for a build that measures 38.5.

**Rule.** A fixed wait is only valid when both sides run at the same frame rate,
which is never true in a test whose whole purpose is that they do not. And
**interleaving cancels drift over time; it does not cancel contention** — launch
one browser, measure, close it, repeat.

---

## 14. Interleaving is not counterbalancing

A 48k -> 65k density A/B ran `for build in (A, B)` inside every round: A B A B A B.
That reads as interleaved and is not. Each B sat in a slot the A before it had
just warmed, so B collected a systematic bias, and repeating the pair only made
the biased answer more confident. It reported the denser build as **6-30% faster**
at every shot.

That is impossible, and the impossibility was the only reason it got caught. The
size attribute is `.fill(1)`, so points do not shrink when a layer densifies, and
17,000 extra sprites are strictly more fill.

**Rule.** The check is not "is this plausible" but **"is there a mechanism by
which this could be true"**. Here the attribute that would have supplied one was
two greps away. Fix: alternate A B / B A on alternate rounds.

---

## 15. A delta is meaningless until you print the within-condition spread

Counterbalancing changed the answer to -9%, 0%, -10% — the physically expected
direction, and still not a result. Running the *same build* at the *same shot*
four times spreads **+/-21-25%** on this machine. Every between-build delta, in
both runs, sat inside that band.

**Rule.** The honest conclusion is not "it costs 10%" and definitely not "it is
free" — it is **"no cost resolvable above noise"**, a different and weaker claim,
and the only one the data supports. Report medians and spread together, or a
noise band gets published as an effect.

---

## 16. One page per sample, or path-dependence contaminates the comparison

Driving one page through a sequence of states is ~5x faster and not reproducible:
several effects lerp from their own previous buffer contents, so where the
timeline has *been* changes what a state looks like. Measured: a fresh capture
diffs 0.0000% against itself, while the same state reached as the fourth step of
a sequence diffs 14%.

**Rule.** Fine for a viewer, fatal for a comparison gate. One page per sample
removes the confound instead of trying to model it.

---

<!-- APPEND NEW ENTRIES BELOW THIS LINE. Never delete or rewrite an entry. -->
