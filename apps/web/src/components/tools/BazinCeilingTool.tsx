import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, AlertTriangle, Building, RefreshCw, ChevronDown } from 'lucide-react';
import { assetService, treasuryService } from '../../services/apiClient';
import { TreasuryBondItem } from '../../types';
import { AssetAutocompleteInput } from '../common/AssetAutocompleteInput';
import { isTijoloFund } from '../../utils/assetValuation';
import { useToast } from '../../context/ToastContext';

export const BazinCeilingTool: React.FC = () => {
  const toast = useToast();
  const [searchTicker, setSearchTicker] = useState<string>('HGLG11');
  const [currentPrice, setCurrentPrice] = useState<number>(152.00);
  const [annualDividend, setAnnualDividend] = useState<number>(13.20);
  const [baseRate, setBaseRate] = useState<number>(6.05);
  const [riskPremium, setRiskPremium] = useState<number>(1.5);
  const [growthRate, setGrowthRate] = useState<number>(0.0);
  const [selectedBondTitle, setSelectedBondTitle] = useState<string>('Tesouro IPCA+ 2035');
  const [isTijolo, setIsTijolo] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [treasuryBonds, setTreasuryBonds] = useState<TreasuryBondItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    treasuryService
      .retrieveBonds()
      .then((bonds) => {
        if (Array.isArray(bonds)) {
          setTreasuryBonds(bonds);
          const ipca2035 = bonds.find(
            (b) => b.bondName.toUpperCase().includes('IPCA+') && b.bondName.includes('2035')
          );
          if (ipca2035 && ipca2035.profitabilityRate > 0) {
            setBaseRate(ipca2035.profitabilityRate);
            setSelectedBondTitle(`${ipca2035.bondName} (${ipca2035.profitabilityRate}% a.a.)`);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleFetchAsset = async (customTicker?: string) => {
    const clean = (customTicker || searchTicker).trim().toUpperCase();
    if (!clean) return;
    setIsLoading(true);

    try {
      const summary = await assetService.retrieveSummary(clean);
      const price = summary.priceQuote?.currentPrice || 0;
      const divs = summary.annualDividendSum || 0;
      const seg = (summary as any).metadata?.segment || '';
      const name = (summary as any).name || '';
      const tijoloDetected = isTijoloFund({ type: 'FII', name, metadata: { segment: seg } });

      setCurrentPrice(price > 0 ? price : 100.0);
      setAnnualDividend(divs > 0 ? divs : 10.0);
      setIsTijolo(tijoloDetected);

      if (tijoloDetected) {
        const ipcaBond = treasuryBonds.find(
          (b) => b.bondName.toUpperCase().includes('IPCA+') && b.bondName.includes('2035')
        ) || treasuryBonds.find((b) => b.bondName.toUpperCase().includes('IPCA+'));

        if (ipcaBond && ipcaBond.profitabilityRate > 0) {
          setBaseRate(ipcaBond.profitabilityRate);
          setSelectedBondTitle(`${ipcaBond.bondName} (${ipcaBond.profitabilityRate}% a.a.)`);
        } else {
          setBaseRate(6.05);
          setSelectedBondTitle('Tesouro IPCA+ 2035 (6,05% a.a.)');
        }
        setRiskPremium(1.5);
        toast.success(`Dados de ${clean} sincronizados! Ativo classificado como FII de Tijolo (Benchmark IPCA+).`);
      } else {
        setBaseRate(6.0);
        setSelectedBondTitle('Taxa Clássica Décio Bazin (6,00% a.a.)');
        setRiskPremium(0.0);
        toast.success(`Dados de ${clean} carregados com sucesso!`);
      }
    } catch {
      toast.error(`Não foi possível carregar dados para ${clean}`);
    } finally {
      setIsLoading(false);
    }
  };

  const targetYield = Math.max(0.1, (baseRate + riskPremium) - growthRate);
  const projectedDividend = annualDividend * (1 + growthRate / 100);
  const bazinCeiling = targetYield > 0 ? projectedDividend / (targetYield / 100) : 0;
  const safetyMargin = currentPrice > 0 ? ((bazinCeiling / currentPrice) - 1) * 100 : 0;
  const isOpportunity = currentPrice <= bazinCeiling;

  const handleSelectBond = (bondName: string, rate: number) => {
    setSelectedBondTitle(`${bondName} (${rate}% a.a.)`);
    setBaseRate(rate);
    setIsDropdownOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calculator className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Preço Teto Décio Bazin & Gordon</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Buscar Código do Ativo</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <AssetAutocompleteInput
                  value={searchTicker}
                  onChange={setSearchTicker}
                  onSelect={(asset) => {
                    setSearchTicker(asset.ticker);
                    handleFetchAsset(asset.ticker);
                  }}
                  placeholder="Ex: HGLG11, BTLG11"
                />
              </div>
              <button
                type="button"
                onClick={() => handleFetchAsset()}
                disabled={isLoading}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Sincronizar'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">Classificação do Ativo</span>
              <span className="block text-[11px] text-slate-400">
                {isTijolo ? 'FII de Tijolo (Aluguéis com correção de inflação)' : 'Papel / Outro (Rendimento nominal)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const newTijolo = !isTijolo;
                setIsTijolo(newTijolo);
                if (newTijolo) {
                  setBaseRate(6.05);
                  setRiskPremium(1.5);
                  setSelectedBondTitle('Tesouro IPCA+ 2035 (6,05% a.a.)');
                } else {
                  setBaseRate(6.0);
                  setRiskPremium(0.0);
                  setSelectedBondTitle('Taxa Clássica Décio Bazin (6,00% a.a.)');
                }
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition ${
                isTijolo
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              {isTijolo ? 'Tijolo (IPCA+)' : 'Papel / Ação'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Taxa Base de Referência (% a.a.)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 transition text-left"
              >
                <span className="truncate">{selectedBondTitle}</span>
                <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl max-h-56 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Títulos do Tesouro Direto Oficial
                  </div>
                  {treasuryBonds
                    .filter((b) => b.bondName.toUpperCase().includes('IPCA+') || b.bondName.toUpperCase().includes('SELIC'))
                    .map((b) => (
                      <button
                        key={b.bondKey}
                        type="button"
                        onClick={() => handleSelectBond(b.bondName, b.profitabilityRate)}
                        className="w-full text-left rounded-xl px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        {b.bondName} &bull; <strong className="text-emerald-400">{b.profitabilityRate}% a.a.</strong>
                      </button>
                    ))}
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBondTitle('Taxa Clássica Décio Bazin (6,00% a.a.)');
                      setBaseRate(6.0);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left rounded-xl px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    Bazin Clássico &bull; <strong className="text-emerald-400">6,00% a.a.</strong>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prêmio de Risco (% a.a.)</label>
              <input
                type="number"
                step={0.1}
                value={riskPremium}
                onChange={(e) => setRiskPremium(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Crescimento Anual (%)</label>
              <input
                type="number"
                step={0.1}
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Proventos Últimos 12M (R$)</label>
              <input
                type="number"
                step={0.01}
                value={annualDividend}
                onChange={(e) => setAnnualDividend(Math.max(0.01, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cotação Atual (R$)</label>
              <input
                type="number"
                step={0.01}
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Math.max(0.01, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {isTijolo ? 'Preço Teto Bazin Tijolo (IPCA+)' : 'Preço Teto Sugerido'}
              </span>
              {isTijolo && (
                <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  IPCA+ Real
                </span>
              )}
            </div>
            <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
              R$ {bazinCeiling.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Cotação atual na B3: <strong>R$ {currentPrice.toFixed(2)}</strong> &bull; Proventos anuais: <strong>R$ {annualDividend.toFixed(2)}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Yield Alvo Exigido</span>
              <span className="text-xl font-bold text-emerald-400">
                {targetYield.toFixed(2)}% a.a.
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Taxa Base ({baseRate.toFixed(2)}%) + Risco ({riskPremium.toFixed(2)}%)
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Margem de Segurança</span>
              <span className={`text-xl font-bold ${safetyMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {safetyMargin >= 0 ? '+' : ''}{safetyMargin.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {safetyMargin >= 0 ? 'Desconto sobre o teto' : 'Ágio sobre o teto'}
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Diagnóstico</span>
              <div className="flex items-center gap-1.5 mt-1">
                {isOpportunity ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span className={`text-xs font-bold ${isOpportunity ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isOpportunity ? 'OPORTUNIDADE' : 'AGUARDAR'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {isOpportunity ? 'Preço abaixo do teto' : 'Preço acima do teto'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-white">
                {isTijolo ? 'Por que Fundos de Tijolo usam o Tesouro IPCA+?' : 'Regra de Graham & Bazin'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isTijolo
                ? `Como os imóveis físicos têm seus aluguéis reajustados anualmente pela inflação oficial (IPCA/IGP-M), o yield distribuído já é líquido de inflação (ganho real). Assim, comparar um FII de Tijolo com a taxa Selic nominal distorce o valuation. A metodologia correta adota como taxa mínima o Tesouro IPCA+ (${baseRate.toFixed(2)}%) acrescido de um prêmio de risco (${riskPremium.toFixed(2)}%), resultando em ${targetYield.toFixed(2)}% de yield alvo.`
                : 'Para ações e ativos que pagam juros nominais, Décio Bazin estabeleceu a taxa clássica de 6% ao ano como remuneração mínima necessária para compensar o risco de renda variável.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
