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

---
---

# vrm-inspector（日本語）

> `.vrm` ファイルをドロップするだけ。三角形数・テクスチャVRAM・ボーン・ブレンドシェイプ・ライセンスを、ブラウザ内で即座に表示。**アップロードなし、100% クライアントサイド。**

`vrm-inspector` は単なる VRM ビューアではなく、**最適化チェッカー**です。あらゆるアバターの **VRChat パフォーマンスランク**（PC *および* Quest）を見積もり、ライセンスを一目で可視化します。しかもファイルはどこにも送信されません。

<!-- TODO: ここに demo.gif を追加（3Dモデルの回転 + 色分けされたメトリクスパネル） -->

**▶ 試す:** https://curemagiclab-jp.github.io/vrm-inspector/

![stars](https://img.shields.io/github/stars/curemagiclab-jp/vrm-inspector?style=social)
![license](https://img.shields.io/github/license/curemagiclab-jp/vrm-inspector)

---

## なぜ作ったか

- **即座に。** `.vrm` をページにドラッグするだけ。インストール不要、5秒で数値が見える。
- **プライベート。** ファイルはブラウザの外に出ません — 100% クライアントサイド、何もアップロードしません。
- **実際の悩みを解決。** VRChat の「重いアバター」警告、BOOTH での購入前スペック確認、VTuber アプリの互換性チェック。

## ユースケース

1. **BOOTH で購入する前に** — 支払う前に、三角形数 / テクスチャVRAM / ボーン、そしてライセンス（商用利用は？改変は？再配布は？）を確認。
2. **VRChat アバターの最適化** — どの指標がランクを下げているのかを、PC *と* より厳しい Quest の両方で一目で把握。
3. **VRoid で作ったモデルの確認** — 妥当なパフォーマンス帯に収まっているか、ライセンスが意図どおり設定されているかを確認。

## 表示する項目

| 指標 | 取得元 |
|---|---|
| 三角形数 | 全メッシュの `geometry.index` の合計 |
| テクスチャメモリ（VRAM見積もり） | `w × h × 4 bytes × 約4/3`（ミップマップ）の合計 |
| テクスチャ数 & 解像度 | glTF images |
| マテリアル | glTF materials |
| ボーン | humanoid + ノードツリー内のボーン |
| ブレンドシェイプ（表情） | モーフターゲット / VRM expressions |
| スプリングボーン | VRM springBone 定義 |
| ライセンス / メタ | VRM メタ（作者、商用 / 改変 / 再配布 / クレジット） |
| VRM バージョン | glTF extensions による `0.x` または `1.0` 判定 |

### 誠実さに関する注記（表示*しない*もの）

VRChat のランクは Unity 側のアバター（GameObject / Component）で算出されます。**PhysBone、マテリアルスロット（レンダラ単位）、Animator、Contacts、Constraints は `.vrm` ファイル内には存在しません**。そのため、これらは意図的に **表示しません**。パフォーマンス見積もりはメッシュ / テクスチャ / ボーンの指標のみを対象とします。

> ⚠️ テクスチャVRAM は **上限見積もり** です — 圧縮（DXT/BCn、KTX2）を無視しているため、実際のエンジン内の値は通常これより小さくなります。

## VRChat パフォーマンスランク

総合ランクは三角形数・テクスチャメモリ・ボーンのうち **最も悪い** ものになります（公式の閾値）:

### PC
| 指標 | Excellent | Good | Medium | Poor | Very Poor |
|---|---|---|---|---|---|
| 三角形数 | ≤32,000 | ≤70,000 | ≤70,000 | ≤70,000 | >70,000 |
| テクスチャメモリ | ≤40 MB | ≤75 MB | ≤110 MB | ≤150 MB | >150 MB |
| ボーン | ≤75 | ≤150 | ≤256 | ≤400 | >400 |

### Quest / モバイル
| 指標 | Excellent | Good | Medium | Poor | Very Poor |
|---|---|---|---|---|---|
| 三角形数 | ≤7,500 | ≤10,000 | ≤15,000 | ≤20,000 | >20,000 |
| テクスチャメモリ | ≤10 MB | ≤18 MB | ≤25 MB | ≤40 MB | >40 MB |
| ボーン | ≤75 | ≤90 | ≤150 | ≤150 | >150 |

## ローカルでの実行

アプリは [`vrm-inspector/`](vrm-inspector/) サブフォルダにあります。

```bash
cd vrm-inspector
npm install
npm run dev       # Vite 開発サーバ
npm run build     # 本番ビルド
npm run preview   # ビルド結果のプレビュー
npm run test      # Vitest（純ロジック: analyze / rank / license）
```

> **GitHub Pages:** `vite.config.ts` で `base: '/vrm-inspector/'` を設定しています。別のリポジトリ名でフォークする場合は、それに合わせて変更しないとページが真っ白になります。

## 技術スタック

- [three.js](https://threejs.org/) r180
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) v3（VRM 0.x **および** 1.0）
- Vite + TypeScript、Vitest でテスト

## ロードマップ

- KTX2 / Basis 圧縮を考慮した VRAM 見積もり（エンジン内の値により近づける）
- マテリアルごとの内訳
- レポートのコピー / 共有用 PNG エクスポート

コントリビューション歓迎 — オープンな issue を参照してください（good-first-issue がタグ付けされています）。

## ライセンス

MIT

---

Topics: `vrm` `vrchat` `vroid` `three-vrm` `vtuber` `avatar`
