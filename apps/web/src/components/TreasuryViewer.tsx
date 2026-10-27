import React, { useEffect, useState, useMemo } from 'react';
import {
  Landmark,
  RefreshCw,
  AlertCircle,
  Calendar,
  DollarSign,
  Search,
  ShieldCheck,
  X
} from 'lucide-react';
import { treasuryService } from '../services/apiClient';
import { TreasuryBondItem } from '../types';
import { CustomSelect } from './common/CustomSelect';

export const TreasuryViewer: React.FC = () => {
  const [bondsList, setBondsList] = useState<TreasuryBondItem[]>([]);
  const [selectedIndexer, setSelectedIndexer] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'rate' | 'name' | 'minPrice'>('rate');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBonds = (): void => {
    setIsLoading(true);
    setErrorMessage(null);

    treasuryService
      .retrieveBonds()
      .then((items) => {
        setBondsList(items);
        setIsLoading(false);
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Falha ao carregar taxas do Tesouro Direto');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchBonds();
  }, []);

  const filteredBonds = useMemo(() => {
    let result = bondsList;

    if (selectedIndexer !== 'ALL') {
      result = result.filter((bond) => {
        const indexer = (bond.indexerName || '').toUpperCase();
        const bondName = bond.bondName.toUpperCase();
        return indexer.includes(selectedIndexer) || bondName.includes(selectedIndexer);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (bond) =>
          bond.bondName.toLowerCase().includes(query) ||
          (bond.rateDescription || bond.profitabilityRateRaw || '').toLowerCase().includes(query)
      );
    }

    const sorted = [...result].sort((firstBond, secondBond) => {
      if (sortOption === 'rate') {
        return secondBond.profitabilityRate - firstBond.profitabilityRate;
      }
      if (sortOption === 'minPrice') {
        return (firstBond.minimumInvestmentAmount || 0) - (secondBond.minimumInvestmentAmount || 0);
      }
      return firstBond.bondName.localeCompare(secondBond.bondName);
    });

    return sorted;
  }, [bondsList, selectedIndexer, searchQuery, sortOption]);

  const maxIpcaRate = useMemo(() => {
    const ipcaBonds = bondsList.filter((b) => (b.indexerName || '').toUpperCase().includes('IPCA'));
    if (ipcaBonds.length === 0) return null;
    return Math.max(...ipcaBonds.map((b) => b.profitabilityRate));
  }, [bondsList]);

  const maxPrefixadoRate = useMemo(() => {
    const prefixados = bondsList.filter((b) => (b.indexerName || '').toUpperCase().includes('PREFIXADO'));
    if (prefixados.length === 0) return null;
    return Math.max(...prefixados.map((b) => b.profitabilityRate));
  }, [bondsList]);

  const lowestInvestmentAmount = useMemo(() => {
    const amounts = bondsList
      .map((b) => b.minimumInvestmentAmount)
      .filter((a): a is number => a !== null && a > 0);
    if (amounts.length === 0) return null;
    return Math.min(...amounts);
  }, [bondsList]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Landmark className="h-7 w-7 text-emerald-400" />
            <span>Tesouro Direto em Tempo Real</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Taxas de rentabilidade anual, aportes mínimos e vencimentos oficiais do Tesouro Nacional.
          </p>
        </div>

        <button
          onClick={fetchBonds}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Atualizar Taxas</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-medium text-slate-400">Títulos Ativos</span>
          <p className="mt-1 text-2xl font-extrabold text-white">{bondsList.length}</p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Garantia do Tesouro Nacional</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-medium text-slate-400">Maior Taxa IPCA+</span>
          <p className="mt-1 text-2xl font-extrabold text-cyan-400">
            {maxIpcaRate ? `+${maxIpcaRate.toFixed(2)}%` : '-'}
          </p>
          <div className="mt-1 text-[11px] text-slate-500">Juro Real + IPCA</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-medium text-slate-400">Maior Taxa Prefixada</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {maxPrefixadoRate ? `${maxPrefixadoRate.toFixed(2)}% a.a.` : '-'}
          </p>
          <div className="mt-1 text-[11px] text-slate-500">Rentabilidade Fixa Travada</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-medium text-slate-400">Menor Aporte Mínimo</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {lowestInvestmentAmount ? `R$ ${lowestInvestmentAmount.toFixed(2)}` : '-'}
          </p>
          <div className="mt-1 text-[11px] text-slate-500">Acessível para qualquer investidor</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar título por nome (ex: IPCA 2035, Selic, Prefixado)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-10 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 rounded-md p-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <CustomSelect
            value={sortOption}
            onChange={(val) => setSortOption(val as any)}
            options={[
              { value: 'rate', label: 'Maior Taxa Anual' },
              { value: 'minPrice', label: 'Menor Aporte Mínimo' },
              { value: 'name', label: 'Nome do Título (A-Z)' }
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { key: 'ALL', label: 'Todos os Títulos' },
          { key: 'IPCA', label: 'IPCA+ (Inflação)' },
          { key: 'PREFIXADO', label: 'Prefixados' },
          { key: 'SELIC', label: 'Tesouro Selic' },
          { key: 'RENDA', label: 'Renda+ (Aposentadoria)' },
          { key: 'EDUCA', label: 'Educa+ (Universidade)' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedIndexer(item.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              selectedIndexer === item.key
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-xs">Buscando cotações em tempo real no portal do Tesouro Direto...</p>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-400 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : filteredBonds.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-4">
          <Landmark className="mx-auto h-10 w-10 text-slate-600" />
          <div>
            <p className="text-base font-semibold text-slate-300">Nenhum título corresponde ao filtro</p>
            <p className="text-xs text-slate-500 mt-1">Experimente alterar a categoria ou o termo de busca.</p>
          </div>
          <button
            onClick={() => {
              setSelectedIndexer('ALL');
              setSearchQuery('');
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Ver Todos os Títulos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBonds.map((bondItem) => {
            const isSelic = (bondItem.indexerName || '').toUpperCase().includes('SELIC');
            const isIpca = (bondItem.indexerName || '').toUpperCase().includes('IPCA');
            const badgeIndexerClass = isSelic
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : isIpca
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

            return (
              <div
                key={bondItem.bondKey || bondItem.bondName}
                className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold uppercase border ${badgeIndexerClass}`}
                    >
                      {bondItem.indexerName || 'TESOURO'}
                    </span>
                    <span className="rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/20 font-mono">
                      {bondItem.rateDescription || bondItem.profitabilityRateRaw || `${bondItem.profitabilityRate.toFixed(2)}%`}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white group-hover:text-emerald-300 transition">
                    {bondItem.bondName}
                  </h3>
                </div>

                <div className="mt-5 space-y-3 pt-4 border-t border-slate-800/60 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <DollarSign className="h-3 w-3" />
                        <span>Preço Unitário</span>
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-slate-200">
                        {bondItem.unitPrice ? `R$ ${bondItem.unitPrice.toFixed(2)}` : 'Indisponível'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>Vencimento</span>
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-slate-200">
                        {bondItem.maturityFormattedDate || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {bondItem.minimumInvestmentAmount && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3.5 py-2 text-xs border border-slate-800/60">
                      <span className="text-slate-400">Aplicação Mínima:</span>
                      <span className="font-extrabold font-mono text-emerald-400">
                        R$ {bondItem.minimumInvestmentAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};