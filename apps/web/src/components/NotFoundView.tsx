import React from 'react';
import { Compass, Home, HelpCircle } from 'lucide-react';
import { ActiveNavigationTab } from './Navbar';

interface NotFoundViewProperties {
  onNavigate: (tab: ActiveNavigationTab) => void;
}

export const NotFoundView: React.FC<NotFoundViewProperties> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fadeIn">
      <div className="inline-flex rounded-3xl bg-emerald-500/10 p-5 text-emerald-400 border border-emerald-500/20">
        <HelpCircle className="h-12 w-12" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
          Erro 404 &bull; Página Não Encontrada
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Conteúdo não localizado</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          O recurso que você tentou acessar não existe ou foi movido. Navegue pelas seções disponíveis no menu superior.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition"
        >
          <Home className="h-4 w-4" />
          <span>Ir para Início</span>
        </button>

        <button
          onClick={() => onNavigate('assets')}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white transition"
        >
          <Compass className="h-4 w-4 text-emerald-400" />
          <span>Explorar Ativos</span>
        </button>
      </div>
    </div>
  );
};