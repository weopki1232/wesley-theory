# Paste this note to your Claude

**First, make sure Claude Code is installed** — you can't paste this to it otherwise:

```
npm install -g @anthropic-ai/claude-code
```

Then run `claude` once and log in.

After that, unzip `claude-setup-for-friend-2026-08-05.zip` (anywhere is fine, e.g. your Downloads
folder). Open Claude Code **in that unzipped folder** if you can — but the note below tells Claude
how to find the folder either way. Paste everything between the lines.

---

I have a Claude Code setup package from a friend — the unzipped folder `claude-setup-for-friend`
(check my current folder first; if it's not here, look in my Downloads). Please set it up for me:

1. Read its `README.md` and `WEBSITE-LEARNING.md` first so you know what's in it.

2. Copy everything in its `skills/` folder into my `~/.claude/skills/` folder (on Windows, `%USERPROFILE%\.claude\skills\`). Don't overwrite any skill I already have with the same name — ask me first if there's a conflict.

3. **Fix the paths that point at my friend's machine.** Several skills name folders on their computer as their reference material, and those folders don't exist for me. Nothing breaks — the skills are written to check before assuming — but go through these and either substitute my equivalent folder or delete the line, asking me when you're not sure:
   - `dark-motion-site` — points at three demo HTML files. Move the 3 files from this package's `demos/` folder into my Downloads first, then update the paths to where they actually are on MY machine.
   - `study-deck` — points at my friend's Downloads (hand-drawn diagram PDFs) and their Obsidian vault for source material.
   - `thai-pdf` — mentions their archive drive as where deliverables get filed.
   - `vault-pdf-ingest` and `obsidian-graph-coloring` — these are built entirely around their personal Obsidian vault. Ask me whether I use Obsidian: if yes, repoint them at my vault; if no, don't install these two at all.
   - `honest-measurement` and `scientific-model` contain no machine-specific paths. Install those two exactly as they are and change nothing.

4. Set up my `~/.claude/settings.json` using `extras/settings-example.json` as reference. Merge carefully with whatever settings I already have and show me the diff before saving. Two things matter here:
   - Add the `extraKnownMarketplaces` entries.
   - **Add the ECC env vars `ECC_HOOK_PROFILE` and `ECC_DISABLED_HOOKS` exactly as the README lists them.** The ECC plugin I'm about to install ships "continuous learning" hooks that automatically write to my memory files in the background. These env vars switch those hooks off. Do this *before* I install the plugin, so it never gets a chance to overwrite anything of mine.
   - Skip the statusLine and theme parts unless I say I want them — they're Windows/PowerShell-specific extras.

5. Then give me the exact `/plugin marketplace add` and `/plugin install` commands from the README, one at a time, and wait for me to run each one myself — these are slash commands only I can type. For the language-server plugins, ask which languages I actually use and only give me those.

6. Give me the two `claude mcp add` commands (playwright and context7) from the README so I can run them in my terminal.

7. Tell me to restart Claude Code, then verify: the skills show up under `/`, the plugins are active, and `/mcp` shows both servers connected.

8. Finally, summarize what I got and suggest a first test — like asking you to build a dark landing page in the dark.design style.

Don't delete or overwrite anything of mine without asking.

Two of these skills should change how you work with me from now on, so treat them as standing habits, not as tools I have to ask for:

- `honest-measurement` — whenever I ask whether a change made something faster, smaller, or smoother, treat that as a claim that needs a measurement, not an opinion. If a number you produce looks surprising or too good, check your own harness against its `pitfalls.md` before you report it to me.
- `scientific-model` — whenever you draw or model a real thing (an organ, a cell, a molecule, a mechanism), fetch a reference and actually look at it before drawing, then check the rendered result against your own written spec before telling me it's done. Never draw anatomy from memory, even when you're sure.

Both have an append-only `pitfalls.md`. When a measurement misleads us, or a diagram turns out to be wrong, add the case to the right file in the same format as the existing entries. That habit is what makes these two get better over time instead of going stale.

---

That's it. Your Claude will handle the file work and walk you through the parts only you can run.
