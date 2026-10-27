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
  Trash2,
  ChevronDown,
  Activity,
  FileSpreadsheet,
  Upload,
  Download,
  HelpCircle,
  Percent,
  Trophy,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { assetService, treasuryService } from '../services/apiClient';
import { TreasuryBondItem } from '../types';
import { useToast } from '../context/ToastContext';
import { SimpleInterestTool } from './tools/SimpleInterestTool';
import { FirstMillionTool } from './tools/FirstMillionTool';
import { DividendCalendarTool } from './tools/DividendCalendarTool';
import { PortfolioRentabilityTool } from './tools/PortfolioRentabilityTool';
import { BazinCeilingTool } from './tools/BazinCeilingTool';
import { MultiComparatorTool } from './tools/MultiComparatorTool';
import { AssetAutocompleteInput } from './common/AssetAutocompleteInput';

type ToolCategory = 'all' | 'statements' | 'assets' | 'simulators';
type ToolId =
  | 'tax_statement'
  | 'portfolio_rentability'
  | 'b3_earnings_calculator'
  | 'multi_comparator'
  | 'risk_analyzer'
  | 'dividend_calendar'
  | 'treasury_simulator'
  | 'compound_interest'
  | 'simple_interest'
  | 'bazin_ceiling'
  | 'first_million'
  | 'avg_price_sim'
  | 'fire_four_percent'
  | 'snowball_magic';

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

  const [earningsConversions, setEarningsConversions] = useState<
    Array<{ id: string; oldTicker: string; newTicker: string }>
  >([
    { id: '1', oldTicker: 'CVBI11', newTicker: 'PCIP11' },
    { id: '2', oldTicker: 'GALG11', newTicker: 'GARE11' },
    { id: '3', oldTicker: 'MALL11', newTicker: 'PMLL11' }
  ]);
  const [earningsSplits, setEarningsSplits] = useState<
    Array<{ id: string; ticker: string; date: string; ratio: number }>
  >([
    { id: '1', ticker: 'HGBS11', date: '19/05/2025', ratio: 10 }
  ]);
  const [earningsRecords, setEarningsRecords] = useState<
    Array<{
      id: string;
      date: string;
      paymentDate: string;
      rawTicker: string;
      resolvedTicker: string;
      type: string;
      quantity: number;
      unitValue: number;
      totalValue: number;
      year: number;
    }>
  >([]);
  const [selectedEarningsYear, setSelectedEarningsYear] = useState<number | 'all'>('all');
  const [earningsViewTab, setEarningsViewTab] = useState<'consolidated' | 'detailed'>('consolidated');
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});
  const [isProcessingEarnings, setIsProcessingEarnings] = useState<boolean>(false);

  const parseDateValue = (v: any): Date | null => {
    if (!v) return null;
    if (typeof v === 'number') {
      return new Date(Math.round((v - 25569) * 86400 * 1000));
    }
    const s = String(v).trim();
    if (s.indexOf('-') > 0) {
      const p = s.split('-');
      if (p.length === 3) return new Date(+p[0], +p[1] - 1, +p[2]);
    }
    if (s.indexOf('/') > 0) {
      const p = s.split('/');
      if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]);
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const handleProcessExcelFile = async (file: File): Promise<void> => {
    setIsProcessingEarnings(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        toast.warning('O arquivo está vazio ou não possui registros legíveis.');
        return;
      }

      const cols = Object.keys(rawRows[0]);
      const findCol = (terms: string[]) => cols.find((c) => {
        const lc = c.toLowerCase();
        return terms.some((t) => lc.includes(t.toLowerCase()));
      });

      const colProduto = findCol(['produto', 'ativo', 'ticker', 'código', 'codigo', 'papel']);
      const colMov = findCol(['movimenta', 'tipo', 'histórico', 'historico', 'evento', 'descri']);
      const colData = findCol(['data', 'pagamento', 'liquidação', 'liquidacao', 'pregao', 'pregão']);
      const colValor = findCol(['valor da operação', 'valor da operacao', 'valor líquido', 'valor liquido', 'valor', 'total']);
      const colQtd = findCol(['quantidade', 'qtd', 'cotas']);

      if (!colProduto || !colMov || !colData || !colValor || !colQtd) {
        toast.error(
          `Colunas esperadas da B3: Produto, Movimentação, Data, Valor da Operação, Quantidade. Encontradas: ${cols.join(', ')}`
        );
        return;
      }

      const conversionMap: Record<string, string> = {};
      earningsConversions.forEach((c) => {
        if (c.oldTicker && c.newTicker) {
          conversionMap[c.oldTicker.trim().toUpperCase()] = c.newTicker.trim().toUpperCase();
        }
      });

      const parsedItems: any[] = [];
      let skippedCount = 0;

      rawRows.forEach((row, idx) => {
        const desc = String(row[colMov] || '');
        if (!desc.includes('Rendimento') && !desc.includes('Dividendo') && !desc.includes('Juros')) {
          return;
        }

        const rawProduct = String(row[colProduto] || '').trim();
        const tickerMatch = rawProduct.match(/([A-Z]{4}[0-9]{1,2}[B]?)/i);
        const rawTicker = tickerMatch ? tickerMatch[1].toUpperCase() : (rawProduct.split(/[\s-]+/)[0] || '').trim().toUpperCase();
        if (!rawTicker || rawTicker.length < 4) {
          skippedCount++;
          return;
        }

        const resolvedTicker = conversionMap[rawTicker] || rawTicker;
        const dateObj = parseDateValue(row[colData]);
        if (!dateObj) {
          skippedCount++;
          return;
        }

        const rawVal = row[colValor];
        let totalVal = 0;
        if (typeof rawVal === 'number') {
          totalVal = rawVal;
        } else {
          totalVal =
            parseFloat(
              String(rawVal)
                .replace('R$', '')
                .trim()
                .replace(/\./g, '')
                .replace(',', '.')
            ) || 0;
        }

        const rawQty = row[colQtd];
        let qty = 0;
        if (typeof rawQty === 'number') {
          qty = rawQty;
        } else {
          qty = parseFloat(String(rawQty).replace(/\./g, '').replace(',', '.')) || 0;
        }

        if (isNaN(totalVal) || totalVal <= 0) {
          skippedCount++;
          return;
        }

        let qtyAjustada = qty;
        for (const sp of earningsSplits) {
          const spDate = parseDateValue(sp.date);
          if (sp.ticker === resolvedTicker && spDate && dateObj < spDate && sp.ratio > 0) {
            qtyAjustada *= sp.ratio;
          }
        }

        const year = dateObj.getFullYear();
        const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(
          dateObj.getMonth() + 1
        ).padStart(2, '0')}/${year}`;

        parsedItems.push({
          id: `row-${idx}`,
          date: formattedDate,
          paymentDate: formattedDate,
          rawTicker,
          resolvedTicker,
          type: desc.includes('Dividendo') ? 'Dividendo' : desc.includes('Juros') ? 'JCP' : 'Rendimento',
          quantity: qtyAjustada,
          unitValue: qtyAjustada > 0 ? totalVal / qtyAjustada : 0,
          totalValue: totalVal,
          year
        });
      });

      if (parsedItems.length === 0) {
        toast.warning(
          `Nenhum provento identificado no arquivo.${skippedCount > 0 ? ` (${skippedCount} linhas ignoradas)` : ''}`
        );
        return;
      }

      setEarningsRecords(parsedItems);
      toast.success(`${parsedItems.length} lançamentos de proventos consolidados com sucesso!`);
    } catch {
      toast.error('Erro ao ler a planilha Excel. Verifique se o formato é o extrato oficial de movimentações B3.');
    } finally {
      setIsProcessingEarnings(false);
    }
  };

  const handleLoadDemoEarnings = (): void => {
    const demoItems = [
      { id: 'd1', date: '14/10/2026', paymentDate: '14/10/2026', rawTicker: 'MXRF11', resolvedTicker: 'MXRF11', type: 'Rendimento', quantity: 1200, unitValue: 0.10, totalValue: 120.00, year: 2026 },
      { id: 'd2', date: '14/10/2026', paymentDate: '14/10/2026', rawTicker: 'HGLG11', resolvedTicker: 'HGLG11', type: 'Rendimento', quantity: 150, unitValue: 1.10, totalValue: 165.00, year: 2026 },
      { id: 'd3', date: '14/10/2026', paymentDate: '14/10/2026', rawTicker: 'XPML11', resolvedTicker: 'XPML11', type: 'Rendimento', quantity: 80, unitValue: 0.92, totalValue: 73.60, year: 2026 },
      { id: 'd4', date: '14/09/2026', paymentDate: '14/09/2026', rawTicker: 'MXRF11', resolvedTicker: 'MXRF11', type: 'Rendimento', quantity: 1200, unitValue: 0.10, totalValue: 120.00, year: 2026 },
      { id: 'd5', date: '14/09/2026', paymentDate: '14/09/2026', rawTicker: 'HGLG11', resolvedTicker: 'HGLG11', type: 'Rendimento', quantity: 150, unitValue: 1.10, totalValue: 165.00, year: 2026 },
      { id: 'd6', date: '14/09/2026', paymentDate: '14/09/2026', rawTicker: 'XPML11', resolvedTicker: 'XPML11', type: 'Rendimento', quantity: 80, unitValue: 0.92, totalValue: 73.60, year: 2026 },
      { id: 'd7', date: '14/08/2026', paymentDate: '14/08/2026', rawTicker: 'GALG11', resolvedTicker: 'GARE11', type: 'Rendimento', quantity: 300, unitValue: 0.086, totalValue: 25.80, year: 2026 },
      { id: 'd8', date: '14/08/2026', paymentDate: '14/08/2026', rawTicker: 'MXRF11', resolvedTicker: 'MXRF11', type: 'Rendimento', quantity: 1000, unitValue: 0.10, totalValue: 100.00, year: 2026 },
      { id: 'd9', date: '14/08/2026', paymentDate: '14/08/2026', rawTicker: 'HGLG11', resolvedTicker: 'HGLG11', type: 'Rendimento', quantity: 120, unitValue: 1.10, totalValue: 132.00, year: 2026 },
      { id: 'd10', date: '14/12/2025', paymentDate: '14/12/2025', rawTicker: 'MXRF11', resolvedTicker: 'MXRF11', type: 'Rendimento', quantity: 800, unitValue: 0.11, totalValue: 88.00, year: 2025 },
      { id: 'd11', date: '12/12/2025', paymentDate: '12/12/2025', rawTicker: 'HGLG11', resolvedTicker: 'HGLG11', type: 'Rendimento', quantity: 100, unitValue: 1.10, totalValue: 110.00, year: 2025 },
      { id: 'd12', date: '12/11/2025', paymentDate: '12/11/2025', rawTicker: 'MXRF11', resolvedTicker: 'MXRF11', type: 'Rendimento', quantity: 800, unitValue: 0.11, totalValue: 88.00, year: 2025 },
      { id: 'd13', date: '14/11/2025', paymentDate: '14/11/2025', rawTicker: 'CVBI11', resolvedTicker: 'PCIP11', type: 'Rendimento', quantity: 200, unitValue: 0.95, totalValue: 190.00, year: 2025 },
      { id: 'd14', date: '15/10/2024', paymentDate: '15/10/2024', rawTicker: 'HGLG11', resolvedTicker: 'HGLG11', type: 'Rendimento', quantity: 80, unitValue: 1.10, totalValue: 88.00, year: 2024 },
      { id: 'd15', date: '15/10/2024', paymentDate: '15/10/2024', rawTicker: 'MXRF11', resolvedTicker: 'MXRF11', type: 'Rendimento', quantity: 500, unitValue: 0.11, totalValue: 55.00, year: 2024 }
    ];
    setEarningsRecords(demoItems);
    toast.success('Extrato de demonstração carregado com 15 lançamentos e 3 anos históricos!');
  };

  const toggleYearCollapse = (year: number): void => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const earningsYearsList = useMemo(() => {
    const yearsSet = new Set<number>();
    earningsRecords.forEach((item) => yearsSet.add(item.year));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [earningsRecords]);

  const filteredEarningsRecords = useMemo(() => {
    if (selectedEarningsYear === 'all') return earningsRecords;
    return earningsRecords.filter((r) => r.year === selectedEarningsYear);
  }, [earningsRecords, selectedEarningsYear]);

  const consolidatedYearlyReport = useMemo(() => {
    const report: Record<number, Record<string, { value: number; quantity: number; meses: number }>> = {};

    filteredEarningsRecords.forEach((item) => {
      const yr = item.year;
      const t = item.resolvedTicker;
      if (!report[yr]) report[yr] = {};
      if (!report[yr][t]) report[yr][t] = { value: 0, quantity: 0, meses: 0 };
      report[yr][t].value += item.totalValue;
      report[yr][t].quantity += item.quantity;
      report[yr][t].meses += 1;
    });

    const years = Object.keys(report).map(Number).sort((a, b) => b - a);
    return years.map((yr) => {
      const tickers = Object.keys(report[yr]).sort();
      const total = tickers.reduce((sum, t) => sum + report[yr][t].value, 0);
      const assets = tickers.map((t) => ({
        ticker: t,
        avgQuantity: report[yr][t].meses > 0 ? report[yr][t].quantity / report[yr][t].meses : 0,
        totalValue: report[yr][t].value,
        monthsCount: report[yr][t].meses
      }));
      return {
        year: yr,
        total,
        assets
      };
    });
  }, [filteredEarningsRecords]);

  const earningsMetrics = useMemo(() => {
    const total = filteredEarningsRecords.reduce((acc, cur) => acc + cur.totalValue, 0);
    const monthsCount = selectedEarningsYear === 'all' ? Math.max(1, earningsYearsList.length * 12) : 12;
    const monthlyAverage = total / monthsCount;

    const totalsByAsset: Record<string, number> = {};
    filteredEarningsRecords.forEach((item) => {
      totalsByAsset[item.resolvedTicker] = (totalsByAsset[item.resolvedTicker] || 0) + item.totalValue;
    });

    let topAsset = 'Nenhum';
    let topVal = 0;
    Object.entries(totalsByAsset).forEach(([ticker, val]) => {
      if (val > topVal) {
        topVal = val;
        topAsset = `${ticker} (R$ ${val.toFixed(2)})`;
      }
    });

    return {
      total,
      monthlyAverage,
      topAsset,
      count: filteredEarningsRecords.length
    };
  }, [filteredEarningsRecords, selectedEarningsYear, earningsYearsList]);

  const toolsList: Array<{
    id: ToolId;
    category: ToolCategory;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'tax_statement',
      category: 'statements',
      title: 'Preço Médio Fiscal (IRPF)',
      description: 'Calcule o preço médio e a quantidade real dos seus ativos processando os dados do seu extrato para declaração fiscal.',
      badge: 'Extrato IRPF',
      icon: <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'portfolio_rentability',
      category: 'statements',
      title: 'Rentabilidade da Carteira (CAGR)',
      description: 'Descubra o CAGR da carteira inteira considerando aportes, resgates e proventos, com a evolução e comparação com a meta.',
      badge: 'CAGR Carteira',
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'b3_earnings_calculator',
      category: 'statements',
      title: 'Total de Proventos B3',
      description: 'Organize e totalize todos os seus rendimentos agrupados por ativo e ano, extraindo os dados diretamente do Excel da B3.',
      badge: 'Extrato Excel',
      icon: <Upload className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'multi_comparator',
      category: 'assets',
      title: 'Comparador de Ativos',
      description: 'Coloque até 9 FIIs, FIAGROs ou FI-INFRAs lado a lado e compare preço, proventos, dividend yield e teto Bazin em tempo real.',
      badge: 'Até 9 Ativos',
      icon: <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'risk_analyzer',
      category: 'assets',
      title: 'Analisador de Risco',
      description: 'Volatilidade anualizada, drawdown máximo, melhor e pior dia e o retorno mês a mês de qualquer ativo da B3.',
      badge: 'Volatilidade',
      icon: <Activity className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'dividend_calendar',
      category: 'assets',
      title: 'Calendário de Dividendos',
      description: 'Monte a carteira e veja quando cada provento cai, a renda mensal média e o dividend yield ponderado da posição.',
      badge: 'Agenda Proventos',
      icon: <Calendar className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'treasury_simulator',
      category: 'assets',
      title: 'Tesouro Direto',
      description: 'Simule o rendimento bruto, o imposto de renda regressivo e o resultado líquido do seu Tesouro com taxas oficiais.',
      badge: 'IPCA+ e Selic',
      icon: <Landmark className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'compound_interest',
      category: 'simulators',
      title: 'Juros Compostos',
      description: 'Projete a evolução do seu patrimônio ao longo do tempo utilizando o efeito multiplicador e exponencial dos juros compostos.',
      badge: 'Exponencial',
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'simple_interest',
      category: 'simulators',
      title: 'Juros Simples',
      description: 'Descubra o rendimento exato de taxas fixas ao longo do tempo para investimentos que seguem juros lineares não-capitalizados.',
      badge: 'Linear',
      icon: <Percent className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'bazin_ceiling',
      category: 'simulators',
      title: 'Preço Teto (Bazin & Gordon)',
      description: 'Aplique o Método Décio Bazin para descobrir o preço máximo ideal a pagar garantindo o yield exigido via Selic ou Tesouro IPCA+.',
      badge: 'Bazin & IPCA+',
      icon: <Calculator className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'first_million',
      category: 'simulators',
      title: 'O 1º Milhão',
      description: 'Descubra exatamente quantos anos e qual o esforço de aporte mensal necessário para atingir o sonhado primeiro milhão investido.',
      badge: '1º Milhão',
      icon: <Trophy className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'avg_price_sim',
      category: 'simulators',
      title: 'Preço Médio (Simulação)',
      description: 'Projete o impacto de uma nova compra no seu portfólio. Saiba exatamente qual será seu novo preço médio antes de boletear.',
      badge: 'Nova Compra',
      icon: <PieChart className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'fire_four_percent',
      category: 'simulators',
      title: 'Regra dos 4% (F.I.R.E.)',
      description: 'Calcule o montante exato necessário para atingir a Independência Financeira e viver de renda com saques seguros de 4% ao ano.',
      badge: 'F.I.R.E.',
      icon: <Target className="h-5 w-5 text-emerald-400" />
    },
    {
      id: 'snowball_magic',
      category: 'simulators',
      title: 'Efeito Bola de Neve',
      description: 'Descubra o momento mágico em que os rendimentos de um ativo se tornam suficientes para comprar novas cotas sem tirar do bolso.',
      badge: 'Magic Number',
      icon: <Snowflake className="h-5 w-5 text-emerald-400" />
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
            <span>YieldIQ Financial Suite &bull; 14 Ferramentas de Carteira</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Central de Ferramentas, Valuation & Extratos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Processe extratos da B3, compare ativos em tempo real com dados oficiais, calcule rentabilidade CAGR e projete metas com simulações financeiras avançadas.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {[
              { id: 'all', label: 'Todas as 14 Ferramentas' },
              { id: 'statements', label: 'Análise de Extrato (3)' },
              { id: 'assets', label: 'Análise de Ativos (4)' },
              { id: 'simulators', label: 'Simuladores (7)' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ToolCategory)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold shadow-emerald-500/20'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-slate-400 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <strong className="text-white font-mono text-sm">0</strong>
              <span>custo mensal</span>
            </div>
            <span className="text-slate-700">&bull;</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-white font-mono text-sm">3</strong>
              <span>ferramentas de extrato</span>
            </div>
            <span className="text-slate-700">&bull;</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-white font-mono text-sm">4</strong>
              <span>análises de ativos</span>
            </div>
            <span className="text-slate-700">&bull;</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-white font-mono text-sm">7</strong>
              <span>simuladores</span>
            </div>
            <span className="text-slate-700">&bull;</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-emerald-400 font-mono text-sm">+600</strong>
              <span>ativos cadastrados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
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
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                    <span>Prazo de Acúmulo</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {yearsPeriod} anos ({monthsTotal} meses)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={yearsPeriod}
                      onChange={(e) =>
                        setYearsPeriod(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      anos
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {[5, 10, 15, 20, 30].map((presetYear) => (
                      <button
                        key={presetYear}
                        type="button"
                        onClick={() => setYearsPeriod(presetYear)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          yearsPeriod === presetYear
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {presetYear} anos
                      </button>
                    ))}
                  </div>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Buscar Código do Ativo</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AssetAutocompleteInput
                        value={snowballTicker}
                        onChange={setSnowballTicker}
                        onSelect={(asset) => {
                          setSnowballTicker(asset.ticker);
                          handleFetchSnowballAsset();
                        }}
                        placeholder="Ex: MXRF11"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchSnowballAsset()}
                      disabled={isLoadingSnowball}
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95"
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

        {activeToolId === 'bazin_ceiling' && <BazinCeilingTool />}
        {activeToolId === 'simple_interest' && <SimpleInterestTool />}
        {activeToolId === 'first_million' && <FirstMillionTool />}
        {activeToolId === 'dividend_calendar' && <DividendCalendarTool />}
        {activeToolId === 'portfolio_rentability' && <PortfolioRentabilityTool />}

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

        {activeToolId === 'multi_comparator' && <MultiComparatorTool />}

        {activeToolId === 'risk_analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Activity className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Analisador de Risco & Volatilidade</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Buscar Código do Ativo</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AssetAutocompleteInput
                        value={riskTicker}
                        onChange={setRiskTicker}
                        onSelect={(asset) => {
                          setRiskTicker(asset.ticker);
                          handleFetchRiskAsset();
                        }}
                        placeholder="Ex: HGLG11"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchRiskAsset()}
                      disabled={isLoadingRisk}
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95"
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
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
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
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-slate-950 transition shadow-md shadow-emerald-500/20 active:scale-95"
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

        {activeToolId === 'b3_earnings_calculator' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Upload className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-base font-bold text-white">Importar Extrato Oficial da B3</h2>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <HelpCircle className="h-4 w-4 shrink-0" />
                      <span>Como obter seu extrato oficial:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                      <li>Acesse <strong className="text-white">investidor.b3.com.br</strong> e faça login.</li>
                      <li>No menu lateral, clique em <strong className="text-white">Extratos</strong>.</li>
                      <li>Clique em <strong className="text-white">Filtrar</strong> e defina o período desde o início.</li>
                      <li>Em Tipo de Movimentação, selecione <strong className="text-white">"Proventos recebidos"</strong>.</li>
                      <li>Em Investimento, marque <strong className="text-white">FII e Fundos de Investimentos</strong>.</li>
                      <li>Clique em Filtrar, depois em Baixar e escolha o formato <strong className="text-emerald-400">Excel (.xlsx)</strong>.</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-slate-300">
                      Arquivo de Movimentação (.xlsx)
                    </label>
                    <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 p-6 text-center hover:border-emerald-500/50 transition group">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleProcessExcelFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="rounded-xl bg-slate-900 p-3 text-emerald-400 group-hover:scale-110 transition">
                          <Upload className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {isProcessingEarnings ? 'Processando proventos...' : 'Clique ou arraste seu arquivo Excel aqui'}
                        </span>
                        <span className="text-[11px] text-slate-500">Formatos aceitos: .xlsx da B3</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLoadDemoEarnings}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900 py-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center justify-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Carregar Dados de Exemplo da B3</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Conversão de Ativos (Fusões / Mudança de Código)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEarningsConversions((prev) => [
                            ...prev,
                            { id: String(Date.now()), oldTicker: '', newTicker: '' }
                          ]);
                        }}
                        className="text-[11px] text-emerald-400 hover:underline font-semibold"
                      >
                        + Adicionar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {earningsConversions.map((conv, idx) => (
                        <div key={conv.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Antigo"
                            value={conv.oldTicker}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setEarningsConversions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, oldTicker: val } : item))
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-xs text-white uppercase outline-none focus:border-emerald-500"
                          />
                          <span className="text-slate-500 font-bold">&rarr;</span>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Novo"
                            value={conv.newTicker}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setEarningsConversions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, newTicker: val } : item))
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-xs text-white uppercase outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEarningsConversions((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Desdobramentos (Splits de Cotas)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEarningsSplits((prev) => [
                            ...prev,
                            { id: String(Date.now()), ticker: '', date: '', ratio: 10 }
                          ]);
                        }}
                        className="text-[11px] text-emerald-400 hover:underline font-semibold"
                      >
                        + Adicionar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {earningsSplits.map((split, idx) => (
                        <div key={split.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Ativo"
                            value={split.ticker}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setEarningsSplits((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, ticker: val } : item))
                              );
                            }}
                            className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-xs text-white uppercase outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="DD/MM/AAAA"
                            value={split.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEarningsSplits((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, date: val } : item))
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-xs text-white outline-none focus:border-emerald-500"
                          />
                          <input
                            type="number"
                            min={1}
                            placeholder="Razão"
                            value={split.ratio}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEarningsSplits((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, ratio: val } : item))
                              );
                            }}
                            className="w-16 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-xs text-white outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEarningsSplits((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Acumulado de Proventos</span>
                    <p className="mt-1 text-3xl sm:text-5xl font-extrabold text-white">
                      R$ {earningsMetrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Média mensal de renda passiva: <strong className="text-emerald-400">R$ {earningsMetrics.monthlyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /mês</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                      <span className="text-[11px] text-slate-400 block">Ativo com Maior Retorno</span>
                      <span className="text-base font-bold text-white font-mono">{earningsMetrics.topAsset}</span>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                      <span className="text-[11px] text-slate-400 block">Lançamentos Processados</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{earningsMetrics.count} proventos</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEarningsViewTab('consolidated')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          earningsViewTab === 'consolidated'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Consolidação por Ano
                      </button>
                      <button
                        type="button"
                        onClick={() => setEarningsViewTab('detailed')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          earningsViewTab === 'detailed'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Extrato Detalhado
                      </button>
                    </div>

                    {earningsYearsList.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEarningsYear('all')}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            selectedEarningsYear === 'all'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Todos
                        </button>
                        {earningsYearsList.map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setSelectedEarningsYear(yr)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition font-mono ${
                              selectedEarningsYear === yr
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {earningsViewTab === 'consolidated' ? (
                    <div className="space-y-4">
                      {consolidatedYearlyReport.length === 0 ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-500">
                          Nenhum extrato carregado ainda. Importe seu arquivo Excel (.xlsx) da B3 ou clique em "Carregar Dados de Exemplo".
                        </div>
                      ) : (
                        consolidatedYearlyReport.map((grp) => {
                          const isCollapsed = Boolean(collapsedYears[grp.year]);
                          return (
                            <div
                              key={grp.year}
                              className="rounded-2xl border border-slate-800/80 bg-slate-950/70 overflow-hidden shadow-lg transition"
                            >
                              <div
                                onClick={() => toggleYearCollapse(grp.year)}
                                className="cursor-pointer p-4 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between user-select-none transition border-b border-slate-800/60"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                                    {isCollapsed ? '+' : '−'}
                                  </span>
                                  <span className="text-base font-extrabold text-white tracking-wide">
                                    {grp.year}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-slate-400">
                                    {grp.assets.length} {grp.assets.length === 1 ? 'ativo' : 'ativos'}
                                  </span>
                                  <span className="text-sm font-bold text-emerald-400 font-mono">
                                    R$ {grp.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              {!isCollapsed && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left font-mono text-xs">
                                    <thead>
                                      <tr className="bg-slate-950 border-b border-slate-800/60 text-slate-400">
                                        <th className="p-3">Ativo</th>
                                        <th className="p-3 text-right" title="Média de cotas que receberam provento no ano (com razão de desdobramento)">
                                          Cotas Médias
                                        </th>
                                        <th className="p-3 text-right">Valor Recebido</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40 text-[11px]">
                                      {grp.assets.map((ast) => (
                                        <tr key={ast.ticker} className="hover:bg-slate-900/30">
                                          <td className="p-3 font-bold text-white">{ast.ticker}</td>
                                          <td className="p-3 text-right text-slate-300">
                                            {ast.avgQuantity.toFixed(0)}
                                          </td>
                                          <td className="p-3 text-right font-bold text-emerald-400">
                                            R$ {ast.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t border-slate-800 bg-slate-900/40 text-xs">
                                        <td colSpan={2} className="p-3 font-bold text-slate-300">
                                          Total do ano ({grp.year})
                                        </td>
                                        <td className="p-3 text-right font-bold text-emerald-400 font-mono text-sm">
                                          R$ {grp.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                            <th className="p-3">Data Pagamento</th>
                            <th className="p-3">Ativo</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Qtd</th>
                            <th className="p-3">Valor/Cota</th>
                            <th className="p-3 text-right">Total Recebido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-[11px]">
                          {filteredEarningsRecords.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                Nenhum extrato carregado ainda. Importe seu arquivo Excel (.xlsx) ou clique em "Carregar Dados de Exemplo".
                              </td>
                            </tr>
                          ) : (
                            filteredEarningsRecords.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-900/40">
                                <td className="p-3 text-slate-300">{item.paymentDate}</td>
                                <td className="p-3">
                                  <span className="font-bold text-white">{item.resolvedTicker}</span>
                                  {item.rawTicker !== item.resolvedTicker && (
                                    <span className="text-[10px] text-slate-500 ml-1.5">({item.rawTicker})</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-emerald-400 font-semibold border border-slate-800">
                                    {item.type}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-300">{item.quantity > 0 ? item.quantity : '-'}</td>
                                <td className="p-3 text-slate-300">R$ {item.unitValue.toFixed(2)}</td>
                                <td className="p-3 text-right font-bold text-emerald-400">
                                  R$ {item.totalValue.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Total Consolidado de Proventos:</span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                      R$ {earningsMetrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
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
