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
| `honest-measurement` | **New.** Stops Claude believing a change worked because its own benchmark said so. For any "is this faster / smoother / did my optimisation work" question, any QA gate or A/B test. Its `pitfalls.md` is 16 real cases where a harness reported a clean number while measuring the wrong thing — the most useful file in this package if you ever profile anything |
| `scientific-model` | **New.** Makes diagrams of *real* things correct rather than merely plausible — anatomy, biology, molecules. Forces Claude to fetch a reference and actually look at it before drawing, then render-and-check the result. Ships 17 caught errors + 3 cached reference images. Pairs with `study-deck` for lessons where the picture has to be right |
| `docx` / `pptx` / `xlsx` / `pdf` | Anthropic's official Office skills — create/edit real Word, PowerPoint, Excel, PDF files |
| `obsidian-markdown` / `obsidian-bases` / `obsidian-cli` / `json-canvas` / `defuddle` | kepano's Obsidian authoring skills |
| `obsidian-graph-coloring` / `vault-pdf-ingest` | My vault-workflow skills — **these reference my vault paths** (`C:\Users\WIN11\Obsidian\Vault`), edit the paths inside SKILL.md to match your setup, or skip them if you don't use Obsidian |

**Heads-up on hard-coded paths.** Besides the two vault skills above, `study-deck`, `dark-motion-site` and `thai-pdf` also name paths on my machine (my Downloads folder, my archive drive) as their reference material. Nothing breaks if those paths don't exist — Claude is told to confirm they're there rather than assume — but tell your Claude to substitute your own equivalents, or just delete those lines. `honest-measurement` and `scientific-model` are the two skills with no machine-specific paths at all; they work as-is anywhere.

**Original sources** (to get updates later, instead of my copies):
- Office skills (docx/pptx/xlsx/pdf): https://github.com/anthropics/skills
- Obsidian skills: https://github.com/kepano/obsidian-skills

**Note on Python dependencies:** the Office and PDF skills need Python packages at runtime (they'll tell you which when first used — things like `python-docx`, `python-pptx`, `openpyxl`, `pypdf`, `pymupdf`). Install as needed with `pip install <package>`.

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

Only install the ones for languages you actually use:

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
- **`statusline.ps1`** — custom status line showing model, color-coded context %, and session cost. Windows/PowerShell only. Copy to `~/.claude/statusline.ps1` and add the `statusLine` block from `settings-example.json`.
- **`themes/warm-amber.json`** — my custom warm-amber theme. Copy to `~/.claude/themes/` and set `"theme": "custom:warm-amber"` in settings.
- **`settings-example.json`** — my full settings.json (sanitized) as a reference.
- **`vault-colors.md`** — a slash command for Obsidian graph coloring (goes in `~/.claude/commands/`; Obsidian users only).

---

## 5. Learning to make websites

Read **`WEBSITE-LEARNING.md`** — it covers the 4 inspiration sites (dark.design, calltoinspiration.com, durves.com, supahero.io), what each is for, and how the `dark-motion-site` skill turns that style into real code.

Then open the three files in `demos/` in your browser — they're working, zero-dependency examples of every technique, and the skill references them as its pattern library. **Keep them in your Downloads folder** (`~/Downloads/` or `C:\Users\<you>\Downloads\`) or edit the paths in `skills/dark-motion-site/SKILL.md` to wherever you put them.

---

## Quick-start test

After setup, restart Claude Code and try:

> "Build me a dark landing page like dark.design with mouse-move effects"

It should invoke `dark-motion-site` and produce a single-file HTML site. Have fun!
