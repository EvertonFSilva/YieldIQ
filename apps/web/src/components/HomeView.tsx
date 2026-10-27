import React from 'react';
import {
  Compass,
  Landmark,
  Bell,
  Code,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Smartphone,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { ActiveNavigationTab } from './Navbar';
import { useAuth } from '../context/AuthContext';

interface HomeViewProperties {
  onSelectTab: (selectedTab: ActiveNavigationTab) => void;
}

export const HomeView: React.FC<HomeViewProperties> = ({ onSelectTab }) => {
  const { currentUser, openAuthModal } = useAuth();

  const platformHighlights = [
    {
      ticker: 'MXRF11',
      name: 'Maxi Renda FII',
      type: 'FII',
      segment: 'Papel / CRI',
      lastPrice: 'R$ 9,11',
      yieldPct: '12,95% a.a.'
    },
    {
      ticker: 'HGLG11',
      name: 'CSHG Logística FII',
      type: 'FII',
      segment: 'Logística',
      lastPrice: 'R$ 151,70',
      yieldPct: '8,85% a.a.'
    },
    {
      ticker: 'XPML11',
      name: 'XP Malls FII',
      type: 'FII',
      segment: 'Shopping Centers',
      lastPrice: 'R$ 102,40',
      yieldPct: '9,20% a.a.'
    },
    {
      ticker: 'KNCA11',
      name: 'Kinea Crédito Agro',
      type: 'FIAGRO',
      segment: 'Crédito Agro',
      lastPrice: 'R$ 100,50',
      yieldPct: '13,10% a.a.'
    },
    {
      ticker: 'JURO11',
      name: 'Sparta Infra FIC FI-Infra',
      type: 'FI_INFRA',
      segment: 'Infraestrutura',
      lastPrice: 'R$ 102,80',
      yieldPct: '13,90% a.a.'
    }
  ];

  return (
    <div className="space-y-16 animate-fadeIn">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950 p-8 sm:p-12 lg:p-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            <span>YieldIQ 2.0 &bull; Inteligência para Renda Passiva</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Monitore <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">FIIs, FIAGROs, FI-INFRAs</span> e o Tesouro em Tempo Real
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Acompanhe cotações instantâneas, dividendos históricos da B3, fatos relevantes FNET CVM, taxas do Tesouro Direto e configure alertas automatizados direto no seu WhatsApp.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onSelectTab('assets')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition"
            >
              <Compass className="h-4 w-4" />
              <span>Explorar 620+ Ativos</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onSelectTab('treasury')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 hover:border-slate-600 transition"
            >
              <Landmark className="h-4 w-4 text-emerald-400" />
              <span>Ver Tesouro Direto</span>
            </button>

            {!currentUser ? (
              <button
                onClick={() => openAuthModal('register')}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <Bell className="h-4 w-4" />
                <span>Ativar Alertas WhatsApp</span>
              </button>
            ) : (
              <button
                onClick={() => onSelectTab('alerts')}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <Bell className="h-4 w-4" />
                <span>Meus Alertas</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Database className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Ativos Monitorados</span>
          </div>
          <div className="text-3xl font-extrabold text-white">622</div>
          <p className="text-xs text-slate-400 mt-1">531 FIIs &bull; 50 FIAGROs &bull; 41 FI-INFRAs</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-teal-400 mb-2">
            <Landmark className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Tesouro Direto</span>
          </div>
          <div className="text-3xl font-extrabold text-white">17</div>
          <p className="text-xs text-slate-400 mt-1">Selic, IPCA+, Prefixados, Renda+, Educa+</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <Zap className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Latência de Cache</span>
          </div>
          <div className="text-3xl font-extrabold text-white">&lt; 15 ms</div>
          <p className="text-xs text-slate-400 mt-1">Cache de múltiplos níveis em memória</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Smartphone className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Alertas WhatsApp</span>
          </div>
          <div className="text-3xl font-extrabold text-white">100%</div>
          <p className="text-xs text-slate-400 mt-1">Notificações no celular sem depender de app</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Ativos em Destaque</h2>
            <p className="text-xs text-slate-400 mt-1">Exemplos de ativos listados na B3 com dados e proventos rastreados</p>
          </div>

          <button
            onClick={() => onSelectTab('assets')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>Ver todos os 622 ativos</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {platformHighlights.map((item) => (
            <div
              key={item.ticker}
              onClick={() => onSelectTab('assets')}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-emerald-500/40 hover:bg-slate-900/90 transition shadow-sm hover:shadow-emerald-500/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-white group-hover:text-emerald-400 transition">
                  {item.ticker}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  {item.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-1">{item.name}</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Cotação</span>
                  <span className="font-semibold text-white">{item.lastPrice}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Yield</span>
                  <span className="font-semibold text-emerald-400">{item.yieldPct}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Radar de Dividendos</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Receba no seu WhatsApp o informe no momento exato em que a gestora anuncia o valor do dividendo, a data de corte (Data Com) e o dia do pagamento.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Cálculo automático de Preço Teto Bazin</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Histórico de distribuições da B3</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="inline-flex rounded-xl bg-teal-500/10 p-3 text-teal-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Alertas de Preço & Variação</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure alertas por preço mínimo, preço teto ou variação percentual (degrau). Quando o ativo atinge o valor, você é avisado instantaneamente.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Disparos individuais ou em grupos</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Rastreador contínuo de oscilação</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <Landmark className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Tesouro Direto em Tempo Real</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Taxas atualizadas direto do Tesouro Nacional. Compare títulos IPCA+, Prefixados e Selic para montar sua reserva e carteira de renda fixa.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Filtro por indexador e vencimento</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Avisos de alterações relevantes de taxa</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Code className="h-4 w-4" />
            <span>YieldIQ Developer API</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">Integre dados em suas planilhas, bots ou aplicações</h3>
          <p className="text-xs text-slate-400">
            Use nossa API REST com autenticação via Bearer token ou X-API-TOKEN para acessar ativos, cotações, dividendos e taxas do Tesouro.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('docs')}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-3 text-xs font-semibold text-white transition border border-slate-700"
          >
            <Code className="h-4 w-4 text-emerald-400" />
            <span>Ver Documentação da API</span>
          </button>

          {!currentUser && (
            <button
              onClick={() => openAuthModal('register')}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-xs font-semibold text-slate-950 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Obter Chave Grátis</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};