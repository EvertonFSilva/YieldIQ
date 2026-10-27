import React from 'react';
import { Bell, Compass, Landmark, User, Home, BookOpen, ShieldAlert, LogOut, LogIn } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

export type ActiveNavigationTab = 'home' | 'assets' | 'treasury' | 'alerts' | 'docs' | 'admin' | 'profile';

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
  const { currentUser, openAuthModal, logout } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRATOR' || (currentUser as any)?.privilege === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onSelectTab('home')}>
            <Logo size={36} showWordmark={true} />
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeTab === 'home'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </button>

            <button
              onClick={() => onSelectTab('assets')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeTab === 'assets'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Ativos</span>
            </button>

            <button
              onClick={() => onSelectTab('treasury')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeTab === 'treasury'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span>Tesouro</span>
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeTab === 'alerts'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Alertas</span>
            </button>

            <button
              onClick={() => onSelectTab('docs')}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeTab === 'docs'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Docs API</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  activeTab === 'admin'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-purple-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  isWhatsAppActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {isWhatsAppActive ? 'WhatsApp Ativo' : 'WhatsApp Desconectado'}
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('profile')}
                  className={`flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium transition hover:border-slate-700 ${
                    activeTab === 'profile' ? 'border-emerald-500/40 text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="max-w-[100px] truncate">{currentUser.username}</span>
                </button>

                <button
                  onClick={logout}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
                  title="Sair da Conta"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-95 transition shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
            activeTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Início</span>
        </button>

        <button
          onClick={() => onSelectTab('assets')}
          className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
            activeTab === 'assets' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span>Ativos</span>
        </button>

        <button
          onClick={() => onSelectTab('treasury')}
          className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
            activeTab === 'treasury' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="h-5 w-5" />
          <span>Tesouro</span>
        </button>

        <button
          onClick={() => onSelectTab('alerts')}
          className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
            activeTab === 'alerts' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="h-5 w-5" />
          <span>Alertas</span>
        </button>

        {isAdmin ? (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
              activeTab === 'admin' ? 'text-purple-400 font-bold' : 'text-purple-300 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-5 w-5" />
            <span>Admin</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('docs')}
            className={`flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
              activeTab === 'docs' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>Docs</span>
          </button>
        )}
      </nav>
    </>
  );
};