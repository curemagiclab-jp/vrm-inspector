// Panel rendering: color-coded metrics, PC/Quest ranks, license, Copy/Export.
import type { AnalysisResult } from './analyze';
import { type PlatformResult, type RankIndex, rankName } from './rank';
import type { NormalizedLicense, Permission } from './license';
import { t } from './i18n';

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
      <h3>${t('summary')}</h3>
      <div class="rank-line"><span>PC</span>${rankBadge(pc.overall)}</div>
      <div class="rank-line"><span>Quest</span>${rankBadge(quest.overall)}</div>
      <p class="caveat">${t('caveat')}</p>
    </section>

    <section class="card">
      <h3>${t('geometry')}</h3>
      ${metricRow(t('triangles'), fmt(a.triangles), worst(pc.triangles, quest.triangles))}
      ${metricRow(t('bones'), fmt(a.bones), worst(pc.bones, quest.bones))}
    </section>

    <section class="card">
      <h3>${t('textures')}</h3>
      ${metricRow(t('vram'), mb(a.textureMemoryMB), worst(pc.textureMemory, quest.textureMemory))}
      ${plainRow(t('texturesLabel'), fmt(a.textureCount))}
      <div class="chips">${resChips || '<span class="muted">—</span>'}</div>
    </section>

    <section class="card">
      <h3>${t('materialsExpressions')}</h3>
      ${plainRow(t('materials'), fmt(a.materials))}
      ${plainRow(t('blendshapes'), fmt(a.expressionCount))}
      ${plainRow(t('springBones'), fmt(a.springBones))}
    </section>

    <section class="card">
      <h3>${t('license')} <span class="muted">(VRM ${lic.specVersion})</span></h3>
      ${plainRow(t('author'), escapeHtml(lic.author) || '<span class="muted">—</span>')}
      ${plainRow(t('allowedUsers'), lic.allowedUser)}
      <div class="metric"><span class="m-label">${t('commercial')}</span>${permIcon(lic.commercialUsage)}</div>
      <div class="metric"><span class="m-label">${t('modification')}</span>${permIcon(lic.modification)}</div>
      <div class="metric"><span class="m-label">${t('redistribution')}</span>${permIcon(lic.redistribution)}</div>
      <div class="metric"><span class="m-label">${t('violentSexual')}</span><span class="m-value">${permIcon(lic.violentUsage)} / ${permIcon(lic.sexualUsage)}</span></div>
      ${plainRow(t('credit'), creditLabel(lic.creditNotation))}
      ${lic.licenseUrl ? `<div class="metric"><a href="${escapeHtml(lic.licenseUrl)}" target="_blank" rel="noopener">${t('licenseDetails')}</a></div>` : ''}
    </section>

    <section class="card">
      ${plainRow(t('file'), escapeHtml(data.fileName))}
      ${plainRow(t('size'), mb(data.fileSizeMB))}
    </section>

    <div class="actions-row">
      <button id="copy-btn" class="btn">${t('copyReport')}</button>
      <button id="export-btn" class="btn">${t('exportPng')}</button>
    </div>
  `;

  const copyBtn = container.querySelector<HTMLButtonElement>('#copy-btn')!;
  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(buildReportText(data));
    copyBtn.textContent = t('copied');
    setTimeout(() => (copyBtn.textContent = t('copyReport')), 1500);
  });
  container
    .querySelector<HTMLButtonElement>('#export-btn')!
    .addEventListener('click', handlers.onExportPng);
}

function creditLabel(c: NormalizedLicense['creditNotation']): string {
  return c === 'required' ? t('creditRequired') : c === 'unnecessary' ? t('creditNotRequired') : '—';
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
