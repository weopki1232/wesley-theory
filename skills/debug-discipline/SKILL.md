---
name: debug-discipline
description: The order of operations for finding a fault. Use when something is broken, failing, hanging, silently doing nothing, producing a wrong number, or "worked yesterday" - and before proposing any fix. Enforces check-the-recorded-traps-first, a reliable repro, narrowing the fail path, disproving the hypothesis before testing it, and a breadcrumb ledger on disk that survives compaction.
---

# Debug Discipline

Adapted from thananon/9arm-skills `engineering/debug-mantra` (2026-08-13). The
original opens by reciting a four-line mantra verbatim every session; that is
ceremony, and it is cut. What remains is the order, which is the actual content.

Do not propose a fix until step 2 is satisfied. Most wasted debugging is a fix
aimed at a symptom whose cause was never located.

## 0. Is it a recorded trap, not a bug?

Check this **first**, before building a repro. A large share of failures here are
environment traps that look exactly like code bugs, and every one of them fails
*silently* - no error, just a wrong or empty result:

- Read the relevant section of `~/.claude/PITFALLS.md`.
- Check the project's own `pitfalls.md` if it has one. The skills in this kit that
  keep one: `honest-measurement\`, `scientific-model\`, `ship-ritual\`.
- The `shell-guard` hook catches six of these before they run. If the hook fired,
  the answer is in its message - read it instead of working around it.

Classic false leads: mangled text is cp1252, not your encoder. A path that
vanished is Bash eating backslashes. An empty grep result is `grep -P` on Git
Bash returning nothing rather than erroring. "No output file" is `--headless=new`.

If it is a recorded trap, you are done. Say which entry it was.

## 1. Reproduce it reliably

Build a runnable repro before anything else.

- **Reliable** - capture exact steps, inputs and environment as an artifact you
  can re-run: a failing test, a scripted browser run, a one-line shell command.
- **Flaky** - not yet debuggable. Raise the rate before diagnosing: loop the
  trigger, add load, narrow the timing window. Anything statistical (fps, timing,
  layout jitter) goes through **`honest-measurement`** first - a flaky repro plus
  an unhonest harness produces a confident wrong answer.
- **No repro** - stop and say so. Do not hypothesise. Ask for the failing input,
  the screenshot, the console dump, or permission to instrument.

**The bar is one named command, already run once, that is red on this bug now and
will be green when it is fixed.** Not "I can see the problem" - a command, run,
with its red output in front of you. Pin the seed, pin the viewport, pin the file,
isolate the run. Seconds, not minutes.

**Then minimise it.** Strip the repro until every remaining element is
load-bearing, and be able to say why each one stays. A repro you have not
minimised is still carrying the noise that hides the cause - and half the time
the minimisation *is* the diagnosis, because the thing whose removal fixes it is
the thing at fault.

## 2. Narrow the fail path

Find *where* it breaks and *what stops it breaking*. The difference between those
two is the search space. Escalate only when the previous tactic fails.

1. **Inspect live.** Browser work: a devtools MCP (`chrome-devtools`, or the
   `playwright` MCP this kit installs) - console, network, evaluate, breakpoints,
   performance trace. One breakpoint beats ten logs. Shell and node scripts have
   no attach here, so start at step 2 for those.
2. **Trace the path and list the knobs.** Walk entry -> call sites -> branches ->
   state mutated -> output. List everything that can change the outcome: flags,
   input shape, viewport, timing, build options, which file is actually loaded.
   Flip **one knob per run** - the same rule as `CLAUDE.md`'s one-variable-per-
   iteration guard, for the same reason: five at once gives you no diagnosis.
3. **Instrument.** Log at the suspected site and dump the state. Tag every probe
   with a unique prefix (`[DBG-a4f2]`) so removing them is one grep - and count
   the probes before and after removal.

## 3. Try to disprove the hypothesis, not prove it

- Does it explain the symptom end-to-end? Walk the chain out loud.
- Generate 3-5 ranked candidates. One plausible idea anchors everything after it.
- **Show the ranked list to the user before testing any of it**, and wait. This is
  the cheapest checkpoint in the whole process - they usually know something about
  the system that reorders the list, and it costs one message instead of a day
  spent down the wrong branch.
- Run the **disproof first**. If it survives disproof it is real; if it dies you
  were saved a day.
- Verify from the code, not from a memory note or an earlier summary in this
  session - `CLAUDE.md` guard 2. Re-read the file.

## 4. Keep a breadcrumb ledger on disk

Every run is evidence. Sessions here compact, so a ledger held only in the
conversation is lost exactly when it becomes valuable.

- Write it to `<project>\debug-<topic>.md` as you go. One row per run: what
  changed, what happened, what it rules in or out.
- When a new hypothesis appears, walk the **whole** ledger. It must hold for every
  prior observation, not just the last one. One contradicting run kills it.
- When stuck, design the single experiment whose outcome settles it, and run that
  instead of churning adjacent runs.

## When the fix lands

- State the mechanism in one sentence: which thing, under which condition, caused
  which symptom. If you cannot, it is not fixed, it is hidden.
- Re-run the step 1 repro and say so explicitly.
- **Leave a regression test at the seam**, so the repro that caught it once catches
  it forever. A fix with no test is a fix that gets re-broken by the next change
  and re-diagnosed from scratch. Name the test in the report.
- Remove the instrumentation: grep the `[DBG-...]` tag, count the hits, and say
  the count is zero.
- If the cause was a trap that would bite again, add **one dated line** to the
  relevant `pitfalls.md` - or `~/.claude/PITFALLS.md` if it is environment-wide.
  That file is dated-real-incidents-only, so a fix without an incident earns no
  line. This replaces the full post-mortem document; the record here is the line.
- Then run `ship-ritual` if this closes out the work.
