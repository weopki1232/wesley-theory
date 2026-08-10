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

**This is an example, not your vault.** `domain-a`..`domain-d` stand in for whatever
subjects you actually tag; swap them for your own. The `path:` rows assume the wiki
layout this kit ships with. `rgb` is the decimal integer Obsidian stores — the hex is
alongside it so you can tell at a glance that a number is the colour it claims to be.

| Query | Color | rgb | hex |
|---|---|---|---|
| `path:wiki/index.md` | red | 16733525 | `#FF5555` |
| `path:wiki/overview.md` | teal | 1960374 | `#1DE9B6` |
| `tag:#index` | blue-grey | 6451876 | `#6272A4` |
| `path:wiki/synthesis/` | yellow | 15858316 | `#F1FA8C` |
| `path:wiki/entities/` | purple | 12424185 | `#BD93F9` |
| `path:wiki/sources/` | grey-blue | 8099754 | `#7B97AA` |
| `tag:#domain-a` | green | 5307003 | `#50FA7B` |
| `tag:#domain-b` | pink | 16742854 | `#FF79C6` |
| `tag:#domain-c` | orange | 16758892 | `#FFB86C` |
| `tag:#domain-d` | cyan | 9169405 | `#8BE9FD` |
| `tag:#meta` | lime | 11132022 | `#A9DC76` |

Each entry in the JSON array is: `{ "query": "<query>", "color": { "a": 1, "rgb": <rgb> } }`

**A table like this rots silently.** In the vault this skill was written for, it sat at
11 of 22 groups long enough for a whole new section of the vault to appear without the
skill ever mentioning it — and nothing complains, because a stale table is still a valid
table. Dump the live truth instead of trusting it:

```powershell
$g = Get-Content '<VAULT_ROOT>\.obsidian\graph.json' -Raw | ConvertFrom-Json
$g.colorGroups | ForEach-Object { $n=[int]$_.color.rgb
  "{0,-32} {1,9}  #{2}" -f $_.query, $n, $n.ToString('X6') }
```

If that count disagrees with your table, the vault is right — update the table, don't
edit graph.json to match it.

## Related
- Slash command `/vault-colors` runs this same procedure on demand.
- Vault `CLAUDE.md` INGEST step auto-runs the audit after every ingest.
