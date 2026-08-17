# pitfalls.md — releases that shipped fine and recorded badly

Append-only. Rule first, story second.

Seeded 2026-07-26. The pattern in every entry: **the code was correct and the
record was not**, so the cost landed weeks later on somebody trying to find out
what state the work was in.

> **Reading this on another machine:** these are real incidents, kept concrete on
> purpose — a rule without its story gets ignored. `C:` is the working drive, `E:`
> the archive/backup drive, and `sync-archive.ps1` is that setup's additive sync
> script. Substitute your own equivalents as you read; the failure modes transfer
> unchanged.

---

## 1. A stale SHIPPED banner is worse than no banner

Found 2026-07-26 while writing this skill: `wiki/projects/neuron-to-brain.md`
still announced **v13.1** in its `> [!success] SHIPPED` callout, with v13.1's tag
and commit range, after v13.2 had shipped, been tagged, committed and mirrored.
`PROJECTS-INDEX.md` had v13.2. The memory file had v13.2. The vault page — the
one the user's own notes designate as the source of truth for *"did we finish
X?"* — was the single place that was wrong.

Cause: v13.2 was a small follow-up (one constant, one rebuild) after the "big"
release, and the ritual ran fully for v13.1 and partially for v13.2. **The small
follow-up release is the dangerous one**, because it does not feel like a
release.

**Rule.** Any change that gets a tag gets all seven steps. If a step is skipped,
say so in the completion report rather than leaving the discrepancy to be found
later. And when steps disagree, the vault page is the one to trust least — it is
the furthest from the code and the easiest to forget.

---

## 2. An additive mirror never forgets a file you renamed

`sync-archive.ps1` uses `robocopy /E` deliberately: `E:\Projects` holds
archive-only projects that exist nowhere on C:, so `/MIR` would delete them, and
`E:\` is delete-guarded besides.

The cost of that choice is that renames and deletions on C: leave **stale copies
on E: forever**. The old name sits there looking exactly as authoritative as the
new one.

**Rule.** After any release that renamed or deleted files, name the stale E:
copies explicitly in the report and let the user decide. Do not clean them
yourself — that is a delete on the guarded drive.

---

<!-- APPEND NEW ENTRIES BELOW THIS LINE. Never delete or rewrite an entry. -->

## 3. Step 4's "verify, do not assume" can itself be a false pass

2026-08-09, releasing v1.0 of a prototype finance app — a personal side project,
not a shipped product. To prove the archive mirror held the real history I
compared committed tree hashes on both sides. PowerShell split the unquoted
`rev-parse HEAD^{tree}` into two arguments, git failed on both sides, and
rev-parse echoed the literal string `HEAD^` back each time — so the equality
check printed **"MATCH — the E: repo holds the identical committed tree"**
having compared one error message to another. Nothing was verified.

The file-count check the skill already prescribes would not have caught this
either: counts came back 3737 on C: and 4682 on E:, and both numbers were
*correct* — the surplus was 944 stale `node_modules` files and 2 orphaned
content-hashed `dist/` bundles from the additive sync (entry 2), all
gitignored and regenerable. A count mismatch is not evidence of damage, and a
count match would not have been evidence of health.

**Rule.** A comparison between two commands that both failed always passes.
Assert the **shape** of the value you got back — a commit hash is 40 hex
characters — before asserting the two sides agree. And when file counts
differ, resolve *which* files before reporting anything; on this drive the
answer is usually the additive sync, not corruption.

---

## 4. Step 3 says "commit" — it does not say *which repo*, and step 6 stops one index short

2026-08-09, found by auditing that same prototype's release an hour after reporting
it done. Two separate misses, same shape: the ritual named a target, I hit that
target, and the neighbouring one went untouched.

**The repo.** The app was its own git repo nested inside `<PROJECTS_ROOT>`, which
is also a repo. I committed and tagged the nested one, and reported "Projects
git history updated" — which was step 4's sync *copying* `Projects\.git` to E:,
not my changes entering it. The parent's HEAD was still the previous day's
snapshot. So `tools\browser-qa\` — the reusable harness that was the most
portable thing the release produced, and the subject of its own technique page —
existed as loose files on C: and E: and **in no history anywhere**, while
`PROJECTS-INDEX.md` promised things were "recoverable from `Projects\.git`".

**The index.** Step 6 sends you to the vault *project page*, and `projects-index.md`
is the obvious neighbour, so both got updated. `wiki/index.md` — the master
catalog, which has its own Projects and Techniques lists — did not. It turned
out to have been drifting for weeks: 10 project entries against 14 real pages,
8 technique entries against 14.

**Rule.** After committing, run `git status` in **every** repo the release
touched, parent included, and paste the result. A nested project repo going
clean says nothing about the repo containing it. And when adding a vault page,
grep the vault for every file that lists pages of that type before declaring
step 6 done — `wiki/index.md` and `wiki/projects-index.md` are two places, and
the count in each is checkable against `ls wiki/projects/`.

---

## 5. A rename is an N-place change, and steps 5-6 are where nobody counts

2026-08-17, found while closing out an unrelated release on the same project. A
public repo had been renamed four days earlier. The remote redirected, the clone
kept working, every command succeeded — and **four days later four records still
named the old repo**: the projects index twice (including a present-tense "now
lives at"), and the vault project page in both its `mirror:` frontmatter and its
Architecture section. The same release had grown the package from 18 skills to
25, and all four places still said 18.

Worse, the status had gone three ways: the project page said `shipped`, while
`wiki/index.md` and `wiki/vault-state.md` both said `archived` — for a repo being
actively pushed to that same afternoon. Entry 1 predicted this and named the
vault page as the one to trust least; here the vault page was **right** and the
two indices above it were wrong. So the direction of rot is not fixed, and
"trust the code, then the index, then the vault" is not a reliable ordering.
Checking them against each other is.

**Cause.** A rename produces no failure anywhere. Nothing breaks, no gate goes
red, and the redirect actively hides it — so steps 5 and 6 are never *prompted*
by a symptom the way a broken build prompts step 1. It surfaced only because a
release touching the same project ran the full ritual.

**Rule.** Treat a rename, a version bump, or a count change (skills, nodes,
files) as an N-place change and count it: `grep -c` the **old** name across the
projects index, the vault project page, `wiki/index.md`, `wiki/vault-state.md`
and your agent's memory files, before and after, and state both numbers. The
pass condition is zero *present-tense* mentions — past-tense history ("renamed
from X on <date>") should stay, so the count will not reach zero and a bare
count is not the test. And when two records disagree about status, resolve it
against the thing itself (is anyone still pushing to it?), not against a
precedence rule about which file usually lies.
