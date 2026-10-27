import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, Send, RefreshCw } from 'lucide-react';
import { alertService } from '../services/apiClient';
import { AlertRuleItem } from '../types';

export const AlertRulesView: React.FC = () => {
  const [rulesList, setRulesList] = useState<AlertRuleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [tickerInput, setTickerInput] = useState<string>('');
  const [variationInput, setVariationInput] = useState<string>('1.0');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [notifyDividend, setNotifyDividend] = useState<boolean>(true);
  const [notifyMaterialFact, setNotifyMaterialFact] = useState<boolean>(true);
  const [notifyReport, setNotifyReport] = useState<boolean>(true);

  const fetchRules = () => {
    setIsLoading(true);
    alertService
      .retrieveRules()
      .then((items) => {
        setRulesList(items);
        setIsLoading(false);
      })
      .catch((error) => {
        setFeedbackMessage({ type: 'error', text: error.message || 'Falha ao buscar regras de alerta' });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tickerInput.trim()) return;

    try {
      await alertService.createOrUpdateRule({
        ticker: tickerInput.trim().toUpperCase(),
        alertPriceChangePct: variationInput ? parseFloat(variationInput) : null,
        alertPriceMin: minPriceInput ? parseFloat(minPriceInput) : null,
        alertPriceMax: maxPriceInput ? parseFloat(maxPriceInput) : null,
        notifyPrice: Boolean(minPriceInput || maxPriceInput || variationInput),
        notifyDividend,
        notifyMaterialFact,
        notifyReport,
        enabled: true
      });

      setFeedbackMessage({ type: 'success', text: `Regra para ${tickerInput.toUpperCase()} salva com sucesso!` });
      setTickerInput('');
      setMinPriceInput('');
      setMaxPriceInput('');
      fetchRules();
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: error.response?.data?.error?.message || error.message });
    }
  };

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await alertService.toggleRule(ruleId, !currentEnabled);
      setRulesList((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentEnabled } : r))
      );
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: 'Falha ao alterar status da regra' });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await alertService.deleteRule(ruleId);
      setRulesList((prev) => prev.filter((r) => r.id !== ruleId));
      setFeedbackMessage({ type: 'success', text: 'Regra de alerta removida com sucesso' });
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: 'Falha ao excluir regra de alerta' });
    }
  };

  const handleSendTestMessage = async () => {
    setIsSendingTestAlert(true);
    setFeedbackMessage(null);
    try {
      await alertService.sendTestAlert();
      setFeedbackMessage({ type: 'success', text: 'Mensagem de teste enviada para seu WhatsApp!' });
    } catch (error: any) {
      setFeedbackMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Falha ao enviar mensagem de teste'
      });
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Central de Alertas no WhatsApp</h1>
          <p className="text-sm text-slate-400">
            Receba notificações automáticas de variação de preço, anúncios de proventos e fatos relevantes direto no seu WhatsApp.
          </p>
        </div>

        <button
          onClick={handleSendTestMessage}
          disabled={isSendingTestAlert}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <Send className={`h-4 w-4 ${isSendingTestAlert ? 'animate-pulse' : ''}`} />
          <span>Enviar Teste no WhatsApp</span>
        </button>
      </div>

      {feedbackMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm ${
            feedbackMessage.type === 'success'
              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Plus className="h-5 w-5 text-emerald-400" />
          <span>Nova Regra de Alerta por Ativo</span>
        </h2>

        <form onSubmit={handleCreateRule} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">Ticker do Ativo *</label>
            <input
              type="text"
              required
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="Ex: HGLG11"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white uppercase placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">Degrau de Variação Diária (%)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={variationInput}
              onChange={(e) => setVariationInput(e.target.value)}
              placeholder="Ex: 1.0 (avisa a cada 1%, 2%...)"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">Preço Mínimo (Piso)</label>
            <input
              type="number"
              step="0.01"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              placeholder="R$ 0,00"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">Preço Máximo (Teto)</label>
            <input
              type="number"
              step="0.01"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              placeholder="R$ 0,00"
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyDividend}
                onChange={(e) => setNotifyDividend(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Avisar Novos Proventos (B3)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyMaterialFact}
                onChange={(e) => setNotifyMaterialFact(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Avisar Fatos Relevantes (CVM)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyReport}
                onChange={(e) => setNotifyReport(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Avisar Relatórios Gerenciais</span>
            </label>
          </div>

          <div className="flex items-end justify-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Adicionar Alerta
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-base font-semibold text-white mb-4">Regras Ativas ({rulesList.length})</h2>

        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
          </div>
        ) : rulesList.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
            Nenhuma regra cadastrada. Adicione seu primeiro alerta acima para começar a receber atualizações.
          </div>
        ) : (
          <div className="space-y-3">
            {rulesList.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-emerald-500/10 px-3 py-1 font-mono text-base font-bold text-emerald-400 border border-emerald-500/20">
                    {rule.ticker}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {rule.alertPriceChangePct && (
                      <span className="rounded bg-slate-800 px-2 py-0.5">
                        Degrau: ±{rule.alertPriceChangePct.toFixed(1)}%
                      </span>
                    )}
                    {rule.alertPriceMin && (
                      <span className="rounded bg-slate-800 px-2 py-0.5">
                        Piso: R$ {rule.alertPriceMin.toFixed(2)}
                      </span>
                    )}
                    {rule.alertPriceMax && (
                      <span className="rounded bg-slate-800 px-2 py-0.5">
                        Teto: R$ {rule.alertPriceMax.toFixed(2)}
                      </span>
                    )}
                    {rule.notifyDividend && (
                      <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5">
                        Proventos
                      </span>
                    )}
                    {rule.notifyMaterialFact && (
                      <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-0.5">
                        Fatos Relevantes
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      rule.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {rule.enabled ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Ligado</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Desligado</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
