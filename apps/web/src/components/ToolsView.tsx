import React, { useState } from 'react';
import {
  Wrench,
  Calculator,
  ArrowRightLeft,
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  PieChart,
  Percent,
  Clock
} from 'lucide-react';

export const ToolsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'ceiling' | 'avgprice' | 'fire' | 'comparator'>('simulator');

  const [initialInvestment, setInitialInvestment] = useState<number>(5000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1000);
  const [annualYieldRate, setAnnualYieldRate] = useState<number>(11.5);
  const [yearsPeriod, setYearsPeriod] = useState<number>(10);

  const [ceilingDividend, setCeilingDividend] = useState<number>(1.20);
  const [ceilingRequiredYield, setCeilingRequiredYield] = useState<number>(6.0);
  const [ceilingCurrentPrice, setCeilingCurrentPrice] = useState<number>(10.50);

  const [currentShares, setCurrentShares] = useState<number>(100);
  const [currentAvgPrice, setCurrentAvgPrice] = useState<number>(105.00);
  const [newShares, setNewShares] = useState<number>(50);
  const [newSharePrice, setNewSharePrice] = useState<number>(95.00);

  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState<number>(5000);
  const [currentFireNetWorth, setCurrentFireNetWorth] = useState<number>(30000);
  const [monthlyFireContribution, setMonthlyFireContribution] = useState<number>(1500);
  const [fireExpectedRate, setFireExpectedRate] = useState<number>(10.0);

  const [ticker1, setTicker1] = useState<string>('HGLG11');
  const [ticker2, setTicker2] = useState<string>('MXRF11');
  const [price1, setPrice1] = useState<number>(152.00);
  const [price2, setPrice2] = useState<number>(9.85);
  const [dy1, setDy1] = useState<number>(9.4);
  const [dy2, setDy2] = useState<number>(12.8);
  const [annualDiv1, setAnnualDiv1] = useState<number>(14.28);
  const [annualDiv2, setAnnualDiv2] = useState<number>(1.26);

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

  const totalSharesAfter = currentShares + newShares;
  const totalCostCurrent = currentShares * currentAvgPrice;
  const totalCostNew = newShares * newSharePrice;
  const totalCostAfter = totalCostCurrent + totalCostNew;
  const calculatedNewAvgPrice = totalSharesAfter > 0 ? totalCostAfter / totalSharesAfter : 0;
  const priceReductionPercentage = currentAvgPrice > 0
    ? ((calculatedNewAvgPrice / currentAvgPrice) - 1) * 100
    : 0;

  const annualExpenses = desiredMonthlyIncome * 12;
  const fireRequiredCapital = annualExpenses * 25;
  const remainingToFire = Math.max(0, fireRequiredCapital - currentFireNetWorth);
  const fireMonthlyRate = Math.pow(1 + fireExpectedRate / 100, 1 / 12) - 1;

  let monthsToFire = 0;
  let simulatedFireWealth = currentFireNetWorth;
  if (simulatedFireWealth < fireRequiredCapital && monthlyFireContribution > 0) {
    while (simulatedFireWealth < fireRequiredCapital && monthsToFire < 600) {
      simulatedFireWealth = simulatedFireWealth * (1 + fireMonthlyRate) + monthlyFireContribution;
      monthsToFire++;
    }
  }

  const yearsToFire = Math.floor(monthsToFire / 12);
  const extraMonthsToFire = monthsToFire % 12;

  let monthsToMillion = 0;
  let simulatedMillionWealth = currentFireNetWorth;
  if (simulatedMillionWealth < 1000000 && monthlyFireContribution > 0) {
    while (simulatedMillionWealth < 1000000 && monthsToMillion < 600) {
      simulatedMillionWealth = simulatedMillionWealth * (1 + fireMonthlyRate) + monthlyFireContribution;
      monthsToMillion++;
    }
  }
  const yearsToMillion = Math.floor(monthsToMillion / 12);
  const extraMonthsToMillion = monthsToMillion % 12;

  const ceilingBazin1 = dy1 > 0 ? annualDiv1 / 0.06 : 0;
  const ceilingBazin2 = dy2 > 0 ? annualDiv2 / 0.06 : 0;
  const margin1 = price1 > 0 ? ((ceilingBazin1 / price1) - 1) * 100 : 0;
  const margin2 = price2 > 0 ? ((ceilingBazin2 / price2) - 1) * 100 : 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto transition-all duration-300">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Wrench className="h-4 w-4" />
          <span>YieldIQ Intelligence Tools</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ferramentas de Investimento & Valuation</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Conjunto avançado de simuladores financeiros, cálculo de preço teto Bazin, preço médio e planejamento de independência financeira (FIRE).
        </p>
      </div>

      <div className="flex flex-wrap rounded-2xl bg-slate-900/80 p-1.5 border border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'simulator'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Juros & Renda</span>
        </button>

        <button
          onClick={() => setActiveTab('ceiling')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'ceiling'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Preço Teto (Bazin)</span>
        </button>

        <button
          onClick={() => setActiveTab('avgprice')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'avgprice'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <PieChart className="h-4 w-4" />
          <span>Preço Médio</span>
        </button>

        <button
          onClick={() => setActiveTab('fire')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'fire'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Regra dos 4% & 1º Milhão</span>
        </button>

        <button
          onClick={() => setActiveTab('comparator')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all duration-200 ${
            activeTab === 'comparator'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Comparador B3</span>
        </button>
      </div>

      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl transition-all duration-300 hover:border-slate-700">
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition"
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition"
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span>Prazo de Acúmulo</span>
                  <span className="font-bold text-emerald-400">{yearsPeriod} anos ({monthsTotal} meses)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={yearsPeriod}
                  onChange={(e) => setYearsPeriod(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Renda Passiva Mensal Estimada no Final
                </span>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                  R$ {simulatedMonthlyPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-slate-400"> /mês</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Projeção livre de Imposto de Renda para FIIs e FIAGROs conforme legislação atual.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <span className="text-[11px] font-medium text-slate-400">Patrimônio Acumulado</span>
                  <p className="mt-1 text-lg font-bold text-white">
                    R$ {simulatedTotalWealth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-500">Multiplicador {compoundMultiplier}x</span>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <span className="text-[11px] font-medium text-slate-400">Total do Próprio Bolso</span>
                  <p className="mt-1 text-lg font-bold text-slate-300">
                    R$ {simulatedTotalContributed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-500">Aportes somados</span>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <span className="text-[11px] font-medium text-emerald-400">Juros & Proventos (Bola de Neve)</span>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    R$ {simulatedTotalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-emerald-500/80">
                    {simulatedTotalWealth > 0 ? Math.round((simulatedTotalEarnings / simulatedTotalWealth) * 100) : 0}% gerado por juros
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Proporção: Aportes vs Proventos Reinvestidos</span>
                  <span className="text-white font-mono">{compoundMultiplier}x seu dinheiro</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 flex">
                  <div
                    className="bg-slate-600 h-3"
                    style={{
                      width: `${simulatedTotalWealth > 0 ? (simulatedTotalContributed / simulatedTotalWealth) * 100 : 50}%`
                    }}
                    title="Aportes"
                  />
                  <div
                    className="bg-emerald-500 h-3 flex-1"
                    title="Juros e Proventos"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-600 inline-block"></span>
                    <span>Seus Aportes</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Efeito Bola de Neve (Rendimento)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ceiling' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl transition-all duration-300 hover:border-slate-700">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-400" />
              <span>Valuation - Método Décio Bazin</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Proventos Pagos nos Últimos 12M por Cota (R$)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step={0.05}
                  value={ceilingDividend}
                  onChange={(e) => setCeilingDividend(Number(e.target.value))}
                  placeholder="Ex: 1.20"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-teal-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Dividend Yield Mínimo Exigido (% a.a.)
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  step={0.5}
                  value={ceilingRequiredYield}
                  onChange={(e) => setCeilingRequiredYield(Number(e.target.value))}
                  placeholder="Padrão Bazin: 6.0"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-teal-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Preço Atual de Mercado da Cota (R$)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step={0.1}
                  value={ceilingCurrentPrice}
                  onChange={(e) => setCeilingCurrentPrice(Number(e.target.value))}
                  placeholder="Ex: 10.50"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-teal-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Preço Teto Calculado
                </span>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                  R$ {bazinCalculatedCeiling.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Valor máximo a pagar para assegurar um retorno mínimo de {ceilingRequiredYield}% ao ano em proventos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
                  <span className="text-[11px] font-medium text-slate-400">Margem de Segurança</span>
                  <p
                    className={`mt-1 text-2xl font-extrabold ${
                      bazinSafetyMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {bazinSafetyMargin >= 0 ? '+' : ''}
                    {bazinSafetyMargin.toFixed(2)}%
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {bazinSafetyMargin >= 0 ? 'Cotado abaixo do teto' : 'Cotado acima do teto'}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
                  <span className="text-[11px] font-medium text-slate-400">Diagnóstico de Valuation</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        bazinSafetyMargin >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-sm font-bold text-white">
                      {bazinSafetyMargin >= 0 ? 'Comprar com Desconto' : 'Aguardar Correção'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Filosofia de Décio Bazin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'avgprice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl transition-all duration-300 hover:border-slate-700">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-400" />
              <span>Simulador de Preço Médio</span>
            </h2>
            <p className="text-xs text-slate-400">
              Calcule exatamente como um novo aporte afetará o seu preço médio por cota.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                  Posição Atual em Carteira
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Quantidade Atual de Cotas
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={currentShares}
                      onChange={(e) => setCurrentShares(Number(e.target.value))}
                      placeholder="Ex: 100"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Preço Médio Atual (R$)
                    </label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.01}
                      value={currentAvgPrice}
                      onChange={(e) => setCurrentAvgPrice(Number(e.target.value))}
                      placeholder="Ex: 105.00"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Nova Compra (Simulação)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Novas Cotas a Comprar
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newShares}
                      onChange={(e) => setNewShares(Number(e.target.value))}
                      placeholder="Ex: 50"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Preço da Nova Cota (R$)
                    </label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.01}
                      value={newSharePrice}
                      onChange={(e) => setNewSharePrice(Number(e.target.value))}
                      placeholder="Ex: 95.00"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Novo Preço Médio Calculado
                </span>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                  R$ {calculatedNewAvgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="mt-2 text-xs font-medium flex items-center gap-2">
                  <span className={priceReductionPercentage <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {priceReductionPercentage <= 0 ? 'Redução' : 'Aumento'} de {Math.abs(priceReductionPercentage).toFixed(2)}%
                  </span>
                  <span className="text-slate-500">em relação ao preço médio anterior de R$ {currentAvgPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-[11px] font-medium text-slate-400">Total de Cotas Final</span>
                  <p className="mt-1 text-2xl font-extrabold text-white">{totalSharesAfter}</p>
                  <span className="text-[10px] text-slate-500">cotas sob custódia</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-[11px] font-medium text-slate-400">Custo Total Acumulado</span>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                    R$ {totalCostAfter.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-500">Capital investido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fire' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl transition-all duration-300 hover:border-slate-700">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-400" />
              <span>Regra dos 4% & Primeiro Milhão</span>
            </h2>
            <p className="text-xs text-slate-400">
              Planejamento para independência financeira sustentável (FIRE - Financial Independence, Retire Early).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Renda Mensal Desejada para Viver de Renda (R$)
                </label>
                <input
                  type="number"
                  step={500}
                  min={1000}
                  value={desiredMonthlyIncome}
                  onChange={(e) => setDesiredMonthlyIncome(Number(e.target.value))}
                  placeholder="Ex: 5000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Patrimônio Atual Já Investido (R$)
                </label>
                <input
                  type="number"
                  step={1000}
                  min={0}
                  value={currentFireNetWorth}
                  onChange={(e) => setCurrentFireNetWorth(Number(e.target.value))}
                  placeholder="Ex: 30000"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Aporte Mensal Futuro (R$)
                </label>
                <input
                  type="number"
                  step={200}
                  min={100}
                  value={monthlyFireContribution}
                  onChange={(e) => setMonthlyFireContribution(Number(e.target.value))}
                  placeholder="Ex: 1500"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Rentabilidade Média Real Esperada (% a.a. acima da inflação)
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={1}
                  max={20}
                  value={fireExpectedRate}
                  onChange={(e) => setFireExpectedRate(Number(e.target.value))}
                  placeholder="Ex: 10.0"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Patrimônio Necessário (Regra dos 4% / Trinity Study)
                </span>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                  R$ {fireRequiredCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Permite sacar R$ {desiredMonthlyIncome.toLocaleString('pt-BR')} todo mês perpetuamente sem corroer o capital principal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Clock className="h-4 w-4" />
                    <span>Tempo até Independência FIRE</span>
                  </div>
                  <p className="text-2xl font-extrabold text-white">
                    {yearsToFire} anos {extraMonthsToFire > 0 ? `e ${extraMonthsToFire}m` : ''}
                  </p>
                  <span className="text-[10px] text-slate-500">Mantendo aporte de R$ {monthlyFireContribution.toLocaleString('pt-BR')}/mês</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Sparkles className="h-4 w-4" />
                    <span>Rumo ao 1º Milhão</span>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-400">
                    {currentFireNetWorth >= 1000000
                      ? 'Conquistado!'
                      : `${yearsToMillion} anos ${extraMonthsToMillion > 0 ? `e ${extraMonthsToMillion}m` : ''}`}
                  </p>
                  <span className="text-[10px] text-slate-500">Marco de R$ 1.000.000,00</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Progresso Atual do Patrimônio FIRE</span>
                  <span className="text-white font-mono">
                    {fireRequiredCapital > 0 ? ((currentFireNetWorth / fireRequiredCapital) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, fireRequiredCapital > 0 ? (currentFireNetWorth / fireRequiredCapital) * 100 : 0)}%`
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Falta acumular R$ {remainingToFire.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl transition-all duration-300 hover:border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Ativo A</span>
                <input
                  type="text"
                  maxLength={6}
                  value={ticker1}
                  onChange={(e) => setTicker1(e.target.value.toUpperCase())}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-sm font-bold text-white text-center w-28 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Preço Atual (R$)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={price1}
                    onChange={(e) => setPrice1(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dividend Yield 12M (%)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={dy1}
                    onChange={(e) => setDy1(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Total Proventos 12M por Cota (R$)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={annualDiv1}
                    onChange={(e) => setAnnualDiv1(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Preço Teto Bazin (6%):</span>
                  <span className="font-bold text-white font-mono">R$ {ceilingBazin1.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Margem de Segurança:</span>
                  <span className={`font-bold font-mono ${margin1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {margin1 >= 0 ? '+' : ''}{margin1.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl transition-all duration-300 hover:border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Ativo B</span>
                <input
                  type="text"
                  maxLength={6}
                  value={ticker2}
                  onChange={(e) => setTicker2(e.target.value.toUpperCase())}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-sm font-bold text-white text-center w-28 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Preço Atual (R$)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={price2}
                    onChange={(e) => setPrice2(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dividend Yield 12M (%)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={dy2}
                    onChange={(e) => setDy2(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Total Proventos 12M por Cota (R$)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={annualDiv2}
                    onChange={(e) => setAnnualDiv2(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Preço Teto Bazin (6%):</span>
                  <span className="font-bold text-white font-mono">R$ {ceilingBazin2.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Margem de Segurança:</span>
                  <span className={`font-bold font-mono ${margin2 >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {margin2 >= 0 ? '+' : ''}{margin2.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-400" />
              <span>Resumo Comparativo de Vantagens</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Maior Rendimento (Dividend Yield 12M):</span>
                <span className="text-base font-bold text-emerald-400">
                  {dy1 >= dy2 ? `${ticker1} (${dy1.toFixed(2)}%)` : `${ticker2} (${dy2.toFixed(2)}%)`}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Maior Margem de Segurança Bazin:</span>
                <span className="text-base font-bold text-cyan-400">
                  {margin1 >= margin2 ? `${ticker1} (+${margin1.toFixed(1)}%)` : `${ticker2} (+${margin2.toFixed(1)}%)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
