# Package improvements — paste this to Claude

> ## ⚠️ SUPERSEDED — read `AUDIT-RESOLUTION.md` first
>
> Kept as a record. F1, G1, G3, H1 and I1 below have been applied or resolved; **G2 was
> rejected** (it contradicts G1), and **H1's supporting evidence was wrong** —
> `frontend-slides` does carry font/language guidance, ~790 matches' worth. F1 is real
> and still open.

Continuation of `PACKAGE-GAPS.md`. That file covers things that are **broken or missing**.
This one covers things that are **worth adding** — each with the reason it's worth it, so you
can reject any of them on the merits rather than doing them because a list said so.

Sections continue the lettering from `PACKAGE-GAPS.md` (which ends at E).

Paste everything between the lines into Claude Code, opened in this folder.

---

I have a Claude Code setup package in this folder, and I've already given you `PACKAGE-GAPS.md`.
This is the follow-up: improvements rather than defects. Each item states its reason. If you
disagree with a reason after looking at the actual files, say so instead of implementing it.

## F. Fix the one real bug in `honest-measurement`

**F1. `prove_patch_applied()` is dead code.** It's defined at `templates/ab_perf.py:71` and
never called from `main()`.

**Why this matters more than a normal dead function:** it is the enforcement of the skill's own
Rule 2 — *"prove the manipulation happened before believing 'no effect'"*. The skill argues at
length that `"no effect"` and `"no experiment"` produce identical output, ships a function to
prevent exactly that, and then never runs it. A user trusting this template gets six of the
seven rules enforced and the seventh silently skipped.

**Why it isn't a one-line fix:** the function signature takes `pages` — a dict of several
simultaneously-open pages. The harness deliberately never has that. Refusal #2 in its own
docstring says one browser per condition, launched-measured-closed, because two Chrome
instances contend for the GPU (measured: 9.8 fps for a build that really runs at 38.5).

So wiring it in needs a small restructure. Suggested shape: probe each build's value as its
page opens in round 0, collect into a dict across the round, and assert the values differ
before any measurement is reported. Then raise if they match, as the function already does.
Show me the diff before committing it.

## G. Make `honest-measurement` match the scope it actually has

**G1. The README oversells it.** `README.md:34` pitches it for "any 'is this faster / smoother /
did my optimisation work' question, any QA gate or A/B test." It is a **browser / WebGL /
canvas** harness. The frontmatter `description:` is correctly scoped; the README isn't.

**Why:** overselling a measurement skill is a specific kind of harm — someone points it at a
database benchmark, finds the templates useless, and concludes the whole skill is
overengineered, when the seven *rules* were the valuable part all along. Narrow the README
claim to match the frontmatter.

**G2. Add a non-browser template — `templates/ab_process.py`.**

**Why:** rules 1–5 (interrogate defaults, prove the patch applied, patch the baseline too,
counterbalance A/B–B/A, print within-condition spread before any delta) are completely
domain-neutral. Only rules 6–7 and the liveness section are graphics-specific. Right now the
domain-neutral 70% of the skill ships with zero tooling, so any non-browser measurement starts
from a blank file and quietly skips the discipline.

Keep it small: time a subprocess or a Python callable across counterbalanced rounds, report
p50/p05, print the within-condition spread, and refuse to report a delta smaller than that
spread. Reuse the wording of the existing template's refusals so the two read as one family.

**G3. Add a "when NOT to measure" section to `SKILL.md`.** It currently scopes itself out of
statistical analysis, user studies, and anything unrunnable — but not out of questions whose
answer is *structural*.

**Why:** `TELL-YOUR-CLAUDE.md:48` installs this as a standing habit — "whenever I ask whether a
change made something faster, smaller, or smoother, treat that as a claim that needs a
measurement, not an opinion." Without a stated exception, that turns "I changed this from
O(n²) to O(n), is it faster?" into a four-round Playwright campaign to confirm arithmetic. A
skill that wastes the user's time on obvious cases gets switched off, and then it isn't there
for the non-obvious ones. Say plainly: when the mechanism is known and the effect size is
order-of-magnitude, reason about it and say so; measure when the mechanism is uncertain or the
effect is small enough to be noise.

## H. The gap I'd fix first: Thai typography exists only for PDF

**H1. Add Thai on-screen guidance to the HTML-producing skills** — `study-deck`,
`frontend-slides`, and `dark-motion-site`.

**Why this is the sharpest gap in the package:** the knowledge already exists here and is
locked in the wrong place.

- `thai-pdf` is built entirely around correct Thai shaping and says Chrome "renders Thai far
  better than reportlab/weasyprint." That skill is **PDF-only** — its own description routes
  on-screen work elsewhere: *"For on-screen slide decks use frontend-slides/study-deck
  instead."*
- `study-deck` is explicitly written for "a detail-oriented **Thai** STEM/olympiad student"
  (`SKILL.md:8`), and its own reference build is named `ติวสอบ-ระบบประสาท.html` — a Thai HTML
  lesson.
- Yet grepping `study-deck`, `frontend-slides`, and `dark-motion-site` for `thai`, `noto`,
  `sarabun`, `word-break`, `line-break`, or `lang=` returns **nothing** but those two prose
  mentions. No font stack, no language attribute, no wrapping guidance.

So the package routes Thai on-screen work to three skills that carry none of its hard-won Thai
knowledge. This bites in a specific way: Thai has no spaces between words, so a browser with a
wrong font stack or no `lang="th"` produces either tofu boxes or line breaks in the middle of
words — and it looks *almost* fine in a screenshot, which is how it ships.

Add a short shared section to those three skills: a Thai-capable font stack (Noto Sans Thai /
Sarabun with a Latin fallback), `lang="th"` on the container, `word-break`/`line-break`
handling for spaceless wrapping, and a note to check wrapping at narrow widths. Pull the
specifics from what `thai-pdf` already knows rather than inventing them.

## I. Diagrams are hard-gated; prose facts are not

**I1. Extend the reference discipline to numeric and factual claims in study material.**

**Why:** the package guards pictures far harder than it guards text, and for exam-prep material
that asymmetry is backwards.

- `scientific-model` hard-gates diagrams: fetch a reference, never draw anatomy from memory,
  write a spec, render it and *look*, then cross-check the domain.
- `study-deck` gathers sources properly (`SKILL.md:30-32`), but its escape hatch at `:33` is
  soft: *"If no source exists, say so and ask, or build to olympiad-level rigor and flag what
  to verify."*

A wrong diagram gets noticed when someone looks at it. A wrong constant, threshold, or
mechanism in revision prose gets **memorised** — which is worse, because the whole point of the
artifact is retention. The one place `study-deck` does hard-gate text is answer keys
(`:95`, "verify answer keys against the source PDF"), which shows the author already knows the
principle; it just isn't generalised.

Add a step to `study-deck`: before shipping, list every numeric claim and named mechanism in
the deck, mark each as sourced or unsourced, and surface the unsourced ones to the user
explicitly rather than only flagging them inline. Ask me before changing `scientific-model` —
it's the one skill in here I want left alone unless there's a clear reason.

## What I deliberately checked and am NOT suggesting

Don't spend time on these — I looked, and they're already handled:

- **The `pitfalls.md` append habit is not missing.** Both skills already carry it in their own
  bodies: `honest-measurement/SKILL.md:172` ("Compound — append after every measurement job")
  and `scientific-model/SKILL.md:74` ("Compound — make this better every time"). It does not
  need to be added, and it should not be moved out into a separate skill.
- **`study-deck` does not need a generic "gather sources" rule.** It has one at `:30`. Item I1
  above is narrower than that on purpose — it's about hard-gating the *unsourced remainder*,
  not about adding source discipline that already exists.
- **`obsidian-graph-coloring` does not need path fixes.** It's already templated with
  `<VAULT_ROOT>` / `<OBSIDIAN_EXE>`. See item A3 in `PACKAGE-GAPS.md`, which corrects the README
  for wrongly claiming otherwise.

When you're done, summarize what you changed, what you rejected and why, and anything you want
my decision on.
