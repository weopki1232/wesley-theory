# CLAUDE.md — example

Copy to `~/.claude/CLAUDE.md` and edit. This is loaded into **every** session, so
keep it short: it competes for attention with the actual task. Anything mechanical
belongs in a hook (`shell-guard.ps1`), not here — hooks are enforced, prose is
merely read.

The version below is a de-personalised copy of a real one. The value is in the
*shape*: a few absolute safety rules, then a handful of guards that each exist
because something went wrong once.

---

```markdown
# Safety rules (always apply)

- **Confirm before anything irreversible.** Warn and get explicit approval before
  deleting, overwriting, force-pushing, or any action that cannot be undone.
- **Clean up only your own mess.** Remove the imports, variables and functions that
  *your* change orphaned. Pre-existing dead code, stale comments and odd formatting
  get **mentioned, not deleted** — every changed line should trace to what was
  actually asked for.
- **<ARCHIVE_DRIVE> is delete-guarded.** Never delete or mirror-delete anything
  there — sync is ADDITIVE only. It holds archive-only projects that exist nowhere
  else.
- **Budget mode is OFF by default.** Do not ration work, refuse subagents, skip web
  fetches, warn about cost, or trim scope for budget reasons unless it is switched
  on. Default to whatever approach does the job best.
  - **Switch it on** when the user says so — "budget mode on", "keep it lean" — and
    only then. It lasts for that session; never carry it into the next one, and
    never turn it on by inference.
  - **While on:** prefer self-made assets (SVG, code) over fetching, avoid subagents
    unless clearly needed, check feasibility/cost before large jobs, skip
    unrequested extras.
- **Windows PowerShell 5.1 environment.** No heredocs, cp1252 stdout (avoid
  printing non-ASCII from scripts), keep script sources pure ASCII where glyphs
  matter.

# Learned guards

Full catalogue with the incident behind each rule: `~/.claude/PITFALLS.md`. Read the
relevant section **before** the action. The mechanical traps are enforced by the
`shell-guard` PreToolUse hook; these need judgment, so they live here:

- **Changing one thing in N places: count first, count after.** `grep -c` the
  pattern before the edit and again after, and state both numbers. Updating 5 of 8
  thresholds once shipped dead code inside a build labelled "real anatomy". A
  "fix-all" request usually means "all of a subset you didn't check" — verify from
  the consumer's side.
- **Claims about a build come from re-reading the code, not from a memory note.** A
  memory records what was true when written. Same for third-party capabilities —
  ask the tool, don't assert from memory.
- **One variable per iteration** on design/visual work. Changing five at once turns
  a good iteration into a regression with no diagnosable cause.
- **Report done vs not-done by name**, and leave unattended/overnight runs a written
  report on disk — not only in chat.
```

---

## How to grow your own

Don't write these from imagination. The method that produced the list above:

1. Read back your own session transcripts, specifically the **"errors and fixes"**
   sections of compaction summaries — not your own messages. That is where the real
   failures are recorded rather than remembered.
2. Group the failures into classes. Anything that recurs three times is a rule.
3. Sort each rule into **mechanical** (a script can detect it → hook) or
   **judgment** (→ `CLAUDE.md`).
4. Keep the date and the incident attached. A rule whose story has been deleted
   reads like an arbitrary preference and gets ignored — including by you.
