import { describe, it, expect } from 'vitest';
import { detectLang, messages } from '../src/i18n';

describe('detectLang', () => {
  it('detects Japanese from ja-JP', () => {
    expect(detectLang('ja-JP')).toBe('ja');
  });

  it('detects Japanese from bare "ja"', () => {
    expect(detectLang('ja')).toBe('ja');
  });

  it('is case-insensitive', () => {
    expect(detectLang('JA')).toBe('ja');
  });

  it('falls back to English for en-US', () => {
    expect(detectLang('en-US')).toBe('en');
  });

  it('falls back to English for other locales', () => {
    expect(detectLang('fr')).toBe('en');
    expect(detectLang('zh-CN')).toBe('en');
  });

  it('falls back to English for empty/undefined input', () => {
    expect(detectLang('')).toBe('en');
    expect(detectLang(undefined)).toBe('en');
  });
});

describe('messages', () => {
  it('ja and en define exactly the same keys (no missing translations)', () => {
    const en = Object.keys(messages.en).sort();
    const ja = Object.keys(messages.ja).sort();
    expect(ja).toEqual(en);
  });

  it('has no empty strings', () => {
    for (const lang of ['en', 'ja'] as const) {
      for (const [key, value] of Object.entries(messages[lang])) {
        expect(value, `${lang}.${key}`).not.toBe('');
      }
    }
  });
});
