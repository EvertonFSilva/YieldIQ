import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Building2,
  Sprout,
  Zap,
  PieChart,
  LayoutGrid,
  List,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { assetService } from '../services/apiClient';
import { AssetItem } from '../types';
import { AssetDetailModal } from './AssetDetailModal';
import { CustomSelect } from './common/CustomSelect';

export const AssetExplorer: React.FC = () => {
  const [assetsList, setAssetsList] = useState<AssetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<AssetItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);

  const loadAssets = (): void => {
    setIsLoading(true);
    setErrorMessage(null);

    assetService
      .listAssets()
      .then((items) => {
        setAssetsList(items);
        setIsLoading(false);
      })
      .catch((error) => {
        setErrorMessage(error.message || 'Falha ao buscar ativos listados');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const filteredAndSortedAssets = useMemo(() => {
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
          (item.metadata?.segment || '').toLowerCase().includes(query) ||
          (item.administratorName || '').toLowerCase().includes(query)
      );
    }

    const sorted = [...result].sort((firstAsset, secondAsset) => {
      if (sortOrder === 'asc') {
        return firstAsset.ticker.localeCompare(secondAsset.ticker);
      }
      return secondAsset.ticker.localeCompare(firstAsset.ticker);
    });

    return sorted;
  }, [searchQuery, selectedTypeFilter, assetsList, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedAssets.length / itemsPerPage);

  const paginatedAssets = useMemo(() => {
    if (itemsPerPage >= 999) {
      return filteredAndSortedAssets;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedAssets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedAssets, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const total = assetsList.length;
    const fiiCount = assetsList.filter((a) => a.type === 'FII').length;
    const fiagroCount = assetsList.filter((a) => a.type === 'FIAGRO').length;
    const fiInfraCount = assetsList.filter((a) => a.type === 'FI_INFRA').length;
    return { total, fiiCount, fiagroCount, fiInfraCount };
  }, [assetsList]);

  const handleClearFilters = (): void => {
    setSearchQuery('');
    setSelectedTypeFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <PieChart className="h-7 w-7 text-emerald-400" />
            <span>Explorador de Ativos da B3</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Acompanhe FIIs, FIAGROs e FI-INFRAs com cotações em tempo real, proventos da B3 e relatórios CVM.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-2 text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={loadAssets}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          onClick={() => {
            setSelectedTypeFilter('ALL');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedTypeFilter === 'ALL'
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Todos os Ativos</span>
            <PieChart className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-white">{metrics.total}</p>
          <div className="mt-1 text-[11px] text-slate-500">Base B3 Monitorada</div>
        </div>

        <div
          onClick={() => {
            setSelectedTypeFilter('FII');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedTypeFilter === 'FII'
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">FIIs Imobiliários</span>
            <Building2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{metrics.fiiCount}</p>
          <div className="mt-1 text-[11px] text-slate-500">Renda Imobiliária</div>
        </div>

        <div
          onClick={() => {
            setSelectedTypeFilter('FIAGRO');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedTypeFilter === 'FIAGRO'
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">FIAGROs</span>
            <Sprout className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-400">{metrics.fiagroCount}</p>
          <div className="mt-1 text-[11px] text-slate-500">Cadeia do Agro</div>
        </div>

        <div
          onClick={() => {
            setSelectedTypeFilter('FI_INFRA');
            setCurrentPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedTypeFilter === 'FI_INFRA'
              ? 'border-cyan-500/40 bg-cyan-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">FI-INFRAs</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-cyan-400">{metrics.fiInfraCount}</p>
          <div className="mt-1 text-[11px] text-slate-500">Debêntures & Infra</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por código ou nome (ex: MXRF11, HGLG11, KNCA11, JURO11)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-10 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-2.5 rounded-md p-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            value={sortOrder}
            onChange={(val) => setSortOrder(val as 'asc' | 'desc')}
            options={[
              { value: 'asc', label: 'Código do Ativo (A-Z)' },
              { value: 'desc', label: 'Código do Ativo (Z-A)' }
            ]}
          />

          <CustomSelect
            value={itemsPerPage}
            onChange={(val) => {
              setItemsPerPage(Number(val));
              setCurrentPage(1);
            }}
            options={[
              { value: 24, label: '24 por pág' },
              { value: 48, label: '48 por pág' },
              { value: 96, label: '96 por pág' },
              { value: 999, label: 'Todos os ativos' }
            ]}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Exibindo <span className="font-semibold text-white">{filteredAndSortedAssets.length}</span> ativos encontrados
        </span>
        {searchQuery && (
          <button
            onClick={handleClearFilters}
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Limpar busca</span>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
          <p className="text-sm">Carregando lista de ativos cadastrados...</p>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      ) : filteredAndSortedAssets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-4">
          <Filter className="mx-auto h-10 w-10 text-slate-600" />
          <div>
            <p className="text-base font-semibold text-slate-300">Nenhum ativo encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Nenhum ativo corresponde à busca "{searchQuery}" para a categoria selecionada.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Redefinir Filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedAssets.map((assetItem) => {
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
                className="group cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 font-mono text-base font-bold border ${badgeClasses}`}>
                        {assetItem.ticker}
                      </span>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase">
                        {assetItem.type.replace('_', '-')}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-xs font-medium text-slate-300 group-hover:text-white transition leading-relaxed">
                    {assetItem.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Segmento</span>
                  <span className="truncate max-w-[140px] text-right font-medium text-slate-300">
                    {assetItem.metadata?.segment || 'Geral'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="p-4">Código do Ativo</th>
                  <th className="p-4">Nome do Ativo</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Segmento</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedAssets.map((assetItem) => (
                  <tr
                    key={assetItem.id}
                    onClick={() => setSelectedAssetForModal(assetItem)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="p-4 font-mono font-bold text-white text-sm">{assetItem.ticker}</td>
                    <td className="p-4 text-slate-300 font-medium max-w-md truncate">{assetItem.name}</td>
                    <td className="p-4">
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        {assetItem.type.replace('_', '-')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{assetItem.metadata?.segment || 'Geral'}</td>
                    <td className="p-4 text-right">
                      <button className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition">
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && itemsPerPage < 999 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-500">
            Página <span className="font-semibold text-slate-300">{currentPage}</span> de{' '}
            <span className="font-semibold text-slate-300">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <span className="px-3 text-xs font-mono font-bold text-emerald-400">{currentPage}</span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition"
            >
              <span>Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
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