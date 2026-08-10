"""TEMPLATE -- deterministic capture + liveness helpers for a pixel-diff gate.

ONE definition of the determinism setup, imported by every capture-based gate.
Duplicated QA constants drift exactly like duplicated build constants do.

Making an animated page reproducible needs four things removed, all found the
hard way by rendering the SAME file twice and diffing:

  1. auto-rotation / idle animation  accumulates from page load, so any wait
     before freezing it banks a different amount each run -- and rotating the
     whole scene shows up as a difference EVERYWHERE, including in layers the
     change under test never touched.
  2. the clock                       rAF is patched to hand every callback the
     same timestamp, freezing time-driven effects at one phase.
  3. Math.random                     anything generated at load differs every
     run, and states mid-morph FROM it differ too. Seeded here.
  4. per-frame lerps                 converge asymptotically and never arrive,
     so a short settle leaves them fractionally short. Handled by capture().

Items 1-3 must be installed BEFORE the first frame, so they go in an init
script, not an evaluate() after load.

DO NOT IMPORT THIS FROM AN FPS SCRIPT. Item 2 freezes the rAF timestamp, which
would report an infinite frame rate while measuring nothing.
"""
import io

import numpy as np
from PIL import Image

W, H = 1100, 850
LOAD_FRAMES = 120       # let the page finish its own entrance before pinning
SETTLE_FRAMES = 180     # after pinning state, before stability testing begins
STABLE_FRAMES = 45      # frames between the two pictures being compared
STABLE_EPS = 2e-5       # fraction of differing pixels that counts as "the same"
STABLE_ROUNDS = 14      # give up after this many tries and FAIL LOUDLY
SETTLE_TIMEOUT = 30000  # ms; a page that cannot deliver frames must fail, not stall

# Hide every overlay. Note the plural: hiding a custom cursor's dot but not its
# ring once left a 34px ring parked at viewport centre in every capture, sitting
# over the subject in every gate diff.
HIDE = ('#main,.hud,.pbar,.rail,.cue,.cur-dot,.cur-ring{display:none!important}'
        'html,body{background:#05070b!important}')

INIT = """
window.__nospin=true;
window.__frames=0;
(function(){
  var raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=function(cb){
    return raf(function(){ window.__frames++; cb(5000); });
  };
  var s=0x9e3779b9;                      // mulberry32, fixed seed
  Math.random=function(){
    s|=0; s=s+0x6D2B79F5|0;
    var t=Math.imul(s^s>>>15,1|s);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
})();
"""

# A DOM reflow fires onScroll, which recomputes state from scrollY and would
# silently overwrite the forced value -- hence the interval, not a single call.
PIN = ("(g)=>{window.__nospin=true;if(window.__pin)clearInterval(window.__pin);"
       "window.__pin=setInterval(()=>window.__g(g),16);window.__g(g);}")


def wait_frames(page, n, timeout=SETTLE_TIMEOUT):
    """Block until the page has actually rendered n more frames.

    wait_for_function polls in the page, so this measures real progress instead
    of assuming a frame rate. If the frames never arrive this raises -- a stalled
    render must be a failure, never a quiet capture of a half-settled scene.
    """
    start = page.evaluate('window.__frames')
    page.wait_for_function('window.__frames >= %d' % (start + n), timeout=timeout)


def open_page(browser, path):
    page = browser.new_page(viewport={'width': W, 'height': H})
    page.add_init_script(INIT)
    errs = []
    page.on('console', lambda m: errs.append(m.text[:160]) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)[:160]))
    page.goto('file:///' + str(path).replace('\\', '/'))
    wait_frames(page, LOAD_FRAMES)
    page.add_style_tag(content=HIDE)
    return page, errs


def shot(page):
    return np.asarray(Image.open(io.BytesIO(page.screenshot())).convert('RGB'),
                      np.float64)


def diff_stats(a, b):
    """mean delta, max delta, fraction of pixels differing by more than 8."""
    d = np.abs(a - b)
    return d.mean(), d.max(), float((d.max(axis=2) > 8).mean())


def capture(page, g, settle=SETTLE_FRAMES):
    """Pin the state and return the frame only once the picture stopped changing.

    Neither a duration nor a frame count can be right, because both PREDICT when
    the picture will stop changing. This MEASURES it. Both proxies were tried:
    3000ms measured 7.96% median self-jitter inside a busy run against 0.002% in
    a quiet browser, and 240 frames was worse.
    """
    page.evaluate(PIN, g)
    wait_frames(page, settle)
    prev = shot(page)
    for _ in range(STABLE_ROUNDS):
        wait_frames(page, STABLE_FRAMES)
        cur = shot(page)
        if diff_stats(prev, cur)[2] <= STABLE_EPS:
            return cur
        prev = cur
    raise RuntimeError('capture never stabilised at %.4f after %d rounds '
                       '(last delta %.4f%%)'
                       % (g, STABLE_ROUNDS, diff_stats(prev, cur)[2] * 100))


def capture_fresh(browser, path, g, settle=SETTLE_FRAMES):
    """Capture on a PAGE OF ITS OWN, then throw the page away.

    Driving one page through a sequence of states is ~5x faster and was the
    obvious way to do this -- and it is not reproducible. Measured: a single
    fresh capture diffs 0.0000% against itself, while the SAME state reached as
    the fourth step of a sequence diffs 14%. Several effects lerp from their own
    previous buffer contents rather than recomputing absolutely, so where the
    timeline has BEEN changes what a state looks like.

    Fine for a human; fatal for a comparison gate, which must attribute every
    difference to the change under test.
    """
    page, errs = open_page(browser, path)
    try:
        return capture(page, g, settle), errs
    finally:
        page.close()


# ---------------------------------------------------------------- liveness ----
# Run these BEFORE any comparison. Two blank images are perfectly identical, and
# a gate that cannot tell "identical because correct" from "identical because
# nothing rendered" manufactures confidence, which is worse than no gate.

def assert_lit(shots, floor=0.02):
    """L1 -- every capture must contain something."""
    dead = [k for k, im in shots.items()
            if float((im.max(axis=2) > 18).mean()) < floor]
    if dead:
        raise SystemExit('L1 FAIL -- blank or near-blank frames: %s' % dead[:6])
    print('L1 liveness OK -- all %d frames substantially lit' % len(shots))


def assert_advances(seq, floor=0.005):
    """L2 -- consecutive states must differ from each other."""
    stuck = [i for i in range(len(seq) - 1)
             if diff_stats(seq[i], seq[i + 1])[2] < floor]
    if stuck:
        raise SystemExit('L2 FAIL -- timeline not advancing at steps %s' % stuck)
    print('L2 liveness OK -- the timeline advances')
