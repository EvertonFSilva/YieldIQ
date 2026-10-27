import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react';
import { assetService } from '../services/apiClient';
import { AssetItem } from '../types';
import { AssetDetailModal } from './AssetDetailModal';

export const AssetExplorer: React.FC = () => {
  const [assetsList, setAssetsList] = useState<AssetItem[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetItem[]>([]);
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
          setFilteredAssets(items);
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

  useEffect(() => {
    let result = assetsList;

    if (selectedTypeFilter !== 'ALL') {
      result = result.filter((item) => item.type === selectedTypeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.ticker.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query)
      );
    }

    setFilteredAssets(result);
  }, [searchQuery, selectedTypeFilter, assetsList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Explorador de Ativos</h1>
          <p className="text-sm text-slate-400">
            Acompanhe FIIs, FIAGROs e FI-INFRAs listados na B3 com proventos e valuations automáticos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              {typeOption === 'ALL' ? 'Todos' : typeOption}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por ticker ou nome (ex: HGLG11, KNIP11, RZTR11, JURO11)..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
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
          {filteredAssets.map((assetItem) => (
            <div
              key={assetItem.id}
              onClick={() => setSelectedAssetForModal(assetItem)}
              className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-950/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-base font-bold text-emerald-400 border border-emerald-500/20">
                    {assetItem.ticker}
                  </span>
                  <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase">
                    {assetItem.type}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              <h3 className="mt-3 line-clamp-2 text-sm font-medium text-slate-300">
                {assetItem.name}
              </h3>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                <span>Gestão / Admin</span>
                <span className="line-clamp-1 max-w-[140px] text-right font-medium text-slate-300">
                  {assetItem.administratorName || 'Não informado'}
                </span>
              </div>
            </div>
          ))}
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
