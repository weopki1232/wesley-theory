"""TEMPLATE -- counterbalanced fps A/B between two builds of the same page.

Fill in BUILDS, SHOTS and the two page hooks below. Everything else is the parts
that took several wrong runs to get right; change them only with a reason.

WHAT THIS TEMPLATE REFUSES TO DO, AND WHY
-----------------------------------------
1. It does NOT import a determinism harness. A capture harness patches rAF to
   hand every callback the same timestamp so time-driven effects freeze. That is
   exactly wrong here: it would report an infinite frame rate while measuring
   nothing. This paragraph exists so nobody "fixes the inconsistency" later.

2. It does NOT hold both browsers open and alternate. Two Chrome instances on one
   GPU contend. Measured: a station read 9.8 fps for a build that measures 38.5.
   Interleaving cancels drift over time; it does not cancel contention. One
   browser per condition, launched, measured, closed.

3. It does NOT run `for tag in BUILDS` inside every round. That is A B A B A B,
   which reads as interleaved and is not: every B sits in a slot the A before it
   just warmed. A real run of that shape reported the heavier build as 6-30%
   FASTER at every shot. The order alternates instead.

4. It does NOT report a mean, and it does NOT report a between-build delta alone.
   The mean hides the stalls a viewer actually feels; a delta smaller than the
   within-build spread is a noise band being published as an effect.

Vsync must be off or a scene with 40 fps of headroom and one with 400 both
report 60, and a real regression passes.
"""
import io
import os

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

# ---------------------------------------------------------------- fill these in
PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BUILDS = [('base', os.path.join(PROJ, 'index.html')),
          ('new', os.path.join(PROJ, 'index_new.html'))]

# The states to sample. Choose the app's WORST cases, not its average ones -- a
# floor is what fails a viewer. Each entry is passed to set_state() below.
SHOTS = [0.45, 0.70]

ROUNDS = 4            # EVEN, so the counterbalanced order stays balanced
SAMPLE_MS = 2500      # per sample, after warm-up
WARM_MS = 1200        # let the scene settle at the new state before counting

FLAGS = ['--disable-gpu-vsync', '--disable-frame-rate-limit',
         '--disable-background-timer-throttling']

# Hide chrome/HUD so the visual pair shows the subject only.
HIDE = '#main,.hud,.pbar{display:none!important}'

READY = 'typeof G_DEN !== "undefined"'      # page-side "the app booted" predicate


def set_state(pg, shot, spin=False):
    """Put the page into the state being measured. REPLACE THIS.

    Re-pin immediately before measuring as well as during warm-up: a DOM reflow
    can fire onScroll (or equivalent) and silently recompute the state from
    scroll position, moving the sample without saying so.
    """
    pg.evaluate('([s, spin]) => { window.__nospin = !spin; window.__g(s); }',
                [shot, spin])


def probe(pg):
    """Read the thing under test back FROM THE LIVE SYSTEM. REPLACE THIS.

    Return a value that must differ between the two builds. Read it back from
    the running page: a constant lifted from the source file only proves the
    file says what you think it says, not that the browser acted on it.

    Example for a renderer flag:
        return pg.evaluate('() => {const c=document.querySelector("canvas");'
                           'const g=c.getContext("webgl2")||c.getContext("webgl");'
                           'return g.getParameter(g.SAMPLES);}')
    If nothing can be read back, run a control so extreme it cannot fail to show.
    """
    return pg.evaluate('() => window.__probe && window.__probe()')
# ------------------------------------------------------------------------------

MEASURE = """async (ms) => {
  const ts = [];
  await new Promise(res => {
    let t0 = null;
    function tick(t) {
      ts.push(t);
      if (t0 === null) t0 = t;
      if (t - t0 < ms) requestAnimationFrame(tick); else res();
    }
    requestAnimationFrame(tick);
  });
  const dt = [];
  for (let i = 1; i < ts.length; i++) dt.push(ts[i] - ts[i - 1]);
  return dt;
}"""


def open_page(pw, path):
    br = pw.chromium.launch(channel='chrome', args=FLAGS)   # bundled shell has no GL
    pg = br.new_page(viewport={'width': 1100, 'height': 850})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    pg.on('console', lambda m: errs.append(m.text[:160]) if m.type == 'error' else None)
    pg.goto('file:///' + path.replace('\\', '/'))
    pg.wait_for_function(READY, timeout=60000)
    pg.wait_for_timeout(3000)
    return br, pg, errs


def prove_patch_applied(pw):
    """Refuse to measure two builds that are not actually different.

    "No effect" and "no experiment" produce identical output. If both builds
    report the same probe value the comparison is void, and the null result it
    produces would read exactly like a real one -- which is the failure this
    whole template exists to prevent.

    This is its own pass, ahead of any timing, for two reasons. It costs two
    page loads and exits before spending the rounds rather than after. And it
    cannot be folded into the measurement loop as a dict of open pages: refusal
    2 at the top forbids holding both browsers open at once.
    """
    vals = {}
    for tag, path in BUILDS:
        br, pg, _ = open_page(pw, path)
        vals[tag] = probe(pg)
        br.close()
    print('probe: %s' % ', '.join('%s=%r' % kv for kv in sorted(vals.items())))
    if len(set(map(str, vals.values()))) == 1:
        raise SystemExit('both builds report %r -- the patch under test did not '
                         'apply, so every number below would be meaningless'
                         % list(vals.values())[0])
    return vals


def fps(pg, shot):
    set_state(pg, shot, spin=False)
    pg.wait_for_timeout(WARM_MS)
    set_state(pg, shot, spin=False)
    dt = [d for d in pg.evaluate(MEASURE, SAMPLE_MS) if d > 0.01]
    if len(dt) < 20:
        raise SystemExit('only %d frames in %d ms -- too few to percentile'
                         % (len(dt), SAMPLE_MS))
    f = 1000.0 / np.asarray(dt, np.float64)
    return float(np.percentile(f, 50)), float(np.percentile(f, 5))


def settled_shot(pg, shot, limit=40):
    """Screenshot only once consecutive frames stop differing.

    A fixed wait is valid only when both sides run at the same frame rate, which
    is never true in a test whose whole point is that they do not. Anything that
    converges per FRAME (camera lerps, eased layout) leaves the slower page short,
    and the difference gets charged to the change under test. Measured once as
    "47% of pixels differ" for a change whose real answer was 8%.
    """
    set_state(pg, shot, spin=False)
    prev = None
    for _ in range(limit):
        pg.wait_for_timeout(500)
        cur = np.asarray(Image.open(io.BytesIO(pg.screenshot())).convert('RGB'),
                         np.float64)
        if prev is not None and float(np.abs(cur - prev).mean()) < 0.02:
            return Image.fromarray(cur.astype(np.uint8))
        prev = cur
    raise SystemExit('frame never settled -- do not compare these screenshots')


def main():
    raw = {(tag, s): [] for tag, _ in BUILDS for s in SHOTS}
    with sync_playwright() as pw:
        # Nothing below is worth running if the two builds are the same build.
        prove_patch_applied(pw)

        for rnd in range(ROUNDS):
            # A B on even rounds, B A on odd: each build gets the cold slot and
            # the warm slot equally often, so a within-round trend cancels
            # instead of being attributed to whichever build always ran second.
            order = BUILDS if rnd % 2 == 0 else BUILDS[::-1]
            for tag, path in order:
                br, pg, errs = open_page(pw, path)
                for s in SHOTS:
                    raw[(tag, s)].append(fps(pg, s))
                if errs:
                    print('   !! %s page errors: %s' % (tag, errs[:2]))
                br.close()
            print('   round %d/%d  (%s first)' % (rnd + 1, ROUNDS, order[0][0]))

        # ---- medians ---------------------------------------------------------
        print('\n%-12s %10s %10s %10s %10s %10s'
              % ('shot', BUILDS[0][0] + ' p50', 'p05',
                 BUILDS[1][0] + ' p50', 'p05', 'p05 delta'))
        med = lambda k, i: float(np.median([r[i] for r in raw[k]]))
        for s in SHOTS:
            a50, a05 = med((BUILDS[0][0], s), 0), med((BUILDS[0][0], s), 1)
            b50, b05 = med((BUILDS[1][0], s), 0), med((BUILDS[1][0], s), 1)
            print('%-12s %10.1f %10.1f %10.1f %10.1f %9.1f%%'
                  % (s, a50, a05, b50, b05, (b05 / a05 - 1) * 100))

        # ---- the part that decides whether any of the above means anything ---
        # A between-build delta is noise until it exceeds the spread of the SAME
        # build measured repeatedly. Measured on this machine: +/-21-25%.
        print('\nper-round p50 spread (same build, same shot, %d rounds):' % ROUNDS)
        worst = 0.0
        for s in SHOTS:
            for tag, _ in BUILDS:
                v = sorted(r[0] for r in raw[(tag, s)])
                sp = (v[-1] / v[0] - 1) * 100
                worst = max(worst, sp)
                print('   %-8s %-5s  %s   spread %+.1f%%'
                      % (s, tag, ' '.join('%.0f' % x for x in v), sp))
        print('\nAny delta smaller than %.0f%% is INSIDE this harness\'s noise. The '
              'honest\nreport for those is "no difference resolvable above noise" '
              '-- not "free".' % worst)

        # ---- the visual pair, so the decision is about the picture too --------
        imgs = {}
        for tag, path in BUILDS:
            br, pg, _ = open_page(pw, path)
            pg.add_style_tag(content=HIDE)
            imgs[tag] = settled_shot(pg, SHOTS[0])
            br.close()

    w, h = imgs[BUILDS[0][0]].size
    sheet = Image.new('RGB', (w * 2 + 12, h), (5, 7, 11))
    sheet.paste(imgs[BUILDS[0][0]], (0, 0))
    sheet.paste(imgs[BUILDS[1][0]], (w + 12, 0))
    out = os.path.join(PROJ, 'ab_pair.jpg')
    sheet.save(out, quality=94)
    d = np.abs(np.asarray(imgs[BUILDS[0][0]], np.float64)
               - np.asarray(imgs[BUILDS[1][0]], np.float64))
    print('\nvisual: %.2f%% of pixels differ by >8, mean delta %.2f'
          % (float((d.max(axis=2) > 8).mean()) * 100, d.mean()))
    print('wrote %s  (left %s, right %s)' % (out, BUILDS[0][0], BUILDS[1][0]))


if __name__ == '__main__':      # guarded: a diagnostic importing FLAGS/MEASURE
    main()                      # must not re-run the whole comparison
