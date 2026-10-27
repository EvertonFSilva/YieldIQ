import React, { useState, useMemo } from 'react';
import { Percent, ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';

export const SimpleInterestTool: React.FC = () => {
  const [initialInvestment, setInitialInvestment] = useState<number>(5000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1000);
  const [annualRate, setAnnualRate] = useState<number>(11.5);
  const [years, setYears] = useState<number>(10);
  const [showDetailedMonths, setShowDetailedMonths] = useState<boolean>(false);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  const calculation = useMemo(() => {
    const months = Math.max(1, years * 12);
    const rateMonthly = annualRate / 12 / 100;

    let totalInvested = initialInvestment;
    let totalInterest = 0;
    let totalLinear = totalInvested + totalInterest;

    let compoundTotal = initialInvestment;
    const compoundMonthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;

    const yearlyData: Array<{
      year: number;
      invested: number;
      interest: number;
      total: number;
      compoundTotal: number;
      months: Array<{
        month: number;
        monthIndex: number;
        invested: number;
        interestThisMonth: number;
        totalInterest: number;
        total: number;
      }>;
    }> = [];

    let currentYearMonths: Array<{
      month: number;
      monthIndex: number;
      invested: number;
      interestThisMonth: number;
      totalInterest: number;
      total: number;
    }> = [];

    for (let m = 1; m <= months; m++) {
      const interestThisMonth = totalInvested * rateMonthly;
      totalInterest += interestThisMonth;
      totalInvested += monthlyContribution;
      totalLinear = totalInvested + totalInterest;

      compoundTotal = compoundTotal * (1 + compoundMonthlyRate) + monthlyContribution;

      currentYearMonths.push({
        month: ((m - 1) % 12) + 1,
        monthIndex: m,
        invested: totalInvested,
        interestThisMonth,
        totalInterest,
        total: totalLinear
      });

      if (m % 12 === 0 || m === months) {
        const yearNumber = Math.ceil(m / 12);
        yearlyData.push({
          year: yearNumber,
          invested: totalInvested,
          interest: totalInterest,
          total: totalLinear,
          compoundTotal,
          months: [...currentYearMonths]
        });
        currentYearMonths = [];
      }
    }

    const compoundAdvantage = Math.max(0, compoundTotal - totalLinear);

    return {
      totalInvested,
      totalInterest,
      totalLinear,
      compoundTotal,
      compoundAdvantage,
      yearlyData
    };
  }, [initialInvestment, monthlyContribution, annualRate, years]);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Percent className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Parâmetros de Juros Simples</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Aplicação Inicial (R$)</label>
            <input
              type="number"
              min={0}
              step={500}
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Aporte Mensal (R$)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Taxa Anual Linear (% a.a.)</label>
            <input
              type="number"
              min={0.1}
              step={0.5}
              value={annualRate}
              onChange={(e) => setAnnualRate(Math.max(0.1, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Prazo de Aplicação (Anos)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={years}
              onChange={(e) => setYears(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Conceito de Juros Simples</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Nos juros lineares, a remuneração incide sempre de forma não-capitalizada (sem juros sobre juros). É amplamente utilizado em cobranças de empréstimos curtos, duplicatas e contratos com remuneração estática.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Patrimônio Final em Juros Simples</span>
            <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
              R$ {calculation.totalLinear.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Rendimento acumulado em {years} anos ({years * 12} meses)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Total Aportado do Bolso</span>
              <span className="text-xl font-bold text-white">
                R$ {calculation.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Capital Principal</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Total em Juros Simples</span>
              <span className="text-xl font-bold text-emerald-400">
                R$ {calculation.totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Rendimento Linear</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Perda vs Juros Compostos</span>
              <span className="text-xl font-bold text-rose-400">
                - R$ {calculation.compoundAdvantage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Efeito multiplicador perdido</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-white">Comparativo Exponencial</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Se investido nos mesmos parâmetros a juros compostos, o patrimônio final atingiria <strong>R$ {calculation.compoundTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>. A capitalização sobre os juros geraria <strong>R$ {calculation.compoundAdvantage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> adicionais.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Evolução Anual da Aplicação</h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={showDetailedMonths}
                onChange={(e) => setShowDetailedMonths(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Expandir meses automaticamente</span>
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-sans">
                  <th className="p-3.5">Período</th>
                  <th className="p-3.5">Total Aportado</th>
                  <th className="p-3.5">Juros Simples</th>
                  <th className="p-3.5 text-right">Patrimônio Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {calculation.yearlyData.map((y) => {
                  const isExpanded = showDetailedMonths || expandedYears[y.year];
                  return (
                    <React.Fragment key={y.year}>
                      <tr
                        onClick={() => toggleYear(y.year)}
                        className="hover:bg-slate-900/60 cursor-pointer font-semibold transition"
                      >
                        <td className="p-3.5 font-sans flex items-center gap-2 text-white">
                          <span>Ano {y.year}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          R$ {y.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-emerald-400">
                          R$ {y.interest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-right font-bold text-white">
                          R$ {y.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>

                      {isExpanded &&
                        y.months.map((m) => (
                          <tr key={m.monthIndex} className="bg-slate-950/40 text-[11px] text-slate-400">
                            <td className="p-2.5 pl-8 font-sans">Mês {m.monthIndex}</td>
                            <td className="p-2.5">
                              R$ {m.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-emerald-400/80">
                              + R$ {m.interestThisMonth.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-slate-200">
                              R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
