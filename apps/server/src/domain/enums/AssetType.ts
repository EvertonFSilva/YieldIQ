export enum AssetType {
  FII = 'FII',
  FIAGRO = 'FIAGRO',
  FI_INFRA = 'FI_INFRA',
  STOCK = 'STOCK'
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
  if (normalizedType.includes('STOCK') || normalizedType.includes('ACAO') || normalizedType.includes('AÇÃO')) {
    return AssetType.STOCK;
  }
  return AssetType.FII;
}
