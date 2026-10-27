import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Send,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { alertService } from '../services/apiClient';
import { AlertRuleItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CustomSwitch } from './common/CustomSwitch';
import { AssetAutocompleteInput } from './common/AssetAutocompleteInput';

export const AlertRulesView: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const toast = useToast();
  const [rulesList, setRulesList] = useState<AlertRuleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState<boolean>(false);

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

  if (!currentUser) {
    return (
      <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-8 sm:p-12 text-center space-y-8 shadow-2xl">
          <div className="inline-flex rounded-2xl bg-emerald-500/10 p-4 text-emerald-400 border border-emerald-500/20 mx-auto">
            <Bell className="h-10 w-10" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Alertas Automatizados no seu WhatsApp
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Receba avisos instantâneos no momento exato em que um ativo anunciar dividendos na B3, publicar fatos relevantes na CVM ou cruzar seus limites de preço.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-2">
              <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
                Proventos na Data Com
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aviso imediato do valor por cota, data de corte e data de liquidação oficial na B3.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-2">
              <span className="text-xs font-bold text-teal-400 block uppercase tracking-wider">
                Fatos Relevantes CVM
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Resumos executivos e protocolos FNet com link direto para os documentos originais.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-2">
              <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
                Piso & Teto de Preço
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Disparos inteligentes quando a cotação oscilar além do degrau ou atingir seu alvo.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-xs font-bold text-slate-950 hover:brightness-110 transition shadow-lg shadow-emerald-500/20"
            >
              <span>Entrar na Minha Conta</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-8 py-3.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Criar Conta Gratuita</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-emerald-400" />
            <span>Central de Alertas no WhatsApp</span>
          </h1>
          <p className="text-sm text-slate-400">
            Cadastre regras inteligentes por ativo para receber avisos de proventos, oscilações e comunicados no seu celular.
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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Plus className="h-5 w-5 text-emerald-400" />
          <span>Nova Regra de Alerta por Ativo</span>
        </h2>

        <form onSubmit={handleCreateRule} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Código do Ativo (B3) *</label>
            <AssetAutocompleteInput
              value={assetInput}
              onChange={setAssetInput}
              onSelect={(asset) => setAssetInput(asset.ticker)}
              placeholder="Ex: MXRF11, HGLG11"
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white uppercase placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Preço Mínimo (Piso)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="99999"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              placeholder="R$ 0,00"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Preço Máximo (Teto)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="99999"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              placeholder="R$ 0,00"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Degrau de Variação (%)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={variationInput}
              onChange={(e) => setVariationInput(e.target.value)}
              placeholder="Ex: 1.0 (a cada 1%)"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-6 pt-2">
            <CustomSwitch
              checked={notifyDividend}
              onChange={setNotifyDividend}
              label="Novos Proventos (B3)"
              description="Avisar no anúncio da Data Com"
            />

            <CustomSwitch
              checked={notifyMaterialFact}
              onChange={setNotifyMaterialFact}
              label="Fatos Relevantes (CVM)"
              description="Comunicados oficiais"
            />

            <CustomSwitch
              checked={notifyReport}
              onChange={setNotifyReport}
              label="Relatórios Gerenciais"
              description="Publicações FNET"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1 flex items-end justify-end pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Salvar Regra de Alerta
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Minhas Regras de Monitoramento ({rulesList.length})</h2>

        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
          </div>
        ) : rulesList.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-500 text-xs space-y-2">
            <Bell className="mx-auto h-8 w-8 text-slate-600" />
            <p className="font-semibold text-slate-300">Nenhuma regra cadastrada</p>
            <p className="text-slate-500">Adicione seu primeiro ativo no formulário acima para começar a receber alertas no WhatsApp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rulesList.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:bg-slate-900"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-sm font-bold text-emerald-400 border border-emerald-500/20">
                      {rule.ticker}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        rule.enabled
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rule.enabled ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
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
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      rule.enabled
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'border border-slate-800 bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {rule.enabled ? 'Pausar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    aria-label="Excluir regra"
                    className="rounded-xl p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
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
