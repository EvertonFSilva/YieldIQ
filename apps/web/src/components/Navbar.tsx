import React from 'react';
import { Activity, Bell, Compass, Landmark, User } from 'lucide-react';
import { Logo } from './Logo';

export type ActiveNavigationTab = 'assets' | 'treasury' | 'alerts' | 'profile';

interface NavbarProperties {
  activeTab: ActiveNavigationTab;
  onSelectTab: (selectedTab: ActiveNavigationTab) => void;
  isWhatsAppActive?: boolean;
}

export const Navbar: React.FC<NavbarProperties> = ({
  activeTab,
  onSelectTab,
  isWhatsAppActive = true
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size={38} showWordmark={true} />

        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('assets')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'assets'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Explorador de Ativos</span>
          </button>

          <button
            onClick={() => onSelectTab('treasury')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'treasury'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Tesouro Direto</span>
          </button>

          <button
            onClick={() => onSelectTab('alerts')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'alerts'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Regras de Alerta</span>
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isWhatsAppActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              {isWhatsAppActive ? 'WhatsApp Ativo' : 'WhatsApp Conectando'}
            </span>
            <Activity className="h-3 w-3 text-slate-500" />
          </div>
        </div>
      </div>
    </header>
  );
};
