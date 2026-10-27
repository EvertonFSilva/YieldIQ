import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Trash2, RefreshCw } from 'lucide-react';
import { assetService } from '../../services/apiClient';
import { AssetAutocompleteInput } from '../common/AssetAutocompleteInput';
import { useToast } from '../../context/ToastContext';

interface PortfolioItem {
  ticker: string;
  quotas: number;
  currentPrice: number;
  annualDividendPerQuota: number;
  monthlyDividendPerQuota: number;
  dividendYield: number;
  segment: string;
  isLoading: boolean;
}

export const DividendCalendarTool: React.FC = () => {
  const toast = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { ticker: 'HGLG11', quotas: 100, currentPrice: 152.00, annualDividendPerQuota: 13.20, monthlyDividendPerQuota: 1.10, dividendYield: 8.68, segment: 'Logística', isLoading: false },
    { ticker: 'BTLG11', quotas: 120, currentPrice: 99.50, annualDividendPerQuota: 9.36, monthlyDividendPerQuota: 0.78, dividendYield: 9.40, segment: 'Logística', isLoading: false },
    { ticker: 'MXRF11', quotas: 1200, currentPrice: 9.85, annualDividendPerQuota: 1.20, monthlyDividendPerQuota: 0.10, dividendYield: 12.18, segment: 'Papel', isLoading: false },
    { ticker: 'XPML11', quotas: 80, currentPrice: 104.50, annualDividendPerQuota: 11.04, monthlyDividendPerQuota: 0.92, dividendYield: 10.56, segment: 'Shoppings', isLoading: false }
  ]);

  const [newTicker, setNewTicker] = useState<string>('');
  const [newQuotas, setNewQuotas] = useState<number>(100);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const syncLivePortfolio = async () => {
      const updated = await Promise.all(
        portfolio.map(async (item) => {
          try {
            const summary = await assetService.retrieveSummary(item.ticker);
            const price = summary.priceQuote?.currentPrice || item.currentPrice;
            const annual = summary.annualDividendSum || item.annualDividendPerQuota;
            const monthly = annual > 0 ? annual / 12 : item.monthlyDividendPerQuota;
            const dy = summary.trailingDividendYieldPercentage || item.dividendYield;
            const seg = (summary as any).metadata?.segment || item.segment;
            return {
              ...item,
              currentPrice: price,
              annualDividendPerQuota: annual,
              monthlyDividendPerQuota: monthly,
              dividendYield: dy,
              segment: seg,
              isLoading: false
            };
          } catch {
            return { ...item, isLoading: false };
          }
        })
      );
      if (isMounted) {
        setPortfolio(updated);
      }
    };
    syncLivePortfolio();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddAsset = async () => {
    const clean = newTicker.trim().toUpperCase();
    if (!clean) {
      toast.warning('Informe o código do ativo.');
      return;
    }
    if (newQuotas <= 0) {
      toast.warning('Informe uma quantidade válida de cotas.');
      return;
    }
    if (portfolio.some((p) => p.ticker === clean)) {
      toast.warning('Este ativo já faz parte do seu calendário.');
      return;
    }

    setIsAdding(true);
    try {
      const summary = await assetService.retrieveSummary(clean);
      const price = summary.priceQuote?.currentPrice || 10.0;
      const annual = summary.annualDividendSum || 1.0;
      const monthly = annual > 0 ? annual / 12 : 0.08;
      const dy = summary.trailingDividendYieldPercentage || 10.0;
      const seg = (summary as any).metadata?.segment || 'Renda Imobiliária';

      const newItem: PortfolioItem = {
        ticker: clean,
        quotas: newQuotas,
        currentPrice: price,
        annualDividendPerQuota: annual,
        monthlyDividendPerQuota: monthly,
        dividendYield: dy,
        segment: seg,
        isLoading: false
      };

      setPortfolio((prev) => [...prev, newItem]);
      setNewTicker('');
      setNewQuotas(100);
      toast.success(`${clean} adicionado à carteira do calendário!`);
    } catch {
      toast.error(`Não foi possível obter dados para ${clean}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAsset = (tickerToRemove: string) => {
    if (portfolio.length <= 1) {
      toast.warning('Mantenha pelo menos um ativo no calendário.');
      return;
    }
    setPortfolio((prev) => prev.filter((p) => p.ticker !== tickerToRemove));
  };

  const metrics = useMemo(() => {
    let totalInvested = 0;
    let totalAnnualIncome = 0;

    portfolio.forEach((item) => {
      totalInvested += item.quotas * item.currentPrice;
      totalAnnualIncome += item.quotas * item.annualDividendPerQuota;
    });

    const totalMonthlyAverage = totalAnnualIncome / 12;
    const weightedYield = totalInvested > 0 ? (totalAnnualIncome / totalInvested) * 100 : 0;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthlyProjection = monthNames.map((name, index) => {
      const monthNumber = index + 1;
      const assetsInMonth = portfolio.map((item) => ({
        ticker: item.ticker,
        quotas: item.quotas,
        amount: item.quotas * item.monthlyDividendPerQuota
      }));
      const monthTotal = assetsInMonth.reduce((acc, curr) => acc + curr.amount, 0);

      return {
        monthNumber,
        name,
        monthTotal,
        assets: assetsInMonth
      };
    });

    return {
      totalInvested,
      totalAnnualIncome,
      totalMonthlyAverage,
      weightedYield,
      monthlyProjection
    };
  }, [portfolio]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Calendário & Agenda de Dividendos</h2>
          </div>
          <p className="text-xs text-slate-400">
            Adicione seus ativos e simule o fluxo contínuo de caixa dos proventos mês a mês.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="w-full sm:w-48">
            <AssetAutocompleteInput
              value={newTicker}
              onChange={setNewTicker}
              onSelect={(asset) => {
                setNewTicker(asset.ticker);
              }}
              placeholder="Código (ex: HGLG11)"
            />
          </div>
          <input
            type="number"
            min={1}
            value={newQuotas}
            onChange={(e) => setNewQuotas(Math.max(1, Number(e.target.value)))}
            placeholder="Cotas"
            className="w-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 outline-none transition"
          />
          <button
            type="button"
            onClick={handleAddAsset}
            disabled={isAdding}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {isAdding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Patrimônio da Posição</span>
          <p className="mt-1 text-2xl font-extrabold text-white">
            R$ {metrics.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">{portfolio.length} ativos na carteira</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Renda Mensal Média</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            R$ {metrics.totalMonthlyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-500/80 block mt-1">Pingando todo mês na conta</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Renda Anual Total (12M)</span>
          <p className="mt-1 text-2xl font-extrabold text-teal-400">
            R$ {metrics.totalAnnualIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Isento de Imposto de Renda</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Dividend Yield Médio Ponderado</span>
          <p className="mt-1 text-2xl font-extrabold text-cyan-400">
            {metrics.weightedYield.toFixed(2)}% a.a.
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">Retorno ponderado pelo capital</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white">Composição da Carteira do Calendário</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-sans">
                <th className="p-3.5">Código do Ativo</th>
                <th className="p-3.5">Cotas</th>
                <th className="p-3.5">Cotação Atual</th>
                <th className="p-3.5">Valor Investido</th>
                <th className="p-3.5">Provento/Mês Est.</th>
                <th className="p-3.5">Total Recebido/Mês</th>
                <th className="p-3.5">Dividend Yield</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {portfolio.map((item) => {
                const totalItemValue = item.quotas * item.currentPrice;
                const monthlyTotal = item.quotas * item.monthlyDividendPerQuota;
                return (
                  <tr key={item.ticker} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-bold text-white font-sans flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-bold">{item.ticker}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                        {item.segment}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-200">{item.quotas.toLocaleString('pt-BR')}</td>
                    <td className="p-3.5 text-slate-300">R$ {item.currentPrice.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-200 font-bold">R$ {totalItemValue.toFixed(2)}</td>
                    <td className="p-3.5 text-emerald-400">R$ {item.monthlyDividendPerQuota.toFixed(2)} / cota</td>
                    <td className="p-3.5 text-emerald-400 font-bold">R$ {monthlyTotal.toFixed(2)}</td>
                    <td className="p-3.5 text-cyan-400 font-bold">{item.dividendYield.toFixed(2)}%</td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(item.ticker)}
                        className="rounded-lg p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remover ativo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span>Agenda Anual dos 12 Meses (Projeção de Renda)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {metrics.monthlyProjection.map((m) => (
            <div
              key={m.monthNumber}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 hover:border-emerald-500/30 transition shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-white font-sans">{m.name}</span>
                <span className="text-xs font-mono font-extrabold text-emerald-400">
                  R$ {m.monthTotal.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {m.assets.map((ast) => (
                  <div key={ast.ticker} className="flex items-center justify-between text-slate-400">
                    <span>{ast.ticker} ({ast.quotas} cotas)</span>
                    <span className="text-slate-200 font-mono">R$ {ast.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Pagamento estimado:</span>
                <span className="text-slate-400 font-medium">10 a 15 de {m.name.slice(0, 3)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
