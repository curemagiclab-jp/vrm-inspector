// VRM 0.x / 1.0 license parsing into one normalized shape for the UI.
// See docs/SPEC.md section 6. VRM single files do not always express every
// permission, so unknown values are reported honestly as 'unknown'.

export type Permission = 'allow' | 'disallow' | 'unknown';
export type AllowedUser = 'OnlyAuthor' | 'ExplicitlyLicensedPerson' | 'Everyone' | 'Unknown';
export type Credit = 'required' | 'unnecessary' | 'unknown';

export interface NormalizedLicense {
  specVersion: '0.x' | '1.0' | 'unknown';
  title: string;
  author: string;
  allowedUser: AllowedUser;
  commercialUsage: Permission;
  violentUsage: Permission;
  sexualUsage: Permission;
  modification: Permission;
  redistribution: Permission;
  creditNotation: Credit;
  licenseName: string;
  licenseUrl: string;
}

const EMPTY: NormalizedLicense = {
  specVersion: 'unknown',
  title: '',
  author: '',
  allowedUser: 'Unknown',
  commercialUsage: 'unknown',
  violentUsage: 'unknown',
  sexualUsage: 'unknown',
  modification: 'unknown',
  redistribution: 'unknown',
  creditNotation: 'unknown',
  licenseName: '',
  licenseUrl: '',
};

/** Parse a three-vrm meta object (VRM0Meta or VRM1Meta). Detects version via `metaVersion`. */
export function parseLicense(meta: any): NormalizedLicense {
  if (!meta) return { ...EMPTY };
  return meta.metaVersion === '1' ? parseVrm1(meta) : parseVrm0(meta);
}

function bool(b: unknown): Permission {
  if (b === true) return 'allow';
  if (b === false) return 'disallow';
  return 'unknown';
}

function parseVrm0(meta: any): NormalizedLicense {
  const allowedUser: AllowedUser =
    meta.allowedUserName === 'Everyone'
      ? 'Everyone'
      : meta.allowedUserName === 'ExplicitlyLicensedPerson'
        ? 'ExplicitlyLicensedPerson'
        : meta.allowedUserName === 'OnlyAuthor'
          ? 'OnlyAuthor'
          : 'Unknown';

  const allowDisallow = (v: unknown): Permission =>
    v === 'Allow' ? 'allow' : v === 'Disallow' ? 'disallow' : 'unknown';

  // VRM 0.x has no dedicated modification/redistribution flag; only the license
  // name hints at redistribution being prohibited.
  const redistribution: Permission =
    meta.licenseName === 'Redistribution_Prohibited' ? 'disallow' : 'unknown';

  return {
    ...EMPTY,
    specVersion: '0.x',
    title: meta.title ?? '',
    author: meta.author ?? '',
    allowedUser,
    commercialUsage: allowDisallow(meta.commercialUssageName),
    violentUsage: allowDisallow(meta.violentUssageName),
    sexualUsage: allowDisallow(meta.sexualUssageName),
    modification: 'unknown',
    redistribution,
    creditNotation: 'unknown',
    licenseName: meta.licenseName ?? '',
    licenseUrl: meta.otherLicenseUrl ?? '',
  };
}

function parseVrm1(meta: any): NormalizedLicense {
  const allowedUser: AllowedUser =
    meta.avatarPermission === 'everyone'
      ? 'Everyone'
      : meta.avatarPermission === 'onlySeparatelyLicensedPerson'
        ? 'ExplicitlyLicensedPerson'
        : meta.avatarPermission === 'onlyAuthor'
          ? 'OnlyAuthor'
          : 'Unknown';

  // commercialUsage: 'personalNonProfit' = no commercial; 'personalProfit'/'corporation' = commercial allowed.
  const commercialUsage: Permission =
    meta.commercialUsage === 'personalNonProfit'
      ? 'disallow'
      : meta.commercialUsage === 'personalProfit' || meta.commercialUsage === 'corporation'
        ? 'allow'
        : 'unknown';

  const modification: Permission =
    meta.modification === 'prohibited'
      ? 'disallow'
      : meta.modification === 'allowModification' || meta.modification === 'allowModificationRedistribution'
        ? 'allow'
        : 'unknown';

  const creditNotation: Credit =
    meta.creditNotation === 'required'
      ? 'required'
      : meta.creditNotation === 'unnecessary'
        ? 'unnecessary'
        : 'unknown';

  const authors = Array.isArray(meta.authors) ? meta.authors.filter(Boolean) : [];

  return {
    ...EMPTY,
    specVersion: '1.0',
    title: meta.name ?? '',
    author: authors.join(', '),
    allowedUser,
    commercialUsage,
    violentUsage: bool(meta.allowExcessivelyViolentUsage),
    sexualUsage: bool(meta.allowExcessivelySexualUsage),
    modification,
    redistribution: bool(meta.allowRedistribution),
    creditNotation,
    licenseName: '',
    licenseUrl: meta.licenseUrl ?? '',
  };
}
