---
name: writing-skills
description: How to write a SKILL.md, CLAUDE.md, or agent instruction file that actually changes behaviour. Use when authoring a new skill, revising an existing one, reviewing a skill before it goes in the shared starter kit, or deciding whether a rule belongs in a skill, CLAUDE.md, or a hook.
---

# Writing skills

Condensed from mattpocock/skills `productivity/writing-for-agents`, cut to what
applies on this machine. The originals are 11 KB; a skill about not bloating
skills should not be bloated.

`ecc:skill-create` generates a skill from git history and `ecc:skill-comply`
measures whether one is obeyed. Neither covers craft. This does.

## Pick the right container first

Most "should I write a skill?" answers are no.

- **Always true, every session** -> `~/.claude/CLAUDE.md`. Loaded deterministically.
- **True only during one kind of task** -> a skill. Loaded on a description match,
  so it must earn the context it costs when it fires.
- **Must not be violated, ever** -> a hook (`~/.claude/tools/shell-guard.ps1`).
  A rule asks; a hook enforces. Anything irreversible belongs here.
- **A fact about one project** -> the vault page or memory, not a skill.

A skill that would fire on every coding task is a CLAUDE.md entry wearing a
costume. Say so instead of writing it.

## The two loads

- **Context load** - what sits in the window. Paid every turn the skill is active.
- **Cognitive load** - the human having to remember the skill exists and when to
  reach for it. Spend this only where judgment is genuinely required; everywhere
  else, make the description do the remembering.

## The description line is the trigger

It is the only part read when deciding whether to load the skill. Everything else
is dead weight until it fires.

- Front-load the distinguishing word.
- Name one concrete trigger per branch of use; collapse synonyms.
- Write the situations the user will be in, not a summary of the contents.
- Do not restate the body here. The body is not read at match time.

## Keep the body small, push detail behind pointers

Tier what you write:
1. Steps to perform now - inline.
2. Reference needed while performing them - inline, but below the steps.
3. Everything else - a separate file named in one line, read only when reached.

This is already the pattern in `honest-measurement` (append-only `pitfalls.md`)
and `scientific-model` (cached `references/`). Follow it. A growing lessons file
next to a stable SKILL.md is how a skill compounds without getting fatter.

## Every step needs a completion criterion

"Understand the code" has no end. "Name the three call sites" does. Fuzzy bounds
produce work that stops early and reports done. Where a step must be exhaustive,
demand it in the criterion - "every rule applied" gets more legwork than "make
changes".

## State the target, not the prohibition

"Do not write vague descriptions" plants the vague description. "Front-load the
distinguishing word" plants the fix. Convert prohibitions into positive targets
wherever the sentence allows it - the negative form primes the thing it forbids.
Keep the negative form only where the boundary itself is the content, e.g. a
safety rule about what never to touch.

## Prune before shipping

- One source of truth. If a rule lives in CLAUDE.md, do not restate it here -
  point at it. Two copies means the wrong one gets read.
- Cache only expensive lookups. Never write down what one command reveals; write
  the command.
- Test each line as a no-op: would behaviour differ if this line were deleted? If
  no, delete it. This is the same test that keeps CLAUDE.md's guards to four.

## Before it goes in the shared starter kit

The public kit is templatized and other people's Claudes read it.

- No absolute paths, no `C:\Users\<name>`, no personal project names.
- No claim that depends on this machine's drives, hooks or installed tools.
- Shared and live copies are allowed to differ on purpose - say which is which in
  the file, or they silently drift apart.
