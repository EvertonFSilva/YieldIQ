import React, { useState, useMemo } from 'react';
import { Trophy, Clock, Sparkles } from 'lucide-react';

export const FirstMillionTool: React.FC = () => {
  const [initialWealth, setInitialWealth] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1500);
  const [annualRate, setAnnualRate] = useState<number>(11.0);
  const [targetGoal, setTargetGoal] = useState<number>(1000000);

  const simulation = useMemo(() => {
    if (monthlyContribution <= 0 && initialWealth < targetGoal) {
      return {
        reachable: false,
        totalMonths: 0,
        years: 0,
        remainingMonths: 0,
        totalInvested: initialWealth,
        totalInterest: 0,
        interestRatio: 0,
        milestones: [],
        yearlyBreakdown: []
      };
    }

    if (initialWealth >= targetGoal) {
      return {
        reachable: true,
        alreadyReached: true,
        totalMonths: 0,
        years: 0,
        remainingMonths: 0,
        totalInvested: initialWealth,
        totalInterest: 0,
        interestRatio: 0,
        milestones: [],
        yearlyBreakdown: []
      };
    }

    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    let currentWealth = initialWealth;
    let months = 0;

    const targets = [
      { label: 'R$ 100 Mil (A Base Inicial)', value: Math.min(100000, targetGoal * 0.1), month: 0, reached: false },
      { label: 'R$ 250 Mil (Ponto de Inflexão)', value: Math.min(250000, targetGoal * 0.25), month: 0, reached: false },
      { label: 'R$ 500 Mil (Metade do Caminho)', value: Math.min(500000, targetGoal * 0.5), month: 0, reached: false },
      { label: 'R$ 750 Mil (Aceleração Final)', value: Math.min(750000, targetGoal * 0.75), month: 0, reached: false },
      { label: `Meta de R$ ${targetGoal.toLocaleString('pt-BR')}`, value: targetGoal, month: 0, reached: false }
    ];

    const yearlyBreakdown: Array<{
      year: number;
      invested: number;
      interest: number;
      wealth: number;
    }> = [];

    while (currentWealth < targetGoal && months < 1200) {
      months++;
      currentWealth = currentWealth * (1 + monthlyRate) + monthlyContribution;

      targets.forEach((t) => {
        if (!t.reached && currentWealth >= t.value) {
          t.reached = true;
          t.month = months;
        }
      });

      if (months % 12 === 0) {
        const yearNumber = months / 12;
        const totalInvestedSoFar = initialWealth + monthlyContribution * months;
        const interestSoFar = Math.max(0, currentWealth - totalInvestedSoFar);
        yearlyBreakdown.push({
          year: yearNumber,
          invested: totalInvestedSoFar,
          interest: interestSoFar,
          wealth: currentWealth
        });
      }
    }

    const totalInvested = initialWealth + monthlyContribution * months;
    const totalInterest = Math.max(0, currentWealth - totalInvested);
    const interestRatio = currentWealth > 0 ? (totalInterest / currentWealth) * 100 : 0;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return {
      reachable: months < 1200,
      alreadyReached: false,
      totalMonths: months,
      years,
      remainingMonths,
      totalInvested,
      totalInterest,
      interestRatio,
      milestones: targets,
      yearlyBreakdown
    };
  }, [initialWealth, monthlyContribution, annualRate, targetGoal]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Simulador do 1º Milhão</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Patrimônio Inicial (R$)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={initialWealth}
              onChange={(e) => setInitialWealth(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Aporte Mensal (R$)</label>
            <input
              type="number"
              min={100}
              step={100}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Rentabilidade Anual Esperada (% a.a.)</label>
            <input
              type="number"
              min={1}
              step={0.5}
              value={annualRate}
              onChange={(e) => setAnnualRate(Math.max(0.1, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Meta Financeira (R$)</label>
            <input
              type="number"
              min={50000}
              step={50000}
              value={targetGoal}
              onChange={(e) => setTargetGoal(Math.max(10000, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>O Segredo do Primeiro Milhão</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              O primeiro milhão é sempre o mais demorado, pois depende predominantemente da força do seu trabalho e aporte. Do segundo milhão em diante, os juros gerados sozinhos passam a superar os seus aportes anuais.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Tempo Estimado para o Objetivo</span>
            <p className="mt-1 text-3xl sm:text-5xl font-extrabold text-white">
              {simulation.years > 0 ? `${simulation.years} anos` : ''}
              {simulation.years > 0 && simulation.remainingMonths > 0 ? ' e ' : ''}
              {simulation.remainingMonths > 0 ? `${simulation.remainingMonths} meses` : ''}
              {simulation.years === 0 && simulation.remainingMonths === 0 ? 'Meta Já Atingida!' : ''}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Total de {simulation.totalMonths} meses de disciplina financeira
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Do Seu Bolso (Aportes)</span>
              <span className="text-xl font-bold text-white">
                R$ {simulation.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {(100 - simulation.interestRatio).toFixed(1)}% do valor final
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Gerado por Juros</span>
              <span className="text-xl font-bold text-emerald-400">
                R$ {simulation.totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-500/80 block mt-0.5">
                {simulation.interestRatio.toFixed(1)}% bancado pelos juros
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block">Renda Mensal Projetada</span>
              <span className="text-xl font-bold text-teal-400">
                R$ {((targetGoal * (annualRate / 100)) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Sem consumir o capital</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 text-xs text-slate-300">
            <p className="leading-relaxed">
              🎉 <strong>{simulation.interestRatio.toFixed(0)}% do seu primeiro milhão</strong> virá dos juros compostos trabalhando para você enquanto você dorme.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Linha do Tempo dos Marcos Financeiros</span>
          </h3>

          <div className="space-y-3">
            {simulation.milestones.map((m, idx) => {
              const yearsNeeded = Math.floor(m.month / 12);
              const monthsNeeded = m.month % 12;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white">{m.label}</span>
                    <span className="block text-[11px] text-slate-400">
                      R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {m.reached ? (
                        <>
                          {yearsNeeded > 0 ? `${yearsNeeded}a ` : ''}
                          {monthsNeeded}m ({m.month} meses)
                        </>
                      ) : (
                        'Em progresso'
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
