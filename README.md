# Claude Code Setup Package

A complete copy of my Claude Code skills + instructions, plus install links for the plugins that can't be copied directly. Follow the steps in order — takes about 15 minutes.

> **Version 2026-08-05.** New here? Just work through the steps below in order. *(If you already installed the July version of this package: the only change is `skills/` — two new skills, `honest-measurement` and `scientific-model`, plus a refreshed `study-deck`. Re-copy `skills/` and skip steps 2–4, you've already done them.)*

> Everything here assumes **Claude Code** is already installed. If not:
> `npm install -g @anthropic-ai/claude-code` then run `claude` once to log in.

---

## 1. Install the skills (copyable — included in this package)

Copy the whole `skills/` folder into your Claude home folder:

```powershell
# Windows (PowerShell)
Copy-Item -Recurse .\skills\* "$env:USERPROFILE\.claude\skills\"
```

```bash
# Mac/Linux
cp -r ./skills/* ~/.claude/skills/
```

Restart Claude Code. Type `/` and you should see them all. What you get:

| Skill | What it does |
|---|---|
| `dark-motion-site` | The big one — builds premium dark motion websites (dark.design style). See `WEBSITE-LEARNING.md` |
| `frontend-slides` | Animation-rich HTML presentations (also converts PPTX to web) |
| `study-deck` | Animated educational explainers / scroll-driven lessons |
| `thai-pdf` | Beautiful multi-page Thai PDFs via HTML + headless Chrome |
| `ship-ritual` | **New.** The seven-step close-out that makes finished work findable three months later: gates, rollback copy, tag, additive archive mirror, index line, project-page status, memory. Deliberately machine-specific — fill in the placeholders or drop the steps you don't have |
| `honest-measurement` | **New.** Stops Claude believing a change worked because its own benchmark said so. The seven *rules* are domain-neutral — they apply to any "is this faster / smoother / did my optimisation work" question. The shipped *templates* are browser/WebGL/canvas-specific; for other domains take the rules and write your own harness. Its `pitfalls.md` is 16 real cases where a harness reported a clean number while measuring the wrong thing — the most useful file in this package if you ever profile anything |
| `scientific-model` | **New.** Makes diagrams of *real* things correct rather than merely plausible — anatomy, biology, molecules. Forces Claude to fetch a reference and actually look at it before drawing, then render-and-check the result. Ships 17 caught errors + 3 cached reference images. Pairs with `study-deck` for lessons where the picture has to be right |
| `docx` / `pptx` / `xlsx` / `pdf` | Anthropic's official Office skills — create/edit real Word, PowerPoint, Excel, PDF files |
| `obsidian-markdown` / `obsidian-bases` / `obsidian-cli` / `json-canvas` / `defuddle` | kepano's Obsidian authoring skills |
| `obsidian-graph-coloring` | My vault-workflow skill, already templated — fill in the `<VAULT_ROOT>` and `<OBSIDIAN_EXE>` placeholders inside `SKILL.md`, or skip it if you don't use Obsidian |
| `vault-pdf-ingest` | Same workflow, but this one names **real paths** on my machine (including an archive drive). Rewrite those to your own, or skip it |

**Placeholders, not my paths.** No skill in this package names a folder on my machine. Where a skill needs a location, it uses a marker you fill in once:

| Placeholder | What to put there | Used by |
|---|---|---|
| `<VAULT_ROOT>` | Your Obsidian vault folder | `vault-pdf-ingest`, `obsidian-graph-coloring`, `study-deck` |
| `<OBSIDIAN_EXE>` | Path to the Obsidian executable | `obsidian-graph-coloring` |
| `<DOWNLOADS>` | Where you keep scanned/hand-drawn reference PDFs | `study-deck` |
| `<ARCHIVE_DRIVE>` | Where finished work gets filed (e.g. an external drive) | `vault-pdf-ingest`, `thai-pdf`, `ship-ritual` |

Grep the installed skills for `<` to find them all. `honest-measurement` and `scientific-model` need nothing — no paths at all. `dark-motion-site` and `study-deck` point at reference builds that ship in `demos/`, using repo-relative paths that already work.

**Original sources** (to get updates later, instead of my copies):
- Office skills (docx/pptx/xlsx/pdf): https://github.com/anthropics/skills
- Obsidian skills: https://github.com/kepano/obsidian-skills

**Python dependencies.** Everything needed is in `requirements.txt` — `pip install -r requirements.txt`. The verified set, taken from the actual imports rather than guessed from skill names:

`defusedxml` · `lxml` · `numpy` · `openpyxl` · `pdf2image` · `pdfplumber` · `Pillow` · `playwright` · `pypdf` · `python-pptx` · `pymupdf`

Optional, only used by examples inside the skill docs: `reportlab`, `pytesseract`, `pypdfium2`, `pandas`.

> Note: **`python-docx` is not needed** despite the skill being called `docx` — it manipulates raw OOXML through `lxml` + `defusedxml`. `pymupdf` is used as `import fitz`, and is required by `thai-pdf` rather than by the Office skills.

**System dependencies.** These can't come from `pip`, and skills fail without them:

| Tool | Needed by | Windows | macOS | Debian/Ubuntu |
|---|---|---|---|---|
| LibreOffice | `docx` (accept tracked changes, PDF export), `pptx`, `xlsx` | `winget install TheDocumentFoundation.LibreOffice` | `brew install --cask libreoffice` | `apt install libreoffice` |
| Poppler (`pdftoppm`) | `docx` page images, `pdf2image` | `winget install oschwartz10612.Poppler` | `brew install poppler` | `apt install poppler-utils` |
| Pandoc | `docx` conversions | `winget install JohnMacFarlane.Pandoc` | `brew install pandoc` | `apt install pandoc` |
| Tesseract | `pdf` OCR | `winget install UB-Mannheim.TesseractOCR` | `brew install tesseract` | `apt install tesseract-ocr` |
| Headless Chrome | `thai-pdf` rendering | ships with Chrome | ships with Chrome | `apt install chromium` |

---

## 2. Install the plugins (NOT copyable — install from source)

Plugins can't be zipped and shared reliably (they're versioned installs tied to marketplaces). Install them fresh — inside Claude Code, run:

```
/plugin marketplace add https://github.com/affaan-m/ECC.git
/plugin install ecc@ecc

/plugin marketplace add pbakaus/impeccable
/plugin install impeccable@impeccable

/plugin marketplace add Leonxlnx/taste-skill
/plugin install taste-skill@taste-skill
```

What they are:
- **ECC** (https://github.com/affaan-m/ECC) — huge toolkit: code reviewers for every language, build fixers, planning commands, orchestration workflows, security scanning.
- **impeccable** (https://github.com/pbakaus/impeccable) — frontend design/UX review and polish. Amazing for making UIs feel professional.
- **taste-skill** (https://github.com/Leonxlnx/taste-skill) — design-taste skills: brand kits, minimalist/brutalist styles, image-to-code.

### Language server plugins (official, optional)

Only install the ones for languages you actually use — each one is a language server running in the background. I keep **typescript** and **pyright** enabled and the rest off; installing all seven costs memory for nothing.

```
/plugin install typescript-lsp@claude-plugins-official
/plugin install pyright-lsp@claude-plugins-official
/plugin install csharp-lsp@claude-plugins-official
/plugin install gopls-lsp@claude-plugins-official
/plugin install rust-analyzer-lsp@claude-plugins-official
/plugin install clangd-lsp@claude-plugins-official
/plugin install kotlin-lsp@claude-plugins-official
```

### ⚠️ Important ECC setting

ECC ships "continuous learning" hooks that write to your memory files automatically. I disable them so they don't overwrite my curated memory. Add this to `~/.claude/settings.json` (see `extras/settings-example.json`):

```json
"env": {
  "ECC_HOOK_PROFILE": "minimal",
  "ECC_DISABLED_HOOKS": "pre:observe:continuous-learning,post:observe:continuous-learning,stop:evaluate-session"
}
```

---

## 3. MCP servers (install fresh)

```
claude mcp add playwright -- npx @playwright/mcp@latest
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

- **playwright** — lets Claude drive a real browser: screenshot your pages, click around, QA animations. Essential for the website workflow.
- **context7** — up-to-date library documentation lookup.

Verify with `/mcp` after restarting Claude Code.

---

## 4. Extras (optional quality-of-life)

In `extras/`:
- **`PITFALLS.md`** — the one I'd copy first. Every entry is a real recorded mistake with its date, grouped into eight classes (editing files, N-place changes, claiming things are true, Bash-vs-PowerShell, encoding, browser QA, working with the user, measurement). Copy to `~/.claude/PITFALLS.md`.
- **`shell-guard.ps1`** — a `PreToolUse` hook that **blocks** six of those pitfalls outright instead of hoping Claude remembers them: Windows backslashes in Bash, `cd X && …`, `grep -P` with unicode ranges, `jq` when it isn't installed, non-ASCII writes under cp1252, and `--headless=new`. It exits 2 with an explanation, which Claude reads and works around. Copy to `~/.claude/tools/` and wire it up with the JSON block at the top of `PITFALLS.md`.
- **`CLAUDE-example.md`** — a de-personalised `CLAUDE.md`: a few absolute safety rules plus judgment-calls that can't be hooked, and the method for growing your own from your transcripts.
- **`statusline.ps1`** — custom status line showing model, color-coded context %, and session cost. Windows/PowerShell only. Copy to `~/.claude/statusline.ps1` and add the `statusLine` block from `settings-example.json`.
- **`themes/warm-amber.json`** — my custom warm-amber theme. Copy to `~/.claude/themes/` and set `"theme": "custom:warm-amber"` in settings.
- **`settings-example.json`** — my full settings.json (sanitized) as a reference.
- **`vault-colors.md`** — a slash command for Obsidian graph coloring (goes in `~/.claude/commands/`; Obsidian users only).

> The hook is the part people skip and shouldn't. A rule in `CLAUDE.md` is advice Claude may or may not recall under load; a `PreToolUse` hook is enforcement that fires every time. Put the mechanical traps in the hook and keep `CLAUDE.md` for the judgment calls.

---

## 5. Learning to make websites

Read **`WEBSITE-LEARNING.md`** — it covers the 4 inspiration sites (dark.design, calltoinspiration.com, durves.com, supahero.io), what each is for, and how the `dark-motion-site` skill turns that style into real code.

Then open the files in `demos/` in your browser — they're working, zero-dependency examples of every technique, and the skills reference them as their pattern library:

- **`demos/mouse-effects-demo.html`** — pointer suite (custom cursor, magnetic buttons, parallax, 3D tilt, spotlight)
- **`demos/dark-motion-techniques.html`** — scroll/reveal suite
- **`demos/dark-motion-slides.html`** — the whole vocabulary inside a presentation engine
- **`demos/neuron-to-brain/index.html`** — three.js particle-morph scrollytelling (open this one from the folder; it needs the `three.min.js` beside it)

`demos/study-deck/` holds the two reference builds for the `study-deck` skill — a Thai scroll-driven biology lesson and a zoom-step DNA replication deck.

All four `dark-motion-site` references and both `study-deck` references now ship **inside this package**, and the skills point at them with repo-relative paths — so they work as soon as you clone, with nothing to move.

---

## Quick-start test

After setup, restart Claude Code and try:

> "Build me a dark landing page like dark.design with mouse-move effects"

It should invoke `dark-motion-site` and produce a single-file HTML site. Have fun!
