---
name: vault-pdf-ingest
description: Ingest a large PDF / textbook into the Obsidian knowledge vault end-to-end — copy to raw/, build a source page and concept nodes, connect them to related existing nodes, color them in graph view, and update the indices/log/state. Use whenever the user says "ingest this PDF", "process this source/textbook", "add this book to the vault", "upload it to Obsidian and connect it", or drops a file in raw/. Pairs with the obsidian-graph-coloring skill for the coloring step.
---

# Vault PDF Ingest

The canonical, repeatable procedure for adding a textbook-sized PDF to the vault.
It operationalizes the `CLAUDE.md` INGEST operation into one checklist. Follow it
in order; do not improvise.

> **CUSTOMIZE ME:** Replace `<VAULT_ROOT>` with the vault's absolute path and the
> domain tags `domain-a..d` with the real subjects, everywhere below.

## Golden rules (do not violate)
- **Source PDFs live on the Kingston backup drive: `E:\Books\<Subject>\` — NOT vault `raw/`.**
  Read the PDF in place during ingest; leave vault `raw/` empty. After the ingest
  completes, MOVE the PDF to `E:\Books\<Subject>\` (Step 7b). Each source page's
  Raw-file field points at that final `E:\` path. (This supersedes the CLAUDE.md
  "copy the PDF into `raw/`" step for PDFs — Wesley's setup, 2026-06-24.)
  Subject folders: `Biology` · `Business-Economics` · `Chemistry` · `Math` ·
  `Nursing-Health` · `Physics` · `Other` (· `_Archives`).
- Every concept node's `tags:` FIRST entry MUST be a domain
  (`domain-a|domain-b|domain-c|domain-d|meta`). This — not `field:` — is what
  colors the node in graph view.
- Universal Master Template (see vault `CLAUDE.md`) is mandatory for every node.
- Source-page claims must trace to the PDF. Concept nodes may use training knowledge
  but every fact must be accurate.
- **Always log; ask before deep capture; never bulk-upload silently** (Task Capture
  Policy). Confirm the node plan with the human before writing 5+ heavy nodes.

## Token-efficiency rules
- **Read PDFs with pypdf `extract_text()` on page ranges — NOT the Read tool's image
  renderer.** The Read tool rasterizes pages and is very expensive on a 200 MB+ file.
  pypdf text is ~100× cheaper. Snippets below.
- Don't read whole index files to edit them — grep a short unique anchor, edit there.
- **Phase-split ~1000-pp ingests across sessions:**
  Session 1 = Phase A (source page) + Phase B (new nodes, the heaviest step).
  Session 2 = Phase C/D (indices) + expansions + color + log + state.
  Update `vault-state.md` at the end of *either* session so the next starts warm.

---

## Procedure

### Step 0 — Pre-flight
1. Note the PDF's **current** path (e.g. `Downloads`). Do NOT copy it into vault `raw/`
   — it's read in place and gets MOVED to `E:\Books\<Subject>\` at the end (Step 7b).
   Pick `slug` = `src-<kebab>`, the kebab filename, and the matching `E:\Books` subject
   folder now so the source page's Raw-file field can point at the final path.
2. Get page count + TOC + license (read in place):
   ```python
   python -c "import sys; sys.stdout.reconfigure(encoding='utf-8'); from pypdf import PdfReader; \
   r=PdfReader(r'<path.pdf>'); print('PAGES',len(r.pages)); \
   [print('p%s: %s'%((r.get_destination_page_number(i)+1 if not isinstance(i,list) else '?'), getattr(i,'title',''))) \
   for i in r.outline if not isinstance(i,list)]"
   ```
   Check the publisher/license on the preface page and note it in the source page
   (e.g. CC BY 4.0 vs CC BY-NC-SA 4.0 — they have different reuse terms).

### Step 1 — Gap analysis
Read `wiki/vault-state.md` (node inventory only). List what this book genuinely
*adds* that existing nodes don't already cover. The test is "does this add knowledge
not already here?" — not "does it touch the same topic?". Propose the new-node list
to the human before writing.

### Step 2 — Phase A: source page → `wiki/sources/src-<slug>.md`
Frontmatter `type: source`. Sections: `## Summary` (2–4 paras), `## Key Claims`,
`## Entities` (`[[entities/...]]`), `## Concepts` (`[[concepts/...]]`),
`## Open Questions`. Note the license/attribution. Extract chapter text per range:
```python
python -c "import sys; sys.stdout.reconfigure(encoding='utf-8'); from pypdf import PdfReader; \
r=PdfReader(r'<path.pdf>'); print('\n'.join((r.pages[p].extract_text() or '')[:1800] for p in range(START,END)))"
```

### Step 3 — Phase B: new concept nodes → `wiki/concepts/<node>.md`
One file per node, Universal Master Template:
`Definition → Core Intuition → Technical & Formal Analysis → Advanced Applications →
Key Results → Connections → Sources Covering This Field`.
Frontmatter:
```yaml
---
title: "..."
type: concept
tags: [<domain>, <secondary>]     # FIRST entry = domain → graph color
field: [<domain-1>, <domain-2>]
sources: [src-<slug>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### Step 4 — Connect
Each new node's `## Connections` block: **≥3 links, ≥1 crossing domains**
(`[[concepts/file|Display]]` format, subdirectory prefix required). Then add
**retroactive** links: grep existing related nodes for unlinked mentions and add a
`[[concepts/<new-node>]]` line into their Connections.

### Step 5 — Phase C/D: indices
Add the source + every new node to: `wiki/information-index.md`, the relevant subject
index (`<domain>-index.md`), and `wiki/index.md`. Grep-anchored edits — alphabetical
order within each section. Entry format:
`- [[path|Display]] — one-line description {YYYY-MM-DD}`

### Step 6 — Color
```
powershell -File "<VAULT_ROOT>\.obsidian\scripts\vault-tag-audit.ps1" -Vault "<VAULT_ROOT>" -Fix
```
Re-run without `-Fix`; confirm output ends `All nodes are colored.` Resolve `[MANUAL]`
entries by hand. (See the **obsidian-graph-coloring** skill for the graph.json race
condition and the color groups if a node still shows grey.)

### Step 7 — Log + state
- Append to `wiki/log.md` (newest at top): `## [YYYY-MM-DD] ingest | <title>` with
  Files touched / Summary / Notes.
- Update `wiki/vault-state.md`: add nodes to the domain line, bump the count in the
  header, add a Sources-table row, update Open Threads, bump `updated:` date.

### Step 7b — Archive PDF to Kingston (E:)
**Only after the ingest is otherwise complete** (source page + nodes + indices + color +
log all done), move the source PDF to its subject folder on the Kingston backup drive.
This is a move (irreversible-ish) → verify the destination, then confirm it landed:
```
mkdir -p "/e/Books/<Subject>"
mv "<current-pdf-path>" "/e/Books/<Subject>/<Kebab-Name>.pdf"
ls -la "/e/Books/<Subject>/<Kebab-Name>.pdf"   # confirm before reporting
```
Subject ↔ domain map: `biology`→Biology · `physics`→Physics · `chemistry`→Chemistry ·
`mathematics`→Math · `finance`/`economics`/management/business→Business-Economics ·
nursing/clinical/medicine→Nursing-Health · `engineering`/`humanities`/misc→Other.
The source page's Raw-file field must already read `E:\Books\<Subject>\<Kebab-Name>.pdf`.

### Step 8 — Report
List every file created/edited, confirm the color audit passed, and confirm the PDF was
moved to `E:\Books\<Subject>\`. If phase-split, say exactly what remains for the next
session (and whether the PDF move is deferred to that session).

---

## Reusable pypdf snippets
```python
# page count
python -c "from pypdf import PdfReader; print(len(PdfReader(r'<path>').pages))"

# text of one page range (0-indexed), trimmed
python -c "import sys; sys.stdout.reconfigure(encoding='utf-8'); from pypdf import PdfReader; \
r=PdfReader(r'<path>'); [print('==p%d=='%(p+1), (r.pages[p].extract_text() or '')[:1500]) for p in range(A,B)]"
```
`sys.stdout.reconfigure(encoding='utf-8')` is mandatory on Windows (Unicode).
Requires `pip install pypdf`.

## Related
- Vault `CLAUDE.md` — full INGEST/EXPAND/LINT spec and the Universal Master Template.
- **obsidian-graph-coloring** skill + `/vault-colors` — the coloring deep-dive.
