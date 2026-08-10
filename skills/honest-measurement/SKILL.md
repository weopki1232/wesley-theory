---
name: honest-measurement
description: Measure a change instead of believing it. Use whenever a claim about a build needs evidence — "is this faster?", "did this break the picture?", "is 30fps still met?", "did my optimisation work?" — or when writing any QA gate, benchmark, A/B comparison, visual-diff test, or performance harness for a browser/WebGL/canvas build. Enforces counterbalanced ordering, within-condition spread reporting, settle-on-the-thing-itself, liveness checks, and proof that the patch under test actually applied. Read pitfalls.md BEFORE writing the harness, not after it lies to you.
---

# Honest Measurement

A harness that measures the wrong thing does not stay silent. **It reports a
number, and the number looks fine.** Every entry in `pitfalls.md` is a case where
a check passed, or produced a clean-looking figure, while the thing it existed to
test was absent, backwards, or unmeasured.

This skill exists because the expensive part of that work is never the fix. It is
the three re-runs before anyone notices the harness was the problem.

**The one-line discipline:** assert on the *outcome* — pixels, populations,
measured frame times — never on the setting that is supposed to produce it. And
before believing any delta, prove there is a *mechanism* by which it could be
true.

---

## When to use

- Any "is A faster / smaller / better than B" question about code you can run.
- Writing a QA gate, regression guard, benchmark, or visual-diff test.
- Before shipping a performance change, so the changelog claim is measured rather
  than assumed.
- When a measurement comes back surprising, implausible, or *too good*. That is
  the highest-value moment to open `pitfalls.md`.

Not for: statistical analysis of collected data, user studies, or anything where
you cannot re-run the thing yourself.

---

## The seven rules, in the order they bite

### 1. Ask what the DEFAULT is doing before optimising what you wrote
The cheapest and most-skipped question. An inherited default is an unmeasured
assumption wearing a reasonable-looking hat. A whole session went into point
budgets and shader clamps; the actual 15x cost was `antialias:true` carried over
from a previous version, giving 4x MSAA to a scene containing no geometric edges
at all. Inventory the flags, constructor options, and build settings you did not
consciously choose *first*.

### 2. Prove the manipulation happened before believing "no effect"
"No effect" and "no experiment" produce identical output. Read the setting back
**from the live system**, not from the source you edited:

```js
gl.getParameter(gl.SAMPLES)          // not "I set antialias:false"
```

If no runtime readback exists, run a control so extreme it cannot fail to show
(a 1px clamp moved 35% of pixels and proved the patch applied; 8px moved 0.01%
and was a real null result). One extra run, every time, no exceptions.

### 3. Hold every other variable equal, including in the BASELINE
The single most expensive bug in this catalogue: a gate flipped to PASS and
credited the right cause for the wrong reason, because the new build was measured
with a flag off and the baseline still had it on. If you patch the challenger,
patch the baseline the same way.

Stage the patched baseline in `TEMP`. **Never inside `backups/`** — a doctored
file in the rollback directory is indistinguishable from the real thing at
exactly the moment somebody needs the real thing.

### 4. Counterbalance the order. Interleaving is not counterbalancing
`for build in (A, B)` inside every round is `A B A B A B`. It looks interleaved.
Every B sits in a slot the A before it just warmed, so B collects a systematic
bias and repeating the pair only makes the biased answer *more confident*.

```python
order = BUILDS if rnd % 2 == 0 else BUILDS[::-1]   # A B / B A
```

Related: interleaving cancels drift over time, it does **not** cancel contention.
Launch one browser, measure, close it, repeat. Two Chrome instances on one GPU
read 9.8 fps for a build that measures 38.5.

### 5. Print the within-condition spread before reporting any delta
A between-build delta is meaningless until it is larger than the spread of the
*same build measured repeatedly*. On this machine that spread is +/-21-25%. Every
delta in two separate runs sat inside it.

```python
v = sorted(r[0] for r in raw[(tag, shot)])
print('%-4s %s  spread %+.1f%%' % (tag, v, (v[-1]/v[0]-1)*100))
```

The honest conclusion when the delta is inside the band is **"no cost resolvable
above noise"** — not "free", not "10% slower". Report medians and spread
together, or a noise band gets published as an effect.

### 6. To wait for a thing to settle, observe the thing that must settle
Any duration or frame count is a proxy that stays correct until the machine gets
busy. Camera lerps, animations, and layout converge by a fraction **per frame**,
so a fixed `wait_for_timeout` is only valid when both sides run at the same frame
rate — which is never true in a test whose entire purpose is that they do not.
A 2.5s wait once left a 10fps page 14% short of a 56fps page and charged the
difference to the change under test (reported 47%; real answer 8%).

Screenshot, advance, screenshot, accept only when consecutive frames agree. A
page that never stabilises must **raise**, never quietly return a half-settled
frame. See `templates/capture.py`.

### 7. Report p50 and p05, never the mean
A mean hides exactly the stalls a viewer feels. Disable vsync
(`--disable-gpu-vsync --disable-frame-rate-limit`) or a scene with 40fps of
headroom and one with 400 both report 60. And report as a **relative comparison**
against a known-good build; headless fps on a dev box is not what a viewer sees.

---

## Liveness first: the gate must be able to fail

Before the gate can be trusted, it must be shown capable of failing. Two blank
images are perfectly identical, and a gate that cannot tell "identical because
correct" from "identical because nothing rendered" manufactures confidence, which
is worse than having no gate.

Every comparison harness gets these, before the comparison:

- **L1 liveness** — the captures contain something.
  `float((img.max(axis=2) > 18).mean()) < 0.02` is a fail.
- **L2 advancement** — consecutive states differ from each other.
- **Error capture** — hook `console` and `pageerror`. A shader that fails to
  compile does not throw; WebGL logs and draws nothing, and the failure surfaces
  several layers away as an unrelated `undefined`.
- **Locate the effect, do not assume where it lives.** A gate testing a *timed*
  effect must scan for its driver's peak. A fixed mid-station sample is fine for
  "does this render at all" and is not evidence about anything timed.
- **Count the population, not the uniform.** "Did the driver produce a value" and
  "how many elements did it reach" are two separate questions. Only the second one
  is the effect. An effect once lit exactly zero points while every uniform-level
  assertion passed.

---

## One-time hypothesis vs regression guard

Keep them separate, and be honest about the split.

- *"Does the GPU lerp beat the CPU lerp?"* is a one-time architectural question.
  Once measured like-for-like it cannot answer differently. **Report it every run,
  assert it never** — a gate that always fails is a gate people stop reading.
- *"Is the deck above 30fps?"* can regress on any future change. **That is what
  fails the build.**

This is only honest if the answer is written down where it will be read: patch
the plan/doc at the place the wrong claim was made. Deleting the assertion alone
is the quiet revert the gate exists to prevent.

---

## Templates

- `templates/ab_perf.py` — counterbalanced fps A/B: one browser per condition,
  p50/p05, within-build spread, visual pair. Fill in three constants and run.
- `templates/capture.py` — settle-on-the-picture capture, liveness helpers, diff
  stats, determinism init (seeded `Math.random`, frozen rAF timestamp, frame
  counter).

Determinism note: the capture harness patches rAF to hand every callback the same
timestamp. **A frame-rate script must not import it** — it would report an
infinite frame rate while measuring nothing. Say so in the fps script's docstring
so nobody "fixes the inconsistency" later.

---

## Compound — append after every measurement job

1. **Append to `pitfalls.md`**: the rule first, the story second. The story only
   helps if the rule is findable before the same mistake repeats. Append only,
   never delete or rewrite entries.
2. **Write the answer where the wrong claim lives**, not only in the commit
   message.
3. If a gate is left stale by a change (it now diffs against an unpatched
   baseline), **put a STALE banner in its docstring** rather than leaving a
   landmine that will blame the wrong subsystem on its next run.

---

## Environment notes

Learned the hard way on the machine this skill came from (Windows 11 + Chrome).
The first two bite everywhere; the Windows ones only matter on Windows.

- Playwright must launch with `channel='chrome'`; the bundled headless shell has
  no real GL stack on some machines, and a WebGL page will render nothing while
  the harness reports identical screenshots and calls it a pass.
- Guard every gate with `if __name__ == '__main__':` — a diagnostic importing its
  constants will otherwise re-run the whole gate.
- Windows PowerShell 5.1: no heredocs, cp1252 stdout. Keep script sources pure
  ASCII, and do not print non-ASCII from Python.
- Smooth scrolling breaks scroll-driven measurement: each `scrollTo` starts a new
  eased animation that fights the previous one. Set `scrollBehavior='auto'` first.
- A DOM reflow can fire `onScroll` and silently overwrite a forced state. Pin it
  on an interval, not with a single call.
