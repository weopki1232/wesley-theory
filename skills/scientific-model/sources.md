# Vetted free reference sources

Openly-licensed or public-domain sources safe to **reference** and (with attribution) adapt.
Licensing note: what we *ship* must respect the license; but any source can be used purely as a
correctness *check* even when its pixels never appear in the final art.

## Best for teaching material (text + clean schematic figures)

| Source | What it's good for | License | Notes |
|---|---|---|---|
| **OpenStax — Anatomy & Physiology** | Correct teaching diagrams + verified explanatory text together | CC BY | Best single match for lesson/deck work. openstax.org |
| **Wikimedia Commons** | Huge searchable image library; download + Read to view | CC / public domain (varies per file — check) | Main "go look at the real thing" source |
| **Gray's Anatomy (1918 plates)** | Classic detailed anatomical plates | Public domain | Zero licensing worry; on Wikimedia & Bartleby |

## 3D work (three.js / spatial relationships)

| Source | What it's good for | License |
|---|---|---|
| **BodyParts3D / Anatomography** (Life Science Databases, JP) | Free 3D anatomical mesh data — proportions, spatial layout | CC-BY-SA |
| **Z-Anatomy** | Open-source 3D anatomy atlas (built on BodyParts3D), downloadable | CC-BY-SA |
| **NIH 3D** | Anatomical + molecular 3D models | Mostly public domain / open |

## Molecular scale (bilayer, ion channels, proteins)

| Source | What it's good for | License |
|---|---|---|
| **RCSB Protein Data Bank (PDB)** | Real molecular structures (ion channels, myelin proteins, etc.) | Open |

## Local-first — always check before fetching

- **The user's own notes** — a vault, a notes folder, their existing lesson material. May already hold the concept, the facts, and the wording they teach with. Search here first.
- **`references/` in this skill** — cached diagrams from previous builds. Check before downloading again.

## How to view an image (I can't "see" a URL, only a downloaded file)

```bash
# <skills-dir> = ~/.claude/skills (macOS/Linux) or %USERPROFILE%\.claude\skills (Windows)
curl -L -o "<skills-dir>/scientific-model/references/<name>.png" "<url>"
# then Read that file
```
