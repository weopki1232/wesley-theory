# Pitfalls catalogue — errors caught, so they never repeat

Append-only. Each entry: the structural fact, the WRONG version I produced (or almost did),
the RIGHT version, and the date. Read this at spec-time (step 2) as a pre-flight checklist of
"mistakes I am known to make." **Add, never delete.**

Format:
```
### <topic> — <one-line fact>
- WRONG: <the mistake>
- RIGHT: <the truth>
- Source: <where verified>
- Caught: <YYYY-MM-DD>
```

---

### Neuron / myelin — a Schwann cell IS the myelin, not a thing beside it
- WRONG: Schwann cells drawn as separate free-floating cells sitting *outside* the myelin sheath.
- RIGHT: The Schwann cell wraps its OWN plasma membrane in concentric layers around one segment of a peripheral axon — those wrapped layers ARE the myelin sheath. Only the nucleus + thin outer collar of cytoplasm (the neurilemma) sit on the sheath's outer surface. The cell and the sheath are the same object.
- Related: **Nodes of Ranvier** = the bare gaps BETWEEN two consecutive Schwann cells (one cell per internodal segment). In the CNS the equivalent cell is the **oligodendrocyte**, which unlike Schwann cells myelinates *several* axons at once.
- Source: OpenStax A&P (nervous tissue), user's own domain knowledge.
- Caught: 2026-07-19 (neuron-to-brain project)

### Spinal cord vs vertebral column — the cord is shorter than the spine
- WRONG: Spinal cord drawn running the full length of the vertebral column down to the tailbone.
- RIGHT: The spinal cord ends around the L1–L2 vertebral level (the conus medullaris). Below that, the vertebral canal contains the **cauda equina** — a bundle of nerve roots, not cord. The column continues down but the cord does not.
- Related: **31 pairs** of spinal nerves (8 cervical, 12 thoracic, 5 lumbar, 5 sacral, 1 coccygeal). 12 pairs of cranial nerves.
- Source: OpenStax A&P (spinal cord), Gray's Anatomy.
- Caught: 2026-07-19 (neuron-to-brain project, flagged by user)

### Downloaded meshes — a mesh's NAME is not a claim about its EXTENT
- WRONG: Loading `FMA78497.stl` ("central canal of spinal cord"), labelling it "the cord", and assuming it covers the structure its name describes.
- RIGHT: Measure the bounding box before trusting a mesh. That file spans z 1470.8–1504.4 — a ~34 mm stub sitting entirely ABOVE the topmost vertebra in the same dataset (z 1461). It is the canal at the medulla, not a spinal cord. **The BodyParts3D subset contains no whole-spinal-cord mesh at all.** Real-data provenance does not make a model correct; an authentic mesh in the wrong role is still wrong anatomy, and it *looks* trustworthy, which is worse.
- Related trap: **bilateral bones have no generic mesh.** `FMA9613 parietal bone` does not exist as a file; `FMA52788 right parietal bone` / `FMA52789 left parietal bone` do. Check left/right ids before concluding a part is unavailable.
- Rule: after loading any anatomical mesh, print its per-axis min/max and sanity-check them against the neighbouring structures before it goes into a scene.
- Source: direct measurement of the BodyParts3D STL set.
- Caught: 2026-07-22 (neuron-to-brain, during skull/spine feasibility research)

### Judge a model with an ISOTROPIC projection, or you will report false bugs
- WRONG: QA-rendering a tall model into a tall image with the horizontal and vertical axes at different units-per-pixel. My skull came out squat and wide and I began diagnosing a geometry fault.
- RIGHT: The geometry was fine; the projection stretched horizontally 1.74x. Always derive the horizontal span from the vertical span and the image aspect (`hspan = vspan * W / H`). A distorted QA view is worse than no QA view, because it manufactures defects that cost real time to chase.
- Caught: 2026-07-22 (neuron-to-brain v12 skull)

### Budget points by SURFACE AREA, not triangle count
- WRONG: allocating a point budget proportional to a mesh's triangle count. Triangle count tracks tessellation density, not size: the ethmoid is a tiny bone with a huge triangle count. The 13 small face bones drew 6062 points while the whole cranial vault drew 5529, so the vault rendered thin and unconvincing.
- RIGHT: allocate by `tri_area()` (sum of 0.5*|cross(b-a, c-a)|), and sample WITHIN a mesh weighted by per-triangle area too — uniform-by-index sampling clumps wherever the scan happens to be finely tessellated.
- Caught: 2026-07-22 (neuron-to-brain v12)

### Derive what anatomy already determines; measure only what varies
- WRONG: estimating the vertebral canal's left-right position from noisy void detection, then fitting a polynomial through the noise. The fit wandered +-8 mm and was worse than useless.
- RIGHT: the canal is a MIDLINE structure — bilateral symmetry fixes x exactly. Only the anterior-posterior position genuinely varies (it traces the spinal curves), so measure that and derive the rest. Ask which coordinates are constrained by anatomy before measuring anything.
- Bonus check that worked: a good detector should reproduce known anatomy for free. Mine recovered cervical lordosis, thoracic kyphosis and lumbar lordosis unprompted — that, not the cell counts, was the evidence it had found the real canal.
- Caught: 2026-07-22 (neuron-to-brain v12)

### Verified-real geometry can still hide hand-drawn fakes
- WRONG: Rebuilding a scene "from real scan data" and then assuming every element in it is real. In neuron-to-brain v11 the brain and vertebrae are genuine BodyParts3D meshes — but the skull is a 1200-point procedural sphere, the cord is a straight random line drawn full-length to the tailbone, and the cranial nerves, spinal nerves, heart, lungs and body outline are all hand-written point generators.
- RIGHT: After a real-data rebuild, enumerate every element in the scene and mark each one *measured* or *invented*. Fakes that survive a "now it's real" pass are the most dangerous kind, because the surrounding authenticity vouches for them.
- Caught: 2026-07-22 (neuron-to-brain)

### Two structures in one scene must share ONE frame, or they will not meet
- WRONG: placing the brain with axis remap `(y, z, x)` and the skull with `(x, z, -y)`. Both remaps are individually correct Z-up to Y-up conversions, both models are real scan data, and each looks right ALONE -- but there is a 90 degree yaw between them. The brain's 136 mm front-to-back axis was laid across the skull's 112 mm ear-to-ear one, so it bulged out through the temporal bones and left the forehead empty.
- RIGHT: one remap function, one uniform scale, applied to everything. If two parts of an illustration must fit together, the only safe number of transforms is one. Two correct-looking transforms are not the same as one shared transform.
- Bonus: check whether your meshes are the SAME SUBJECT first. Brain and braincase centres agreed to 0.0 / 2.1 / 2.8 mm, which meant the correct placement was already in the data and never needed to be typed at all.
- Caught: 2026-07-22 (neuron-to-brain v12.1, reported by the user from a screenshot)

### Do not scale a model about its CENTROID
- WRONG: shrinking a point cloud about its centroid to seat it inside a container. The centroid of a point cloud is weighted by how many points each region was allocated -- a rendering budget, not a geometric fact. Change the cortex point budget and the "centre" of the brain moves.
- RIGHT: use the geometric centre of a robust bounding box (0.5 / 99.5 percentile), or better, the measured position from the source data.
- Caught: 2026-07-22 (neuron-to-brain v12.1)

### Colour-by-index dies silently when real data replaces procedural data
- WRONG: an axon whose myelin sheath is coloured by walking the index range and testing `sin(t*22) > 0.35`. That works only because the PROCEDURAL generator emitted points in order along the fibre. Swapping in a real resampled scan cloud randomised the order, so the "sheath" landed on a random 44% of the axon: no bands, no nodes of Ranvier, no error, and it still looks like a plausible speckled axon.
- RIGHT: after any real-data swap, re-check every effect that keys off INDEX rather than position -- colouring, staging, reveal order. Either sort the points so the index means what the effect assumes, or derive the effect from the geometry and emit it. Here the reference axon's radius genuinely dips at each node, so the bands were measurable: 5 real nodes, where the hardcoded sine drew 3.5.
- Caught: 2026-07-22 (neuron-to-brain v12.1, while re-verifying an old audit item)

### To fade a point cloud in/out, animate ALPHA — never colour-toward-zero (blending-dependent)
- WRONG: fading an un-revealed anatomy piece by multiplying its RGB toward 0. On an AdditiveBlending layer that looks correct (black adds nothing = invisible), so the habit forms. But on a NormalBlending layer black is a real, opaque colour: the piece paints a solid dark blob. In neuron-to-brain the skeleton/optic-nerve layer was NormalBlending, so every not-yet-revealed piece drew black; the optic nerve (tight cluster, tiny fly offset, late reveal) hung in the head as a black "caterpillar" through all the skull stations.
- RIGHT: fade via true per-point transparency. PointsMaterial has only one global opacity, so use a small ShaderMaterial with a per-point `aReveal` attribute driving `gl_FragColor.a` (discard when ~0). Colour stays constant; only alpha animates. Same code then behaves identically under Additive and Normal blending.
- General rule: "invisible" is alpha 0, not colour 0. Verify the blend mode before assuming a colour fade hides anything, especially when the SAME fade code is shared across additive and normal-blended layers.
- Caught: 2026-07-22 (neuron-to-brain v12.3)

### A comparison gate must be able to fail — check liveness before trusting a PASS
- WRONG: proving an engine rewrite is neutral by rendering the old and new builds at 14 scroll positions and diffing the pixels. It reported 0.0000% on every frame and "passed". It was comparing two BLANK images: Chrome's CLI `--screenshot` never composited the WebGL canvas. Two blank frames are perfectly identical. The tell was that every frame had identical statistics (mean 7.60, max 133) regardless of which scene it was supposed to show — different scenes cannot produce identical pixels.
- RIGHT: before comparing anything, assert the artefacts are alive. L1: each frame must be substantially lit (>2% of pixels above black). L2: consecutive frames must DIFFER from each other, so the timeline is provably advancing. A gate that cannot distinguish "identical because correct" from "identical because nothing rendered" manufactures confidence, which is worse than having no gate.
- General: for any equality-based check, ask what a *broken* run would look like. If broken and correct produce the same output, the check is decorative.
- Caught: 2026-07-25 (neuron-to-brain v13, gate G1)

### An outlier-sensitive baseline makes a gate EASIER to pass — never use max
- WRONG: passing a build when its cross-build difference is below the noise each build shows against ITSELF, with that baseline computed as the max over repetitions. One contaminated capture (a load that hit ERR_NETWORK_CHANGED) reported 7.96% self-jitter at a station where five clean repetitions measure 0.001-0.010%. Because the baseline is the BAR, a single bad sample widened the goalposts and made a failing build pass.
- RIGHT: use the median. Ask, for every tolerance, which direction an anomaly pushes the verdict. Noise in the thing being measured makes a gate stricter; noise in the threshold makes it weaker, and only the second one is silent.
- Caught: 2026-07-25 (neuron-to-brain v13, gate G1)

### To wait for something to settle, observe the thing that settles
- WRONG: two settle rules, both proxies, both wrong. (1) "wait 3000 ms" — a bet on machine speed that lost under load, producing a 7.96% bimodal split at one station. (2) "wait 240 frames", reasoning that the camera converges per rAF at 0.08 of the remaining gap, not per millisecond — measured, this was WORSE, scattering up to 2.4%.
- DIAGNOSIS that ended the guessing: probe the live scene at capture time and print what the renderer was actually handed. Everything the deck was told was identical across six captures (scroll position, every uniform, both rotations) and the pictures still differed. The one quantity still moving was `camera.position.y`: 4.797762715 / 4.797568168 / 4.797941698. An asymptotic lerp never arrives, and with 70000 hard-edged point sprites a sub-pixel camera shift flips a very large number of pixels.
- RIGHT: measure the output, don't predict it. Screenshot, advance some frames, screenshot again, accept only when two consecutive pictures agree; raise if they never do. Self-jitter went from 8.15% to 0.0005%.
- General: a proxy for "settled" is correct until the machine gets busy, and jitter in a comparison gate is indistinguishable from the defect it hunts. Also: when two fixes both fail, stop theorising and instrument.
- Caught: 2026-07-25 (neuron-to-brain v13, gate G1)

### A fly-in must start on screen — in THAT station's framing, not the wide shot
- WRONG: reusing the arm's "telescope out of the shoulder" fly-in for the 27 hand bones. It reads well at the wide arm framing, but the hand station pushes the camera in to frame a 5-unit hand, so every bone began its travel outside the frame and appeared from nowhere instead of moving into place.
- RIGHT: pick the fly origin against the camera key that will be live during that reveal. The hand explodes locally about the hand's own centre (~1 unit), the skull about the cranial centre, the vertebrae from just in front of their own slot.
- Related: a piece must also finish arriving before the camera LEAVES. With paired camera keys holding a framing to 72% and then transitioning, a reveal wave completing at 92% lands its last pieces off-frame. Tie the build's wave timing to the HTML's hold fraction with an assertion, not by eye.
- Caught: 2026-07-25 (neuron-to-brain v13)

### If the subject reads wrong, measure its principal axes before moving the camera
- WRONG: assuming the deck's established lateral view would show a hand. It renders edge-on: all five fingers stack behind one another and 27 bones read as three.
- RIGHT: PCA the subject and read the extents. The hand measured 176 mm along the finger axis, 110 mm across the palm, 47 mm thick, with the palm normal almost pure ±x — the scan is in anatomical position, palms forward — so the camera had to come 94.5 degrees round. The number came from the geometry, not from taste, and it survives the meshes changing.
- Bonus: those three numbers are also a free correctness check on the whole transform chain. 176/110/47 mm is a real hand; had the scale or remap been wrong they would not have been.
- When adding a capability to a shared camera rig, make neutrality algebraic rather than careful: the orbit is weighted by `orb`, which is 0 for every key that does not opt in, and at `orb=0` the expressions reduce exactly to the old dolly-and-pan.
- Caught: 2026-07-25 (neuron-to-brain v13)
