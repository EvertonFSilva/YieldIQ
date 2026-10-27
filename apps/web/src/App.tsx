import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/AuthModal';
import { Navbar, ActiveNavigationTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { AssetExplorer } from './components/AssetExplorer';
import { TreasuryViewer } from './components/TreasuryViewer';
import { AlertRulesView } from './components/AlertRulesView';
import { ApiDocsView } from './components/ApiDocsView';
import { AdminView } from './components/AdminView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { ToolsView } from './components/ToolsView';
import { NotFoundView } from './components/NotFoundView';
import { TermsModal } from './components/TermsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { Logo } from './components/Logo';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavigationTab>('home');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onSelectTab={setActiveTab} />;
      case 'assets':
        return <AssetExplorer />;
      case 'treasury':
        return <TreasuryViewer />;
      case 'alerts':
        return <AlertRulesView />;
      case 'docs':
        return <ApiDocsView />;
      case 'admin':
        return <AdminView />;
      case 'profile':
        return <ProfileSettingsView />;
      case 'tools':
        return <ToolsView />;
      default:
        return <NotFoundView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
      <AuthModal />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 pb-24 md:pb-12 sm:px-6 lg:px-8">
        {renderActiveView()}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/95 text-xs text-slate-400 pt-12 pb-24 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Logo size={32} showWordmark={true} />
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Plataforma de inteligência de dados de mercado para FIIs, FIAGROs, FI-INFRAs e Tesouro Direto. Notificações automáticas no WhatsApp e API REST de alta velocidade para investidores, planilhas e desenvolvedores.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Plataforma Online &bull; Dados em Tempo Real</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navegação</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setActiveTab('home')} className="hover:text-emerald-400 transition">
                    Página Inicial
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('assets')} className="hover:text-emerald-400 transition">
                    Ativos da B3 (622)
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('treasury')} className="hover:text-emerald-400 transition">
                    Tesouro Direto
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('alerts')} className="hover:text-emerald-400 transition">
                    Alertas no WhatsApp
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('tools')} className="hover:text-emerald-400 transition">
                    Ferramentas & Simuladores
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Desenvolvedores</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setActiveTab('docs')} className="hover:text-emerald-400 transition">
                    Documentação da API REST
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('docs')} className="hover:text-emerald-400 transition">
                    Integração Google Sheets
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('docs')} className="hover:text-emerald-400 transition">
                    Integração Excel Power Query
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('docs')} className="hover:text-emerald-400 transition">
                    Formato XML & JSON
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal & Privacidade</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-emerald-400 transition text-left">
                    Termos de Uso
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-emerald-400 transition text-left">
                    Política de Privacidade (LGPD)
                  </button>
                </li>
                <li>
                  <span className="text-slate-500 block">Isenção CVM nº 20/2021</span>
                </li>
                <li>
                  <a href="mailto:suporte@yieldiq.com.br" className="hover:text-emerald-400 transition block">
                    suporte@yieldiq.com.br
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex items-start gap-3 text-[11px] text-slate-400 leading-relaxed">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300">Aviso Regulatório:</strong> O YieldIQ é uma ferramenta exclusivamente tecnológica de consolidação de dados públicos disponibilizados pela B3 e pelo Tesouro Nacional. O conteúdo exibido não constitui, sob qualquer hipótese, recomendação de compra, venda, alocação de valores mobiliários ou assessoria financeira de investimentos. Rentabilidade passada não representa garantia de rentabilidade futura.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span>YieldIQ Intelligence Platform &copy; {new Date().getFullYear()}</span>
              <span>&bull;</span>
              <span>Todos os direitos reservados</span>
            </div>

            <div className="flex items-center gap-4">
              <span>622 ativos B3 cadastrados</span>
              <span>&bull;</span>
              <span>17 títulos públicos do Tesouro</span>
              <span>&bull;</span>
              <span>Disparos WhatsApp Instantâneos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
