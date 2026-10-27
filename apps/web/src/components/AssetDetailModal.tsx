import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { assetService } from '../services/apiClient';
import { AssetSummaryData, AssetItem } from '../types';

interface AssetDetailModalProperties {
  asset: AssetItem | null;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProperties> = ({ asset, onClose }) => {
  const [summaryData, setSummaryData] = useState<AssetSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    assetService
      .retrieveSummary(asset.ticker)
      .then((data) => {
        if (isMounted) {
          setSummaryData(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error.message || 'Falha ao carregar detalhes do ativo');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [asset]);

  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-emerald-500/10 px-3 py-1 font-mono text-xl font-bold text-emerald-400 border border-emerald-500/20">
                {asset.ticker}
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {asset.type}
              </span>
            </div>
            <h2 className="mt-2 text-base text-slate-300 font-medium">{asset.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm">Buscando cotações e proventos oficiais em tempo real...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 my-6 text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        ) : summaryData ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-xs font-medium text-slate-400">Preço Atual</span>
                <p className="mt-1 text-2xl font-bold text-white">
                  R$ {summaryData.priceQuote.currentPrice.toFixed(2)}
                </p>
                <div className="mt-1 text-xs text-slate-400">
                  Fechamento anterior: R$ {summaryData.priceQuote.previousClose.toFixed(2)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-xs font-medium text-slate-400">Dividend Yield (12M)</span>
                <p className="mt-1 text-2xl font-bold text-emerald-400">
                  {summaryData.trailingDividendYieldPercentage.toFixed(2)}%
                </p>
                <div className="mt-1 text-xs text-slate-400">
                  Soma 12M: R$ {summaryData.annualDividendSum.toFixed(2)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-xs font-medium text-slate-400">Preço Teto Bazin (6%)</span>
                <p className="mt-1 text-2xl font-bold text-cyan-400">
                  R$ {summaryData.bazinCeilingPriceSixPercent.toFixed(2)}
                </p>
                <div className="mt-1 text-xs text-slate-400">
                  Margem: {summaryData.priceQuote.currentPrice > 0 ? (((summaryData.bazinCeilingPriceSixPercent / summaryData.priceQuote.currentPrice) - 1) * 100).toFixed(1) : 0}%
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-xs font-medium text-slate-400">Preço Teto Gordon</span>
                <p className="mt-1 text-2xl font-bold text-indigo-400">
                  R$ {summaryData.gordonCeilingPrice.toFixed(2)}
                </p>
                <div className="mt-1 text-xs text-slate-400">Valuation de fluxo</div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                  Histórico Recente de Proventos (B3)
                </h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Valor por Cota</th>
                      <th className="px-4 py-3">Data Com (Base)</th>
                      <th className="px-4 py-3">Data Pagamento</th>
                      <th className="px-4 py-3 text-right">Fonte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {summaryData.recentDividends.slice(0, 6).map((dividend, index) => (
                      <tr key={index} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-emerald-400">
                          {dividend.formattedValue}
                        </td>
                        <td className="px-4 py-3">{dividend.baseRecordDate || '-'}</td>
                        <td className="px-4 py-3">{dividend.paymentDistributionDate || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {dividend.documentSourceUrl ? (
                            <a
                              href={dividend.documentSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                            >
                              <span>Aviso</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs">Oficial B3</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
