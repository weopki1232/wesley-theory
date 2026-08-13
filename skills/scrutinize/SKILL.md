---
name: scrutinize
description: Review a change, plan, or file cold - inline, without spawning a subagent. Use when asked to review, check, sanity-check, critique or "look over" a diff, a script, a plan, or something just written, and before shipping anything non-trivial. Asks whether the change should exist at all, traces the real path past the edited lines, verifies each claim against the code, and returns severity-ordered findings with evidence and a one-line verdict.
---

# Scrutinize

Adapted from thananon/9arm-skills `engineering/scrutinize` (2026-08-13).

**This runs inline, in this session.** That is the point of it. The ECC reviewers
(`code-reviewer`, `code-simplifier`, `silent-failure-hunter`, `security-reviewer`)
each start cold and re-derive context this session already has - including why the
change was made, what was already ruled out, and what the user actually asked for.
Use this first. Escalate to an ECC agent, or to `/code-review ultra`, when the
review needs a full sweep of a large or unfamiliar codebase, or a second opinion
genuinely uncontaminated by this session's reasoning.

## Stance

- **Outsider.** Read it cold. Forget that you wrote it and why you thought it was
  right - that reasoning is the thing under test.
- **The diff is the entry point, not the scope.** Bugs live at the seams, in the
  unchanged code either side.
- **Cite or it did not happen.** Every claim about the code names a file, line, or
  traced path. No "this might break under load".

## 1. Intent - should this exist at all?

State the goal in one sentence in your own words. If you cannot, it is
underspecified - say so and stop.

Then spend one pass on the cheaper alternative, always, even on a small change:

- Do nothing. Is the problem real and load-bearing?
- Use what is already there instead of adding surface.
- A smaller change that gets 90% of the goal for 10% of the risk.
- A different layer - config instead of code, CSS instead of JS, build instead of
  runtime.

If a better route exists, name it with rationale **before** the line-by-line.
This is the most valuable output. Skip only if the user says "don't question scope".

## 2. Trace the real path

For each behaviour the change claims, walk it end-to-end through the actual code:
entry -> call sites -> branches taken -> state mutated -> output or side effect.
Include the untouched lines around the edit.

Two local checks that belong here:

- **Count first, count after.** Any change that lands in N places: `grep -c` the
  pattern before and after and state both numbers. "Fix all of X" reliably means
  all of a subset nobody counted - this is `CLAUDE.md` guard 1, and it shipped
  dead code inside a build labelled correct.
- **Verify from the consumer's side.** Does the thing that reads this value
  actually receive it? A constant updated where nothing reads it is not a change.

Note every surprise - a branch you did not expect, dead code reached, state you
did not know existed. Surprises are the signal.

## 3. Verify each claim

- **Does the traced path actually produce the claimed behaviour?** Say it
  explicitly: "claims X; path A -> B -> C; at C, <observation>; therefore
  holds / does not hold."
- **What input or state breaks it?** Empty, null, huge, unicode/Thai, wrong
  encoding, missing file, ordering assumptions, the second run.
- **What does it silently change?** Performance, error semantics, on-disk format,
  the contract for other callers.
- **Do the tests exercise the traced path**, or pass while skipping it? For any
  number or benchmark, `honest-measurement` owns this - a green harness that
  measured the wrong thing is the usual failure, not a red one.
- **Visual work:** one variable changed per iteration, or the result is not
  diagnosable either way.

## 4. Report

One tight block per finding, ordered blocker -> major -> nit:

- **Finding** - one specific sentence, with `file:line`.
- **Why it matters** - the consequence, not the principle.
- **Evidence** - the trace step or input that exposes it.
- **Change** - concrete and minimal.

Close with a verdict line: **ship / fix-then-ship / rework / reject**, plus the
single biggest reason.

## Rules

- **No rubber-stamps.** "LGTM" is not an output. Finding nothing means stating
  what you traced and what you checked, so the user can judge the coverage.
- **Separate claim from verification.** "It says X" and "I traced X and confirmed
  it" are different lines.
- **Lead with structure.** If step 1 or 2 found something real, do not bury it
  under style nits - defer or drop them.
- **Report done vs not-done by name.** If you did not trace a path, say which one.
