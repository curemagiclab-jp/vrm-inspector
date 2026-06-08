# vrm-inspector

> Drop a `.vrm` file. See its triangles, texture VRAM, bones, blendshapes, and license — instantly, in your browser. **No upload, 100% client-side.**

`vrm-inspector` is not just a VRM viewer — it's an **optimization checker**. It estimates the **VRChat Performance Rank** (PC *and* Quest) of any avatar and visualizes its license at a glance, all without sending your file anywhere.

<!-- TODO: add demo.gif here (3D model rotating + colored metrics panel) -->

**▶ Try it:** https://curemagiclab-jp.github.io/vrm-inspector/

![stars](https://img.shields.io/github/stars/curemagiclab-jp/vrm-inspector?style=social)
![license](https://img.shields.io/github/license/curemagiclab-jp/vrm-inspector)

---

## Why

- **Instant.** Drag a `.vrm` onto the page. No install, value visible in 5 seconds.
- **Private.** Your file never leaves the browser — 100% client-side, nothing is uploaded.
- **Solves real pain.** VRChat "heavy avatar" warnings, pre-purchase spec checks on BOOTH, VTuber app compatibility.

## Use cases

1. **Before buying on BOOTH** — check triangles / texture VRAM / bones and the license (commercial use? modification? redistribution?) before you pay.
2. **Optimizing a VRChat avatar** — see at a glance which metric drops your rank, on PC *and* the much stricter Quest.
3. **Checking a model you made in VRoid** — confirm it lands in a sane performance bracket and that the license is set the way you intended.

## What it shows

| Metric | Source |
|---|---|
| Triangles | sum of every mesh `geometry.index` |
| Texture memory (estimated VRAM) | `w × h × 4 bytes × ~4/3` (mipmaps), summed |
| Texture count & resolutions | glTF images |
| Materials | glTF materials |
| Bones | humanoid + bones in the node tree |
| Blendshapes (expressions) | morph targets / VRM expressions |
| SpringBones | VRM springBone definitions |
| License / meta | VRM meta (author, commercial / modification / redistribution / credit) |
| VRM version | `0.x` or `1.0` via glTF extensions |

### Honesty note (what it does *not* show)

VRChat's rank is computed on the Unity-side avatar (GameObjects/Components). **PhysBones, material slots (per-renderer), Animators, Contacts and Constraints do not exist inside a `.vrm` file**, so they are intentionally **not displayed**. The performance estimate covers mesh / texture / bone metrics only.

> ⚠️ Texture VRAM is an **estimated upper bound** — compression (DXT/BCn, KTX2) is ignored, so real in-engine values are typically lower.

## VRChat Performance Rank

The overall rank is the **worst** of triangles, texture memory and bones (official thresholds):

### PC
| Metric | Excellent | Good | Medium | Poor | Very Poor |
|---|---|---|---|---|---|
| Triangles | ≤32,000 | ≤70,000 | ≤70,000 | ≤70,000 | >70,000 |
| Texture Memory | ≤40 MB | ≤75 MB | ≤110 MB | ≤150 MB | >150 MB |
| Bones | ≤75 | ≤150 | ≤256 | ≤400 | >400 |

### Quest / Mobile
| Metric | Excellent | Good | Medium | Poor | Very Poor |
|---|---|---|---|---|---|
| Triangles | ≤7,500 | ≤10,000 | ≤15,000 | ≤20,000 | >20,000 |
| Texture Memory | ≤10 MB | ≤18 MB | ≤25 MB | ≤40 MB | >40 MB |
| Bones | ≤75 | ≤90 | ≤150 | ≤150 | >150 |

## Run it locally

The app lives in the [`vrm-inspector/`](vrm-inspector/) subfolder.

```bash
cd vrm-inspector
npm install
npm run dev       # Vite dev server
npm run build     # production build
npm run preview   # preview the build
npm run test      # Vitest (pure logic: analyze / rank / license)
```

> **GitHub Pages:** `vite.config.ts` sets `base: '/vrm-inspector/'`. If you fork under a different repo name, change it to match or the page renders blank.

## Tech stack

- [three.js](https://threejs.org/) r180
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) v3 (VRM 0.x **and** 1.0)
- Vite + TypeScript, tested with Vitest

## Roadmap

- KTX2 / Basis compression-aware VRAM estimate (closer to in-engine values)
- Per-material breakdown
- Copy report / Export PNG for sharing

Contributions welcome — see the open issues (good-first-issues are tagged).

## License

MIT

---

Topics: `vrm` `vrchat` `vroid` `three-vrm` `vtuber` `avatar`
