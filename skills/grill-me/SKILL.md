---
name: grill-me
description: Interview the user relentlessly until a vague idea becomes decisions they can defend. Use when they say grill me, stress-test this, poke holes in this, or bring a plan/feature/design/direction that is not specified enough to build yet - and before starting any build whose scope is still fuzzy. Works rounds of a design tree, asks only questions whose prerequisites are settled, looks facts up itself, and never acts until they confirm.
---

# Grill Me

Adapted from mattpocock/skills `productivity/grill-me` + `productivity/grilling`
(2026-08-13), collapsed into one file.

The original splits into a 147-byte front door whose entire body is "run a
`/grilling` session" plus the primitive that holds the mechanism. Its author
documents the failure that causes: *a skill that names another skill does not
reliably load it*, and the tell is an interview with no recommendations attached.
Collapsing removes the failure. `grill-with-docs` is not adopted - it needs
`domain-modeling`, which is not installed.

**This is for the moment before the work**, not during it. `scrutinize` reviews
an artifact that exists; this one exists because the artifact does not yet.

## The three ideas

- **Design tree** - the subject as decisions, with decisions hanging off them.
- **Frontier** - every decision whose prerequisites are already settled. The only
  questions that can honestly be asked yet.
- **Round** - one frontier, asked in full, answered in full.

Ask the whole frontier at once, then wait. Two questions never share a round if
one depends on the other - that one belongs to a later round. Answers settle
decisions, the frontier moves outward, recompute and ask the next round. Thirteen
questions land in about three rounds, not thirteen.

## Question format

Fixed shape, so a round is answerable by number - "1 yes, 2 the second option,
3 no because..." - instead of by quoting questions back:

```
[Q1] <question title>: <body, may be several paragraphs, may offer choices>

-> <your recommended answer>
```

Always attach the recommendation. An interview without recommendations is the
tell that this skill is not actually running.

**Known rough edge:** the recommendation sometimes argues *against* the question
as worded, so agreeing with it means answering "no" to the question. When that
happens, answer the recommendation and say so.

## Facts are your job. Decisions are theirs.

- **Never ask the user something you can look up.** Read the file, grep the repo,
  check your project index, search the vault with `obsidian-cli`, check whether
  the path still exists. Use `Explore` for a genuinely broad sweep.
- **Do not block on it.** A running lookup is an unsettled prerequisite, so only
  the questions downstream of it wait. Ask the rest of the frontier now.
- **Never answer a decision yourself.** Answering your own questions is a broken
  run, not a liberal interpretation. Put each to them and wait.

## Stop when the question is ungrillable

Some questions cannot be settled by talking: how it should *look*, how it should
*feel*, one long form or three pages. Talking through these is where sessions
balloon - the questions keep rephrasing, the answers keep guessing, and scope
grows to fill the uncertainty.

When you hit one, **say so and stop grilling**. Build the throwaway version, look
at the actual render (drive it with Playwright, or just open it), then answer in
one line.
That is the same reason `CLAUDE.md` says one variable per iteration on visual
work: you cannot reason your way to what only looking will tell you.

## Rules

- **Start clean.** Best on a fresh conversation, not stacked on a plan already
  written - that plan is the thing being tested.
- **If you reached for this yourself** rather than being asked, say so in one
  line and get a yes before round 1. Nobody wants forty questions they did not
  ask for.
- **Do not act on any of it** until they confirm the understanding is shared. The
  frontier emptying is not the end; their confirmation is. Sliding from the last
  round into building is the most common way this breaks.
- **"I don't know" is a real answer** and usually means the question is
  ungrillable - prototype it instead of guessing.
- **No cap on questions.** Some plans need three, some need fifty. If a session
  runs very long the scope was too big: break the work up and grill the pieces.
- **The frontier is judgement, not a computed graph.** Two questions can land in
  one round and only afterwards turn out to interact. When that happens, reopen
  that branch in the next round.

## One question at a time

The round format is genuinely contested, and the people who prefer sequential
are disproportionately those reading in a second language. If the user asks for
one at a time, switch and stay switched - it is a supported mode, not a downgrade.

## After

The value is the context just built, so do not start a fresh session to write
things up - carry straight on. If it is real work, `ship-ritual` closes it out
and the decisions belong on the project's own notes page under Status & left-off.
