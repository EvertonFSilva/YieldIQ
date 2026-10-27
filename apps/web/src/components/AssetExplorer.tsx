import React, { useEffect, useState, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, RefreshCw, AlertCircle, Building2, Sprout, Zap, PieChart } from 'lucide-react';
import { assetService } from '../services/apiClient';
import { AssetItem } from '../types';
import { AssetDetailModal } from './AssetDetailModal';

export const AssetExplorer: React.FC = () => {
  const [assetsList, setAssetsList] = useState<AssetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<AssetItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    assetService
      .listAssets()
      .then((items) => {
        if (isMounted) {
          setAssetsList(items);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error.message || 'Falha ao buscar ativos listados');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    let result = assetsList;

    if (selectedTypeFilter !== 'ALL') {
      result = result.filter((item) => item.type === selectedTypeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.ticker.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          (item.administratorName || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedTypeFilter, assetsList]);

  const metrics = useMemo(() => {
    const total = assetsList.length;
    const fiiCount = assetsList.filter((a) => a.type === 'FII').length;
    const fiagroCount = assetsList.filter((a) => a.type === 'FIAGRO').length;
    const fiInfraCount = assetsList.filter((a) => a.type === 'FI_INFRA').length;
    return { total, fiiCount, fiagroCount, fiInfraCount };
  }, [assetsList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <PieChart className="h-6 w-6 text-emerald-400" />
            <span>Explorador de Ativos de Rendimento</span>
          </h1>
          <p className="text-sm text-slate-400">
            Acompanhe FIIs, FIAGROs e FI-INFRAs listados na B3 com proventos oficiais e cálculos de valuation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {['ALL', 'FII', 'FIAGRO', 'FI_INFRA'].map((typeOption) => (
            <button
              key={typeOption}
              onClick={() => setSelectedTypeFilter(typeOption)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                selectedTypeFilter === typeOption
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {typeOption === 'ALL' ? 'Todos' : typeOption.replace('_', '-')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Ativos</span>
            <PieChart className="h-4 w-4 text-slate-500" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-white">{metrics.total}</p>
          <div className="mt-1 text-[11px] text-slate-500">Monitorados 24/7</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">FIIs Imobiliários</span>
            <Building2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-400">{metrics.fiiCount}</p>
          <div className="mt-1 text-[11px] text-slate-500">Renda Imobiliária</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">FIAGROs Agro</span>
            <Sprout className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-amber-400">{metrics.fiagroCount}</p>
          <div className="mt-1 text-[11px] text-slate-500">Crédito & Terras Agro</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">FI-INFRAs Infra</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-cyan-400">{metrics.fiInfraCount}</p>
          <div className="mt-1 text-[11px] text-slate-500">Isentos de I.R.</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por código ou nome (ex: HGLG11, KNIP11, RZTR11, JURO11)..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
          <p className="text-sm">Carregando lista de ativos cadastrados...</p>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <Filter className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-300">Nenhum ativo encontrado</p>
          <p className="mt-1 text-xs text-slate-500">Tente buscar por outro código de negociação ou mude o filtro de categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((assetItem) => {
            const isFii = assetItem.type === 'FII';
            const isFiagro = assetItem.type === 'FIAGRO';
            const badgeClasses = isFii
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : isFiagro
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

            return (
              <div
                key={assetItem.id}
                onClick={() => setSelectedAssetForModal(assetItem)}
                className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-950/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`rounded-md px-2.5 py-1 font-mono text-base font-bold border ${badgeClasses}`}>
                      {assetItem.ticker}
                    </span>
                    <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase">
                      {assetItem.type.replace('_', '-')}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <h3 className="mt-3 line-clamp-2 text-sm font-medium text-slate-300 group-hover:text-white transition">
                  {assetItem.name}
                </h3>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                  <span>Administração</span>
                  <span className="line-clamp-1 max-w-[140px] text-right font-medium text-slate-300">
                    {assetItem.administratorName || 'B3 Oficial'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAssetForModal && (
        <AssetDetailModal
          asset={selectedAssetForModal}
          onClose={() => setSelectedAssetForModal(null)}
        />
      )}
    </div>
  );
};
