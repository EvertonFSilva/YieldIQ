import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, HelpCircle } from 'lucide-react';

export const PortfolioRentabilityTool: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState<number>(50000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(2000);
  const [periodYears, setPeriodYears] = useState<number>(3);
  const [currentValue, setCurrentValue] = useState<number>(165000);
  const [accumulatedDividends, setAccumulatedDividends] = useState<number>(18500);

  const metrics = useMemo(() => {
    const totalMonths = Math.max(1, periodYears * 12);
    const totalInvested = initialCapital + monthlyContribution * totalMonths;
    const capitalGain = currentValue - totalInvested;
    const totalGainWithDividends = capitalGain + accumulatedDividends;

    const absoluteReturnPercentage = totalInvested > 0 ? (capitalGain / totalInvested) * 100 : 0;
    const totalReturnWithDividendsPercentage = totalInvested > 0 ? (totalGainWithDividends / totalInvested) * 100 : 0;

    const cagr =
      periodYears > 0 && totalInvested > 0 && currentValue > 0
        ? (Math.pow(currentValue / totalInvested, 1 / periodYears) - 1) * 100
        : 0;

    const cdiAnnualRate = 11.5;
    const ifixAnnualRate = 10.2;
    const ipcaAnnualRate = 4.5;

    const cdiTotalReturn = (Math.pow(1 + cdiAnnualRate / 100, periodYears) - 1) * 100;
    const ifixTotalReturn = (Math.pow(1 + ifixAnnualRate / 100, periodYears) - 1) * 100;
    const ipcaTotalReturn = (Math.pow(1 + ipcaAnnualRate / 100, periodYears) - 1) * 100;

    const cagrDifferenceCdi = cagr - cdiAnnualRate;
    const cagrDifferenceIpca = cagr - ipcaAnnualRate;

    return {
      totalMonths,
      totalInvested,
      capitalGain,
      totalGainWithDividends,
      absoluteReturnPercentage,
      totalReturnWithDividendsPercentage,
      cagr,
      cdiAnnualRate,
      ifixAnnualRate,
      ipcaAnnualRate,
      cdiTotalReturn,
      ifixTotalReturn,
      ipcaTotalReturn,
      cagrDifferenceCdi,
      cagrDifferenceIpca
    };
  }, [initialCapital, monthlyContribution, periodYears, currentValue, accumulatedDividends]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Rentabilidade da Carteira B3 (CAGR)</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Patrimônio Inicial Aportado (R$)</label>
            <input
              type="number"
              min={0}
              step={5000}
              value={initialCapital}
              onChange={(e) => setInitialCapital(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Aporte Mensal Médio (R$)</label>
            <input
              type="number"
              min={0}
              step={500}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tempo de Acúmulo (Anos)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={periodYears}
              onChange={(e) => setPeriodYears(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Valor Atual da Carteira na Corretora (R$)</label>
            <input
              type="number"
              min={0}
              step={5000}
              value={currentValue}
              onChange={(e) => setCurrentValue(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Proventos Recebidos no Período (R$)</label>
            <input
              type="number"
              min={0}
              step={500}
              value={accumulatedDividends}
              onChange={(e) => setAccumulatedDividends(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>O que é o CAGR?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              O CAGR (Compound Annual Growth Rate) é a taxa geométrica anual que expressa o crescimento verdadeiro do seu patrimônio com aportes, valorizações de cotas e proventos reinvestidos.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">CAGR da Sua Carteira</span>
            <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
              {metrics.cagr.toFixed(2)}% <span className="text-xl sm:text-2xl font-bold text-slate-400">a.a.</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Retorno anualizado composto ao longo de {periodYears} anos ({metrics.totalMonths} meses)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Total Aportado do Bolso</span>
              <span className="text-xl font-bold text-white">
                R$ {metrics.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Capital Principal</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Lucro Total com Proventos</span>
              <span className={`text-xl font-bold ${metrics.totalGainWithDividends >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                R$ {metrics.totalGainWithDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                +{metrics.totalReturnWithDividendsPercentage.toFixed(1)}% de retorno total
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Ganho Real Acima da Inflação</span>
              <span className={`text-xl font-bold ${metrics.cagrDifferenceIpca >= 0 ? 'text-teal-400' : 'text-amber-400'}`}>
                {metrics.cagrDifferenceIpca >= 0 ? '+' : ''}{metrics.cagrDifferenceIpca.toFixed(2)}% a.a.
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Acima do IPCA (4,5%)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 text-xs text-slate-300">
            <p className="leading-relaxed">
              🏆 Sua carteira apresentou rendimento acumulado de <strong>+{metrics.totalReturnWithDividendsPercentage.toFixed(1)}%</strong> considerando valorização patrimonial e proventos recebidos.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-400" />
            <span>Comparativo com os Principais Indicadores de Mercado</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">Sua Carteira de Ativos</span>
                <span className="block text-[11px] text-slate-400">Retorno anualizado composto (CAGR)</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-extrabold text-emerald-400">
                  {metrics.cagr.toFixed(2)}% a.a.
                </span>
                <span className="block text-[10px] text-slate-400">+{metrics.totalReturnWithDividendsPercentage.toFixed(1)}% no período</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">CDI (Certificado de Depósito Interbancário)</span>
                <span className="block text-[11px] text-slate-400">Benchmark padrão de renda fixa</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-200">
                  {metrics.cdiAnnualRate.toFixed(2)}% a.a.
                </span>
                <span className="block text-[10px] text-slate-500">+{metrics.cdiTotalReturn.toFixed(1)}% acumulado</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">IFIX (Índice de Fundos Imobiliários B3)</span>
                <span className="block text-[11px] text-slate-400">Média ponderada do mercado de FIIs</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-200">
                  {metrics.ifixAnnualRate.toFixed(2)}% a.a.
                </span>
                <span className="block text-[10px] text-slate-500">+{metrics.ifixTotalReturn.toFixed(1)}% acumulado</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">IPCA (Inflação Oficial IBGE)</span>
                <span className="block text-[11px] text-slate-400">Poder de compra da moeda</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-200">
                  {metrics.ipcaAnnualRate.toFixed(2)}% a.a.
                </span>
                <span className="block text-[10px] text-slate-500">+{metrics.ipcaTotalReturn.toFixed(1)}% acumulado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
