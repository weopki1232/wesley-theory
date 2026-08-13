---
name: handoff
description: Write a handoff document so another session (or another agent) can pick up this work mid-flight. Use ONLY when the user explicitly asks for a handoff, says they are stopping/switching/running out of context, or types /handoff. Do not invoke on your own.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

# Handoff

Adapted from mattpocock/skills `productivity/handoff`. Two deliberate changes from
the original: the document is written somewhere durable instead of the OS temp
directory, and every claim in it is tagged verified or assumed.

This is for MID-FLIGHT work. For a finished/shipped project use `ship-ritual`
instead - that covers the tag, the archive mirror, the project index line and the
project's notes page.

## Where it goes

NOT the temp directory. Temp here is the session scratchpad and gets cleaned, and
a handoff that dies with the session defeats the point.

1. Working in a project folder -> `<project root>\HANDOFF.md`. It rides that
   repo's history and the `<ARCHIVE_DRIVE>` mirror from there.
2. No project folder -> `<PROJECTS_ROOT>\HANDOFF-<topic>.md`.
3. If you keep a per-project notes page (a vault page, a wiki entry), also
   refresh its "Status & left-off" line to point at the handoff. One line, not a
   copy.

If `HANDOFF.md` already exists, print its date and first few lines and ASK before
replacing it. Never silently overwrite someone else's handoff.

## What goes in it

Keep it short. A handoff nobody reads is the same as no handoff.

- **Next session is for** - from the user's argument. If they gave none, ask.
- **Done / Not done, by name.** Two explicit lists. Never "mostly working" -
  name the parts. A missing item reads as a finished item to the next session.
- **Verified vs assumed.** Tag every state claim. `[verified: <command>]` for
  anything you actually ran or read this session, `[assumed]` for the rest, with
  the command that would settle it. A note records what was true when written;
  the next session must re-read the code, not trust this file.
- **Open decisions** - things waiting on the user, not on the agent. Say what
  each one blocks.
- **Traps hit** - what already went wrong here, so it is not rediscovered. If a
  trap is general rather than task-specific, it belongs in `~/.claude/PITFALLS.md`
  instead; say which you did.
- **Suggested skills** - name the skills the next session should load, and why.
  Do not make it guess from a list of hundreds.

## What stays out

- Anything already in a file, commit, diff, tag, ADR or issue. Reference it by
  path, URL, tag or SHA. Restating it creates a second source of truth that goes
  stale first.
- Narration of what happened. The next session needs current state, not a diary.
- Secrets. Redact API keys, tokens, passwords and personal data before writing.

## Finish

Tell the user the exact path you wrote, and give the one-line prompt they can
paste into the next session to resume.
