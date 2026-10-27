import React, { useState } from 'react';
import {
  Wrench,
  Calculator,
  ArrowRightLeft,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export const ToolsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'comparator' | 'simulator' | 'ceiling'>('simulator');

  const [initialInvestment, setInitialInvestment] = useState<number>(5000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1000);
  const [annualYieldRate, setAnnualYieldRate] = useState<number>(11.5);
  const [yearsPeriod, setYearsPeriod] = useState<number>(10);

  const [ceilingDividend, setCeilingDividend] = useState<number>(1.20);
  const [ceilingRequiredYield, setCeilingRequiredYield] = useState<number>(6.0);
  const [ceilingCurrentPrice, setCeilingCurrentPrice] = useState<number>(10.50);

  const monthsTotal = yearsPeriod * 12;
  const monthlyRate = Math.pow(1 + annualYieldRate / 100, 1 / 12) - 1;

  let simulatedTotalWealth = initialInvestment;
  for (let month = 1; month <= monthsTotal; month++) {
    simulatedTotalWealth = simulatedTotalWealth * (1 + monthlyRate) + monthlyContribution;
  }

  const simulatedTotalContributed = initialInvestment + monthlyContribution * monthsTotal;
  const simulatedTotalEarnings = Math.max(0, simulatedTotalWealth - simulatedTotalContributed);
  const simulatedMonthlyPassiveIncome = (simulatedTotalWealth * (annualYieldRate / 100)) / 12;
  const compoundMultiplier = simulatedTotalContributed > 0
    ? (simulatedTotalWealth / simulatedTotalContributed).toFixed(1)
    : '1.0';

  const bazinCalculatedCeiling = ceilingRequiredYield > 0
    ? ceilingDividend / (ceilingRequiredYield / 100)
    : 0;

  const bazinSafetyMargin = ceilingCurrentPrice > 0
    ? ((bazinCalculatedCeiling / ceilingCurrentPrice) - 1) * 100
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Wrench className="h-4 w-4" />
          <span>YieldIQ Intelligence Tools</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ferramentas de Investimento & Valuation</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Simuladores matemáticos de juros compostos, cálculo de preço teto Bazin e análise comparativa de ativos da B3
        </p>
      </div>

      <div className="flex rounded-2xl bg-slate-900/80 p-1.5 border border-slate-800 max-w-xl">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            activeTab === 'simulator'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Simulador de Renda</span>
        </button>

        <button
          onClick={() => setActiveTab('ceiling')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            activeTab === 'ceiling'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Preço Teto (Bazin)</span>
        </button>

        <button
          onClick={() => setActiveTab('comparator')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            activeTab === 'comparator'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Comparador de Ativos</span>
        </button>
      </div>

      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span>Parâmetros da Simulação</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Aporte Inicial (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(Number(e.target.value))}
                  placeholder="Ex: 5000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Aporte Mensal Recorrente (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  placeholder="Ex: 1000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Taxa Média de Dividend Yield (% a.a.)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.5}
                  value={annualYieldRate}
                  onChange={(e) => setAnnualYieldRate(Number(e.target.value))}
                  placeholder="Ex: 11.5"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Período de Acumulação (Anos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  step={1}
                  value={yearsPeriod}
                  onChange={(e) => setYearsPeriod(Number(e.target.value))}
                  placeholder="Ex: 10"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 p-6 sm:p-8 space-y-6 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Resultado Projetado em {yearsPeriod} Anos
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400">Patrimônio Acumulado Final</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">
                    R$ {simulatedTotalWealth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    {compoundMultiplier}x o total desembolsado
                  </span>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 space-y-1">
                  <span className="text-[11px] font-medium text-emerald-300">Renda Passiva Mensal Estimada</span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    R$ {simulatedMonthlyPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-300 block">Sem consumir o patrimônio principal</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Composição do Patrimônio</span>
                  <span className="text-emerald-400 font-bold">Efeito Juros Compostos</span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-3 flex overflow-hidden border border-slate-800">
                  <div
                    className="bg-slate-600 h-3"
                    style={{ width: `${(simulatedTotalContributed / simulatedTotalWealth) * 100}%` }}
                    title="Total Aportado"
                  />
                  <div
                    className="bg-emerald-500 h-3"
                    style={{ width: `${(simulatedTotalEarnings / simulatedTotalWealth) * 100}%` }}
                    title="Rendimentos Reinvestidos"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 block">Total Aportado do Bolso</span>
                    <span className="font-bold text-slate-200">
                      R$ {simulatedTotalContributed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-emerald-400 block font-semibold">Ganhos em Proventos (Bola de Neve)</span>
                    <span className="font-bold text-emerald-400">
                      R$ {simulatedTotalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ceiling' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-400" />
              <span>Dados para Cálculo Bazin</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Proventos Projetados em 12 Meses (R$ / cota)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step={0.05}
                  value={ceilingDividend}
                  onChange={(e) => setCeilingDividend(Number(e.target.value))}
                  placeholder="Ex: 1.20"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Yield Mínimo Desejado (% a.a.)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[6.0, 8.0, 10.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setCeilingRequiredYield(rate)}
                      className={`rounded-xl py-2 text-xs font-bold transition border ${
                        ceilingRequiredYield === rate
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate.toFixed(1)}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Cotação Atual de Mercado (R$)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step={0.10}
                  value={ceilingCurrentPrice}
                  onChange={(e) => setCeilingCurrentPrice(Number(e.target.value))}
                  placeholder="Ex: 10.50"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 p-6 sm:p-8 space-y-6 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Valuation pelo Método Décio Bazin
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-1">
                  <span className="text-[11px] font-medium text-slate-400">Preço Teto Máximo Recomendado</span>
                  <p className="text-3xl font-extrabold text-cyan-400">
                    R$ {bazinCalculatedCeiling.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Garante no mínimo {ceilingRequiredYield}% de dividend yield anual
                  </span>
                </div>

                <div
                  className={`rounded-2xl border p-5 space-y-1 ${
                    bazinSafetyMargin >= 0
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                  }`}
                >
                  <span className="text-[11px] font-medium block">Margem de Segurança</span>
                  <p className="text-3xl font-extrabold">
                    {bazinSafetyMargin >= 0 ? '+' : ''}{bazinSafetyMargin.toFixed(1)}%
                  </p>
                  <span className="text-[10px] block font-medium">
                    {bazinSafetyMargin >= 0 ? 'Cotado abaixo do teto (Oportunidade)' : 'Cotado acima do teto (Aguardar)'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 leading-relaxed">
                <p>
                  O método de Bazin estabelece que o investidor só deve adquirir cotas quando o preço de mercado garantir um retorno mínimo em dividendos de 6% ao ano, proporcionando uma margem defensiva contra oscilações de mercado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Comparativo Lado a Lado de Ativos Listados</h2>
            <p className="text-xs text-slate-400">
              Compare os principais múltiplos e indicadores de valuation entre referências de mercado da B3
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
                    <th className="p-3.5">Indicador / Múltiplo</th>
                    <th className="p-3.5 text-emerald-400 font-mono font-bold">MXRF11 (FII Papel)</th>
                    <th className="p-3.5 text-cyan-400 font-mono font-bold">HGLG11 (FII Logística)</th>
                    <th className="p-3.5 text-amber-400 font-mono font-bold">KNCA11 (FIAGRO)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  <tr className="hover:bg-slate-800/20">
                    <td className="p-3.5 font-medium text-slate-300">Cotação Atual</td>
                    <td className="p-3.5 font-bold text-white font-mono">R$ 9,11</td>
                    <td className="p-3.5 font-bold text-white font-mono">R$ 151,70</td>
                    <td className="p-3.5 font-bold text-white font-mono">R$ 100,50</td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="p-3.5 font-medium text-slate-300">Dividend Yield (12M)</td>
                    <td className="p-3.5 text-emerald-400 font-bold">12,95%</td>
                    <td className="p-3.5 text-emerald-400 font-bold">8,85%</td>
                    <td className="p-3.5 text-emerald-400 font-bold">13,10%</td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="p-3.5 font-medium text-slate-300">Preço Teto Bazin (6%)</td>
                    <td className="p-3.5 text-slate-200 font-mono">R$ 19,67</td>
                    <td className="p-3.5 text-slate-200 font-mono">R$ 223,80</td>
                    <td className="p-3.5 text-slate-200 font-mono">R$ 219,30</td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="p-3.5 font-medium text-slate-300">Soma de Proventos 12M</td>
                    <td className="p-3.5 text-slate-300 font-mono">R$ 1,18</td>
                    <td className="p-3.5 text-slate-300 font-mono">R$ 13,43</td>
                    <td className="p-3.5 text-slate-300 font-mono">R$ 13,16</td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="p-3.5 font-medium text-slate-300">Segmento de Atuação</td>
                    <td className="p-3.5 text-slate-400">Papel / CRI</td>
                    <td className="p-3.5 text-slate-400">Logística Industrial</td>
                    <td className="p-3.5 text-slate-400">Crédito do Agronegócio</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
