import React, { useEffect, useState } from 'react';
import { Landmark, RefreshCw, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { treasuryService } from '../services/apiClient';
import { TreasuryBondItem } from '../types';

export const TreasuryViewer: React.FC = () => {
  const [bondsList, setBondsList] = useState<TreasuryBondItem[]>([]);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tesouro Direto</h1>
          <p className="text-sm text-slate-400">
            Acompanhe taxas de rentabilidade anual e preços unitários oficiais do Tesouro Nacional.
          </p>
        </div>

        <button
          onClick={fetchBonds}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Taxas</span>
        </button>
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
      ) : bondsList.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <Landmark className="mx-auto h-8 w-8 text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-300">Mercado do Tesouro Fechado ou sem dados no momento</p>
          <p className="mt-1 text-xs text-slate-500">Tente novamente durante o horário de negociação (09:30 às 18:00).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bondsList.map((bondItem) => (
            <div
              key={bondItem.bondKey || bondItem.bondName}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-slate-800 px-2.5 py-1 font-mono text-xs font-semibold text-slate-300">
                  {bondItem.indexerName || 'TESOURO'}
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  {bondItem.profitabilityRateRaw || `${bondItem.profitabilityRate.toFixed(2)}%`}
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
