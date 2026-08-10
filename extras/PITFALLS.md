# PITFALLS.md - errors this machine has actually made, as pre-flight checks

Every entry below is a real recorded incident from a session transcript, with its date.
This file exists because the classes that got a pitfalls file (scientific-model,
honest-measurement) stopped recurring, and the classes that only got a memory line
did not. Read the relevant section BEFORE the action, not after it fails.

Append new entries when an error is caught. Never delete one.

> **Reading this on another machine:** the incidents are kept concrete on purpose —
> a rule stripped of its story gets ignored. `C:` is the working drive, `E:` the
> archive/backup drive, and paths under `C:\Users\<name>\` are that machine's home
> folder. Substitute your own; the failure modes transfer unchanged.
>
> **To enforce the mechanical ones automatically:** `shell-guard.ps1` in this folder
> is a `PreToolUse` hook that blocks six of these outright (sections D and E) by
> exiting 2 with an explanation, which Claude then reads and works around. Wire it up
> in `settings.json`:
>
> ```json
> "hooks": {
>   "PreToolUse": [{
>     "matcher": "Bash|PowerShell",
>     "hooks": [{
>       "type": "command",
>       "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"%USERPROFILE%\\.claude\\tools\\shell-guard.ps1\"",
>       "timeout": 10
>     }]
>   }]
> }
> ```
>
> The rules it cannot check — the ones needing judgment — belong in `CLAUDE.md`
> instead. See `CLAUDE-example.md`.

---

## A. Before editing a file (6 recorded failures)

**A1. A prior edit in the same batch invalidates every later `old_string`.**
Two edits queued against `subjects.js`; the first shifted nearby text, the second
failed to match. (2026-07-16, twice; `schedule.js` same day.)
-> Batch edits only when the targets are far apart. Otherwise re-read between them.

**A2. When `old_string` fails, grep the exact bytes - do not guess again.**
Guessed context `'</select>' + '<input type="number"...` did not exist. Fixed by
`grep -o '.\{20\}class="subj-icon">'` and using the literal result. (2026-07-16.)
A second guess costs the same as a grep and is usually also wrong.

**A3. "File has not been read yet" means you read a DIFFERENT path.**
Read the live `references/README.md`, wrote to the bundle copy. Same name, different
file. (2026-08-05.)

**A4. Big structural rewrites: splice by marker, then syntax-check.**
168-line deletion and 172-line function replacement done via Python marker splice
with `io.open(..., newline='\n')` + `node --check` after each. Zero failures.
(2026-07-16.) This is the method that works - use it, don't hand-edit blind.

---

## B. Changing the same thing in N places (5 recorded failures, highest severity)

**B1. Count the sites first, then assert you changed all of them.**
The densify edit updated 5 of 8 `brainRegion` thresholds. `else if(f<0.68)` became
dead code, so real midbrain geometry rendered in cerebellum colour on the wrong beat
- inside a build labelled "real anatomy". Found only because the user asked for a
review. (2026-07-20.)
-> Before: `grep -c` the pattern. After: `grep -c` again and state both numbers.

**B2. A tool that "fixes all" usually means "all of a subset you didn't check."**
`git add --renormalize -A` re-adds only ALREADY-TRACKED paths, so the brand-new
untracked `.gitattributes` was never staged. I reported the restore fixed; 98/368
files were still byte-wrong. Caught by `git ls-files | grep -c gitattributes` = 0
*in the clone*. (2026-08-05.)
-> Verify the fix from the consumer's side, not the producer's.

**B3. If the plan says "full sweep", do the full sweep.**
Plan section 3 said "full 20-station QA pass"; ~4 states were spot-checked and the
step was marked done. (2026-07-20.)

**B4. Same class, user-caught:** custom emoji built for one theme, "other's might've
slipped out" (user, 2026-07-17). A per-theme/per-item change needs a per-item roll call.

---

## C. Before claiming something is true (7 recorded failures)

**C1. This user verifies. Answer from source, never from the memory note.**
Described the modelling pipeline confidently from notes; user pushed back with "you
sure you can recall how we make this right?" I had not re-read the code.
(2026-07-22.) See memory `verify-dont-recall`.

**C2. A memory note can be wrong. It records what was true when written.**
The v11.1 memory claimed thresholds were already 0.75/0.88/0.93. They were not.
(2026-07-20.) A roadmap item was marked open that had been done five days earlier.
(2026-07-09.)
-> Re-check the file/flag/command still exists before recommending it.

**C3. Do not assert a third-party capability from memory - ask the tool.**
Assumed Canva had a "Match & Move" morph transition. It does not. Caught only by
querying Canva's own help tool. (2026-08-06.)

**C4. Do not overclaim provenance or licensing.**
Wrote "three cached public-domain reference images" when only one (the Gray's plate)
was verifiable. Corrected before shipping. (2026-08-05.)

**C5. Correct yourself out loud when a stated basis turns out wrong.**
I had called `/usage` a check against server-side truth; its own text says
"approximate, based on local sessions on this machine". (2026-08-05.)

---

## D. Shell: Bash vs PowerShell on this box (5 recorded failures)

**D1. `cd X && ...` does not persist, and breaks later relative paths.**
`cd realmesh &&` changed cwd and silently broke subsequent relative greps
(2026-07-26). A compound block re-ran a "PROJECTS REPO" check inside the vault
directory (2026-08-05).
-> Use absolute paths, or `git -C <path>`.

**D2. Bash eats backslashes in Windows paths.**
`C:\Users\You\Projects...` arrived as `C:UsersYouProjects`. (2026-07-26.)
-> Windows paths go through the PowerShell tool, or use forward slashes.

**D3. The `!` prefix runs BASH, not PowerShell.**
I handed the user PowerShell call-operator syntax (`& "C:\...\gh.exe"`); it errored
twice with `syntax error near unexpected token '&'`. Working form was a bash-quoted
forward-slash path with no `&`. (2026-07-15.)

**D4. Git Bash is missing tools and silently fails at Unicode.**
`jq: command not found` (2026-07-09). `grep -nP` with `\x{1F300}` ranges returned
nothing rather than erroring - the Grep tool (ripgrep) found everything. (2026-07-16.)
An unquoted `find` loop exploded on "RATH Center" and Thai filenames. (2026-07-21.)

**D5. PowerShell 5.1 specifics that have each cost real time.**
- Function name `R` collides with the built-in alias for `Invoke-History`. (2026-07-21.)
- `$a[1..0]` REVERSES and returns 2 elements -> infinite loop, 120s timeout. (2026-07-21.)
- `-f` binds tighter than `+`: `$pct + ('{0:N2}' -f $cost)` collapses into one
  argument. Use a 3-argument format string. (2026-08-05.)
- Robocopy exit code 1 means SUCCESS (files copied). 0-7 are all ok. (2026-08-05.)
- Spawned `powershell -File` dies under ExecutionPolicy Restricted even when the
  same script runs clean in-session. (2026-07-09.)
- `Set-ScheduledTask` needs elevation even for a task that runs as the user. (2026-08-05.)
- Do not redirect a native exe's stderr; it wraps lines in ErrorRecords. Pipe
  through `| Out-String` instead. (2026-08-06.)
- **`{...}` and `^` in a git revision are eaten by PowerShell.** Unquoted
  `rev-parse HEAD^{tree}` arrives as two arguments; git errors on `HEAD^` and
  rev-parse echoes the literal string back. Both sides of my C:-vs-E: comparison
  then returned `"HEAD^"`, so `$c -eq $e` printed **"MATCH - identical tree"**
  while comparing nothing. Quote it: `rev-parse 'HEAD^{tree}'`. (2026-08-09.)
  -> The general form of the bug is in C: an equality check between two failed
  commands always passes. Assert the *shape* of what came back (40 hex chars),
  not only that the two sides agree.

---

## E. Encoding - the single most repeated class (12 recorded failures)

**E1. Keep .ps1 sources pure ASCII.**
PowerShell 5.1 reads a UTF-8-no-BOM script as ANSI. An em dash became `a**"` and
threw a parser error. Fixed with `$dash = [char]0x2014`. (2026-07-21.)

**E2. Do not print non-ASCII from a script.**
`UnicodeEncodeError` printing an arrow from a Python script editing MEMORY.md; used
the Edit tool instead. (2026-07-26.) Python default encoding wrote a cp1252 em dash
into a JS file, which then failed to read back (`byte 0x97`). Fixed with
`open(out,'w',encoding='ascii')`. (2026-07-20.)

**E3. A BOM makes line 1 not match `^---`.**
Flagged ~10 vault files as having unclosed frontmatter. Fix: `.TrimStart([char]0xFEFF)`.
(2026-07-21.)

**E4. Git and Thai filenames / line endings.**
`git ls-files` escapes Thai names -> `git config core.quotepath off`. A clone from
exFAT E: hits "dubious ownership" -> `git -c safe.directory='*'`. A fresh clone
ignores repo-local `core.autocrlf=false` -> commit `.gitattributes` with `* -text`.
(all 2026-08-05.)

---

## F. Browser QA (9 recorded failures)

**F1. Playwright screenshots land in `C:\Users\You\`, not `.playwright-mcp\`.**
Hit at least 4 times (2026-07-16 x2, 2026-07-22, 2026-07-20). Relative paths resolve
to the home dir and then ENOENT.
-> Use absolute project paths; sweep the home dir into scratchpad afterwards.

**F2. Chrome serves stale JS even when curl proves the server is fresh.**
Ctrl+Shift+R via Playwright did NOT work. What worked:
`await Promise.all(urls.map(u=>fetch(u,{cache:'reload'})))` over every `script[src]`
and stylesheet, then `location.reload()`. (2026-07-16.) A same-name same-size data
file needed a `?v=2` cache-buster. (2026-07-20.)
-> Before blaming code for "my edit did nothing", bust the cache first.

**F3. Playwright blocks `file://`.** Serve over HTTP. (recurring, 2026-07-20.)

**F4. Smooth scroll silently ruins scroll measurements.**
`scrollspeed.py` returned all zeros; scrollY sat at 34703 against a requested 75960.
Fix: `scrollBehavior='auto'`. (2026-07-26, and again 2026-07-20.)

**F5. Headless Chrome: use old `--headless`, not `--headless=new`.**
With `--no-sandbox` and an explicit `--user-data-dir`. (2026-08-06.)

---

## G. Working with the user (recorded redirects)

**G1. Re-anchor before iterating.** "im lost in what we're doing" came after I had
iterated on art for several rounds without restating the plan. (2026-08-06.)

**G2. Change one variable per iteration.** Iteration 4 of the volcano print REGRESSED
on five axes at once; root cause recorded as "too many variables changed at once".
(2026-08-06.)

**G3. Confirm who/what the deliverable is for.** I advised "skip steps 2 and 3, they
already did them in July"; the user replied "this is a new friend btw ;-;".
(2026-08-05.)

**G4. Say which items are done and which are not, by name.**
"which one did you do the fixing and which one did you didn't" (user, 2026-07-19).
"i've found that the terminal is closed and no where to be found" (user, 2026-07-16).
-> An unattended/overnight run must leave a written report on disk, not only in chat.

**G5. Design-hook findings: triage, state the verdict, never silently suppress.**
This has been handled correctly every time (impeccable em-dash, side-tab,
numbered-markers, flat-type-hierarchy). Keep doing it: fix real ones, classify
intentional ones out loud, and leave `ignore-*` commands to the user.

---

## H. Measurement and science

Not duplicated here. Those catalogues already exist and are working:
- `~/.claude/skills/honest-measurement/pitfalls.md` - 17 rules (harness lying, warm-up
  bias, counterbalancing, liveness, proving the patch applied)
- `~/.claude/skills/scientific-model/pitfalls.md` - 22 rules (anatomy correctness)
- `~/.claude/skills/ship-ritual/pitfalls.md` - 4 rules (release recording)
Read those before benchmarking or before drawing anything real.

---

## I. Publishing a repo to a public host (4 recorded failures, all 2026-08-10)

All four came from one afternoon spent putting this package on GitHub. Publishing
is unusually unforgiving: the mistakes are visible to strangers before you notice
them, and several of them cannot be taken back by editing.

**I1. Never seed a git identity from a nearby repo's config.**
A fresh clone had no `user.email`, so the address was copied from a neighbouring
repo on the same machine - the author's real personal one - and two commits went
out with it. The host matched it to their account and printed their real name on
the public repo's front page. They spotted it in a screenshot; the tooling never
flagged it. Cost: two history rewrites and two delete-and-recreate cycles, which
also destroyed the repo's rename redirect and broke a link already sent to someone.
-> When a repo is or may become public, decide which identity to commit under
BEFORE the first commit. A missing `user.email` is a question to ask, not a gap to
fill from whatever is next door.

**I2. `<name>@users.noreply.github.com` is NOT anonymous - it resolves to that user.**
The first fix used a plausible-looking `<name>@users.noreply.github.com`. That form
belongs to whoever actually holds the username, and in this case it was a real,
long-standing account owned by an unrelated stranger - so the "anonymised" commits
were now attributed to a person who had nothing to do with them. The genuinely
unlinkable forms are `<numeric-id>+<name>@users.noreply.github.com` using your own
ID, or a reserved domain such as `example.com`, which nobody can register.
-> After any authorship rewrite, query the API for the pushed commit's
`.author.login`. `NONE` is the pass condition. Reading the display name back is not
enough - the name was already correct in the broken case.

**I3. Run the check a backup exists for BEFORE deleting the backup.**
With the rewrite pushed, deleting the pre-rewrite bundle looked obviously safe:
`filter-branch --env-filter` touches author/committer variables and cannot alter
file trees. True - and still the wrong basis, because that had been reasoned, not
measured. Only blob counts on the remote had ever been checked, never a pre-vs-post
tree comparison, and deleting the bundle would have made that comparison impossible
forever. Running it took a minute and passed: all 6 pre-rewrite commits had
byte-identical trees.
-> A backup may be discarded once the verification it enables has actually been
run, not once you have argued that it would pass. Ask what this artifact is the
last copy of, and which question only it can answer.
-> Give the comparison something it must still be able to see. Here it matched 6
commits and flagged the 7th - a later commit, correctly absent from the bundle.
That disagreeing line is the control; without one, "no differences" is
indistinguishable from a comparison that silently examined nothing. See section C.

**I4. On Windows, `core.autocrlf` makes a repo differ from its own source files.**
Comparing the live skills against the checked-out repo reported all 234 files
different, then a single file 418 lines different when it was byte-identical in
substance. Cause: `core.autocrlf=true` (the Git-for-Windows default) stores LF in
the index and writes CRLF into the working tree, while the source files git never
touches stay LF. Commits are unaffected - git normalises back on the way in - but
every naive diff, hash or file-compare between the two trees is pure noise, which
either provokes a needless full re-sync or hides the two files that really are stale.
Worse, the first attempt to *measure* the problem used a shell one-liner whose `\r`
was eaten by quoting; it detected zero CRs and reported everything clean.
-> Commit a `.gitattributes` with `* text=auto eol=lf` so the working tree matches
the source and checkout is deterministic for everyone who clones, whatever their
local setting. Until then compare with `diff --strip-trailing-cr`, or ask git
directly with `git ls-files --eol`.
-> A line-ending detector that reports "all clean" is the easiest thing in this
file to get wrong. Test it against a file you know has CRLF before believing it.
