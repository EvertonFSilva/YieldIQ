import React from 'react';
import { Bell, Compass, Landmark, User } from 'lucide-react';
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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size={36} showWordmark={true} />

          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('assets')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeTab === 'assets'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Explorador</span>
            </button>

            <button
              onClick={() => onSelectTab('treasury')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeTab === 'treasury'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span>Tesouro Direto</span>
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeTab === 'alerts'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Alertas WhatsApp</span>
            </button>

            <button
              onClick={() => onSelectTab('profile')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeTab === 'profile'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Configurações</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  isWhatsAppActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium hidden sm:inline">
                {isWhatsAppActive ? 'WhatsApp Ativo' : 'WhatsApp Desconectado'}
              </span>
              <span className="text-slate-300 font-medium sm:hidden">Online</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => onSelectTab('assets')}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
            activeTab === 'assets' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span>Ativos</span>
        </button>

        <button
          onClick={() => onSelectTab('treasury')}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
            activeTab === 'treasury' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="h-5 w-5" />
          <span>Tesouro</span>
        </button>

        <button
          onClick={() => onSelectTab('alerts')}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
            activeTab === 'alerts' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="h-5 w-5" />
          <span>Alertas</span>
        </button>

        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
            activeTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="h-5 w-5" />
          <span>Perfil</span>
        </button>
      </nav>
    </>
  );
};
