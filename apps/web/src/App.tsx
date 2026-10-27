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
import { NotFoundView } from './components/NotFoundView';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavigationTab>('home');

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
      default:
        return <NotFoundView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
      <AuthModal />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 pb-24 md:pb-8 sm:px-6 lg:px-8">
        {renderActiveView()}
      </main>

      <footer className="hidden md:block border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-400">YieldIQ Intelligence Platform &copy; {new Date().getFullYear()}</span>
            <button onClick={() => setActiveTab('docs')} className="hover:text-emerald-400 transition">
              Docs da API
            </button>
            <button onClick={() => setActiveTab('assets')} className="hover:text-emerald-400 transition">
              Ativos da B3
            </button>
            <button onClick={() => setActiveTab('treasury')} className="hover:text-emerald-400 transition">
              Tesouro Direto
            </button>
          </div>
          <span className="text-slate-600">622 ativos listados &bull; 17 títulos do tesouro &bull; Notificações WhatsApp</span>
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