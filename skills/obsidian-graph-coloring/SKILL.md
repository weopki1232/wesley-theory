---
name: obsidian-graph-coloring
description: Diagnose and fix uncolored (grey) nodes in the Obsidian knowledge vault's graph view. Use whenever the user mentions graph colors, grey/uncolored nodes, node coloring, color groups, or says nodes "aren't colored", "lost their color", or shows a screenshot of a grey Obsidian graph. Also use after ingesting new files into the vault to ensure new nodes are colored.
---

# Obsidian Graph Coloring

Keep every node in the vault's graph view colored. This skill fixes the two
distinct failure modes and is the canonical procedure — do not improvise.

> **CUSTOMIZE ME:** Replace `<VAULT_ROOT>` below with the absolute path to the
> vault, `<OBSIDIAN_EXE>` with the Obsidian executable path, and the domain tags
> `domain-a..d` with the real subjects. Keep these in sync with `graph.json` and
> `vault-tag-audit.ps1`.

## Background: the two root causes

1. **Wrong frontmatter key.** Obsidian's graph view colors nodes by `tags:`,
   NOT by `field:`. Nodes written with only `field:` show grey. Every concept
   node needs `tags:` whose first entry is a recognized domain:
   `domain-a | domain-b | domain-c | domain-d | meta` (index files use `index`).

2. **graph.json race condition.** While Obsidian is running, the open graph view
   holds the color groups in memory and overwrites `.obsidian/graph.json` on
   every pan/zoom. Editing that file while Obsidian runs gets stomped instantly.
   To change it you MUST: quit Obsidian → write the file → relaunch.

## Procedure

### Step 1 — Audit (always start here)
```
powershell -File "<VAULT_ROOT>\.obsidian\scripts\vault-tag-audit.ps1" -Vault "<VAULT_ROOT>"
```
Reports any node missing a recognized domain tag. Idempotent and safe.

### Step 2 — Fix node tags (if the audit flags anything)
```
powershell -File "<VAULT_ROOT>\.obsidian\scripts\vault-tag-audit.ps1" -Vault "<VAULT_ROOT>" -Fix
```
- Re-run Step 1 to confirm `All nodes are colored.`
- Any `[MANUAL]` entry couldn't be auto-classified — read the file, pick the
  domain, and add `tags: [domain]` to its frontmatter by hand.

### Step 3 — Verify graph.json has all color groups
```
powershell -Command "(Get-Content '<VAULT_ROOT>\.obsidian\graph.json' -Raw | ConvertFrom-Json).colorGroups.Count"
```
Expected: the number of groups in your `graph.json` (the shipped template has **11**).
If it returns 0 (Obsidian wiped it), restore via the quit→write→relaunch dance below.

### Restoring graph.json (only if the count is wrong)
1. Quit Obsidian: `powershell -Command "Stop-Process -Name Obsidian -Force"`
   then confirm 0 processes remain.
2. Write the color groups back to `.obsidian/graph.json` (color map below).
3. Relaunch: `powershell -Command "Start-Process '<OBSIDIAN_EXE>'"`
4. Wait ~5s, re-check the count.

> Never edit graph.json while Obsidian is open.

## Color map (graph.json colorGroups → rgb)

| Query | Color | rgb |
|---|---|---|
| `path:wiki/index.md` | red | 16733525 |
| `path:wiki/overview.md` | teal | 1960374 |
| `tag:#index` | blue-grey | 6451876 |
| `path:wiki/synthesis/` | yellow | 15858316 |
| `path:wiki/entities/` | purple | 12424185 |
| `path:wiki/sources/` | grey-blue | 8099754 |
| `tag:#domain-a` | green | 5307003 |
| `tag:#domain-b` | pink | 16742854 |
| `tag:#domain-c` | orange | 16758892 |
| `tag:#domain-d` | cyan | 9169405 |
| `tag:#meta` | lime | 11132022 |

Each entry in the JSON array is: `{ "query": "<query>", "color": { "a": 1, "rgb": <rgb> } }`

## Related
- Slash command `/vault-colors` runs this same procedure on demand.
- Vault `CLAUDE.md` INGEST step auto-runs the audit after every ingest.
