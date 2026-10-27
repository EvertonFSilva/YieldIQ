import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Bell,
  Wifi,
  Battery,
  Signal,
  CheckCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { alertService } from '../services/apiClient';
import { AlertRuleItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type PreviewMessageType = 'dividend' | 'price' | 'report';

export const AlertRulesView: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const toast = useToast();
  const [rulesList, setRulesList] = useState<AlertRuleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState<boolean>(false);
  const [selectedPreviewType, setSelectedPreviewType] = useState<PreviewMessageType>('dividend');

  const [assetInput, setAssetInput] = useState<string>('');
  const [variationInput, setVariationInput] = useState<string>('1.0');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [notifyDividend, setNotifyDividend] = useState<boolean>(true);
  const [notifyMaterialFact, setNotifyMaterialFact] = useState<boolean>(true);
  const [notifyReport, setNotifyReport] = useState<boolean>(true);

  const fetchRules = () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    alertService
      .retrieveRules()
      .then((items) => {
        setRulesList(items);
        setIsLoading(false);
      })
      .catch((error) => {
        toast.error(error.message || 'Falha ao buscar regras de alerta');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchRules();
  }, [currentUser]);

  const handleCreateRule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assetInput.trim()) return;

    try {
      await alertService.createOrUpdateRule({
        ticker: assetInput.trim().toUpperCase(),
        alertPriceChangePct: variationInput ? parseFloat(variationInput) : null,
        alertPriceMin: minPriceInput ? parseFloat(minPriceInput) : null,
        alertPriceMax: maxPriceInput ? parseFloat(maxPriceInput) : null,
        notifyPrice: Boolean(minPriceInput || maxPriceInput || variationInput),
        notifyDividend,
        notifyMaterialFact,
        notifyReport,
        enabled: true
      });

      toast.success(`Regra para o ativo ${assetInput.toUpperCase()} salva com sucesso!`);
      setAssetInput('');
      setMinPriceInput('');
      setMaxPriceInput('');
      fetchRules();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || error.message);
    }
  };

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await alertService.toggleRule(ruleId, !currentEnabled);
      setRulesList((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentEnabled } : r))
      );
      toast.info(!currentEnabled ? 'Alerta ativado' : 'Alerta pausado');
    } catch {
      toast.error('Falha ao alterar status da regra');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await alertService.deleteRule(ruleId);
      setRulesList((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success('Regra de alerta removida com sucesso');
    } catch {
      toast.error('Falha ao excluir regra de alerta');
    }
  };

  const handleSendTestMessage = async () => {
    setIsSendingTestAlert(true);
    try {
      await alertService.sendTestAlert();
      toast.success('Mensagem de teste enviada com sucesso para seu WhatsApp!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || error.message);
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const renderSmartphoneMockup = () => (
    <div className="relative mx-auto w-full max-w-[320px] rounded-[42px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl shadow-emerald-950/20 ring-1 ring-slate-800">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-1.5 z-20">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800" />
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
      </div>

      <div className="overflow-hidden rounded-[32px] bg-[#0b141a] text-slate-100 flex flex-col h-[520px] border border-slate-900">
        <div className="bg-[#1f2c34] px-4 pt-6 pb-2.5 flex items-center justify-between text-[11px] text-slate-300 select-none">
          <span className="font-semibold text-xs">09:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-b border-slate-800/80 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center font-bold text-slate-950 text-xs shadow">
              YQ
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1f2c34]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs text-white">YieldIQ Alertas</span>
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-400 block font-medium">online</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-3 flex flex-col justify-end space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden">
          <div className="self-center rounded-lg bg-[#182229] px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider shadow">
            Hoje
          </div>

          <div className="transition-all duration-300 ease-in-out transform">
            {selectedPreviewType === 'dividend' && (
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#005c4b] p-3 text-xs text-white shadow-lg space-y-1.5 animate-fadeIn">
                <div className="font-bold text-[11px] text-emerald-200 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-amber-300" />
                  <span>Provento Anunciado &bull; MXRF11</span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-100">
                  <p><span className="font-semibold text-emerald-200">Ativo:</span> MAXI RENDA FII</p>
                  <p><span className="font-semibold text-emerald-200">Valor por Cota:</span> R$ 0,09</p>
                  <p><span className="font-semibold text-emerald-200">Data Com:</span> 15/10/2026</p>
                  <p><span className="font-semibold text-emerald-200">Pagamento:</span> 24/10/2026</p>
                  <p><span className="font-semibold text-emerald-200">DY Estimado:</span> 0,98% no mês</p>
                </div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-300/80 pt-1">
                  <span>09:41</span>
                  <CheckCheck className="h-3 w-3 text-cyan-300" />
                </div>
              </div>
            )}

            {selectedPreviewType === 'price' && (
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#005c4b] p-3 text-xs text-white shadow-lg space-y-1.5 animate-fadeIn">
                <div className="font-bold text-[11px] text-emerald-200 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Variação de Preço &bull; HGLG11</span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-100">
                  <p><span className="font-semibold text-emerald-200">Ativo:</span> CSHG LOGÍSTICA</p>
                  <p><span className="font-semibold text-emerald-200">Cotação Atual:</span> R$ 151,70</p>
                  <p><span className="font-semibold text-emerald-200">Oscilação Diária:</span> +0,33%</p>
                  <p><span className="font-semibold text-emerald-200">Preço Teto Alvo:</span> R$ 150,00</p>
                </div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-300/80 pt-1">
                  <span>09:41</span>
                  <CheckCheck className="h-3 w-3 text-cyan-300" />
                </div>
              </div>
            )}

            {selectedPreviewType === 'report' && (
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#005c4b] p-3 text-xs text-white shadow-lg space-y-1.5 animate-fadeIn">
                <div className="font-bold text-[11px] text-emerald-200 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-300" />
                  <span>Fato Relevante CVM &bull; CPTS11</span>
                </div>
                <div className="text-[11px] leading-relaxed text-slate-100">
                  <p><span className="font-semibold text-emerald-200">Ativo:</span> CAPITÂNIA SECURITIES</p>
                  <p><span className="font-semibold text-emerald-200">Categoria:</span> Relatório Mensal</p>
                  <p><span className="font-semibold text-emerald-200">Publicado:</span> Protocolo FNET 894123</p>
                </div>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-300/80 pt-1">
                  <span>09:41</span>
                  <CheckCheck className="h-3 w-3 text-cyan-300" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-slate-800">
          <div className="flex-1 rounded-full bg-[#2a3942] px-3 py-1.5 text-[11px] text-slate-400">
            Mensagem
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
            ▶
          </div>
        </div>
      </div>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-8 sm:p-12">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="h-8 w-8" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Alertas Instantâneos no seu WhatsApp
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Receba notificações automáticas no momento exato em que um ativo anunciar dividendos na B3, publicar fatos relevantes na CVM ou cruzar seus limites de preço.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-1">
                <span className="text-xs font-bold text-emerald-400 block">Proventos Data Com</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Aviso imediato do valor por cota e data de liquidação.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-1">
                <span className="text-xs font-bold text-teal-400 block">Fatos CVM</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Resumos executivos e links oficiais de comunicados.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-1">
                <span className="text-xs font-bold text-amber-400 block">Piso & Teto</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Disparos inteligentes quando a cotação atingir seus alvos.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-xs font-bold text-slate-950 hover:brightness-110 transition shadow-lg shadow-emerald-500/20"
              >
                <span>Entrar na Minha Conta</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => openAuthModal('register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Criar Conta Gratuita</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedPreviewType('dividend')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  selectedPreviewType === 'dividend' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Proventos
              </button>
              <button
                onClick={() => setSelectedPreviewType('price')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  selectedPreviewType === 'price' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cotações
              </button>
              <button
                onClick={() => setSelectedPreviewType('report')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  selectedPreviewType === 'report' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                CVM FNET
              </button>
            </div>

            {renderSmartphoneMockup()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Smartphone className="h-6 w-6 text-emerald-400" />
            <span>Central de Alertas no WhatsApp</span>
          </h1>
          <p className="text-sm text-slate-400">
            Cadastre regras inteligentes por ativo para receber avisos de proventos, oscilações e comunicados no seu WhatsApp.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Plus className="h-5 w-5 text-emerald-400" />
              <span>Nova Regra de Alerta por Ativo</span>
            </h2>

            <form onSubmit={handleCreateRule} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Código do Ativo (B3) *</label>
                <input
                  type="text"
                  required
                  value={assetInput}
                  onChange={(e) => setAssetInput(e.target.value)}
                  placeholder="Ex: MXRF11, HGLG11, KNCA11, JURO11"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white uppercase placeholder-slate-600 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Preço Mínimo (Piso)</label>
                <input
                  type="number"
                  step="0.01"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Preço Máximo (Teto)</label>
                <input
                  type="number"
                  step="0.01"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Degrau de Variação Diária (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={variationInput}
                  onChange={(e) => setVariationInput(e.target.value)}
                  placeholder="Ex: 1.0 (avisa a cada 1%, 2%...)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
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

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
                >
                  Salvar Regra de Alerta
                </button>
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-4">Minhas Regras de Monitoramento ({rulesList.length})</h2>

            {isLoading ? (
              <div className="flex justify-center py-12 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
              </div>
            ) : rulesList.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 text-xs">
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
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Pausado</span>
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

        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedPreviewType('dividend')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                selectedPreviewType === 'dividend' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Proventos
            </button>
            <button
              onClick={() => setSelectedPreviewType('price')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                selectedPreviewType === 'price' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cotações
            </button>
            <button
              onClick={() => setSelectedPreviewType('report')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                selectedPreviewType === 'report' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              CVM FNET
            </button>
          </div>

          {renderSmartphoneMockup()}
        </div>
      </div>
    </div>
  );
};
