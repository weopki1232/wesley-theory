# Paste this note to your Claude

**First, make sure Claude Code is installed** — you can't paste this to it otherwise:

```
npm install -g @anthropic-ai/claude-code
```

Then run `claude` once and log in.

After that, get the package:

```
git clone https://github.com/weopki1232/wesley-theory.git
```

Open Claude Code **in that folder** if you can — but the note below tells Claude how to find it
either way. Paste everything between the lines.

---

I have a Claude Code setup package from a friend — the folder `wesley-theory`
(check my current folder first; if it's not here, look in my Downloads). Please set it up for me:

1. Read its `README.md` and `WEBSITE-LEARNING.md` first so you know what's in it.

2. Copy everything in its `skills/` folder into my `~/.claude/skills/` folder (on Windows, `%USERPROFILE%\.claude\skills\`). Don't overwrite any skill I already have with the same name — ask me first if there's a conflict.

3. **Fill in the placeholders.** The skills use `<PLACEHOLDER>` markers instead of real paths, so nothing points at anyone else's machine. Search the installed skills for `<` and replace these with my own locations, asking me when you're not sure:
   - `<VAULT_ROOT>` — my Obsidian vault folder. Used by `vault-pdf-ingest`, `obsidian-graph-coloring`, and `study-deck`.
   - `<OBSIDIAN_EXE>` — path to the Obsidian executable (`obsidian-graph-coloring` only).
   - `<DOWNLOADS>` — where I keep scanned/hand-drawn reference PDFs (`study-deck`).
   - `<ARCHIVE_DRIVE>` — where finished work and source PDFs get filed, e.g. an external drive (`vault-pdf-ingest`, `thai-pdf`, `ship-ritual`, `handoff`).
   - `<PROJECTS_ROOT>` — where my project folders live (`handoff`).

   Two notes: `dark-motion-site` and `study-deck` reference builds all ship inside this package's `demos/` folder with repo-relative paths, so those need nothing. And if I don't use Obsidian, just don't install `vault-pdf-ingest` or `obsidian-graph-coloring` at all — ask me first.
   - `honest-measurement`, `scientific-model`, and the seven working-discipline skills (`debug-discipline`, `scrutinize`, `grill-me`, `prototype`, `writing-skills`, `wait-what`, and `handoff` apart from the two markers above) contain no machine-specific paths. Install those exactly as they are and change nothing.

4. Set up my `~/.claude/settings.json` using `extras/settings-example.json` as reference. Merge carefully with whatever settings I already have and show me the diff before saving. Two things matter here:
   - Add the `extraKnownMarketplaces` entries.
   - **Add the ECC env vars `ECC_HOOK_PROFILE` and `ECC_DISABLED_HOOKS` exactly as the README lists them.** The ECC plugin I'm about to install ships "continuous learning" hooks that automatically write to my memory files in the background. These env vars switch those hooks off. Do this *before* I install the plugin, so it never gets a chance to overwrite anything of mine.
   - Skip the statusLine and theme parts unless I say I want them — they're Windows/PowerShell-specific extras.

5. **Install the guard hook** — `extras/shell-guard.ps1` goes in `~/.claude/tools/`, and the `PreToolUse` JSON block at the top of `extras/PITFALLS.md` goes in my settings. Also copy `extras/PITFALLS.md` to `~/.claude/PITFALLS.md`. This is the part people skip: the hook blocks six silent-failure traps *and* six destructive git commands before they run, instead of hoping you remember them. Windows/PowerShell only — if I'm on Mac or Linux, tell me so and read the rules as a checklist instead.

6. Then give me the exact `/plugin marketplace add` and `/plugin install` commands from the README, one at a time, and wait for me to run each one myself — these are slash commands only I can type. For the language-server plugins, ask which languages I actually use and only give me those.

7. Give me the two `claude mcp add` commands (playwright and context7) from the README so I can run them in my terminal.

8. Tell me to restart Claude Code, then verify: the skills show up under `/`, the plugins are active, and `/mcp` shows both servers connected.

9. Finally, summarize what I got and suggest a first test — like asking you to build a dark landing page in the dark.design style.

Don't delete or overwrite anything of mine without asking.

Four of these skills should change how you work with me from now on, so treat them as standing habits, not as tools I have to ask for:

- `honest-measurement` — whenever I ask whether a change made something faster, smaller, or smoother, treat that as a claim that needs a measurement, not an opinion. If a number you produce looks surprising or too good, check your own harness against its `pitfalls.md` before you report it to me.
- `scientific-model` — whenever you draw or model a real thing (an organ, a cell, a molecule, a mechanism), fetch a reference and actually look at it before drawing, then check the rendered result against your own written spec before telling me it's done. Never draw anatomy from memory, even when you're sure.
- `debug-discipline` — whenever something is broken, failing, hanging, or quietly producing a wrong number, load this *before* proposing a fix. Check the recorded traps in `PITFALLS.md` first, then get me a repro that is one red command. A fix aimed at a symptom whose cause was never found is the most expensive thing you can hand me.
- `scrutinize` — before shipping anything non-trivial, review it inline in the same session rather than spawning a reviewer that has to re-derive why we did any of it. Start with "should this change exist at all?", and cite `file:line` for every claim.

Both have an append-only `pitfalls.md`. When a measurement misleads us, or a diagram turns out to be wrong, add the case to the right file in the same format as the existing entries. That habit is what makes these two get better over time instead of going stale.

---

That's it. Your Claude will handle the file work and walk you through the parts only you can run.
