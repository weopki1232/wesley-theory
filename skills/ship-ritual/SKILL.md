---
name: ship-ritual
description: The release checklist for this machine. Use whenever work is finished, shipped, released, version-bumped, tagged, or "mirrored to the backup drive" — or when the user says "we're done", "that's it", "back it up", or asks to record/archive a project. Runs the seven steps that make a project findable and recoverable later: gates, rollback copy, git tag, ADDITIVE archive mirror, PROJECTS-INDEX line, vault Status & left-off, memory. Steps 5-7 are the ones that get skipped and they are the ones that decide whether "the X thing we made" can be found in three months.
---

> **CUSTOMIZE ME:** this skill is deliberately machine-specific — that is the point
> of it. Replace `<PROJECTS_ROOT>` with your working-projects folder,
> `<ARCHIVE_DRIVE>` with your backup drive, `<VAULT_ROOT>` with your Obsidian vault,
> and `<CLAUDE_HOME>` with your `.claude` folder. If you don't keep a vault or an
> archive drive, drop steps 4 and 6 rather than watering them down — a generic
> "remember to tag and back up" is not worth a skill.

# Ship Ritual

Finishing the code is step 3 of 7. The other four are what makes the work
**findable and recoverable** later, and they are boring, so they are the ones
that get dropped. Every entry in `pitfalls.md` here is a case where the code
shipped fine and the record did not.

Run the whole list. If a step genuinely does not apply, say so out loud rather
than silently skipping it.

---

## The seven steps

### 1. Gates green, and say which ones ran
Run the project's QA gates. Report what passed **and what was not run**. "Gates
pass" is not a true statement if three of five were skipped because they are
slow. If a gate is stale, fix or banner it now (see `honest-measurement`).

### 2. Rollback copy before the release copy
`backups/<version>-<label>/` inside the project, self-contained — it must open
offline on its own, which for a vendored-dependency build means copying the
dependency in beside it. Hash-verify it.

**Never stage a QA variant or a patched file in `backups/`.** That directory is
the rollback path; a doctored file in it is indistinguishable from the real thing
at exactly the moment somebody needs the real thing.

### 3. Commit and tag
```
cd <PROJECTS_ROOT>
git add -A
git commit -m "..."        # multi-line: use a single-quoted here-string, @' ... '@
git tag v<x.y>-<short-label>
```
The tag label should say what the release *is* (`v13.1-msaa-and-pacing`), not
just its number. Six weeks later the number means nothing.

### 4. Mirror to the archive drive — ADDITIVE ONLY
```
powershell -ExecutionPolicy Bypass -File <PROJECTS_ROOT>\tools\sync-archive.ps1
```
It syncs the whole vault plus every folder in `<PROJECTS_ROOT>\`, and copies
`PROJECTS-INDEX.md` across. For a single project, `robocopy <src> <dst> /E` is
the same guarantee.

- **`/MIR` is forbidden.** `<ARCHIVE_DRIVE>` holds archive-only projects that do not
  exist on the working drive at all, and a mirror would delete them. Treat the
  archive drive as delete-guarded.
- **Known limitation, worth stating each time:** because the sync is additive,
  renamed or deleted working-side files leave **stale copies on the archive** forever. If this
  release renamed or removed files, name them so the user can decide by hand. Do
  not clean them yourself.
- Verify: compare recursive file counts on both sides, do not assume.

### 5. `PROJECTS-INDEX.md` — one line, findable by a bad description
`<PROJECTS_ROOT>\PROJECTS-INDEX.md`. Write the line so it matches how the
user will actually search for it later — "the X thing we made" — not the folder
name. Include the trap if there is one (e.g. the live deck is in
`neuron-to-brain-fix\`, *not* `neuron-to-brain\`). Bump `Last updated:`.

### 6. Vault project page — **Status & left-off is the source of truth**
`<VAULT_ROOT>\wiki\projects\<project>.md`

This is the file that answers "did we finish X?", so a stale banner here is worse
than no banner. Update **all four**:
- frontmatter `status:` and `updated:`
- the `> [!success] SHIPPED — ...` callout: version, date, tag, commit range,
  rollback path
- a dated section for what this release changed and why
- any `[[techniques/...]]` link if a reusable trick came out of it

New project? Copy the frontmatter shape from an existing page
(`title, type, status, tags, code, mirror, created, updated`).

### 7. Memory
`<CLAUDE_HOME>\projects\<project-slug>\memory\`
- update the project's memory file (convert relative dates to absolute)
- update its one-line hook in `MEMORY.md`
- do **not** record what git history or the code already says; record the
  decisions and open items that are not derivable from the repo

---

## Then report, in this order

1. What shipped, with the tag and the verified file count/hash.
2. **What was left out and why** — every open item, named. Scaling the work down
   is the user's call, not yours.
3. Stale copies now sitting on the archive drive, if any.

---

## Compound

Append to `pitfalls.md` whenever a release turns out to have left something
inconsistent. Rule first, story second. Append only.
