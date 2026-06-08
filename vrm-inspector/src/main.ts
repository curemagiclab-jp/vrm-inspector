import './style.css';
import { Viewer } from './viewer';
import { analyze } from './analyze';
import { evaluate, PC, QUEST } from './rank';
import { parseLicense } from './license';
import { renderReport } from './ui';

const host = document.querySelector<HTMLElement>('#canvas-host')!;
const reportEl = document.querySelector<HTMLElement>('#report')!;
const dropzone = document.querySelector<HTMLElement>('#dropzone')!;
const progress = document.querySelector<HTMLElement>('#progress')!;
const progressText = document.querySelector<HTMLElement>('#progress .ptext')!;
const fileInput = document.querySelector<HTMLInputElement>('#file')!;
const sampleSelect = document.querySelector<HTMLSelectElement>('#sample')!;

const viewer = new Viewer(host);

function setProgress(message: string | null): void {
  if (message === null) {
    progress.hidden = true;
    return;
  }
  progress.hidden = false;
  progressText.textContent = message;
}

async function inspect(buffer: ArrayBuffer, fileName: string, fileSize: number): Promise<void> {
  setProgress(`Parsing ${fileName}…`);
  try {
    const { gltf, vrm } = await viewer.load(buffer);
    const a = analyze(gltf, vrm);
    const metrics = {
      triangles: a.triangles,
      textureMemoryMB: a.textureMemoryMB,
      bones: a.bones,
    };
    const license = parseLicense(vrm.meta);

    renderReport(
      reportEl,
      {
        fileName,
        fileSizeMB: fileSize / (1024 * 1024),
        vrmVersion: license.specVersion,
        analysis: a,
        pc: evaluate(metrics, PC),
        quest: evaluate(metrics, QUEST),
        license,
      },
      { onExportPng: () => exportPng(fileName) },
    );
  } catch (err) {
    reportEl.classList.add('placeholder');
    reportEl.textContent = `⚠️ ${(err as Error).message ?? 'Failed to load this file.'}`;
  } finally {
    setProgress(null);
  }
}

function exportPng(fileName: string): void {
  const url = viewer.screenshot();
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/\.vrm$/i, '')}-vrm-inspector.png`;
  a.click();
}

async function loadFile(file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith('.vrm')) {
    reportEl.classList.add('placeholder');
    reportEl.textContent = '⚠️ Please drop a .vrm file.';
    return;
  }
  const buffer = await file.arrayBuffer();
  await inspect(buffer, file.name, file.size);
}

async function loadSample(path: string): Promise<void> {
  const url = `${import.meta.env.BASE_URL}${path}`;
  setProgress(`Downloading ${path}…`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load sample (${res.status}).`);
    const buffer = await res.arrayBuffer();
    await inspect(buffer, path, buffer.byteLength);
  } catch (err) {
    setProgress(null);
    reportEl.classList.add('placeholder');
    reportEl.textContent = `⚠️ ${(err as Error).message}`;
  }
}

// --- File input ---
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void loadFile(file);
});

// --- Sample dropdown ---
sampleSelect.addEventListener('change', () => {
  if (sampleSelect.value) void loadSample(sampleSelect.value);
});

// --- Drag & drop (whole window) ---
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragDepth++;
  dropzone.classList.add('active');
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  if (--dragDepth <= 0) dropzone.classList.remove('active');
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  dropzone.classList.remove('active');
  const file = e.dataTransfer?.files?.[0];
  if (file) void loadFile(file);
});
