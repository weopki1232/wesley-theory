# Audit resolution — 2026-08-10

`PACKAGE-GAPS.md` and `PACKAGE-IMPROVEMENTS.md` are a review of this package by a
second Claude instance. Most of it was correct and has been applied. **Some of it was
wrong**, and one item would have broken the package if followed.

Read this file before acting on anything in those two.

---

## ⛔ Do NOT do this — item D1 is refuted

`PACKAGE-GAPS.md` item **D1** says to delete `skills/frontend-slides/plugins/`,
claiming it is an accidental duplicate.

**Do not delete it.** `skills/frontend-slides/.claude-plugin/marketplace.json:13`
declares `"source": "./plugins/frontend-slides"` — the manifest points *at* that
directory. It is the upstream repo's plugin-marketplace layout, not stray duplication.
The tree also contains one file with no counterpart anywhere else:
`plugins/frontend-slides/.claude-plugin/plugin.json`.

The audit's supporting claims were checked and are partly wrong: the tree is
**1.67 MB, not 2.1 MB**, and while all 79 skill files are byte-identical to their
outer counterparts, it is **not** a pure subset because of `plugin.json`.

---

## Applied

| Item | What changed |
|---|---|
| A1 | Dependency list rebuilt from actual imports; `requirements.txt` added |
| A2 | System-dependency table added (LibreOffice, Poppler, Pandoc, Tesseract, Chrome) |
| A3 | README no longer claims `obsidian-graph-coloring` hard-codes paths — it is templated |
| A4 | `dark-motion-site` said "Three working references" then listed four. Now four, and the fourth ships |
| B1 | `extras/statusline.ps1` resolves from `$env:USERPROFILE` instead of a literal path |
| B2 | `thai-pdf` no longer claims pypdf/pymupdf are "already installed" |
| C1 | The three.js particle-morph build now ships at `demos/neuron-to-brain/` with its `three.min.js` |
| C2 | Both `study-deck` reference builds now ship at `demos/study-deck/` |
| E1 | `requirements.txt` added |
| E3 | Root `.gitignore` added |
| G1 | README now distinguishes `honest-measurement`'s domain-neutral *rules* from its browser-specific *templates* |
| G3 | "Not for structural questions" added to `honest-measurement` — stops it demanding a harness to confirm arithmetic |
| H1 | Thai on-screen typography section added to `study-deck` (font stack, `lang`, line-height, wrapping) |
| I1 | `study-deck` now hard-gates prose facts: list every numeric claim as sourced/unsourced before shipping |

Beyond the audit, every machine-specific path in the package was replaced with a
`<PLACEHOLDER>` — see the table in `README.md`.

## Rejected, with reasons

- **D1** — see above. Would have broken `marketplace.json`.
- **G2** (add a non-browser `ab_process.py` template) — contradicts G1, which argues
  the skill *is* browser-scoped. Both cannot hold. Resolved instead by one clause in
  the README separating the general rules from the browser-specific templates.
- **A3, second half** — the audit says `TELL-YOUR-CLAUDE.md` repeats the
  `obsidian-graph-coloring` error. It does not; that line was accurate as written.
- **H1, as stated** — the audit claims grepping the three HTML skills for Thai/font
  terms "returns nothing". `frontend-slides` returns ~790 hits including a complete
  CJK font strategy. The real gap was narrower and only `study-deck` and
  `dark-motion-site` needed the addition.
- **A1, one entry** — `validators` is not a PyPI dependency. `from validators import
  ...` resolves to the local `office/validators/` directory. The audit also missed
  four doc-only packages, now listed as optional in `requirements.txt`.

## Still open

- **F1** — `prove_patch_applied()` in `skills/honest-measurement/templates/ab_perf.py:71`
  is defined and never called, so the template silently skips the one guard its own
  documentation calls mandatory. Confirmed real. Wiring it in needs a restructure
  (probe each build as its page opens in round 0, then assert the values differ), and
  that change is pending review rather than applied blind.
