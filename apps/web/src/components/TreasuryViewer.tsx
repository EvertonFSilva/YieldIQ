import React, { useEffect, useState, useMemo } from 'react';
import { Landmark, RefreshCw, AlertCircle, Calendar, DollarSign, Search, ShieldCheck } from 'lucide-react';
import { treasuryService } from '../services/apiClient';
import { TreasuryBondItem } from '../types';

export const TreasuryViewer: React.FC = () => {
  const [bondsList, setBondsList] = useState<TreasuryBondItem[]>([]);
  const [selectedIndexer, setSelectedIndexer] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBonds = () => {
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
        return indexer.includes(selectedIndexer);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((bond) =>
        bond.bondName.toLowerCase().includes(query) ||
        (bond.rateDescription || bond.profitabilityRateRaw || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [bondsList, selectedIndexer, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-400" />
            <span>Tesouro Direto</span>
          </h1>
          <p className="text-sm text-slate-400">
            Acompanhe taxas de rentabilidade anual e preços unitários oficiais do Tesouro Nacional.
          </p>
        </div>

        <button
          onClick={fetchBonds}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Atualizar Taxas</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-xs font-medium text-slate-400">Títulos Ativos</span>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-white">{bondsList.length}</p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            <span>Garantia Soberana</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-xs font-medium text-slate-400">Indexados Selic</span>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-400">
            {bondsList.filter((b) => (b.indexerName || '').toUpperCase().includes('SELIC')).length}
          </p>
          <div className="mt-1 text-[11px] text-slate-500">Reserva de Emergência</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-xs font-medium text-slate-400">Indexados IPCA+</span>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-cyan-400">
            {bondsList.filter((b) => (b.indexerName || '').toUpperCase().includes('IPCA')).length}
          </p>
          <div className="mt-1 text-[11px] text-slate-500">Proteção Inflacionária</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-xs font-medium text-slate-400">Prefixados</span>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-amber-400">
            {bondsList.filter((b) => (b.indexerName || '').toUpperCase().includes('PREFIXADO')).length}
          </p>
          <div className="mt-1 text-[11px] text-slate-500">Taxa Fixa Garantida</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar título por nome ou taxa (ex: IPCA 2035, Selic, Prefixado)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'SELIC', 'IPCA', 'PREFIXADO'].map((indexerKey) => (
            <button
              key={indexerKey}
              onClick={() => setSelectedIndexer(indexerKey)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                selectedIndexer === indexerKey
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {indexerKey === 'ALL' ? 'Todos' : indexerKey}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
          <p className="text-sm">Buscando cotações em tempo real no portal do Tesouro Direto...</p>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      ) : filteredBonds.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <Landmark className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-300">Nenhum título corresponde ao filtro</p>
          <p className="mt-1 text-xs text-slate-500">Experimente alterar a categoria ou o termo de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBonds.map((bondItem) => (
            <div
              key={bondItem.bondKey || bondItem.bondName}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-slate-800 px-2.5 py-1 font-mono text-xs font-semibold text-slate-300">
                  {bondItem.indexerName || 'TESOURO'}
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  {bondItem.rateDescription || bondItem.profitabilityRateRaw || `${bondItem.profitabilityRate.toFixed(2)}%`}
                </span>
              </div>

              <h3 className="mt-3 text-base font-semibold text-white">
                {bondItem.bondName}
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-3">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <DollarSign className="h-3 w-3 text-slate-500" />
                    <span>Preço Unitário</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-200">
                    {bondItem.unitPrice ? `R$ ${bondItem.unitPrice.toFixed(2)}` : 'Indisponível'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>Vencimento</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-200">
                    {bondItem.maturityFormattedDate || 'Não informado'}
                  </p>
                </div>
              </div>

              {bondItem.minimumInvestmentAmount && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-1.5 text-xs text-slate-400">
                  <span>Aplicação Mínima:</span>
                  <span className="font-semibold text-slate-300">
                    R$ {bondItem.minimumInvestmentAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
