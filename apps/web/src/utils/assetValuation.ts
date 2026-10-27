export const isTijoloFund = (asset: { type?: string; name?: string; metadata?: any }): boolean => {
  if (!asset || asset.type !== 'FII') return false;
  const seg = ((asset.metadata?.segment as string) || '').toLowerCase();
  const name = (asset.name || '').toLowerCase();
  const tijoloKeywords = [
    'tijolo',
    'logística',
    'logistica',
    'log ',
    ' log',
    'shopping',
    'shoppings',
    'mall',
    'laje',
    'lajes',
    'corporativ',
    'escritório',
    'escritorio',
    'renda urbana',
    'varejo',
    'imóveis',
    'imoveis',
    'galp',
    'hotel',
    'hospital',
    'educacion',
    'residenc'
  ];
  return tijoloKeywords.some((kw) => seg.includes(kw) || name.includes(kw));
};

export const calculateBazinForTijolo = (
  annualDividends: number,
  treasuryIpcaRate: number = 6.05,
  riskPremium: number = 1.5,
  growth: number = 0.0
): { targetYield: number; ceilingPrice: number } => {
  const targetYield = Math.max(0.1, treasuryIpcaRate + riskPremium - growth);
  if (annualDividends <= 0) {
    return { targetYield, ceilingPrice: 0 };
  }
  const projectedDiv = annualDividends * (1 + growth / 100);
  const ceilingPrice = projectedDiv / (targetYield / 100);
  return { targetYield, ceilingPrice };
};

export const getAssetClassificationLabel = (asset: { type?: string; name?: string; metadata?: any }): {
  label: string;
  badgeStyle: string;
  isTijolo: boolean;
} => {
  if (asset.type === 'FIAGRO') {
    return {
      label: 'Agro (CRA)',
      badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      isTijolo: false
    };
  }
  if (asset.type === 'FI_INFRA') {
    return {
      label: 'Infra (Debênture)',
      badgeStyle: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      isTijolo: false
    };
  }
  if (asset.type === 'FII') {
    if (isTijoloFund(asset)) {
      return {
        label: 'Tijolo (IPCA+)',
        badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        isTijolo: true
      };
    }
    return {
      label: 'Papel (CRI/CDI)',
      badgeStyle: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
      isTijolo: false
    };
  }
  return {
    label: 'Geral',
    badgeStyle: 'bg-slate-800 text-slate-300 border-slate-700',
    isTijolo: false
  };
};
