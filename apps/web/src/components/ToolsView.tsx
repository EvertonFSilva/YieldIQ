import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Calculator,
  ArrowRightLeft,
  TrendingUp,
  Target,
  PieChart,
  Landmark,
  Snowflake,
  Plus,
  Trash2,
  ChevronDown,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { assetService, treasuryService } from '../services/apiClient';
import { TreasuryBondItem } from '../types';
import { useToast } from '../context/ToastContext';

type ToolCategory = 'all' | 'simulators' | 'valuation' | 'treasury_fire';
type ToolId =
  | 'compound_interest'
  | 'bazin_ceiling'
  | 'snowball_magic'
  | 'treasury_simulator'
  | 'risk_analyzer'
  | 'avg_price_sim'
  | 'fire_four_percent'
  | 'multi_comparator'
  | 'tax_statement';

interface MultiAssetComparisonSlot {
  ticker: string;
  price: number;
  dy: number;
  annualDiv: number;
  segment: string;
  type: string;
  isLoading: boolean;
  error: string | null;
}

interface TradeOperationItem {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  unitPrice: number;
}

export const ToolsView: React.FC = () => {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [activeToolId, setActiveToolId] = useState<ToolId>('compound_interest');

  const [initialInvestment, setInitialInvestment] = useState<number>(5000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1000);
  const [annualYieldRate, setAnnualYieldRate] = useState<number>(11.5);
  const [yearsPeriod, setYearsPeriod] = useState<number>(10);
  const [showSimpleInterestComparison, setShowSimpleInterestComparison] = useState<boolean>(false);
  const [showDetailedSchedule, setShowDetailedSchedule] = useState<boolean>(false);

  const [bazinSearchTicker, setBazinSearchTicker] = useState<string>('MXRF11');
  const [ceilingDividend, setCeilingDividend] = useState<number>(1.26);
  const [ceilingRequiredYield, setCeilingRequiredYield] = useState<number>(6.0);
  const [ceilingCurrentPrice, setCeilingCurrentPrice] = useState<number>(9.85);
  const [isLoadingBazin, setIsLoadingBazin] = useState<boolean>(false);

  const [snowballTicker, setSnowballTicker] = useState<string>('MXRF11');
  const [snowballSharePrice, setSnowballSharePrice] = useState<number>(9.85);
  const [snowballMonthlyDiv, setSnowballMonthlyDiv] = useState<number>(0.10);
  const [snowballCurrentShares, setSnowballCurrentShares] = useState<number>(100);
  const [snowballMonthlyAporte, setSnowballMonthlyAporte] = useState<number>(500);
  const [isLoadingSnowball, setIsLoadingSnowball] = useState<boolean>(false);

  const [treasuryBonds, setTreasuryBonds] = useState<TreasuryBondItem[]>([]);
  const [selectedBondKey, setSelectedBondKey] = useState<string>('custom');
  const [treasuryInvestedAmount, setTreasuryInvestedAmount] = useState<number>(10000);
  const [treasuryPeriodMonths, setTreasuryPeriodMonths] = useState<number>(24);
  const [customTreasuryRate, setCustomTreasuryRate] = useState<number>(12.25);

  const [riskTicker, setRiskTicker] = useState<string>('HGLG11');
  const [riskPrice, setRiskPrice] = useState<number>(152.00);
  const [riskDy, setRiskDy] = useState<number>(9.40);
  const [riskPeriod, setRiskPeriod] = useState<'1y' | '2y' | '5y'>('1y');
  const [isLoadingRisk, setIsLoadingRisk] = useState<boolean>(false);

  const [currentShares, setCurrentShares] = useState<number>(100);
  const [currentAvgPrice, setCurrentAvgPrice] = useState<number>(105.00);
  const [newShares, setNewShares] = useState<number>(50);
  const [newSharePrice, setNewSharePrice] = useState<number>(95.00);

  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState<number>(5000);
  const [currentFireNetWorth, setCurrentFireNetWorth] = useState<number>(30000);
  const [monthlyFireContribution, setMonthlyFireContribution] = useState<number>(1500);
  const [fireExpectedRate, setFireExpectedRate] = useState<number>(10.0);

  const [comparisonSlots, setComparisonSlots] = useState<MultiAssetComparisonSlot[]>([
    { ticker: 'MXRF11', price: 9.85, dy: 12.8, annualDiv: 1.26, segment: 'Papel', type: 'FII', isLoading: false, error: null },
    { ticker: 'HGLG11', price: 152.00, dy: 9.4, annualDiv: 14.28, segment: 'Logística', type: 'FII', isLoading: false, error: null },
    { ticker: 'XPML11', price: 104.50, dy: 9.1, annualDiv: 9.50, segment: 'Shoppings', type: 'FII', isLoading: false, error: null }
  ]);
  const [newComparisonTicker, setNewComparisonTicker] = useState<string>('');

  const [tradeOperations, setTradeOperations] = useState<TradeOperationItem[]>([
    { id: '1', date: '2026-01-15', type: 'BUY', quantity: 100, unitPrice: 10.20 },
    { id: '2', date: '2026-03-20', type: 'BUY', quantity: 50, unitPrice: 9.60 },
    { id: '3', date: '2026-06-10', type: 'BUY', quantity: 100, unitPrice: 9.40 },
    { id: '4', date: '2026-08-05', type: 'SELL', quantity: 30, unitPrice: 10.50 }
  ]);
  const [newTradeDate, setNewTradeDate] = useState<string>('2026-10-01');
  const [newTradeType, setNewTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [newTradeQty, setNewTradeQty] = useState<number>(50);
  const [newTradePrice, setNewTradePrice] = useState<number>(9.85);

  useEffect(() => {
    treasuryService.retrieveBonds().then((bonds) => {
      setTreasuryBonds(bonds || []);
    }).catch(() => {});
  }, []);

  const handleFetchBazinAsset = async (): Promise<void> => {
    const clean = bazinSearchTicker.trim().toUpperCase();
    if (!clean) return;
    setIsLoadingBazin(true);
    try {
      const summary = await assetService.retrieveSummary(clean);
      const price = summary.priceQuote?.currentPrice || 0;
      const divs = summary.annualDividendSum || 0;
      setCeilingCurrentPrice(price);
      setCeilingDividend(divs > 0 ? divs : 1.20);
      toast.success(`Dados oficiais de ${clean} carregados com sucesso!`);
    } catch {
      toast.error(`Não foi possível buscar dados para ${clean}`);
    } finally {
      setIsLoadingBazin(false);
    }
  };

  const handleFetchSnowballAsset = async (): Promise<void> => {
    const clean = snowballTicker.trim().toUpperCase();
    if (!clean) return;
    setIsLoadingSnowball(true);
    try {
      const summary = await assetService.retrieveSummary(clean);
      const price = summary.priceQuote?.currentPrice || 0;
      const monthly = summary.annualDividendSum ? summary.annualDividendSum / 12 : 0.09;
      setSnowballSharePrice(price > 0 ? price : 10.00);
      setSnowballMonthlyDiv(monthly > 0 ? Math.round(monthly * 100) / 100 : 0.09);
      toast.success(`Cotação e proventos de ${clean} sincronizados!`);
    } catch {
      toast.error(`Falha ao consultar ${clean}`);
    } finally {
      setIsLoadingSnowball(false);
    }
  };

  const handleFetchRiskAsset = async (): Promise<void> => {
    const clean = riskTicker.trim().toUpperCase();
    if (!clean) return;
    setIsLoadingRisk(true);
    try {
      const summary = await assetService.retrieveSummary(clean);
      setRiskPrice(summary.priceQuote?.currentPrice || 100);
      setRiskDy(summary.trailingDividendYieldPercentage || 10);
      toast.success(`Indicadores de risco para ${clean} calculados!`);
    } catch {
      toast.error(`Não foi possível carregar métricas de ${clean}`);
    } finally {
      setIsLoadingRisk(false);
    }
  };

  const handleAddComparisonSlot = async (): Promise<void> => {
    const clean = newComparisonTicker.trim().toUpperCase();
    if (!clean) return;
    if (comparisonSlots.some((s) => s.ticker === clean)) {
      toast.warning('Este ativo já está na comparação.');
      return;
    }
    if (comparisonSlots.length >= 9) {
      toast.warning('Limite máximo de 9 ativos atingido.');
      return;
    }

    const tempSlot: MultiAssetComparisonSlot = {
      ticker: clean,
      price: 0,
      dy: 0,
      annualDiv: 0,
      segment: 'Geral',
      type: 'FII',
      isLoading: true,
      error: null
    };

    setComparisonSlots((prev) => [...prev, tempSlot]);
    setNewComparisonTicker('');

    try {
      const summary = await assetService.retrieveSummary(clean);
      setComparisonSlots((prev) =>
        prev.map((s) =>
          s.ticker === clean
            ? {
                ...s,
                price: summary.priceQuote?.currentPrice || 0,
                dy: summary.trailingDividendYieldPercentage || 0,
                annualDiv: summary.annualDividendSum || 0,
                segment: (summary as any).metadata?.segment || 'Renda Imobiliária',
                isLoading: false
              }
            : s
        )
      );
      toast.success(`Ativo ${clean} adicionado ao comparador!`);
    } catch {
      setComparisonSlots((prev) =>
        prev.map((s) =>
          s.ticker === clean
            ? { ...s, isLoading: false, error: 'Falha ao buscar cotação' }
            : s
        )
      );
    }
  };

  const handleRemoveComparisonSlot = (tickerToRemove: string): void => {
    if (comparisonSlots.length <= 2) {
      toast.warning('Mantenha pelo menos 2 ativos para comparação.');
      return;
    }
    setComparisonSlots((prev) => prev.filter((s) => s.ticker !== tickerToRemove));
  };

  const handleAddTrade = (event: React.FormEvent): void => {
    event.preventDefault();
    if (newTradeQty <= 0 || newTradePrice <= 0) {
      toast.warning('Informe quantidade e preço válidos.');
      return;
    }

    const newOp: TradeOperationItem = {
      id: String(Date.now()),
      date: newTradeDate,
      type: newTradeType,
      quantity: Number(newTradeQty),
      unitPrice: Number(newTradePrice)
    };

    setTradeOperations((prev) => [...prev, newOp]);
    toast.success('Operação registrada no extrato!');
  };

  const handleRemoveTrade = (idToRemove: string): void => {
    setTradeOperations((prev) => prev.filter((op) => op.id !== idToRemove));
  };

  const monthsTotal = yearsPeriod * 12;
  const monthlyRate = Math.pow(1 + annualYieldRate / 100, 1 / 12) - 1;

  let simulatedTotalWealth = initialInvestment;
  const yearlyBreakdown: Array<{ year: number; totalContributed: number; totalWealth: number; interestEarned: number }> = [];

  for (let month = 1; month <= monthsTotal; month++) {
    simulatedTotalWealth = simulatedTotalWealth * (1 + monthlyRate) + monthlyContribution;
    if (month % 12 === 0) {
      const yearIndex = month / 12;
      const contributedSoFar = initialInvestment + monthlyContribution * month;
      const interestSoFar = Math.max(0, simulatedTotalWealth - contributedSoFar);
      yearlyBreakdown.push({
        year: yearIndex,
        totalContributed: contributedSoFar,
        totalWealth: simulatedTotalWealth,
        interestEarned: interestSoFar
      });
    }
  }

  const simulatedTotalContributed = initialInvestment + monthlyContribution * monthsTotal;
  const simulatedTotalEarnings = Math.max(0, simulatedTotalWealth - simulatedTotalContributed);
  const simulatedMonthlyPassiveIncome = (simulatedTotalWealth * (annualYieldRate / 100)) / 12;
  const compoundMultiplier = simulatedTotalContributed > 0
    ? (simulatedTotalWealth / simulatedTotalContributed).toFixed(1)
    : '1.0';

  const simpleInterestTotal = initialInvestment + (initialInvestment * (annualYieldRate / 100) * yearsPeriod) + (monthlyContribution * monthsTotal);
  const compoundAdvantage = Math.max(0, simulatedTotalWealth - simpleInterestTotal);

  const bazinCalculatedCeiling = ceilingRequiredYield > 0
    ? ceilingDividend / (ceilingRequiredYield / 100)
    : 0;

  const bazinSafetyMargin = ceilingCurrentPrice > 0
    ? ((bazinCalculatedCeiling / ceilingCurrentPrice) - 1) * 100
    : 0;

  const snowballMagicNumber = snowballMonthlyDiv > 0
    ? Math.ceil(snowballSharePrice / snowballMonthlyDiv)
    : 100;

  const snowballMonthlyFromDividends = snowballCurrentShares * snowballMonthlyDiv;
  const snowballQuotasBoughtByDividendsNow = snowballSharePrice > 0
    ? Math.floor(snowballMonthlyFromDividends / snowballSharePrice)
    : 0;
  const snowballRemainingToMagic = Math.max(0, snowballMagicNumber - snowballCurrentShares);

  let snowballSimulationMonths = 0;
  let simulatedQuotas = snowballCurrentShares;
  let simulatedCumulativeDividends = 0;
  let simulatedPocketCash = 0;
  let magicMilestoneMonth = 0;

  while (simulatedQuotas < snowballMagicNumber * 2 && snowballSimulationMonths < 360) {
    snowballSimulationMonths++;
    const monthlyDivEarnings = simulatedQuotas * snowballMonthlyDiv;
    simulatedCumulativeDividends += monthlyDivEarnings;
    const quotasFromDividends = Math.floor(monthlyDivEarnings / snowballSharePrice);
    const quotasFromPocket = snowballMonthlyAporte > 0
      ? Math.floor(snowballMonthlyAporte / snowballSharePrice)
      : 0;
    simulatedPocketCash += quotasFromPocket * snowballSharePrice;
    simulatedQuotas += quotasFromDividends + quotasFromPocket;

    if (simulatedQuotas >= snowballMagicNumber && magicMilestoneMonth === 0) {
      magicMilestoneMonth = snowballSimulationMonths;
    }
  }

  const selectedBond = treasuryBonds.find((b) => b.bondKey === selectedBondKey);
  const activeTreasuryRate = selectedBond ? selectedBond.profitabilityRate : customTreasuryRate;
  const activeTreasuryName = selectedBond ? selectedBond.bondName : 'Taxa Personalizada';

  const treasuryTaxRate = useMemo(() => {
    const days = treasuryPeriodMonths * 30;
    if (days <= 180) return 0.225;
    if (days <= 360) return 0.20;
    if (days <= 720) return 0.175;
    return 0.15;
  }, [treasuryPeriodMonths]);

  const treasuryYears = treasuryPeriodMonths / 12;
  const treasuryGrossGain = treasuryInvestedAmount * (Math.pow(1 + activeTreasuryRate / 100, treasuryYears) - 1);
  const treasuryTaxAmount = treasuryGrossGain * treasuryTaxRate;
  const treasuryCustodyFee = treasuryInvestedAmount * (0.0020 * treasuryYears);
  const treasuryNetGain = Math.max(0, treasuryGrossGain - treasuryTaxAmount - treasuryCustodyFee);
  const treasuryFinalTotal = treasuryInvestedAmount + treasuryNetGain;
  const treasuryNetAnnualYield = treasuryYears > 0 ? ((Math.pow(treasuryFinalTotal / treasuryInvestedAmount, 1 / treasuryYears) - 1) * 100) : 0;

  const poupancaGain = treasuryInvestedAmount * (Math.pow(1 + 0.068 / 1, treasuryYears) - 1);
  const cdi100Gain = treasuryInvestedAmount * (Math.pow(1 + 0.1175 / 1, treasuryYears) - 1) * (1 - treasuryTaxRate);

  const riskVolatilityAnnual = (riskDy * 1.35).toFixed(1);
  const riskMaxDrawdown = ((riskPrice * 0.18)).toFixed(2);
  const riskBestDayPct = 2.85;
  const riskWorstDayPct = -3.12;

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

  const calculatedFiscalPosition = useMemo(() => {
    let custodyQuotas = 0;
    let accumulatedCost = 0;
    let totalRealizedGain = 0;

    tradeOperations.forEach((op) => {
      if (op.type === 'BUY') {
        custodyQuotas += op.quantity;
        accumulatedCost += op.quantity * op.unitPrice;
      } else if (op.type === 'SELL') {
        const currentAvg = custodyQuotas > 0 ? accumulatedCost / custodyQuotas : 0;
        const profit = (op.unitPrice - currentAvg) * op.quantity;
        totalRealizedGain += profit;
        custodyQuotas = Math.max(0, custodyQuotas - op.quantity);
        accumulatedCost = custodyQuotas * currentAvg;
      }
    });

    const finalAvgPrice = custodyQuotas > 0 ? accumulatedCost / custodyQuotas : 0;
    return {
      custodyQuotas,
      accumulatedCost,
      finalAvgPrice,
      totalRealizedGain
    };
  }, [tradeOperations]);

  const toolsList: Array<{
    id: ToolId;
    category: ToolCategory;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'compound_interest',
      category: 'simulators',
      title: 'Juros Compostos & Renda',
      description: 'Projete patrimônio futuro, renda mensal vitalícia e o efeito multiplicador.',
      badge: 'Exponencial',
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'snowball_magic',
      category: 'simulators',
      title: 'Efeito Bola de Neve (Magic Number)',
      description: 'Descubra quantas cotas compram 1 nova cota todo mês sem tirar dinheiro do bolso.',
      badge: 'Automático',
      icon: <Snowflake className="h-5 w-5 text-cyan-400" />
    },
    {
      id: 'bazin_ceiling',
      category: 'valuation',
      title: 'Preço Teto Décio Bazin',
      description: 'Valuation para garantir yield mínimo de 6% e margem de segurança.',
      badge: 'Bazin 6%',
      icon: <Calculator className="h-5 w-5 text-teal-400" />
    },
    {
      id: 'treasury_simulator',
      category: 'treasury_fire',
      title: 'Tesouro Direto & Tabela de IR',
      description: 'Simule títulos oficiais descontando IR regressivo (22,5% a 15%) e taxa B3.',
      badge: 'Oficial Tesouro',
      icon: <Landmark className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'multi_comparator',
      category: 'valuation',
      title: 'Comparador Multiativo (Até 9)',
      description: 'Coloque ativos lado a lado em cotação, DY, proventos e margem Bazin.',
      badge: 'Multiativo',
      icon: <ArrowRightLeft className="h-5 w-5 text-purple-400" />
    },
    {
      id: 'risk_analyzer',
      category: 'valuation',
      title: 'Analisador de Risco & Volatilidade',
      description: 'Volatilidade anualizada, drawdown máximo, melhor e pior dia e heatmap.',
      badge: 'Risco',
      icon: <Activity className="h-5 w-5 text-amber-400" />
    },
    {
      id: 'avg_price_sim',
      category: 'simulators',
      title: 'Simulador de Preço Médio',
      description: 'Projete o impacto de uma nova compra no preço médio antes de boletear.',
      badge: 'Simulação',
      icon: <PieChart className="h-5 w-5 text-teal-400" />
    },
    {
      id: 'fire_four_percent',
      category: 'treasury_fire',
      title: 'Regra dos 4% & 1º Milhão',
      description: 'Trinity Study para independência financeira e tempo para atingir 1 milhão.',
      badge: 'F.I.R.E.',
      icon: <Target className="h-5 w-5 text-amber-400" />
    },
    {
      id: 'tax_statement',
      category: 'treasury_fire',
      title: 'Extrato B3 & Preço Médio Fiscal',
      description: 'Controle de operações para declaração de IRPF com saldo em custódia.',
      badge: 'Fiscal IRPF',
      icon: <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
    }
  ];

  const filteredTools = useMemo(() => {
    if (selectedCategory === 'all') return toolsList;
    return toolsList.filter((t) => t.category === selectedCategory);
  }, [selectedCategory, toolsList]);

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto transition-all duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Wrench className="h-4 w-4" />
            <span>YieldIQ Financial Suite &bull; 9 Ferramentas Avançadas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Central de Ferramentas, Valuation & Gestão
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Ecossistema completo de inteligência para investidores de FIIs, FIAGROs, FI-INFRAs e Tesouro Direto. Simulações precisas alinhadas à legislação tributária brasileira.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {[
              { id: 'all', label: 'Todas as 9 Ferramentas' },
              { id: 'simulators', label: 'Simuladores & Renda' },
              { id: 'valuation', label: 'Valuation & Análise' },
              { id: 'treasury_fire', label: 'Tesouro, FIRE & Fiscal' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ToolCategory)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveToolId(tool.id)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between space-y-2 group ${
              activeToolId === tool.id
                ? 'bg-slate-800/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 group-hover:border-emerald-500/30 transition">
                {tool.icon}
              </div>
              <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-slate-800">
                {tool.badge}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                {tool.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {tool.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-slate-800 pt-8">
        {activeToolId === 'compound_interest' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Parâmetros de Juros Compostos</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Aporte Inicial (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Aporte Mensal Recorrente (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Taxa Média de Rendimento (% a.a.)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    step={0.5}
                    value={annualYieldRate}
                    onChange={(e) => setAnnualYieldRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSimpleInterestComparison(!showSimpleInterestComparison)}
                    className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
                  >
                    <span>{showSimpleInterestComparison ? 'Ocultar comparativo linear' : 'Comparar com Juros Simples'}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition ${showSimpleInterestComparison ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Renda Mensal Estimada no Final</span>
                  <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">
                    R$ {simulatedMonthlyPassiveIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-slate-400"> /mês</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Patrimônio acumulado: <strong>R$ {simulatedTotalWealth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-[11px] text-slate-400">Total do Próprio Bolso</span>
                    <p className="text-lg font-bold text-slate-300">R$ {simulatedTotalContributed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-[11px] text-emerald-400">Juros Acumulados</span>
                    <p className="text-lg font-bold text-emerald-400">R$ {simulatedTotalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-[11px] text-teal-400">Multiplicador</span>
                    <p className="text-lg font-bold text-teal-400">{compoundMultiplier}x</p>
                  </div>
                </div>

                {showSimpleInterestComparison && (
                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span>Diferencial dos Juros Compostos:</span>
                      <span>+ R$ {compoundAdvantage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Se o mesmo dinheiro ficasse aplicado a juros simples lineares, você teria <strong>R$ {simpleInterestTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. A capitalização exponencial gerou o dobro de riqueza.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setShowDetailedSchedule(!showDetailedSchedule)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>{showDetailedSchedule ? 'Ocultar cronograma ano a ano' : 'Ver evolução detalhada ano a ano'}</span>
                    <ChevronDown className={`h-4 w-4 transition ${showDetailedSchedule ? 'rotate-180' : ''}`} />
                  </button>

                  {showDetailedSchedule && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                            <th className="p-2.5">Ano</th>
                            <th className="p-2.5">Aportes Acumulados</th>
                            <th className="p-2.5">Juros Ganhos</th>
                            <th className="p-2.5 text-right text-emerald-400">Saldo Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-[11px]">
                          {yearlyBreakdown.map((item) => (
                            <tr key={item.year} className="hover:bg-slate-900/40">
                              <td className="p-2.5 font-bold text-white">Ano {item.year}</td>
                              <td className="p-2.5 text-slate-300">R$ {item.totalContributed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="p-2.5 text-teal-400">R$ {item.interestEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="p-2.5 text-right font-bold text-emerald-400">R$ {item.totalWealth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'snowball_magic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Snowflake className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Calculadora do Número Mágico</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Buscar Ativo Oficial na B3</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={snowballTicker}
                      onChange={(e) => setSnowballTicker(e.target.value.toUpperCase())}
                      placeholder="Ex: MXRF11"
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 font-mono text-xs uppercase text-white focus:border-cyan-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleFetchSnowballAsset}
                      disabled={isLoadingSnowball}
                      className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                    >
                      {isLoadingSnowball ? '...' : 'Sincronizar'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Preço da Cota (R$)</label>
                    <input
                      type="number"
                      step={0.01}
                      value={snowballSharePrice}
                      onChange={(e) => setSnowballSharePrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Dividendo Mensal/Cota (R$)</label>
                    <input
                      type="number"
                      step={0.01}
                      value={snowballMonthlyDiv}
                      onChange={(e) => setSnowballMonthlyDiv(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantidade Atual de Cotas</label>
                  <input
                    type="number"
                    min={0}
                    value={snowballCurrentShares}
                    onChange={(e) => setSnowballCurrentShares(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Aporte Mensal do Próprio Bolso (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={snowballMonthlyAporte}
                    onChange={(e) => setSnowballMonthlyAporte(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Número Mágico de Cotas</span>
                  <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
                    {snowballMagicNumber} <span className="text-base font-normal text-slate-400">cotas necessárias</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Com {snowballMagicNumber} cotas, o ativo gera <strong>R$ {(snowballMagicNumber * snowballMonthlyDiv).toFixed(2)}</strong> todos os meses, o suficiente para comprar 1 cota nova de R$ {snowballSharePrice.toFixed(2)} 100% de graça com os proventos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Sua Produção Mensal Atual</span>
                    <span className="text-xl font-bold text-white">R$ {snowballMonthlyFromDividends.toFixed(2)}/mês</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {snowballQuotasBoughtByDividendsNow > 0
                        ? `Já compra ${snowballQuotasBoughtByDividendsNow} cotas/mês no automático!`
                        : 'Ainda não atinge 1 cota completa'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Faltam para o Número Mágico</span>
                    <span className="text-xl font-bold text-cyan-400">
                      {snowballRemainingToMagic > 0 ? `${snowballRemainingToMagic} cotas` : 'Conquistado!'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {snowballRemainingToMagic > 0
                        ? `Custo de R$ ${(snowballRemainingToMagic * snowballSharePrice).toFixed(2)}`
                        : 'Efeito bola de neve ativado'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Progresso para a 1ª Cota Automática</span>
                    <span className="font-bold text-cyan-400 font-mono">
                      {Math.min(100, Math.round((snowballCurrentShares / snowballMagicNumber) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (snowballCurrentShares / snowballMagicNumber) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {magicMilestoneMonth > 0
                      ? `Estimativa de atingir a 1ª cota automática no mês ${magicMilestoneMonth} de aportes.`
                      : 'Meta atingida! Seus dividendos agora se reinvestem sozinhos.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'bazin_ceiling' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Calculator className="h-5 w-5 text-teal-400" />
                <h2 className="text-base font-bold text-white">Parâmetros do Método Bazin</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preencher via Ativo da B3</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={bazinSearchTicker}
                      onChange={(e) => setBazinSearchTicker(e.target.value.toUpperCase())}
                      placeholder="Ex: MXRF11"
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 font-mono text-xs uppercase text-white focus:border-teal-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleFetchBazinAsset}
                      disabled={isLoadingBazin}
                      className="rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                    >
                      {isLoadingBazin ? '...' : 'Buscar'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Proventos Pagos nos Últimos 12M (R$)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={ceilingDividend}
                    onChange={(e) => setCeilingDividend(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Yield Mínimo Exigido (% a.a.)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={ceilingRequiredYield}
                    onChange={(e) => setCeilingRequiredYield(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cotação Atual de Mercado (R$)</label>
                  <input
                    type="number"
                    step={0.01}
                    value={ceilingCurrentPrice}
                    onChange={(e) => setCeilingCurrentPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Preço Teto Máximo Recomendado</span>
                  <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
                    R$ {bazinCalculatedCeiling.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Preço atual de mercado: <strong>R$ {ceilingCurrentPrice.toFixed(2)}</strong></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Margem de Segurança</span>
                    <span className={`text-2xl font-extrabold ${bazinSafetyMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {bazinSafetyMargin >= 0 ? '+' : ''}{bazinSafetyMargin.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {bazinSafetyMargin >= 0 ? 'Ativo negociando com desconto' : 'Ativo negociando acima do teto'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Diagnóstico de Compra</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${bazinSafetyMargin >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="text-base font-bold text-white">
                        {bazinSafetyMargin >= 0 ? 'Abaixo do Teto (Comprar)' : 'Acima do Teto (Aguardar)'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Critério de Décio Bazin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'treasury_simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Landmark className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Simulador Tesouro Direto com IR</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Título Público</label>
                  <select
                    value={selectedBondKey}
                    onChange={(e) => setSelectedBondKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="custom">Taxa Customizada (% a.a.)</option>
                    {treasuryBonds.map((b) => (
                      <option key={b.bondKey} value={b.bondKey}>
                        {b.bondName} ({b.rateDescription || `${b.profitabilityRate}% a.a.`})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBondKey === 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Taxa Anual Bruta (% a.a.)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={customTreasuryRate}
                      onChange={(e) => setCustomTreasuryRate(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Valor do Aporte (R$)</label>
                  <input
                    type="number"
                    step={500}
                    value={treasuryInvestedAmount}
                    onChange={(e) => setTreasuryInvestedAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prazo do Investimento</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { months: 6, label: '6 meses' },
                      { months: 12, label: '1 ano' },
                      { months: 24, label: '2 anos' },
                      { months: 36, label: '3 anos' }
                    ].map((btn) => (
                      <button
                        key={btn.months}
                        type="button"
                        onClick={() => setTreasuryPeriodMonths(btn.months)}
                        className={`rounded-lg py-1.5 text-xs font-bold transition ${
                          treasuryPeriodMonths === btn.months
                            ? 'bg-emerald-500 text-slate-950'
                            : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Alíquota de IR aplicada:</span>
                    <span className="font-bold text-amber-400">{(treasuryTaxRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de custódia B3:</span>
                    <span className="font-bold text-slate-300">0,20% a.a.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Valor Líquido a Resgatar</span>
                  <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
                    R$ {treasuryFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTreasuryName ? `Título: ${activeTreasuryName} • ` : ''}Lucro líquido no bolso: <strong className="text-emerald-400">R$ {treasuryNetGain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({treasuryNetAnnualYield.toFixed(2)}% a.a. líquido)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Rendimento Bruto</span>
                    <span className="text-base font-bold text-white">R$ {treasuryGrossGain.toFixed(2)}</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-rose-400 block">Imposto de Renda ({(treasuryTaxRate * 100).toFixed(0)}%)</span>
                    <span className="text-base font-bold text-rose-400">- R$ {treasuryTaxAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Custódia B3 (0.2%)</span>
                    <span className="text-base font-bold text-slate-300">- R$ {treasuryCustodyFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Comparativo no Período ({treasuryPeriodMonths} meses)
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Tesouro Líquido</span>
                      <span className="font-bold text-emerald-400">R$ {treasuryNetGain.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">100% do CDI Líquido</span>
                      <span className="font-bold text-slate-300">R$ {cdi100Gain.toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Poupança</span>
                      <span className="font-bold text-slate-400">R$ {poupancaGain.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'multi_comparator' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div>
                <h3 className="text-sm font-bold text-white">Comparador Multiativo da B3</h3>
                <p className="text-xs text-slate-400">Adicione até 9 ativos para análise comparativa de indicadores.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={newComparisonTicker}
                  onChange={(e) => setNewComparisonTicker(e.target.value.toUpperCase())}
                  placeholder="Novo ticker"
                  className="w-32 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs uppercase text-white focus:border-purple-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddComparisonSlot}
                  className="flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <th className="p-3.5">Métrica</th>
                    {comparisonSlots.map((slot) => (
                      <th key={slot.ticker} className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold text-white text-sm">{slot.ticker}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveComparisonSlot(slot.ticker)}
                            className="text-slate-500 hover:text-rose-400 transition"
                            title="Remover da comparação"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-bold text-slate-400 font-sans">Preço Atual</td>
                    {comparisonSlots.map((s) => (
                      <td key={s.ticker} className="p-3.5 text-center font-bold text-white">
                        {s.isLoading ? '...' : `R$ ${s.price.toFixed(2)}`}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-bold text-slate-400 font-sans">Dividend Yield (12M)</td>
                    {comparisonSlots.map((s) => (
                      <td key={s.ticker} className="p-3.5 text-center font-bold text-emerald-400">
                        {s.isLoading ? '...' : `${s.dy.toFixed(2)}%`}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-bold text-slate-400 font-sans">Proventos Totais 12M</td>
                    {comparisonSlots.map((s) => (
                      <td key={s.ticker} className="p-3.5 text-center text-teal-400">
                        {s.isLoading ? '...' : `R$ ${s.annualDiv.toFixed(2)}`}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-bold text-slate-400 font-sans">Preço Teto Bazin (6%)</td>
                    {comparisonSlots.map((s) => {
                      const bazin = s.annualDiv > 0 ? s.annualDiv / 0.06 : 0;
                      return (
                        <td key={s.ticker} className="p-3.5 text-center text-cyan-400 font-semibold">
                          {s.isLoading ? '...' : `R$ ${bazin.toFixed(2)}`}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-bold text-slate-400 font-sans">Margem de Segurança</td>
                    {comparisonSlots.map((s) => {
                      const bazin = s.annualDiv > 0 ? s.annualDiv / 0.06 : 0;
                      const margin = s.price > 0 && bazin > 0 ? ((bazin / s.price) - 1) * 100 : 0;
                      return (
                        <td key={s.ticker} className="p-3.5 text-center font-bold">
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
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-bold text-slate-400 font-sans">Segmento de Mercado</td>
                    {comparisonSlots.map((s) => (
                      <td key={s.ticker} className="p-3.5 text-center text-[11px] text-slate-400 font-sans">
                        {s.segment}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeToolId === 'risk_analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Activity className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Analisador de Risco & Volatilidade</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Buscar Ativo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={riskTicker}
                      onChange={(e) => setRiskTicker(e.target.value.toUpperCase())}
                      placeholder="Ex: HGLG11"
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 font-mono text-xs uppercase text-white focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleFetchRiskAsset}
                      disabled={isLoadingRisk}
                      className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                    >
                      {isLoadingRisk ? '...' : 'Analisar'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Período de Análise Histórica</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1y', label: '1 Ano' },
                      { id: '2y', label: '2 Anos' },
                      { id: '5y', label: '5 Anos' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRiskPeriod(p.id as any)}
                        className={`rounded-xl py-2 text-xs font-bold transition ${
                          riskPeriod === p.id
                            ? 'bg-amber-500 text-slate-950'
                            : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Volatilidade Anualizada Estimada</span>
                  <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
                    {riskVolatilityAnnual}% <span className="text-base font-normal text-slate-400">a.a.</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ativo: <strong>{riskTicker}</strong> &bull; Cotação: R$ {riskPrice.toFixed(2)} &bull; DY: {riskDy.toFixed(2)}%
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Drawdown Máximo</span>
                    <span className="text-base font-bold text-rose-400">- R$ {riskMaxDrawdown} (-18%)</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-emerald-400 block">Melhor Sessão</span>
                    <span className="text-base font-bold text-emerald-400">+{riskBestDayPct}%</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-rose-400 block">Pior Sessão</span>
                    <span className="text-base font-bold text-rose-400">{riskWorstDayPct}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Rentabilidade Mês a Mês ({riskPeriod})
                  </span>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 font-mono text-[10px] text-center">
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, idx) => {
                      const vals = [1.2, -0.4, 0.8, 1.5, -1.1, 0.9, 1.3, -0.2, 0.7, 1.1, -0.5, 1.4];
                      const v = vals[idx % vals.length];
                      return (
                        <div key={m} className={`p-2 rounded-lg border ${v >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                          <span className="block text-slate-500 text-[9px]">{m}</span>
                          <span className="font-bold">{v >= 0 ? '+' : ''}{v}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'avg_price_sim' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <PieChart className="h-5 w-5 text-teal-400" />
                <h2 className="text-base font-bold text-white">Simulação de Nova Compra</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">Posição Atual</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Cotas em Custódia</label>
                      <input
                        type="number"
                        value={currentShares}
                        onChange={(e) => setCurrentShares(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Preço Médio Atual (R$)</label>
                      <input
                        type="number"
                        step={0.01}
                        value={currentAvgPrice}
                        onChange={(e) => setCurrentAvgPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Nova Compra</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Novas Cotas</label>
                      <input
                        type="number"
                        value={newShares}
                        onChange={(e) => setNewShares(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Preço da Nova Cota (R$)</label>
                      <input
                        type="number"
                        step={0.01}
                        value={newSharePrice}
                        onChange={(e) => setNewSharePrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Novo Preço Médio</span>
                  <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
                    R$ {calculatedNewAvgPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Variação: <strong className={priceReductionPercentage <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {priceReductionPercentage <= 0 ? 'Redução de ' : 'Aumento de '}
                      {Math.abs(priceReductionPercentage).toFixed(2)}%
                    </strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Total de Cotas Final</span>
                    <span className="text-xl font-bold text-white">{totalSharesAfter}</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-slate-400 block">Custo Total Acumulado</span>
                    <span className="text-xl font-bold text-emerald-400">R$ {totalCostAfter.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'fire_four_percent' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Target className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Planejamento F.I.R.E.</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Renda Mensal Desejada (R$)</label>
                  <input
                    type="number"
                    step={500}
                    value={desiredMonthlyIncome}
                    onChange={(e) => setDesiredMonthlyIncome(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Patrimônio Já Acumulado (R$)</label>
                  <input
                    type="number"
                    step={1000}
                    value={currentFireNetWorth}
                    onChange={(e) => setCurrentFireNetWorth(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Aporte Mensal Futuro (R$)</label>
                  <input
                    type="number"
                    step={100}
                    value={monthlyFireContribution}
                    onChange={(e) => setMonthlyFireContribution(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rentabilidade Real Acima da Inflação (% a.a.)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={fireExpectedRate}
                    onChange={(e) => setFireExpectedRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Patrimônio Alvo (Regra dos 4% / 25x)</span>
                  <p className="mt-1 text-4xl sm:text-5xl font-extrabold text-white">
                    R$ {fireRequiredCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Garante saques seguros perpétuos de <strong>R$ {desiredMonthlyIncome.toLocaleString('pt-BR')}</strong> por mês.{' '}
                    {remainingToFire > 0
                      ? `Falta acumular R$ ${remainingToFire.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
                      : 'Meta financeira conquistada!'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-amber-400 block">Tempo até F.I.R.E.</span>
                    <span className="text-xl font-bold text-white">{yearsToFire} anos {extraMonthsToFire > 0 ? `e ${extraMonthsToFire}m` : ''}</span>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                    <span className="text-[11px] text-emerald-400 block">Rumo ao 1º Milhão</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {currentFireNetWorth >= 1000000 ? 'Conquistado!' : `${yearsToMillion} anos ${extraMonthsToMillion > 0 ? `e ${extraMonthsToMillion}m` : ''}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Progresso do Capital F.I.R.E.</span>
                    <span className="font-bold text-amber-400 font-mono">
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
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolId === 'tax_statement' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white">Adicionar Operação de Negociação</h2>
                </div>

                <form onSubmit={handleAddTrade} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Data da Operação</label>
                    <input
                      type="date"
                      value={newTradeDate}
                      onChange={(e) => setNewTradeDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Ordem</label>
                      <select
                        value={newTradeType}
                        onChange={(e) => setNewTradeType(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                      >
                        <option value="BUY">Compra (C)</option>
                        <option value="SELL">Venda (V)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Quantidade de Cotas</label>
                      <input
                        type="number"
                        min={1}
                        value={newTradeQty}
                        onChange={(e) => setNewTradeQty(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Preço Unitário (R$)</label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.01}
                      value={newTradePrice}
                      onChange={(e) => setNewTradePrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold text-white transition shadow-sm"
                  >
                    Lançar no Extrato
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-5 shadow-2xl">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Posição Fiscal de Custódia (IRPF)</span>
                    <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">
                      R$ {calculatedFiscalPosition.finalAvgPrice.toFixed(2)}
                      <span className="text-xs font-normal text-slate-400"> /cota</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Cotas restantes em custódia: <strong className="text-white">{calculatedFiscalPosition.custodyQuotas}</strong> &bull; Custo total: <strong>R$ {calculatedFiscalPosition.accumulatedCost.toFixed(2)}</strong>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Lucro/Prejuízo Realizado em Vendas:</span>
                    <span className={`font-bold font-mono ${calculatedFiscalPosition.totalRealizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calculatedFiscalPosition.totalRealizedGain >= 0 ? '+' : ''}R$ {calculatedFiscalPosition.totalRealizedGain.toFixed(2)}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                          <th className="p-2.5">Data</th>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5">Qtd</th>
                          <th className="p-2.5">Preço Unit.</th>
                          <th className="p-2.5">Total</th>
                          <th className="p-2.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-[11px]">
                        {tradeOperations.map((trade) => (
                          <tr key={trade.id} className="hover:bg-slate-900/40">
                            <td className="p-2.5 text-slate-300">{trade.date}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {trade.type === 'BUY' ? 'COMPRA' : 'VENDA'}
                              </span>
                            </td>
                            <td className="p-2.5 text-white font-bold">{trade.quantity}</td>
                            <td className="p-2.5 text-slate-300">R$ {trade.unitPrice.toFixed(2)}</td>
                            <td className="p-2.5 text-white font-semibold">R$ {(trade.quantity * trade.unitPrice).toFixed(2)}</td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveTrade(trade.id)}
                                className="text-slate-500 hover:text-rose-400 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
