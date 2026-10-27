import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  FileText,
  BarChart3,
  DollarSign,
  Clock,
  ShieldCheck,
  Building
} from 'lucide-react';
import { assetService, treasuryService } from '../services/apiClient';
import { AssetSummaryData, AssetItem, DocumentItem } from '../types';
import {
  isTijoloFund,
  calculateBazinForTijolo,
  getAssetClassificationLabel
} from '../utils/assetValuation';

interface AssetDetailModalProperties {
  asset: AssetItem | null;
  onClose: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProperties> = ({
  asset,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dividends' | 'documents'>('overview');
  const [summaryData, setSummaryData] = useState<AssetSummaryData | null>(null);
  const [documentsList, setDocumentsList] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tesouroIpcaRate, setTesouroIpcaRate] = useState<number>(6.05);

  useEffect(() => {
    treasuryService
      .retrieveBonds()
      .then((bonds) => {
        const ipcaBond = bonds.find(
          (b) => b.bondName.toUpperCase().includes('IPCA+') && b.bondName.includes('2035')
        ) || bonds.find((b) => b.bondName.toUpperCase().includes('IPCA+'));
        if (ipcaBond && ipcaBond.profitabilityRate > 0) {
          setTesouroIpcaRate(ipcaBond.profitabilityRate);
        }
      })
      .catch(() => {});
  }, []);

  const fetchSummary = (): void => {
    if (!asset) return;
    setIsLoading(true);
    setErrorMessage(null);

    assetService
      .retrieveSummary(asset.ticker)
      .then((data) => {
        setSummaryData(data);
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMessage('Não foi possível carregar os dados em tempo real para este ativo.');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!asset) return;
    fetchSummary();
  }, [asset]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadDocuments = async (): Promise<void> => {
    if (!asset || documentsList.length > 0) return;
    setIsLoadingDocuments(true);
    try {
      const docs = await assetService.retrieveDocuments(asset.ticker);
      setDocumentsList(docs || []);
    } catch {
      setDocumentsList([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments();
    }
  }, [activeTab]);

  if (!asset) return null;

  const formatLastUpdated = (dateString?: string): string => {
    try {
      const date = dateString ? new Date(dateString) : new Date();
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Hoje';
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn transition-all duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-xl bg-emerald-500/10 px-3.5 py-1.5 font-mono text-2xl font-bold text-emerald-400 border border-emerald-500/20">
                {asset.ticker}
              </span>
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {asset.type.replace('_', '-')}
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${getAssetClassificationLabel(asset).badgeStyle}`}>
                {getAssetClassificationLabel(asset).label}
              </span>
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-400">
                {asset.metadata?.segment || 'Geral'}
              </span>
            </div>
            <h2 className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">{asset.name}</h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar detalhes do ativo"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex rounded-2xl bg-slate-950/70 p-1.5 border border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral & Valuation</span>
          </button>

          <button
            onClick={() => setActiveTab('dividends')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              activeTab === 'dividends'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Proventos da B3</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200 ${
              activeTab === 'documents'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Fatos Relevantes CVM</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-xs">Buscando cotações e proventos oficiais em tempo real...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-800 bg-slate-950/60 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="text-sm font-semibold text-white">Informações Temporariamente Indisponíveis</p>
            <p className="text-xs text-slate-400 max-w-md">
              Não foi possível sincronizar os dados em tempo real para este ativo. A B3 ou CVM podem estar em janela de manutenção.
            </p>
            <button
              onClick={fetchSummary}
              className="mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition"
            >
              Tentar Novamente
            </button>
          </div>
        ) : summaryData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 px-4 py-2.5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Última atualização: <strong className="text-white">{formatLastUpdated(summaryData.priceQuote?.lastUpdatedAt)}</strong></span>
              </div>
              <span className="text-[11px] text-slate-500">Fonte Oficial: B3 &bull; CVM</span>
            </div>

            {activeTab === 'overview' && (() => {
              const isTijolo = isTijoloFund(asset);
              const tijoloValuation = calculateBazinForTijolo(summaryData.annualDividendSum || 0, tesouroIpcaRate, 1.5, 0.0);
              const activeBazinCeiling = isTijolo ? tijoloValuation.ceilingPrice : (summaryData.bazinCeilingPriceSixPercent || 0);
              const currentPrice = summaryData.priceQuote?.currentPrice || 0;
              const activeMargin = currentPrice > 0 && activeBazinCeiling > 0 ? (((activeBazinCeiling / currentPrice) - 1) * 100) : null;

              return (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                      <span className="text-[11px] font-medium text-slate-400">Preço Atual</span>
                      <p className="mt-1 text-2xl font-extrabold text-white">
                        R$ {summaryData.priceQuote?.currentPrice ? summaryData.priceQuote.currentPrice.toFixed(2) : '0,00'}
                      </p>
                      <div className="mt-1 text-[11px] flex items-center gap-1 font-semibold">
                        <span
                          className={
                            (summaryData.priceQuote?.dailyVariationPercentage || 0) >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          {(summaryData.priceQuote?.dailyVariationPercentage || 0) >= 0 ? '+' : ''}
                          {(summaryData.priceQuote?.dailyVariationPercentage || 0).toFixed(2)}%
                        </span>
                        <span className="text-slate-500">hoje</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                      <span className="text-[11px] font-medium text-slate-400">Dividend Yield (12M)</span>
                      <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                        {summaryData.trailingDividendYieldPercentage ? summaryData.trailingDividendYieldPercentage.toFixed(2) : '0,00'}%
                      </p>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Soma 12M: R$ {summaryData.annualDividendSum ? summaryData.annualDividendSum.toFixed(2) : '0,00'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">
                          {isTijolo ? 'Preço Teto (IPCA+)' : 'Preço Teto Bazin (6%)'}
                        </span>
                        {isTijolo && (
                          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Tijolo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-2xl font-extrabold text-teal-400">
                        R$ {activeBazinCeiling > 0 ? activeBazinCeiling.toFixed(2) : '0,00'}
                      </p>
                      <div className="mt-1 text-[11px]">
                        {activeMargin !== null ? (
                          <span className={activeMargin >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            Margem: {activeMargin >= 0 ? '+' : ''}{activeMargin.toFixed(1)}% {activeMargin >= 0 ? '(Oportunidade)' : '(Aguardar)'}
                          </span>
                        ) : (
                          <span className="text-slate-500">Margem: Sob Apuração</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                      <span className="text-[11px] font-medium text-slate-400">Preço Teto Gordon</span>
                      <p className="mt-1 text-2xl font-extrabold text-cyan-400">
                        R$ {summaryData.gordonCeilingPrice ? summaryData.gordonCeilingPrice.toFixed(2) : '0,00'}
                      </p>
                      <div className="mt-1 text-[11px] text-slate-500">Modelo DDM descontado</div>
                    </div>
                  </div>

                  {isTijolo && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-xs text-slate-300 flex items-start gap-3">
                      <Building className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Metodologia Bazin para FII de Tijolo</span>
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            Ref: Tesouro IPCA+ ({tesouroIpcaRate.toFixed(2)}%)
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          Como os ativos de tijolo têm imóveis físicos cujos aluguéis se corrigem com a inflação oficial, seu rendimento é real. O valuation Bazin técnico adota como taxa base o <strong>Tesouro IPCA+ ({tesouroIpcaRate.toFixed(2)}% a.a.)</strong> + 1,50% de prêmio de risco, exigindo yield alvo de <strong>{tijoloValuation.targetYield.toFixed(2)}% a.a.</strong>
                        </p>
                        <div className="pt-1 text-[10px] text-slate-500">
                          Bazin Clássico (6% fixo): R$ {(summaryData.bazinCeilingPriceSixPercent || 0).toFixed(2)} &bull; Taxa Alvo Gordon: R$ {(summaryData.gordonCeilingPrice || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Detalhes de Negociação no Mercado
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Fechamento Anterior</span>
                      <span className="font-semibold text-slate-200">
                        R$ {summaryData.priceQuote?.previousClose ? summaryData.priceQuote.previousClose.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Abertura</span>
                      <span className="font-semibold text-slate-200">
                        R$ {summaryData.priceQuote?.openingPrice ? summaryData.priceQuote.openingPrice.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Faixa do Dia (Mín - Máx)</span>
                      <span className="font-semibold text-slate-200">
                        R$ {summaryData.priceQuote?.dayLowPrice ? summaryData.priceQuote.dayLowPrice.toFixed(2) : '-'} - R${' '}
                        {summaryData.priceQuote?.dayHighPrice ? summaryData.priceQuote.dayHighPrice.toFixed(2) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Volume Financeiro</span>
                      <span className="font-semibold text-slate-200">
                        {summaryData.priceQuote?.tradingVolume
                          ? summaryData.priceQuote.tradingVolume.toLocaleString('pt-BR')
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {summaryData.institutionalDetails && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Informações Cadastrais & Governança (B3 & CVM)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {summaryData.institutionalDetails.cnpj && (
                        <div>
                          <span className="text-slate-500 block">CNPJ do Fundo</span>
                          <span className="font-mono font-semibold text-white">
                            {summaryData.institutionalDetails.cnpj}
                          </span>
                        </div>
                      )}
                      {summaryData.institutionalDetails.positionManager && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 block">Administrador / Gestor Fiduciário</span>
                          <span className="font-medium text-slate-200">
                            {summaryData.institutionalDetails.positionManager}
                          </span>
                        </div>
                      )}
                      {summaryData.institutionalDetails.quotaCount && (
                        <div>
                          <span className="text-slate-500 block">Total de Cotas Emitidas</span>
                          <span className="font-mono font-semibold text-slate-200">
                            {summaryData.institutionalDetails.quotaCount}
                          </span>
                        </div>
                      )}
                      {summaryData.institutionalDetails.classification && (
                        <div>
                          <span className="text-slate-500 block">Classificação ANBIMA / B3</span>
                          <span className="font-semibold text-slate-200">
                            {summaryData.institutionalDetails.classification}
                          </span>
                        </div>
                      )}
                      {summaryData.institutionalDetails.webSite && (
                        <div>
                          <span className="text-slate-500 block">Portal Institucional</span>
                          <a
                            href={
                              summaryData.institutionalDetails.webSite.startsWith('http')
                                ? summaryData.institutionalDetails.webSite
                                : `https://${summaryData.institutionalDetails.webSite}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:underline"
                          >
                            <span className="truncate max-w-[180px]">
                              {summaryData.institutionalDetails.webSite}
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
              );
            })()}

            {activeTab === 'dividends' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Distribuições de Rendimentos Registradas na B3
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Total em 12M: R$ {summaryData.annualDividendSum ? summaryData.annualDividendSum.toFixed(2) : '0,00'}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
                        <th className="p-3.5">Valor por Cota</th>
                        <th className="p-3.5">Data Com (Base)</th>
                        <th className="p-3.5">Data Pagamento</th>
                        <th className="p-3.5 text-right">Documento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {!summaryData.recentDividends || summaryData.recentDividends.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500">
                            Nenhum dividendo registrado recentemente no cache da B3.
                          </td>
                        </tr>
                      ) : (
                        summaryData.recentDividends.map((dividend, index) => (
                          <tr key={index} className="hover:bg-slate-800/40">
                            <td className="p-3.5 font-bold font-mono text-emerald-400 text-sm">
                              {dividend.formattedValue}
                            </td>
                            <td className="p-3.5 text-slate-300 font-mono">{dividend.baseRecordDate || '-'}</td>
                            <td className="p-3.5 text-slate-300 font-mono">{dividend.paymentDistributionDate || '-'}</td>
                            <td className="p-3.5 text-right">
                              {dividend.documentSourceUrl ? (
                                <a
                                  href={dividend.documentSourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                                >
                                  <span>Visualizar</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-slate-500 text-[11px]">B3 Oficial</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4 animate-fadeIn">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Publicações Oficiais FNET da CVM / B3
                </span>

                {isLoadingDocuments ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                    <p className="text-xs">Consultando FNET CVM...</p>
                  </div>
                ) : documentsList.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center text-slate-500 text-xs">
                    Nenhum documento protocolado recentemente para este ativo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documentsList.map((doc) => (
                      <div
                        key={doc.documentIdentifier}
                        className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              {doc.documentCategoryName || 'Comunicado'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">{doc.referenceDate}</span>
                          </div>
                          <p className="text-xs font-medium text-slate-200">{doc.documentDescription}</p>
                        </div>

                        <a
                          href={doc.documentDownloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Dados oficiais B3 &bull; CVM FNET &bull; Tesouro Nacional</span>
          </div>
          <span className="text-[11px]">Pressione ESC para fechar</span>
        </div>
      </div>
    </div>
  );
};
