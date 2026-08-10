# Package gaps — paste this to Claude

> ## ⚠️ SUPERSEDED — read `AUDIT-RESOLUTION.md` first
>
> This is the original 2026-08-10 audit, kept as a record. Most of it has since been
> **applied**; some of it was **checked and found wrong**.
>
> **Item D1 is refuted and must not be followed.** It tells you to delete
> `skills/frontend-slides/plugins/`. That directory is what
> `skills/frontend-slides/.claude-plugin/marketplace.json:13` points at, and it holds a
> `plugin.json` that exists nowhere else. Deleting it breaks the package.
>
> File paths quoted below are the pre-templatization ones; the package now uses
> `<PLACEHOLDER>` markers instead.

Findings from a full scan of this package (all 385 files) on 2026-08-10. Every item below
cites the file and line it came from, so Claude can verify each one before changing anything.

Paste everything between the lines into Claude Code, opened in this folder.

---

I have a Claude Code setup package in this folder. A scan found the gaps below. Please work
through them in order. Verify each finding at the cited file:line before you change anything —
if a finding doesn't match what you actually see, stop and tell me instead of guessing.

## A. Wrong information in README.md — fix these first

These are actively misleading, and a recipient following the README hits them immediately.

**A1. The Python dependency list is wrong in both directions.** `README.md:46` says the skills
need "`python-docx`, `python-pptx`, `openpyxl`, `pypdf`, `pymupdf`".

- `python-docx` is never imported anywhere. The `docx` skill manipulates raw OOXML through
  `lxml` and `defusedxml` instead. Drop it.
- Actually required but missing from that list: `Pillow`, `defusedxml`, `lxml`, `numpy`,
  `pdf2image`, `pdfplumber`, `playwright`, `validators`.
- Correct as listed: `python-pptx` (`from pptx import Presentation`), `openpyxl`, `pypdf`,
  `pymupdf` (used as `import fitz` in `skills/thai-pdf/SKILL.md:44`).

Rewrite the list with the full, verified set.

**A2. System dependencies aren't mentioned at all.** `pip install` cannot supply these, and two
skills fail without them:

- **LibreOffice** — `skills/docx/SKILL.md:48` (accept tracked changes) and `:589` (PDF conversion).
- **Poppler** — `skills/docx/SKILL.md:590` needs `pdftoppm`; `pdf2image` also wraps Poppler.

Add a short "System dependencies" note to the README under the Python note, with install
commands for macOS (`brew`), Debian/Ubuntu (`apt`), and Windows.

**A3. `obsidian-graph-coloring` is wrongly accused of hardcoding paths.** `README.md:38` groups
it with `vault-pdf-ingest` as "these reference my vault paths (`C:\Users\WIN11\Obsidian\Vault`)".
It doesn't. That skill is already templated — it uses `<VAULT_ROOT>` and `<OBSIDIAN_EXE>`
placeholders throughout (`skills/obsidian-graph-coloring/SKILL.md:12`, `:32`, `:38`). Only
`vault-pdf-ingest` has real hardcoded paths (`E:\Books\<Subject>\`, at `SKILL.md:16`, `:18`,
`:48`, `:131`, `:135`).

Fix `README.md:38` to name only `vault-pdf-ingest` as having hardcoded paths, and describe
`obsidian-graph-coloring` as needing its placeholders filled in. Make the same correction in
`TELL-YOUR-CLAUDE.md:26`, which repeats the error.

**A4. The demo count is wrong.** README and `TELL-YOUR-CLAUDE.md:24` both say
`dark-motion-site` points at "three demo HTML files". It names **four** references
(`skills/dark-motion-site/SKILL.md:36-39`), and the fourth has its own dedicated section at
`:44`. See item C1 — decide that one first, then make the count here match the outcome.

## B. Machine-specific leftovers the setup note doesn't flag

`TELL-YOUR-CLAUDE.md` step 3 lists the skills with paths pointing at the author's machine, but
misses these two:

**B1. `extras/statusline.ps1:51`** falls back to `C:\Users\WIN11\.claude` when it can't resolve
the Claude root. Anyone who installs the statusline gets a silently wrong path. Change the
fallback to resolve from `$env:USERPROFILE` instead of a literal, and note it in the README's
extras section.

**B2. `skills/thai-pdf/SKILL.md:71`** states `pypdf` and `pymupdf` are "both already installed in
system Python." True on the author's machine, false on a fresh one. Reword it to an instruction
to install them.

## C. Missing assets — these need the author, not you

Do not try to recreate these. Report them to me and I'll ask the friend who sent the package.

**C1. The fourth `dark-motion-site` reference doesn't ship.**
`skills/dark-motion-site/SKILL.md:39` and `:44` point at
`C:\Users\WIN11\Downloads\neuron-to-brain\index.html` — a three.js particle-morph
scrollytelling build ("lesson 4"), plus a vendored `three.min.js` beside it. `demos/` contains
only the other three files. So the skill documents a technique at length while its only
worked example is absent.

Two ways out, and I want you to ask me which: either the friend ships `neuron-to-brain/`
into `demos/`, or those references get deleted from the skill so it stops promising an
example it doesn't have.

**C2. `study-deck`'s two "proven" reference builds don't ship either.**
`skills/study-deck/SKILL.md:69`, `:129`, `:130` cite
`E:\Projects\biology-nervous-system-exam-prep\ติวสอบ-ระบบประสาท.html` and
`E:\Projects\frontend-design-from-reels\central-dogma-replication.html` as the sources for
its three scroll mechanisms. Same choice as C1 — ship them or drop the references.

## D. Packaging defect

**D1. `frontend-slides` contains a complete copy of itself.** There is a second, full skill tree
at `skills/frontend-slides/plugins/frontend-slides/skills/frontend-slides/SKILL.md` — 2.1 MB,
and a second `SKILL.md` declaring the same skill name. This is a packaging accident from
bundling the plugin form alongside the skill form.

The two `SKILL.md` files are byte-identical (`diff -q` reports no difference), so nothing is
lost by removing the copy. Delete `skills/frontend-slides/plugins/` entirely. Re-run the diff
yourself first to confirm it still holds.

## E. Things that should be in the package but aren't

**E1. `requirements.txt`** at the package root, so the Python side is one command instead of a
scavenger hunt. Generate it from the actual imports across `skills/**/*.py` plus the inline
`import fitz` in `thai-pdf`, not from the README's list (which A1 shows is wrong). Reference
the file from the README.

**E2. A root `LICENSE`.** The bundled Anthropic skills each carry their own
(`skills/{docx,pptx,xlsx,pdf}/LICENSE.txt`) and `skills/frontend-slides/LICENSE` exists, but the
package as a whole states no terms. Ask me which license I want before adding one — don't pick
for me.

**E3. A root `.gitignore`.** Only `skills/frontend-slides/.gitignore` exists. A root one should
cover `.DS_Store`, `__pycache__/`, `*.pyc`, `node_modules/`, `.claude-design/`, `*.log`.

## What the scan found healthy — don't touch these

Verified correct, so leave them alone:

- All 17 skills are present, each with a `SKILL.md` carrying valid `name` and `description`
  frontmatter. The README's skill table matches the directory listing exactly.
- `skills/honest-measurement/pitfalls.md` has 16 entries; README claims 16.
- `skills/scientific-model/pitfalls.md` has 17 entries and `references/` holds 3 PNGs;
  README claims 17 and 3.
- Both of those skills contain zero machine-specific paths, exactly as the README promises.
- No credentials, tokens, or keys anywhere in the package.
  `extras/settings-example.json` is genuinely sanitized (`<YOUR-USERNAME>` placeholder).

When you're done, summarize what you changed, what you skipped, and what still needs the
friend's input.
