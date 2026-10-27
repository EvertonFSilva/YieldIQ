import React from 'react';
import { X, FileText, ShieldAlert } from 'lucide-react';

interface TermsModalProperties {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProperties> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Termos de Uso</h2>
              <p className="text-xs text-slate-400">YieldIQ Intelligence Platform</p>
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
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-amber-300">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block">Isenção de Responsabilidade Financeira</span>
              <p className="text-xs">
                O YieldIQ é exclusivamente uma ferramenta tecnológica de consolidação de dados públicos e automação de alertas. As informações exibidas não representam, em nenhuma circunstância, recomendação de compra, venda, alocação ou consultoria de valores mobiliários (CVM / ANBIMA).
              </p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white pt-2">1. Natureza do Serviço</h3>
          <p>
            A plataforma agrega dados públicos disponibilizados pela B3 (Brasil, Bolsa, Balcão), CVM (Comissão de Valores Mobiliários) e Secretaria do Tesouro Nacional. Não garantimos a infalibilidade ou ausência de atrasos por parte das fontes governamentais ou entidades de custódia.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">2. Responsabilidade do Usuário</h3>
          <p>
            O usuário é integralmente responsável por suas decisões financeiras, estratégias de investimento e pela custódia de suas credenciais de acesso e chaves de API (<code className="text-emerald-400">X-API-TOKEN</code>).
          </p>

          <h3 className="text-sm font-bold text-white pt-2">3. Notificações e Disponibilidade</h3>
          <p>
            O serviço de alertas via WhatsApp é dependente da disponibilidade da rede de telecomunicações e dos protocolos de mensageria. A plataforma reserva-se o direito de aplicar limites de taxa (rate limits) e cotas por conta para preservar a estabilidade da infraestrutura.
          </p>

          <h3 className="text-sm font-bold text-white pt-2">4. Atualizações dos Termos</h3>
          <p>
            Estes termos podem ser periodicamente revisados para refletir melhorias no sistema e conformidade regulatória. O uso continuado da plataforma após modificações constitui aceitação dos novos termos.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-bold text-slate-950 transition"
          >
            Entendido e Concordo
          </button>
        </div>
      </div>
    </div>
  );
};