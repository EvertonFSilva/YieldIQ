import React, { useState } from 'react';
import { Navbar, ActiveNavigationTab } from './components/Navbar';
import { AssetExplorer } from './components/AssetExplorer';
import { TreasuryViewer } from './components/TreasuryViewer';
import { AlertRulesView } from './components/AlertRulesView';
import { ProfileSettingsView } from './components/ProfileSettingsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavigationTab>('assets');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'assets' && <AssetExplorer />}
        {activeTab === 'treasury' && <TreasuryViewer />}
        {activeTab === 'alerts' && <AlertRulesView />}
        {activeTab === 'profile' && <ProfileSettingsView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>YieldIQ Intelligence Platform &copy; {new Date().getFullYear()}</span>
          <span>FIIs, FIAGROs, FI-INFRAs e Tesouro Direto em tempo real</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
