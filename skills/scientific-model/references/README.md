# references/ — cached ground-truth diagrams

Downloaded reference images from previous `scientific-model` builds live here, named
`<topic>-<what>.png` (e.g. `neuron-myelin-schwann-crosssection.png`).

Purpose: the next build on the same topic starts with ground truth already on disk — no re-fetch.
Check here (and `../pitfalls.md`) before downloading anything new.

These are **correctness checks**, not art to ship. Using an image to verify that your geometry is
right is unrestricted; putting its pixels in a deliverable is what the license governs.

## What is cached, and where it came from

| File | Shows | Provenance |
|---|---|---|
| `spinalcord-cauda-equina-gray662.png` | Cord ending at the conus medullaris, cauda equina below | Gray's Anatomy 1918, plate 662 — public domain |
| `neuron-myelin-schwann-crosssection.png` | Concentric wrapped membrane layers around the axon | Source not recorded at cache time — verify before republishing |
| `neuron-myelin-schwann-longitudinal.png` | One Schwann cell per internodal segment, nodes of Ranvier between | Source not recorded at cache time — verify before republishing |
| `volcano-stratovolcano-crosssection.png` | Stratovolcano cross-section: outward-dipping layers, conduit, magma chamber | Source not recorded at cache time — verify before republishing |
| `volcano-fuji-geological-section.png` | Geological section through Mt Fuji | Source not recorded at cache time — verify before republishing |

**When you cache a new one, add its row here** with the source and license. A reference image with
no recorded provenance can still be checked against, but it cannot be shipped — and a missing row
is how that gets discovered too late.

Keep only openly-licensed / public-domain images (see `../sources.md`). Add, don't prune.
