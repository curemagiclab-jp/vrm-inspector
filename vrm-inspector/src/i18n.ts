// Browser-locale UI localization (English / Japanese).
// Pure logic — detectLang and the dictionaries are unit-tested.
// NOTE: VRChat rank names (rank.ts RANKS) and the clipboard report text
// (ui.ts buildReportText) intentionally stay English and are NOT localized.

export type Lang = 'en' | 'ja';

/** Pick the UI language from a locale string. 'ja*' -> Japanese, else English. */
export function detectLang(language?: string): Lang {
  return (language ?? '').toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export const messages = {
  en: {
    // <head>
    docTitle: 'vrm-inspector — VRChat rank & license checker',
    docDescription:
      'Drop a .vrm to see triangles, texture VRAM, bones, blendshapes, license, and its VRChat performance rank (PC & Quest). 100% client-side.',
    // topbar
    tagline: '100% client-side · your file is never uploaded',
    sampleDefault: 'Sample VRM ▾',
    sampleV0: 'Sample — VRM 0.x',
    sampleV1: 'Sample — VRM 1.0',
    openVrm: 'Open .vrm',
    // dropzone / placeholder
    dropTitle: 'Drop a <code>.vrm</code> here',
    dropSub: 'or use “Open .vrm” / a sample — nothing leaves your browser',
    placeholder: 'Drop a <code>.vrm</code> to inspect…',
    // report card headings
    summary: 'SUMMARY',
    geometry: 'GEOMETRY',
    textures: 'TEXTURES',
    materialsExpressions: 'MATERIALS / EXPRESSIONS',
    license: 'LICENSE',
    caveat:
      '⚠️ Mesh / texture / bone metrics only. PhysBones, material slots and other Unity-side components are not included.',
    // metric labels
    triangles: 'Triangles',
    bones: 'Bones',
    vram: 'VRAM (est. upper bound)',
    texturesLabel: 'Textures',
    materials: 'Materials',
    blendshapes: 'Blendshapes',
    springBones: 'SpringBones',
    // license labels
    author: 'Author',
    allowedUsers: 'Allowed users',
    commercial: 'Commercial',
    modification: 'Modification',
    redistribution: 'Redistribution',
    violentSexual: 'Violent / Sexual',
    credit: 'Credit',
    creditRequired: 'Required',
    creditNotRequired: 'Not required',
    licenseDetails: 'License details ↗',
    // file card
    file: 'File',
    size: 'Size',
    // actions
    copyReport: 'Copy report',
    copied: 'Copied ✓',
    exportPng: 'Export PNG',
    // progress / errors ({file} is replaced at runtime)
    parsing: 'Parsing {file}…',
    downloading: 'Downloading {file}…',
    errNotVrm: '⚠️ Please drop a .vrm file.',
    errLoad: 'Failed to load this file.',
    errSample: 'Could not load sample',
  },
  ja: {
    // <head>
    docTitle: 'vrm-inspector — VRChat ランク & ライセンス チェッカー',
    docDescription:
      '.vrm をドロップすると、三角形数・テクスチャVRAM・ボーン・ブレンドシェイプ・ライセンス、そして VRChat パフォーマンスランク（PC & Quest）を表示します。100% ブラウザ内で完結。',
    // topbar
    tagline: '100% ブラウザ内処理 · ファイルはアップロードされません',
    sampleDefault: 'サンプルVRM ▾',
    sampleV0: 'サンプル — VRM 0.x',
    sampleV1: 'サンプル — VRM 1.0',
    openVrm: '.vrm を開く',
    // dropzone / placeholder
    dropTitle: '<code>.vrm</code> をここにドロップ',
    dropSub: 'または「.vrm を開く」/ サンプルを利用 — ファイルはブラウザの外に出ません',
    placeholder: '<code>.vrm</code> をドロップして調べる…',
    // report card headings
    summary: '概要',
    geometry: 'ジオメトリ',
    textures: 'テクスチャ',
    materialsExpressions: 'マテリアル / 表情',
    license: 'ライセンス',
    caveat:
      '⚠️ メッシュ / テクスチャ / ボーンの指標のみ。PhysBone・マテリアルスロット等の Unity 側コンポーネントは含まれません。',
    // metric labels
    triangles: '三角形数',
    bones: 'ボーン',
    vram: 'VRAM（上限見積もり）',
    texturesLabel: 'テクスチャ',
    materials: 'マテリアル',
    blendshapes: 'ブレンドシェイプ',
    springBones: 'スプリングボーン',
    // license labels
    author: '作者',
    allowedUsers: '利用可能なユーザー',
    commercial: '商用利用',
    modification: '改変',
    redistribution: '再配布',
    violentSexual: '暴力 / 性的表現',
    credit: 'クレジット表記',
    creditRequired: '必要',
    creditNotRequired: '不要',
    licenseDetails: 'ライセンス詳細 ↗',
    // file card
    file: 'ファイル',
    size: 'サイズ',
    // actions
    copyReport: 'レポートをコピー',
    copied: 'コピーしました ✓',
    exportPng: 'PNG を書き出し',
    // progress / errors ({file} is replaced at runtime)
    parsing: '{file} を解析中…',
    downloading: '{file} をダウンロード中…',
    errNotVrm: '⚠️ .vrm ファイルをドロップしてください。',
    errLoad: 'このファイルを読み込めませんでした。',
    errSample: 'サンプルを読み込めませんでした',
  },
} as const;

export type I18nKey = keyof (typeof messages)['en'];

/** Resolved UI language for this session (from navigator.language in the browser). */
export const lang: Lang = detectLang(
  typeof navigator !== 'undefined' ? navigator.language : undefined,
);

/** Translate a key for the current session language, falling back to English. */
export function t(key: I18nKey): string {
  return messages[lang][key] ?? messages.en[key];
}
