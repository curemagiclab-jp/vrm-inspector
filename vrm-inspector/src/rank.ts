// VRChat Performance Rank judgement.
// Thresholds are the official values from docs/SPEC.md section 5. Do not change them.

export const RANKS = ['Excellent', 'Good', 'Medium', 'Poor', 'Very Poor'] as const;
export type Rank = (typeof RANKS)[number];
export type RankIndex = 0 | 1 | 2 | 3 | 4;

export interface Limits {
  /** ascending thresholds for Excellent/Good/Medium/Poor; above last -> Very Poor */
  triangles: number[];
  texMem: number[]; // MB
  bones: number[];
}

export const PC: Limits = {
  triangles: [32000, 70000, 70000, 70000],
  texMem: [40, 75, 110, 150],
  bones: [75, 150, 256, 400],
};

export const QUEST: Limits = {
  triangles: [7500, 10000, 15000, 20000],
  texMem: [10, 18, 25, 40],
  bones: [75, 90, 150, 150],
};

export interface Metrics {
  triangles: number;
  textureMemoryMB: number;
  bones: number;
}

export interface PlatformResult {
  triangles: RankIndex;
  textureMemory: RankIndex;
  bones: RankIndex;
  /** worst of the three metrics */
  overall: RankIndex;
}

/** Return the rank index (0..4) for a value against ascending limits. First match wins. */
export function rankOf(value: number, limits: number[]): RankIndex {
  for (let i = 0; i < limits.length; i++) {
    if (value <= limits[i]) return i as RankIndex;
  }
  return 4;
}

export function rankName(index: RankIndex): Rank {
  return RANKS[index];
}

/** Evaluate metrics against a platform's limits. Overall = worst metric. */
export function evaluate(metrics: Metrics, limits: Limits): PlatformResult {
  const triangles = rankOf(metrics.triangles, limits.triangles);
  const textureMemory = rankOf(metrics.textureMemoryMB, limits.texMem);
  const bones = rankOf(metrics.bones, limits.bones);
  const overall = Math.max(triangles, textureMemory, bones) as RankIndex;
  return { triangles, textureMemory, bones, overall };
}
