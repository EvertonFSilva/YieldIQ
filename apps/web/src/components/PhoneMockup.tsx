import React, { useState, useEffect, useRef } from 'react';
import { Bell, Wifi, Battery, Signal, CheckCheck } from 'lucide-react';

interface PhoneAlertItem {
  id: string;
  ticker: string;
  badge: string;
  badgeColor: string;
  accentColor: string;
  time: string;
  title: string;
  lines: string[];
}

export const PhoneMockup: React.FC = () => {
  const alertPool: PhoneAlertItem[] = [
    {
      id: 'craa-price',
      ticker: 'CRAA11',
      badge: 'Queda de Preço 📉',
      badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
      accentColor: '#fb7185',
      time: '10:01',
      title: '⚠️ Alerta de Preço: CRAA11',
      lines: [
        'O ativo CRAA11 caiu -2,12%.',
        '💰 Cotação atual: R$ 88,20',
        '📊 Cotação de abertura: R$ 90,11',
        '⬆️ Cotação máxima do dia: R$ 90,50',
        '📈 Média Dividend Yield (12M): 1,02% ao mês'
      ]
    },
    {
      id: 'craa-dividend',
      ticker: 'CRAA11',
      badge: 'Novo Rendimento 💰',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      accentColor: '#34d399',
      time: '10:02',
      title: '💰 CRAA11 anunciou rendimentos',
      lines: [
        '✅ Valor: R$ 0,90 por cota',
        '📅 Data com: 31/07/2026',
        '📆 Pagamento: 14/08/2026',
        '💰 Preço atual: R$ 88,20',
        '📈 Dividend Yield: 1,02%'
      ]
    },
    {
      id: 'ggrc-report',
      ticker: 'GGRC11',
      badge: 'Fato Relevante 📄',
      badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      accentColor: '#60a5fa',
      time: '10:03',
      title: '📣 Fato Relevante CVM FNet',
      lines: [
        'O ativo GGRC11 publicou um novo documento oficial.',
        '📄 Tipo de Documento: Aviso aos Cotistas',
        '🏛️ Protocolo CVM FNet: #139824'
      ]
    },
    {
      id: 'hglg-gordon',
      ticker: 'HGLG11',
      badge: 'Oportunidade Gordon 🎯',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      accentColor: '#fbbf24',
      time: '10:04',
      title: '🎯 Oportunidade (Método Gordon)',
      lines: [
        'O teto do HGLG11 está em R$ 165,20.',
        '💰 Preço atual: R$ 147,00 (Abaixo do teto).',
        'Isso indica margem de segurança na renda e na cota.'
      ]
    },
    {
      id: 'btlg-bazin',
      ticker: 'BTLG11',
      badge: 'Abaixo do Teto Bazin 💡',
      badgeColor: 'border-teal-500/30 text-teal-400 bg-teal-500/10',
      accentColor: '#2dd4bf',
      time: '10:05',
      title: '🎯 Oportunidade (Método Bazin)',
      lines: [
        'O teto do BTLG11 está em R$ 110,50.',
        '💰 Preço atual: R$ 100,73 (Abaixo do teto).',
        'Oportunidade de dividendos acima de 6% ao ano.'
      ]
    },
    {
      id: 'treasury-rate',
      ticker: 'Tesouro IPCA+',
      badge: 'Taxa Atualizada 🔄',
      badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      accentColor: '#c084fc',
      time: '10:06',
      title: '🏛️ Oscilação de Taxa do Tesouro',
      lines: [
        '🏛️ Título: Tesouro IPCA+ 2035',
        '📉 Taxa anterior: IPCA + 6,20% a.a.',
        '📈 Nova Taxa: IPCA + 6,05% a.a.',
        '⏳ Valor anterior: R$ 2.975,10',
        '💰 Preço Atual: R$ 2.980,20'
      ]
    },
    {
      id: 'xpml-report',
      ticker: 'XPML11',
      badge: 'Relatório CVM 📊',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      accentColor: '#34d399',
      time: '10:07',
      title: '📊 Novo Documento Gerencial',
      lines: [
        'O ativo XPML11 publicou um novo Relatório Gerencial.',
        '📄 Período de apuração referente ao mês corrente.',
        '📈 Rendimento projetado mantido com liquidez recorde.'
      ]
    }
  ];

  const [visibleMessages, setVisibleMessages] = useState<PhoneAlertItem[]>([alertPool[0], alertPool[1]]);
  const [nextIndex, setNextIndex] = useState<number>(2);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [activeChip, setActiveChip] = useState<PhoneAlertItem>(alertPool[1]);
  const feedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTop = feedScrollRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(true);

      setTimeout(() => {
        const itemToAdd = alertPool[nextIndex % alertPool.length];
        setVisibleMessages((prev) => {
          const updated = [...prev, itemToAdd];
          if (updated.length > 5) {
            return updated.slice(updated.length - 5);
          }
          return updated;
        });
        setActiveChip(itemToAdd);
        setNextIndex((prev) => prev + 1);
        setIsTyping(false);
      }, 1400);
    }, 6500);

    return () => clearInterval(interval);
  }, [nextIndex, alertPool]);

  const handleManualPush = (item: PhoneAlertItem): void => {
    setIsTyping(true);
    setTimeout(() => {
      setVisibleMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== item.id);
        const updated = [...filtered, item];
        if (updated.length > 5) {
          return updated.slice(updated.length - 5);
        }
        return updated;
      });
      setActiveChip(item);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="relative mx-auto flex items-center justify-center p-2 sm:p-6 select-none max-w-full">
      <div
        className="hidden xl:block absolute -top-4 -left-12 z-20 pointer-events-none transition-all duration-500"
        style={{
          transform: 'translateY(-4px)'
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-indigo-400/30 bg-slate-900/90 px-3.5 py-1.5 shadow-2xl backdrop-blur-md">
          <span
            className="w-2 h-2 rounded-full shadow-md"
            style={{
              backgroundColor: activeChip.accentColor,
              boxShadow: `0 0 10px ${activeChip.accentColor}`
            }}
          />
          <span className="text-[11px] font-bold text-slate-200 whitespace-nowrap">
            {activeChip.ticker} &bull; {activeChip.badge}
          </span>
        </div>
      </div>

      <div
        className="hidden xl:block absolute -bottom-4 -right-10 z-20 pointer-events-none transition-all duration-500"
        style={{
          transform: 'translateY(4px)'
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-slate-900/90 px-3.5 py-1.5 shadow-2xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-md shadow-emerald-400" />
          <span className="text-[11px] font-bold text-emerald-300 whitespace-nowrap">
            WhatsApp Oficial &bull; 24/7 Ativo
          </span>
        </div>
      </div>

      <div
        className="landing-phone relative w-[340px] max-w-full rounded-[52px] p-[14px]"
        style={{
          background: 'linear-gradient(160deg, #141c2b, #060911)',
          border: '1px solid rgba(147, 165, 255, 0.42)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(148, 163, 184, 0.16)'
        }}
      >
        <span className="absolute top-[88px] -left-[2px] w-[4px] h-[26px] rounded-[3px] bg-slate-700/80" />
        <span className="absolute top-[132px] -left-[2px] w-[4px] h-[44px] rounded-[3px] bg-slate-700/80" />
        <span className="absolute top-[132px] -right-[2px] w-[4px] h-[70px] rounded-[3px] bg-slate-700/80" />

        <div className="absolute top-[17px] left-1/2 -translate-x-1/2 w-[118px] h-[26px] bg-black rounded-[14px] z-30 border border-[#141b28] flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
        </div>

        <div className="bg-[#0c1219] border border-slate-700/60 rounded-[39px] overflow-hidden relative">
          <div className="flex justify-between items-end pt-4 px-6 pb-2 text-[12px] text-white font-bold">
            <span>10:30</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-1">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-bold">100%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#141c2b] border-b border-indigo-500/20">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                <span>YieldIQ Alertas</span>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  ✓
                </span>
              </div>
              <div className="text-slate-400 text-[11px] truncate">Alertas oficiais em tempo real</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 live-dot shadow-sm" />
          </div>

          <div
            ref={feedScrollRef}
            className="phone-alert-scroll h-[440px] overflow-y-auto p-3 flex flex-col gap-2.5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent"
          >
            <div className="mx-auto rounded-full bg-slate-900/90 border border-slate-800 px-3 py-0.5 text-[10px] text-slate-400 font-medium">
              Hoje &bull; Mensagens Criptografadas
            </div>

            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className="wa-msg self-start max-w-[96%] rounded-[14px_14px_14px_4px] p-3 text-[12px] leading-relaxed shadow-md"
                style={{
                  backgroundColor: 'rgba(14, 35, 63, 0.92)',
                  borderLeft: `3px solid ${msg.accentColor}`
                }}
              >
                <div className="font-bold text-white mb-1.5 flex items-center justify-between gap-1">
                  <span>{msg.title}</span>
                </div>
                <div className="space-y-1 text-slate-200">
                  {msg.lines.map((ln, idx) => (
                    <div key={idx} className={idx === 0 ? 'font-medium text-white' : 'text-slate-300'}>
                      {ln}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-400">
                  <span>{msg.time}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ))}

            {isTyping && (
              <div
                className="wa-typing self-start rounded-[14px_14px_14px_4px] px-3.5 py-2.5 flex items-center gap-1.5 shadow-md"
                style={{ backgroundColor: 'rgba(14, 35, 63, 0.92)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot" />
                <span className="text-[11px] text-slate-400 ml-1 font-medium">digitando alerta...</span>
              </div>
            )}
          </div>

          <div className="p-2 bg-[#141c2b]/90 border-t border-slate-800">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5">
              {alertPool.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleManualPush(item)}
                  className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition shrink-0"
                >
                  {item.ticker}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-white/70 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
