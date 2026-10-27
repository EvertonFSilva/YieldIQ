import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Trash2, RefreshCw } from 'lucide-react';
import { assetService } from '../../services/apiClient';
import { AssetAutocompleteInput } from '../common/AssetAutocompleteInput';
import { isTijoloFund, calculateBazinForTijolo } from '../../utils/assetValuation';
import { useToast } from '../../context/ToastContext';

interface ComparisonSlot {
  ticker: string;
  name: string;
  price: number;
  dy: number;
  annualDiv: number;
  segment: string;
  type: string;
  isTijolo: boolean;
  isLoading: boolean;
  error: string | null;
}

export const MultiComparatorTool: React.FC = () => {
  const toast = useToast();
  const [comparisonSlots, setComparisonSlots] = useState<ComparisonSlot[]>([
    { ticker: 'HGLG11', name: 'CSHG Logística', price: 152.00, dy: 8.68, annualDiv: 13.20, segment: 'Logística', type: 'FII', isTijolo: true, isLoading: false, error: null },
    { ticker: 'BTLG11', name: 'BTG Pactual Logística', price: 99.50, dy: 9.40, annualDiv: 9.36, segment: 'Logística', type: 'FII', isTijolo: true, isLoading: false, error: null },
    { ticker: 'MXRF11', name: 'Maxi Renda', price: 9.85, dy: 12.18, annualDiv: 1.20, segment: 'Papel', type: 'FII', isTijolo: false, isLoading: false, error: null },
    { ticker: 'XPML11', name: 'XP Malls', price: 104.50, dy: 10.56, annualDiv: 11.04, segment: 'Shoppings', type: 'FII', isTijolo: true, isLoading: false, error: null }
  ]);
  const [newAssetCode, setNewAssetCode] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveBenchmarks = async () => {
      const benchmarkCodes = ['HGLG11', 'BTLG11', 'MXRF11', 'XPML11'];
      const updated = await Promise.all(
        benchmarkCodes.map(async (code, idx) => {
          try {
            const summary = await assetService.retrieveSummary(code);
            const price = summary.priceQuote?.currentPrice || comparisonSlots[idx]?.price || 0;
            const dy = summary.trailingDividendYieldPercentage || comparisonSlots[idx]?.dy || 0;
            const annual = summary.annualDividendSum || comparisonSlots[idx]?.annualDiv || 0;
            const seg = (summary as any).metadata?.segment || comparisonSlots[idx]?.segment || 'Geral';
            const name = (summary as any).name || code;
            const tijolo = isTijoloFund({ type: 'FII', name, metadata: { segment: seg } });

            return {
              ticker: code,
              name,
              price,
              dy,
              annualDiv: annual,
              segment: seg,
              type: 'FII',
              isTijolo: tijolo,
              isLoading: false,
              error: null
            };
          } catch {
            return comparisonSlots[idx];
          }
        })
      );

      if (isMounted) {
        setComparisonSlots(updated);
      }
    };

    fetchLiveBenchmarks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddSlot = async () => {
    const clean = newAssetCode.trim().toUpperCase();
    if (!clean) {
      toast.warning('Informe o código do ativo a ser comparado.');
      return;
    }
    if (comparisonSlots.some((s) => s.ticker === clean)) {
      toast.warning('Este ativo já está na tabela de comparação.');
      return;
    }
    if (comparisonSlots.length >= 9) {
      toast.warning('Limite máximo de 9 ativos atingido.');
      return;
    }

    setIsAdding(true);
    const tempSlot: ComparisonSlot = {
      ticker: clean,
      name: clean,
      price: 0,
      dy: 0,
      annualDiv: 0,
      segment: 'Carregando...',
      type: 'FII',
      isTijolo: false,
      isLoading: true,
      error: null
    };

    setComparisonSlots((prev) => [...prev, tempSlot]);
    setNewAssetCode('');

    try {
      const summary = await assetService.retrieveSummary(clean);
      const price = summary.priceQuote?.currentPrice || 0;
      const dy = summary.trailingDividendYieldPercentage || 0;
      const annual = summary.annualDividendSum || 0;
      const seg = (summary as any).metadata?.segment || 'Renda Imobiliária';
      const name = (summary as any).name || clean;
      const tijolo = isTijoloFund({ type: 'FII', name, metadata: { segment: seg } });

      setComparisonSlots((prev) =>
        prev.map((s) =>
          s.ticker === clean
            ? {
                ...s,
                name,
                price,
                dy,
                annualDiv: annual,
                segment: seg,
                isTijolo: tijolo,
                isLoading: false
              }
            : s
        )
      );
      toast.success(`${clean} adicionado à comparação!`);
    } catch {
      setComparisonSlots((prev) =>
        prev.map((s) =>
          s.ticker === clean
            ? { ...s, isLoading: false, error: 'Falha ao buscar cotação' }
            : s
        )
      );
      toast.error(`Não foi possível sincronizar ${clean}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveSlot = (tickerToRemove: string) => {
    if (comparisonSlots.length <= 2) {
      toast.warning('Mantenha pelo menos 2 ativos para comparação.');
      return;
    }
    setComparisonSlots((prev) => prev.filter((s) => s.ticker !== tickerToRemove));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Comparador de Ativos da B3 (Até 9)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Compare preço, dividend yield, proventos e preço teto lado a lado com dados oficiais sincronizados.
          </p>
        </div>

        <div className="flex items-stretch sm:items-center gap-2">
          <div className="w-full sm:w-48">
            <AssetAutocompleteInput
              value={newAssetCode}
              onChange={setNewAssetCode}
              onSelect={(asset) => {
                setNewAssetCode(asset.ticker);
              }}
              placeholder="Código (ex: KNIP11)"
            />
          </div>
          <button
            type="button"
            onClick={handleAddSlot}
            disabled={isAdding}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {isAdding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/60 shadow-2xl">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-sans">
              <th className="p-4 w-48 font-bold">Métrica / Indicador</th>
              {comparisonSlots.map((slot) => (
                <th key={slot.ticker} className="p-4 text-center min-w-[140px]">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-base font-mono">{slot.ticker}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.ticker)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Remover ativo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {slot.isTijolo && (
                      <span className="rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
                        Tijolo (IPCA+)
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 font-bold text-slate-400 font-sans">Preço Atual</td>
              {comparisonSlots.map((s) => (
                <td key={s.ticker} className="p-4 text-center font-bold text-white text-sm">
                  {s.isLoading ? '...' : `R$ ${s.price.toFixed(2)}`}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 font-bold text-slate-400 font-sans">Dividend Yield (12M)</td>
              {comparisonSlots.map((s) => (
                <td key={s.ticker} className="p-4 text-center font-extrabold text-emerald-400 text-sm">
                  {s.isLoading ? '...' : `${s.dy.toFixed(2)}%`}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 font-bold text-slate-400 font-sans">Proventos Totais 12M</td>
              {comparisonSlots.map((s) => (
                <td key={s.ticker} className="p-4 text-center text-teal-400 font-semibold">
                  {s.isLoading ? '...' : `R$ ${s.annualDiv.toFixed(2)}`}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 font-bold text-slate-400 font-sans">
                Preço Teto Bazin
              </td>
              {comparisonSlots.map((s) => {
                const bazin = s.isTijolo
                  ? calculateBazinForTijolo(s.annualDiv, 6.05, 1.5, 0.0).ceilingPrice
                  : (s.annualDiv > 0 ? s.annualDiv / 0.06 : 0);
                return (
                  <td key={s.ticker} className="p-4 text-center text-cyan-400 font-semibold">
                    {s.isLoading ? '...' : `R$ ${bazin.toFixed(2)}`}
                    <span className="block text-[10px] text-slate-500 font-sans">
                      {s.isTijolo ? 'Benchmark IPCA+' : 'Bazin 6%'}
                    </span>
                  </td>
                );
              })}
            </tr>

            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 font-bold text-slate-400 font-sans">Margem de Segurança</td>
              {comparisonSlots.map((s) => {
                const bazin = s.isTijolo
                  ? calculateBazinForTijolo(s.annualDiv, 6.05, 1.5, 0.0).ceilingPrice
                  : (s.annualDiv > 0 ? s.annualDiv / 0.06 : 0);
                const margin = s.price > 0 && bazin > 0 ? ((bazin / s.price) - 1) * 100 : 0;
                return (
                  <td key={s.ticker} className="p-4 text-center font-bold">
                    {s.isLoading ? (
                      '...'
                    ) : (
                      <span className={margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 font-bold text-slate-400 font-sans">Diagnóstico Bazin</td>
              {comparisonSlots.map((s) => {
                const bazin = s.isTijolo
                  ? calculateBazinForTijolo(s.annualDiv, 6.05, 1.5, 0.0).ceilingPrice
                  : (s.annualDiv > 0 ? s.annualDiv / 0.06 : 0);
                const isOp = s.price > 0 && s.price <= bazin;
                return (
                  <td key={s.ticker} className="p-4 text-center font-sans font-bold">
                    {s.isLoading ? (
                      '...'
                    ) : (
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] ${isOp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {isOp ? 'OPORTUNIDADE' : 'AGUARDAR'}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr className="hover:bg-slate-900/40 transition">
              <td className="p-4 font-bold text-slate-400 font-sans">Segmento Oficial</td>
              {comparisonSlots.map((s) => (
                <td key={s.ticker} className="p-4 text-center text-[11px] text-slate-400 font-sans">
                  {s.segment}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
