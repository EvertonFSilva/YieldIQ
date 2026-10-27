import React, { useEffect, useState } from 'react';
import { Key, Phone, Check, Copy, RefreshCw } from 'lucide-react';
import { userService } from '../services/apiClient';
import { UserAccountProfile } from '../types';

export const ProfileSettingsView: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserAccountProfile | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>('');
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = () => {
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
        setFeedbackMessage({
          type: 'error',
          text: error.message || 'Falha ao carregar informações da conta'
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSavePhone = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedbackMessage(null);
    try {
      await userService.updatePhone(phoneNumberInput);
      setFeedbackMessage({ type: 'success', text: 'Número de WhatsApp atualizado com sucesso!' });
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: error.message || 'Falha ao salvar telefone' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWhatsApp = async (newVal: boolean) => {
    try {
      setIsWhatsAppEnabled(newVal);
      await userService.updateWhatsApp(newVal);
      setFeedbackMessage({
        type: 'success',
        text: newVal ? 'Alertas de WhatsApp ativados!' : 'Alertas de WhatsApp desativados.'
      });
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: 'Falha ao alterar preferência' });
    }
  };

  const handleCopyApiKey = () => {
    if (!userProfile?.apiKey) return;
    navigator.clipboard.writeText(userProfile.apiKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Tem certeza? A chave antiga deixará de funcionar imediatamente.')) return;
    try {
      const newKey = await userService.regenerateApiKey();
      if (userProfile) {
        setUserProfile({ ...userProfile, apiKey: newKey });
      }
      setFeedbackMessage({ type: 'success', text: 'Nova chave de API gerada com sucesso!' });
    } catch (error: any) {
      setFeedbackMessage({ type: 'error', text: 'Falha ao gerar nova chave de API' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Configurações da Conta</h1>
        <p className="text-sm text-slate-400">
          Gerencie suas preferências de notificação do WhatsApp e suas credenciais de integração da API.
        </p>
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

      {isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Phone className="h-5 w-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-semibold text-white">Notificações no WhatsApp</h2>
                <p className="text-xs text-slate-400">
                  Informe seu número com DDD para receber alertas diários e em tempo real.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePhone} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Número de Telefone (com DDD)
                </label>
                <input
                  type="text"
                  value={phoneNumberInput}
                  onChange={(e) => setPhoneNumberInput(e.target.value)}
                  placeholder="Ex: 11999998888"
                  className="mt-1.5 w-full sm:max-w-md rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="whatsappToggle"
                  checked={isWhatsAppEnabled}
                  onChange={(e) => handleToggleWhatsApp(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="whatsappToggle" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Habilitar envio de alertas para este número
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Telefone'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Key className="h-5 w-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-semibold text-white">Chave de Acesso da API (API Key)</h2>
                <p className="text-xs text-slate-400">
                  Use esta chave no cabeçalho <code className="text-emerald-400">X-API-TOKEN</code> para consultar dados programaticamente.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={userProfile?.apiKey || 'yieldiq_****************'}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 font-mono text-sm text-slate-300 outline-none"
                />
                <button
                  onClick={handleCopyApiKey}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={handleRegenerateKey}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
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
