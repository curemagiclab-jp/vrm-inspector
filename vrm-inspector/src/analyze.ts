// Metric aggregation. The pure core (summarize / VRAM helpers) is unit-tested;
// `analyze()` is the thin three.js/three-vrm traversal wrapper that feeds it.
// See docs/SPEC.md sections 2 & 4.

import type { VRM } from '@pixiv/three-vrm';

/** Minimal structural view of the parts of a loaded GLTF this module reads. */
export interface GLTFLike {
  parser?: { json?: { materials?: unknown[] } };
}

/** mipmap chain ≈ 4/3 of the base level (SPEC writes this as ~1.3333). */
export const MIPMAP_FACTOR = 4 / 3;
const BYTES_PER_PIXEL = 4; // RGBA8, uncompressed upper bound

export interface TextureInfo {
  width: number;
  height: number;
}

export interface ResolutionBucket extends TextureInfo {
  count: number;
}

export interface AnalysisInput {
  triangles: number;
  bones: number;
  materials: number;
  springBones: number;
  expressionNames: string[];
  textures: TextureInfo[];
}

export interface AnalysisResult {
  triangles: number;
  bones: number;
  materials: number;
  springBones: number;
  expressionCount: number;
  expressionNames: string[];
  textureCount: number;
  textureMemoryBytes: number;
  textureMemoryMB: number;
  resolutions: ResolutionBucket[];
}

/** Upper-bound VRAM for one texture: w * h * 4 bytes * mipmap factor. Compression ignored. */
export function estimateTextureVramBytes(width: number, height: number): number {
  return width * height * BYTES_PER_PIXEL * MIPMAP_FACTOR;
}

/** Bytes -> MiB (1024 * 1024), matching how VRAM is conventionally reported. */
export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/** Pure aggregation from plain values — fully unit-testable. */
export function summarize(input: AnalysisInput): AnalysisResult {
  const textureMemoryBytes = input.textures.reduce(
    (sum, t) => sum + estimateTextureVramBytes(t.width, t.height),
    0,
  );

  // Group identical resolutions, largest area first.
  const groups = new Map<string, ResolutionBucket>();
  for (const t of input.textures) {
    const key = `${t.width}x${t.height}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, { width: t.width, height: t.height, count: 1 });
  }
  const resolutions = [...groups.values()].sort(
    (a, b) => b.width * b.height - a.width * a.height,
  );

  return {
    triangles: input.triangles,
    bones: input.bones,
    materials: input.materials,
    springBones: input.springBones,
    expressionCount: input.expressionNames.length,
    expressionNames: input.expressionNames,
    textureCount: input.textures.length,
    textureMemoryBytes,
    textureMemoryMB: bytesToMB(textureMemoryBytes),
    resolutions,
  };
}

/** Traverse a loaded VRM/GLTF, extract raw values, and summarize. */
export function analyze(gltf: GLTFLike, vrm: VRM): AnalysisResult {
  let triangles = 0;
  const bones = new Set<object>();
  const textures = new Map<string, TextureInfo>();

  vrm.scene.traverse((o: any) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry;
      triangles += g.index
        ? g.index.count / 3
        : g.attributes.position.count / 3;
      collectMaterialTextures(o.material, textures);
    }
    if (o.isBone) bones.add(o);
  });

  // Material count from the glTF json (definition count, per SPEC).
  const json: any = gltf.parser?.json ?? {};
  const materials =
    Array.isArray(json.materials) ? json.materials.length : countMeshMaterials(vrm);

  const expressionNames =
    vrm.expressionManager?.expressions?.map(
      (e: any) => e.expressionName ?? e.name ?? '',
    ) ?? [];

  const springAny: any = (vrm as any).springBoneManager?.joints;
  const springBones = springAny?.size ?? springAny?.length ?? 0;

  return summarize({
    triangles: Math.round(triangles),
    bones: bones.size,
    materials,
    springBones,
    expressionNames,
    textures: [...textures.values()],
  });
}

interface TextureRef extends TextureInfo {
  uuid: string;
}

/**
 * Collect textures from a single material.
 * - Standard materials expose maps as own properties (map, normalMap, …).
 * - MToon (three-vrm) exposes them as prototype getters backed by uniforms,
 *   so Object.keys misses them — we also scan `material.uniforms[*].value`.
 */
export function texturesFromMaterial(material: any): TextureRef[] {
  if (!material) return [];
  const out: TextureRef[] = [];
  const seen = new Set<string>();

  const consider = (tex: any): void => {
    if (!tex || !tex.isTexture || !tex.uuid || !tex.image) return;
    const img = tex.image;
    const width = img.width ?? img.naturalWidth ?? img.videoWidth ?? 0;
    const height = img.height ?? img.naturalHeight ?? img.videoHeight ?? 0;
    if (width && height && !seen.has(tex.uuid)) {
      seen.add(tex.uuid);
      out.push({ uuid: tex.uuid, width, height });
    }
  };

  for (const key of Object.keys(material)) consider(material[key]);
  const uniforms = material.uniforms;
  if (uniforms) for (const k of Object.keys(uniforms)) consider(uniforms[k]?.value);

  return out;
}

function collectMaterialTextures(material: any, out: Map<string, TextureInfo>): void {
  const mats = Array.isArray(material) ? material : [material];
  for (const m of mats) {
    for (const t of texturesFromMaterial(m)) {
      if (!out.has(t.uuid)) out.set(t.uuid, { width: t.width, height: t.height });
    }
  }
}

function countMeshMaterials(vrm: VRM): number {
  const seen = new Set<string>();
  vrm.scene.traverse((o: any) => {
    if (o.isMesh && o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m?.uuid) seen.add(m.uuid);
    }
  });
  return seen.size;
}
