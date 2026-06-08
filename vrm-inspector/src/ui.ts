// Panel rendering: color-coded metrics, PC/Quest ranks, license, Copy/Export.
import type { AnalysisResult } from './analyze';
import { type PlatformResult, type RankIndex, rankName } from './rank';
import type { NormalizedLicense, Permission } from './license';

// VRChat-style rank colors: Excellent=blue, Good=green, Medium=yellow, Poor=orange, Very Poor=red.
export const RANK_COLORS: Record<RankIndex, string> = {
  0: '#3b82f6',
  1: '#22c55e',
  2: '#eab308',
  3: '#f97316',
  4: '#ef4444',
};

export interface ReportData {
  fileName: string;
  fileSizeMB: number;
  vrmVersion: string;
  analysis: AnalysisResult;
  pc: PlatformResult;
  quest: PlatformResult;
  license: NormalizedLicense;
}

export interface ReportHandlers {
  onExportPng: () => void;
}

const fmt = (n: number) => n.toLocaleString('en-US');
const mb = (n: number) => `${n.toFixed(1)} MB`;

function dot(index: RankIndex): string {
  return `<span class="dot" style="color:${RANK_COLORS[index]}" title="${rankName(index)}">●</span>`;
}

function rankBadge(index: RankIndex): string {
  return `<span class="rank-badge" style="background:${RANK_COLORS[index]}">${rankName(index)}</span>`;
}

function permIcon(p: Permission): string {
  const map: Record<Permission, [string, string]> = {
    allow: ['✓', '#22c55e'],
    disallow: ['✗', '#ef4444'],
    unknown: ['△', '#9ca3af'],
  };
  const [glyph, color] = map[p];
  return `<span class="perm" style="color:${color}">${glyph}</span>`;
}

/** Dot color for a metric = the worse of its PC and Quest rank. */
function worst(a: RankIndex, b: RankIndex): RankIndex {
  return Math.max(a, b) as RankIndex;
}

function metricRow(label: string, value: string, index: RankIndex): string {
  return `<div class="metric"><span class="m-label">${label}</span><span class="m-value">${value}</span>${dot(index)}</div>`;
}

function plainRow(label: string, value: string): string {
  return `<div class="metric"><span class="m-label">${label}</span><span class="m-value">${value}</span></div>`;
}

export function renderReport(
  container: HTMLElement,
  data: ReportData,
  handlers: ReportHandlers,
): void {
  const { analysis: a, pc, quest, license: lic } = data;
  const resChips = a.resolutions
    .map((r) => `<span class="chip">${r.width}²${r.count > 1 ? ` ×${r.count}` : ''}</span>`)
    .join('');

  container.classList.remove('placeholder');
  container.innerHTML = `
    <section class="card summary">
      <h3>SUMMARY</h3>
      <div class="rank-line"><span>PC</span>${rankBadge(pc.overall)}</div>
      <div class="rank-line"><span>Quest</span>${rankBadge(quest.overall)}</div>
      <p class="caveat">⚠️ Mesh / texture / bone metrics only. PhysBones, material slots and other Unity-side components are not included.</p>
    </section>

    <section class="card">
      <h3>GEOMETRY</h3>
      ${metricRow('Triangles', fmt(a.triangles), worst(pc.triangles, quest.triangles))}
      ${metricRow('Bones', fmt(a.bones), worst(pc.bones, quest.bones))}
    </section>

    <section class="card">
      <h3>TEXTURES</h3>
      ${metricRow('VRAM (est. upper bound)', mb(a.textureMemoryMB), worst(pc.textureMemory, quest.textureMemory))}
      ${plainRow('Textures', fmt(a.textureCount))}
      <div class="chips">${resChips || '<span class="muted">—</span>'}</div>
    </section>

    <section class="card">
      <h3>MATERIALS / EXPRESSIONS</h3>
      ${plainRow('Materials', fmt(a.materials))}
      ${plainRow('Blendshapes', fmt(a.expressionCount))}
      ${plainRow('SpringBones', fmt(a.springBones))}
    </section>

    <section class="card">
      <h3>LICENSE <span class="muted">(VRM ${lic.specVersion})</span></h3>
      ${plainRow('Author', escapeHtml(lic.author) || '<span class="muted">—</span>')}
      ${plainRow('Allowed users', lic.allowedUser)}
      <div class="metric"><span class="m-label">Commercial</span>${permIcon(lic.commercialUsage)}</div>
      <div class="metric"><span class="m-label">Modification</span>${permIcon(lic.modification)}</div>
      <div class="metric"><span class="m-label">Redistribution</span>${permIcon(lic.redistribution)}</div>
      <div class="metric"><span class="m-label">Violent / Sexual</span><span class="m-value">${permIcon(lic.violentUsage)} / ${permIcon(lic.sexualUsage)}</span></div>
      ${plainRow('Credit', creditLabel(lic.creditNotation))}
      ${lic.licenseUrl ? `<div class="metric"><a href="${escapeHtml(lic.licenseUrl)}" target="_blank" rel="noopener">License details ↗</a></div>` : ''}
    </section>

    <section class="card">
      ${plainRow('File', escapeHtml(data.fileName))}
      ${plainRow('Size', mb(data.fileSizeMB))}
    </section>

    <div class="actions-row">
      <button id="copy-btn" class="btn">Copy report</button>
      <button id="export-btn" class="btn">Export PNG</button>
    </div>
  `;

  const copyBtn = container.querySelector<HTMLButtonElement>('#copy-btn')!;
  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(buildReportText(data));
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => (copyBtn.textContent = 'Copy report'), 1500);
  });
  container
    .querySelector<HTMLButtonElement>('#export-btn')!
    .addEventListener('click', handlers.onExportPng);
}

function creditLabel(c: NormalizedLicense['creditNotation']): string {
  return c === 'required' ? 'Required' : c === 'unnecessary' ? 'Not required' : '—';
}

/** Plain-text report for the clipboard (SNS-friendly). */
export function buildReportText(data: ReportData): string {
  const { analysis: a, pc, quest, license: lic } = data;
  const perm = (p: Permission) => (p === 'allow' ? 'Yes' : p === 'disallow' ? 'No' : '?');
  return [
    `vrm-inspector report — ${data.fileName}`,
    `VRChat rank:  PC ${rankName(pc.overall)}  |  Quest ${rankName(quest.overall)}`,
    `(mesh/texture/bone metrics only — Unity-side components not included)`,
    ``,
    `Triangles:    ${fmt(a.triangles)}`,
    `Bones:        ${fmt(a.bones)}`,
    `Texture VRAM: ${mb(a.textureMemoryMB)} (estimated upper bound)`,
    `Textures:     ${a.textureCount}`,
    `Materials:    ${a.materials}`,
    `Blendshapes:  ${a.expressionCount}`,
    `SpringBones:  ${a.springBones}`,
    ``,
    `License (VRM ${lic.specVersion}) — by ${lic.author || 'unknown'}`,
    `  Commercial: ${perm(lic.commercialUsage)}  Modification: ${perm(lic.modification)}  Redistribution: ${perm(lic.redistribution)}`,
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
