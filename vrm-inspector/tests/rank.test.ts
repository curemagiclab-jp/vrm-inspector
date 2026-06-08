import { describe, it, expect } from 'vitest';
import { rankOf, evaluate, rankName, RANKS, PC, QUEST } from '../src/rank';

describe('rankOf', () => {
  it('returns 0 (Excellent) at the lower boundary', () => {
    expect(rankOf(32000, PC.triangles)).toBe(0);
  });

  it('steps to the next rank just over a threshold', () => {
    expect(rankOf(32001, PC.triangles)).toBe(1);
  });

  it('returns 4 (Very Poor) when above the last limit', () => {
    expect(rankOf(70001, PC.triangles)).toBe(4);
  });

  it('handles flat thresholds (PC triangles 70k for Good/Medium/Poor)', () => {
    // 70000 is the cap for Good/Medium/Poor; first match wins -> Good (1)
    expect(rankOf(70000, PC.triangles)).toBe(1);
  });
});

describe('rankName', () => {
  it('maps indices to official rank labels', () => {
    expect(rankName(0)).toBe('Excellent');
    expect(rankName(4)).toBe('Very Poor');
    expect(RANKS.length).toBe(5);
  });
});

describe('evaluate', () => {
  it('overall rank equals the worst of the three metrics', () => {
    // tris Excellent, texMem Good, bones Very Poor -> overall Very Poor
    const r = evaluate({ triangles: 1000, textureMemoryMB: 50, bones: 500 }, PC);
    expect(r.triangles).toBe(0);
    expect(r.textureMemory).toBe(1);
    expect(r.bones).toBe(4);
    expect(r.overall).toBe(4);
  });

  it('rates a light avatar Excellent on PC', () => {
    const r = evaluate({ triangles: 20000, textureMemoryMB: 30, bones: 60 }, PC);
    expect(r.overall).toBe(0);
  });

  it('Quest limits are stricter than PC for the same avatar', () => {
    const m = { triangles: 18000, textureMemoryMB: 30, bones: 60 };
    // PC: tris 0, texMem 0, bones 0 -> Excellent
    expect(evaluate(m, PC).overall).toBe(0);
    // Quest: tris 18k -> Poor(3), texMem 30 -> Poor(3), bones 60 -> Excellent(0) => Poor
    expect(evaluate(m, QUEST).overall).toBe(3);
  });
});
