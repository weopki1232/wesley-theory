---
description: Audit and fix Obsidian graph node coloring in the knowledge vault
---

# Vault Graph Colors — Audit & Fix

Ensure every node in the Obsidian graph is colored. Nodes show grey when they
lack a `tags:` entry matching a color group in `graph.json` (Obsidian's graph
reads `tags:`, NOT `field:`).

> **CUSTOMIZE ME:** Replace `<VAULT_ROOT>` with the vault path, `<OBSIDIAN_EXE>`
> with the Obsidian executable, and `domain-a..d` with the real subjects.

## Steps

1. **Run the audit in report mode** to see any uncolored nodes:
   ```
   powershell -File "<VAULT_ROOT>\.obsidian\scripts\vault-tag-audit.ps1" -Vault "<VAULT_ROOT>"
   ```

2. **If any `[WOULD FIX]` entries appear, apply the fix:**
   ```
   powershell -File "<VAULT_ROOT>\.obsidian\scripts\vault-tag-audit.ps1" -Vault "<VAULT_ROOT>" -Fix
   ```
   - Any `[MANUAL]` entries could not be auto-classified — read those files and
     decide the domain (`domain-a`/`domain-b`/`domain-c`/`domain-d`/`meta`),
     then add `tags: [domain]` to their frontmatter by hand.

3. **Verify `graph.json` still has all its color groups:**
   ```
   powershell -Command "(Get-Content '<VAULT_ROOT>\.obsidian\graph.json' -Raw | ConvertFrom-Json).colorGroups.Count"
   ```
   - Expected: the number in your `graph.json` (shipped template = **11**). If it
     returns 0 or fewer, Obsidian's running graph view wiped it. Restore it with
     the **quit → write → relaunch** procedure:
     a. `powershell -Command "Stop-Process -Name Obsidian -Force"`
     b. Write the groups back into `graph.json` (see color map below).
     c. `powershell -Command "Start-Process '<OBSIDIAN_EXE>'"`
     d. Confirm the count is correct again.

   > IMPORTANT: Never edit `graph.json` while Obsidian is running — the open
   > graph view overwrites it on every pan/zoom. Always quit first.

4. **Re-run step 1** to confirm `All nodes are colored. Nothing to do.`

## Color map (graph.json `rgb` values)

| Tag / Path | Color | rgb |
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
