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
  Smartphone
} from 'lucide-react';
import { userService } from '../services/apiClient';
import { UserAccountProfile } from '../types';
import { useToast } from '../context/ToastContext';

export const ProfileSettingsView: React.FC = () => {
  const toast = useToast();
  const [userProfile, setUserProfile] = useState<UserAccountProfile | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState<boolean>(true);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
        toast.info('Alertas de WhatsApp desativados.');
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

  const handleRegenerateKey = async (): Promise<void> => {
    if (!window.confirm('Tem certeza? A chave antiga deixará de funcionar imediatamente.')) return;
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
    <div className="space-y-8 max-w-4xl animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <ShieldCheck className="h-7 w-7 text-emerald-400" />
          <span>Configurações da Conta</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Gerencie seu número de WhatsApp para alertas e credenciais de integração da API.
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
                <span className="text-[11px] font-medium text-slate-400">Conta & Usuário</span>
                <p className="mt-1 text-lg font-bold text-white truncate">{userProfile.username}</p>
                <div className="mt-1 text-xs text-slate-500 truncate">{userProfile.email}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-[11px] font-medium text-slate-400">Nível de Acesso</span>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {userProfile.role || userProfile.privilege?.toUpperCase()}
                </p>
                <div className="mt-1 text-xs text-slate-500">Privilégios da Plataforma</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">Cota de Alertas</span>
                  <Bell className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-1 text-lg font-bold text-white">
                  {userProfile.alertQuota || userProfile.ruleLimit} regras
                </p>
                <div className="mt-1 text-xs text-slate-500">Limite de monitoramento ativo</div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Notificações no WhatsApp</h2>
                <p className="text-xs text-slate-400">
                  Informe seu número com DDD (ex: 11999998888) para receber avisos instantâneos.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Número de WhatsApp
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
                  {isSaving ? 'Salvando...' : 'Salvar Telefone'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Chave de Acesso da API (X-API-TOKEN)</h2>
                <p className="text-xs text-slate-400">
                  Use esta chave para integrar com planilhas Excel, Google Sheets, bots ou rotinas Python.
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
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 pr-10 font-mono text-xs text-slate-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    title={showApiKey ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  onClick={handleCopyApiKey}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition border border-slate-700"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar Chave'}</span>
                </button>

                <button
                  onClick={handleRegenerateKey}
                  className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Gerar Nova Chave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};