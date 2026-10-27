import React from 'react';
import { X, ShieldCheck, Lock } from 'lucide-react';

interface PrivacyModalProperties {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProperties> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-500/10 p-2 text-teal-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Política de Privacidade</h2>
              <p className="text-xs text-slate-400">Em conformidade com a LGPD (Lei Geral de Proteção de Dados)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 flex items-start gap-3 text-teal-300">
            <Lock className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block">Compromisso com a Privacidade</span>
              <p className="text-xs">
                O YieldIQ não comercializa, não aluga e não compartilha seus dados cadastrais, números de telefone ou hábitos de consulta com terceiros para fins publicitários.
              </p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white pt-2">1. Dados Coletados</h3>
          <p>
            Coletamos apenas as informações essenciais para a execução do serviço: endereço de e-mail, nome de usuário, número de telefone para envio de alertas WhatsApp e parâmetros das regras configuradas pelo próprio titular.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">2. Finalidade do Tratamento</h3>
          <p>
            Os dados são utilizados unicamente para autenticar o acesso às contas, enviar as notificações de proventos e cotações solicitadas pelo usuário e gerar telemetria de desempenho das APIs.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">3. Segurança da Informação</h3>
          <p>
            Todas as senhas são criptografadas com hashing unidirecional. A comunicação cliente-servidor é protegida por criptografia TLS/HTTPS e os tokens de sessão utilizam padrões criptográficos JWT.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">4. Direitos do Titular</h3>
          <p>
            Em conformidade com a LGPD, o titular tem direito a consultar, atualizar, desativar o recebimento de mensagens e solicitar a exclusão de seus dados a qualquer momento pelo painel de configurações.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-teal-500 hover:bg-teal-400 px-5 py-2 text-xs font-bold text-slate-950 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};