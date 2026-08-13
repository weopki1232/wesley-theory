# Skill review log

Why this kit contains the skills it contains, and — more usefully — why it doesn't
contain the others. Every third-party skill considered gets judged against what is
already installed, then adapted and kept, or dropped with a stated reason.

The reasons are kept concrete on purpose. "Rejected: not useful" teaches nobody
anything; "rejected: it launches a background agent instead of writing a file, and
a note that dies with the session defeats the point" is a rule you can reuse.

---

## 2026-08-13 — mattpocock/skills + thananon/9arm-skills

Sources: [mattpocock/skills](https://github.com/mattpocock/skills),
[thananon/9arm-skills](https://github.com/thananon/9arm-skills).
Roughly 45 skills read, 7 adopted.

### Adopted (7)

| Skill | What it does |
|---|---|
| `handoff` | Writes an end-of-session handoff note somewhere durable so the next session can pick the work up. Says done vs not-done by name and tags every claim verified or assumed. |
| `writing-skills` | How to write a skill an agent actually obeys. Adds a container-choice step first: does this belong in `CLAUDE.md`, a skill, a hook, or a notes page? |
| `debug-discipline` | The order of operations for finding a fault. Check the recorded traps first, build a repro that is one red command, narrow the fail path, try to disprove the hypothesis before testing it, keep the ledger on disk. |
| `scrutinize` | Inline code/plan review. Always asks "is there a simpler version of this?" before reading line by line, and counts every place a change had to land. |
| `grill-me` | Interviews a vague idea into decisions you can defend. Works a design tree in rounds, asking only the decisions whose prerequisites are already settled, each with a recommended answer. |
| `prototype` | Throwaway code that answers one question talking cannot settle. Either a self-contained HTML state demo, or several UI variants that must disagree about structure, not colour. |
| `wait-what` | Re-pitch a message that did not land. Works out how far back comprehension failed and supplies the missing premise, instead of just cutting words. |

Two more were **folded in rather than installed**:

- **`diagnosing-bugs`** competes directly with `debug-discipline`, so its four real
  additions went into that file instead of shipping a second, rival debugging skill.
- **`git-guardrails-claude-code`** is a hook, not a skill. Its rules went into
  `extras/shell-guard.ps1` as a second contract, where they are enforced rather than
  merely read.

### Rejected

| Skill | Reason |
|---|---|
| `karpathy-guidelines` | Always-on coding behaviour, so a skill is the wrong container — nothing would ever trigger it. Its one real gap was promoted into `CLAUDE.md` instead; see the note below. |
| `claude-handoff` | Launches a background agent instead of writing to disk. A handoff that dies with the session is not a handoff. |
| `post-mortem` | 13.5 KB of org ceremony — JIRA payloads, owners, tracking tickets. Its one good idea (write the incident down) is already done shorter by `PITFALLS.md`. |
| `management-talk` | Rewrites content for an engineering org's leadership. Solo builder, no org. |
| `qwen-agent` | Requires the author's personal alias to his own Qwen gateway. |
| `qwenchance` | Half of it argues against harness behaviour that is already handled (auto-compaction, a statusline reporting context %). The other half is real, but a skill is the wrong container — an agent stuck in a loop will not notice it should load an anti-loop skill. |
| `teach` | Closest call. The `study-deck` + `vault-pdf-ingest` pair already is the accumulating study workspace, and the upstream doc admits three unfixed defects, including the correct quiz answer landing in slot A 33 times out of 33. |
| `to-spec`, `to-tickets`, `wayfinder`, `triage` | Ticket machinery. All of it needs an issue tracker configured first, and each is one step of a five-skill chain. |
| `resolving-merge-conflicts` | Solo work on local repos. |
| `code-review`, `improve-codebase-architecture`, `codebase-design` | `scrutinize` plus the ECC reviewers already cover this. |
| `implement`, `domain-modeling`, `to-questionnaire`, `tdd`, `research`, `wizard` | Chain-dependent or already covered. |
| `grill-with-docs` | Needs `domain-modeling`, which is not installed. |
| `ask-matt`, `setup-matt-pocock-skills` | Routers for the author's full set. |

### Three lessons from the review itself

- **Never rule a skill out on `SKILL.md` size.** The first pass cut 34 of 37 skills
  from one repo for having tiny SKILL.md files. That repo keeps its content in a
  parallel `docs/` tree, so `grill-me` is a 147-byte pointer that reads as a stub —
  and turned out to be one of the best skills there. Read the body it points at.
- **A skill that names another skill does not reliably load it.** The upstream author
  documents this failure himself. Where an adopted skill was split into a front door
  plus a primitive, the two were collapsed into one file.
- **Re-judge a rejection when the reason it rested on changes.** One skill was
  rejected partly because of a standing budget rule. When that rule was removed, the
  skill was read again from source. The verdict held, but for a different and
  stronger reason — and the old argument was struck out rather than left to be
  reused.

### Note on `karpathy-guidelines`

Worth spelling out, because it is the clearest example of the container test from
`writing-skills`. Section by section: §1 *Think Before Coding* is already in most
base instructions; §2 *Simplicity First* is a real gap while writing, but generic,
and `scrutinize` already forces a simpler-alternative pass when reviewing; §4
*Goal-Driven Execution* is covered by `debug-discipline`'s repro bar and
`honest-measurement`. **§3 *Surgical Changes* was the one real gap**, and it is now
a `CLAUDE.md` safety rule in `extras/CLAUDE-example.md`: clean up only the orphans
your own change created, and *mention* pre-existing dead code rather than deleting
it.

A skill only loads when something invokes it. Always-on coding behaviour never gets
invoked, so it would sit unread. `CLAUDE.md` or nothing.
