---
name: prototype
description: Write throwaway code that answers one question you cannot settle by talking - how should this feel, what should this look like, does this state model hold up. Use when a design or UX decision is stuck, when grilling stalls on an ungrillable question, or when someone needs something concrete to react to. Builds either one shareable HTML state demo or several structurally different UI variants, then folds the answer back and parks the evidence.
---

# Prototype

Adapted from mattpocock/skills `engineering/prototype` (2026-08-13), with its
ticket and branch machinery removed - that repo's flow assumes wayfinder maps and
an issue tracker, neither of which exists here.

**The question comes first and decides everything else.** A prototype that
answers the wrong question is pure waste however good it looks. Write the
question at the top of the file, not just in your head.

## Throwaway is a rule about how it is written

Not a promise to destroy it. No tests, no error handling beyond what makes it
run, no abstractions, no persistence - because none of that helps you learn the
one thing you are trying to learn.

**The moment you start hardening it, you have stopped prototyping.** Adding a
test, wiring real storage, generalising for a case you might want later - that is
the signal to stop and go build the real thing.

## Which branch - the question picks

### "Does this logic or state model hold up?"

One **self-contained HTML file** that opens by double-click. No build, no server,
no dependencies - the same shape as the `frontend-slides` builds.

- A **labelled state panel** that re-renders after every click. Full state
  visible at every step, always.
- **Free-play buttons** for poking at the model in any order.
- **Tabbed guided walkthroughs** - one scenario per tab, with the ordered buttons
  to press underneath it.
- Everything labelled in **domain language**, not variable names, so someone who
  does not read code can drive it and tell you what they see.
- The logic underneath is a **small pure module** - a reducer, a machine, a set of
  functions - kept clean of the DOM, so the validated version lifts straight into
  the real code.

### "What should this look like?"

Several **radically different** variants on one page, switchable from a floating
bar and a `?variant=` URL param.

- **Variants must disagree about structure and information hierarchy, not
  colour.** Three tweaked card grids is wallpaper, not a prototype. The useful
  outcome is "the header from B with the sidebar from C".
- Render inside a **real page against real data and real density**. A variant
  judged in a vacuum always looks fine.
- **Use real copy in the language the thing will actually carry.** Thai, for one,
  runs wider than English at the same size and wraps differently - a layout
  validated on Latin placeholder text is not validated.
- Look at the actual render (drive it with Playwright, or just open it). This is
  the whole point: you are here because looking is the only thing that answers it.

## Rules

- **One question, one sitting.** If you are still building it the next day, the
  question was too big - split it.
- **Not for "what is the whole app?"** That has no stopping point, so it becomes
  the production app by momentum, and code written under prototype rules ends up
  in front of users. If you need a demo, build it deliberately as a demo and say
  plainly that none of it is production.
- **Not for diagnosing.** Something already built misbehaving is
  `debug-discipline`. Prototyping explores what to build, not why the built thing
  is broken.
- **One variable per iteration still applies** to the variants you compare -
  `CLAUDE.md` guard 3. Variants differing in five ways teach you nothing about
  which one mattered.
- **Realism needs a reference.** If a variant is meant to look like a real thing,
  work from an actual reference image, per `scientific-model`.

## When it is done

Two things survive, and they go to different places.

- **The answer** - the verdict and the question it settled - in one line, folded
  into the real work and onto the project's notes page under Status & left-off.
- **The prototype itself** - the runnable evidence the answer came from. Keep it
  at `<project>\prototypes\<name>.html`. Do not delete it and do not let it drift
  into the real build. A prose summary of a prototype loses the thing that made
  it convincing, and the next person to pick this up will want to press the
  buttons themselves.

## It is working if

- You can say in one sentence what question it exists to answer, and it is
  written at the top of the file.
- Someone who does not read code can drive it and describe what they see.
- Somebody says "wait, that shouldn't be possible" - that is a bug in the *idea*,
  which is the entire point.
- The UI variants disagree about layout, not colour and copy.
- It is answered in one sitting, and the answer is one line.
