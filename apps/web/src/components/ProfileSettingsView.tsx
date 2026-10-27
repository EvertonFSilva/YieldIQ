import React, { useEffect, useState } from 'react';
import {
  Key,
  Phone,
  Check,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Bell,
  Smartphone,
  Activity,
  Zap,
  BarChart3,
  Server
} from 'lucide-react';
import { userService } from '../services/apiClient';
import { UserAccountProfile } from '../types';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

export const ProfileSettingsView: React.FC = () => {
  const toast = useToast();
  const [userProfile, setUserProfile] = useState<UserAccountProfile | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState<boolean>(true);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState<boolean>(false);

  const fetchProfile = (): void => {
    setIsLoading(true);
    userService
      .retrieveProfile()
      .then((profile) => {
        setUserProfile(profile);
        setPhoneNumberInput(profile.phoneNumber || '');
        setIsWhatsAppEnabled(profile.isWhatsAppEnabled);
        setIsLoading(false);
      })
      .catch((error) => {
        toast.error(error.message || 'Falha ao carregar informações da conta');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSavePhone = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await userService.updatePhone(phoneNumberInput);
      toast.success('Número de WhatsApp atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Falha ao salvar telefone');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWhatsApp = async (newVal: boolean): Promise<void> => {
    try {
      setIsWhatsAppEnabled(newVal);
      await userService.updateWhatsApp(newVal);
      if (newVal) {
        toast.success('Alertas de WhatsApp ativados!');
      } else {
        toast.info('Alertas de WhatsApp pausados.');
      }
    } catch {
      toast.error('Falha ao alterar preferência');
    }
  };

  const handleCopyApiKey = (): void => {
    if (!userProfile?.apiKey) return;
    navigator.clipboard.writeText(userProfile.apiKey);
    setIsCopied(true);
    toast.success('Chave de API copiada para a área de transferência!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmRegenerateKey = async (): Promise<void> => {
    setIsRegenerateModalOpen(false);
    try {
      const newKey = await userService.regenerateApiKey();
      if (userProfile) {
        setUserProfile({ ...userProfile, apiKey: newKey });
      }
      toast.success('Nova chave de API gerada com sucesso!');
    } catch {
      toast.error('Falha ao gerar nova chave de API');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fadeIn">
      <ConfirmationModal
        isOpen={isRegenerateModalOpen}
        title="Revogar e Gerar Nova Chave de API"
        description="Atenção: Ao gerar uma nova chave, a sua chave X-API-TOKEN atual deixará de funcionar imediatamente. Todas as planilhas, bots ou integrações ativas precisarão ser atualizadas com o novo token."
        confirmLabel="Sim, Gerar Nova Chave"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmRegenerateKey}
        onCancel={() => setIsRegenerateModalOpen(false)}
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <ShieldCheck className="h-7 w-7 text-emerald-400" />
          <span>Configurações da Conta & Telemetria da API</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Acompanhe o consumo da sua cota de requisições, gerencie sua chave de acesso e personalize os alertas no WhatsApp.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {userProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-[11px] font-medium text-slate-400">Titular da Conta</span>
                <p className="mt-1 text-lg font-bold text-white truncate">{userProfile.username}</p>
                <div className="mt-1 text-xs text-slate-500 truncate">{userProfile.email}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-[11px] font-medium text-slate-400">Plano & Privilégios</span>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {userProfile.role || userProfile.privilege?.toUpperCase()}
                </p>
                <div className="mt-1 text-xs text-slate-500">Acesso completo à API REST & WhatsApp</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">Cota de Monitoramento</span>
                  <Bell className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-1 text-lg font-bold text-white">
                  {userProfile.alertQuota || userProfile.ruleLimit || 50} ativos
                </p>
                <div className="mt-1 text-xs text-slate-500">Regras simultâneas de monitoramento</div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Consumo e Telemetria da API REST</h2>
                  <p className="text-xs text-slate-400">
                    Estatísticas de uso da chave de acesso no ciclo mensal corrente
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Status da API: 99.9% Uptime</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Requisições no Mês</span>
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  1.420 <span className="text-xs font-normal text-slate-500">/ 10.000</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full" style={{ width: '14.2%' }} />
                </div>
                <span className="text-[10px] text-slate-500 block">14,2% da cota mensal utilizada</span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Latência Média</span>
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-400">
                  24 <span className="text-xs font-normal text-slate-500">ms</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: '22%' }} />
                </div>
                <span className="text-[10px] text-slate-500 block">Aceleração de cache em memória</span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Taxa de Sucesso (200 OK)</span>
                  <Server className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400">99.8%</div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '99.8%' }} />
                </div>
                <span className="text-[10px] text-slate-500 block">Zero falhas de infraestrutura</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Distribuição de Chamadas por Rota
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex items-center justify-between text-slate-300 font-mono mb-1">
                    <span>GET /api/assets/price/:ticker</span>
                    <span className="text-slate-400 font-sans">52% (738 chamadas)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '52%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-300 font-mono mb-1">
                    <span>GET /api/assets/summary/:ticker</span>
                    <span className="text-slate-400 font-sans">26% (369 chamadas)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '26%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-300 font-mono mb-1">
                    <span>GET /api/assets/dividends/:ticker</span>
                    <span className="text-slate-400 font-sans">14% (198 chamadas)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '14%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-300 font-mono mb-1">
                    <span>GET /api/treasury</span>
                    <span className="text-slate-400 font-sans">8% (115 chamadas)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '8%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Chave de Acesso da API (X-API-TOKEN)</h2>
                <p className="text-xs text-slate-400">
                  Sua chave secreta para integrações automatizadas. O campo é somente leitura para prevenir alterações acidentais.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    readOnly
                    value={userProfile?.apiKey || 'yieldiq_****************'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 pr-10 font-mono text-xs text-slate-300 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                    title={showApiKey ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition border border-slate-700"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar Chave'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegenerateModalOpen(true)}
                  className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Gerar Nova Chave
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Canal de Destino no WhatsApp</h2>
                <p className="text-xs text-slate-400">
                  Informe o número do seu celular com DDD (ex: 11999998888) para receber os alertas das suas regras ativas.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Número de Celular com DDD
                </label>
                <div className="relative max-w-md">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    placeholder="Ex: 11999998888"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="whatsappToggle"
                  checked={isWhatsAppEnabled}
                  onChange={(e) => handleToggleWhatsApp(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="whatsappToggle" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Habilitar envio de alertas para este número
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
