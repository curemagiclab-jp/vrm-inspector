import { describe, it, expect } from 'vitest';
import {
  estimateTextureVramBytes,
  bytesToMB,
  summarize,
  texturesFromMaterial,
  MIPMAP_FACTOR,
} from '../src/analyze';

const fakeTex = (uuid: string, width: number, height: number) => ({
  isTexture: true,
  uuid,
  image: { width, height },
});

describe('texturesFromMaterial', () => {
  it('finds textures on standard materials (own properties)', () => {
    const mat = { map: fakeTex('a', 1024, 1024), normalMap: fakeTex('b', 512, 512) };
    expect(texturesFromMaterial(mat)).toEqual([
      { uuid: 'a', width: 1024, height: 1024 },
      { uuid: 'b', width: 512, height: 512 },
    ]);
  });

  it('finds MToon textures stored in uniforms (getters are not own-enumerable)', () => {
    // Reproduces the real bug: MToonMaterial exposes `map` via a prototype
    // getter and keeps the texture in uniforms.map.value, so Object.keys misses it.
    const proto = {};
    Object.defineProperty(proto, 'map', {
      get() {
        return this.uniforms.map.value;
      },
      enumerable: false,
    });
    const mtoon: any = Object.create(proto);
    mtoon.uniforms = {
      map: { value: fakeTex('m', 2048, 2048) },
      shadeMultiplyTexture: { value: fakeTex('s', 1024, 1024) },
      shadingToonyFactor: { value: 0.9 }, // non-texture uniform, ignored
    };
    expect(texturesFromMaterial(mtoon)).toEqual([
      { uuid: 'm', width: 2048, height: 2048 },
      { uuid: 's', width: 1024, height: 1024 },
    ]);
  });

  it('dedupes a texture referenced from multiple slots and ignores empties', () => {
    const shared = fakeTex('dup', 256, 256);
    const mat = { map: shared, emissiveMap: shared, normalMap: null, color: 0xffffff };
    expect(texturesFromMaterial(mat)).toEqual([{ uuid: 'dup', width: 256, height: 256 }]);
  });
});

describe('estimateTextureVramBytes', () => {
  it('uses w * h * 4 bytes * mipmap factor (upper-bound, compression ignored)', () => {
    expect(estimateTextureVramBytes(1024, 1024)).toBe(1024 * 1024 * 4 * MIPMAP_FACTOR);
  });

  it('mipmap factor approximates 4/3', () => {
    expect(MIPMAP_FACTOR).toBeCloseTo(4 / 3, 4);
  });
});

describe('bytesToMB', () => {
  it('converts using MiB (1024*1024)', () => {
    expect(bytesToMB(1024 * 1024)).toBe(1);
  });
});

describe('summarize', () => {
  const input = {
    triangles: 45320,
    bones: 128,
    materials: 9,
    springBones: 14,
    expressionNames: ['happy', 'angry', 'sad'],
    textures: [
      { width: 2048, height: 2048 },
      { width: 1024, height: 1024 },
      { width: 1024, height: 1024 },
    ],
  };
  const r = summarize(input);

  it('passes through simple counts', () => {
    expect(r.triangles).toBe(45320);
    expect(r.bones).toBe(128);
    expect(r.materials).toBe(9);
    expect(r.springBones).toBe(14);
    expect(r.textureCount).toBe(3);
  });

  it('counts expressions and keeps their names', () => {
    expect(r.expressionCount).toBe(3);
    expect(r.expressionNames).toEqual(['happy', 'angry', 'sad']);
  });

  it('sums texture VRAM across all textures', () => {
    const expected =
      estimateTextureVramBytes(2048, 2048) +
      estimateTextureVramBytes(1024, 1024) * 2;
    expect(r.textureMemoryBytes).toBeCloseTo(expected, 3);
    expect(r.textureMemoryMB).toBeCloseTo(bytesToMB(expected), 6);
  });

  it('groups texture resolutions, sorted largest first', () => {
    expect(r.resolutions).toEqual([
      { width: 2048, height: 2048, count: 1 },
      { width: 1024, height: 1024, count: 2 },
    ]);
  });

  it('handles an empty texture list without dividing by zero', () => {
    const e = summarize({ ...input, textures: [] });
    expect(e.textureMemoryBytes).toBe(0);
    expect(e.textureMemoryMB).toBe(0);
    expect(e.resolutions).toEqual([]);
  });
});
