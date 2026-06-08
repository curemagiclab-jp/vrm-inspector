import { describe, it, expect } from 'vitest';
import { parseLicense } from '../src/license';

// VRM 0.x meta (pixiv original spelling kept on purpose: *UssageName)
const vrm0 = {
  metaVersion: '0' as const,
  title: 'Sample Avatar',
  author: 'Alice',
  allowedUserName: 'Everyone',
  violentUssageName: 'Disallow',
  sexualUssageName: 'Disallow',
  commercialUssageName: 'Allow',
  licenseName: 'CC_BY',
  otherLicenseUrl: 'https://example.com/license',
};

// VRM 1.0 meta (VRMC_vrm)
const vrm1 = {
  metaVersion: '1' as const,
  name: 'Sample 1.0',
  authors: ['Bob', 'Carol'],
  avatarPermission: 'onlyAuthor',
  commercialUsage: 'corporation',
  allowExcessivelyViolentUsage: false,
  allowExcessivelySexualUsage: false,
  creditNotation: 'required',
  modification: 'allowModificationRedistribution',
  allowRedistribution: true,
  licenseUrl: 'https://vrm.dev/licenses/1.0/',
};

describe('parseLicense — VRM 0.x', () => {
  const r = parseLicense(vrm0);

  it('detects the spec version', () => {
    expect(r.specVersion).toBe('0.x');
  });

  it('reads title and author', () => {
    expect(r.title).toBe('Sample Avatar');
    expect(r.author).toBe('Alice');
  });

  it('maps commercial usage to a tri-state permission', () => {
    expect(r.commercialUsage).toBe('allow');
  });

  it('maps violent/sexual usage', () => {
    expect(r.violentUsage).toBe('disallow');
    expect(r.sexualUsage).toBe('disallow');
  });

  it('leaves modification/redistribution/credit unknown when absent in 0.x', () => {
    expect(r.modification).toBe('unknown');
    expect(r.redistribution).toBe('unknown');
    expect(r.creditNotation).toBe('unknown');
  });

  it('normalizes the allowed-user enum', () => {
    expect(r.allowedUser).toBe('Everyone');
  });

  it('flags redistribution disallowed for Redistribution_Prohibited license', () => {
    const r2 = parseLicense({ ...vrm0, licenseName: 'Redistribution_Prohibited' });
    expect(r2.redistribution).toBe('disallow');
  });
});

describe('parseLicense — VRM 1.0', () => {
  const r = parseLicense(vrm1);

  it('detects the spec version', () => {
    expect(r.specVersion).toBe('1.0');
  });

  it('reads name and joins multiple authors', () => {
    expect(r.title).toBe('Sample 1.0');
    expect(r.author).toBe('Bob, Carol');
  });

  it('treats corporation commercial usage as allowed', () => {
    expect(r.commercialUsage).toBe('allow');
    expect(parseLicense({ ...vrm1, commercialUsage: 'personalNonProfit' }).commercialUsage).toBe('disallow');
  });

  it('maps modification and redistribution', () => {
    expect(r.modification).toBe('allow');
    expect(r.redistribution).toBe('allow');
    expect(parseLicense({ ...vrm1, modification: 'prohibited' }).modification).toBe('disallow');
  });

  it('maps credit notation and allowed-user enum', () => {
    expect(r.creditNotation).toBe('required');
    expect(r.allowedUser).toBe('OnlyAuthor');
  });
});

describe('parseLicense — missing meta', () => {
  it('returns an unknown-filled result when meta is null', () => {
    const r = parseLicense(null);
    expect(r.title).toBe('');
    expect(r.author).toBe('');
    expect(r.commercialUsage).toBe('unknown');
    expect(r.allowedUser).toBe('Unknown');
  });
});
