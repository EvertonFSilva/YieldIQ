export enum AssetType {
  FII = 'FII',
  FIAGRO = 'FIAGRO',
  FI_INFRA = 'FI-INFRA'
}

export function resolveAssetType(rawTypeIdentifier: string | null | undefined): AssetType {
  if (!rawTypeIdentifier) {
    return AssetType.FII;
  }
  const normalizedType = rawTypeIdentifier.toUpperCase().trim();
  if (normalizedType.includes('INFRA')) {
    return AssetType.FI_INFRA;
  }
  if (normalizedType.includes('AGRO')) {
    return AssetType.FIAGRO;
  }
  return AssetType.FII;
}
