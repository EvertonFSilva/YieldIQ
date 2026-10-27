import React, { useState, useEffect } from 'react';
import {
  CheckCheck,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

interface PhoneAlertMessage {
  id: string;
  category: 'dividend' | 'price' | 'report' | 'bazin' | 'treasury';
  label: string;
  badgeColor: string;
  title: string;
  time: string;
  content: string[];
  footerNote?: string;
}

export const PhoneMockup: React.FC = () => {
  const [selectedAlertIndex, setSelectedAlertIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const alertExamples: PhoneAlertMessage[] = [
    {
      id: 'div-mxrf',
      category: 'dividend',
      label: 'Proventos',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      title: '💰 Anúncio de Provento Oficial',
      time: '18:02',
      content: [
        'O ativo MXRF11 aprovou novos rendimentos na B3.',
        '• Valor por cota: R$ 0,10',
        '• Data de corte (Com): 31/10/2026',
        '• Data de pagamento: 14/11/2026',
        '• Dividend Yield do mês: 1,02%',
        '• Yield Anualizado (12M): 12,95% a.a.'
      ],
      footerNote: 'Fonte: Escriturador BTG Pactual & B3'
    },
    {
      id: 'price-hglg',
      category: 'price',
      label: 'Oscilação',
      badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      title: '⚠️ Alerta de Degrau de Preço',
      time: '14:25',
      content: [
        'O ativo HGLG11 atingiu a meta de oscilação (-2,15%).',
        '• Preço Atual: R$ 151,70',
        '• Abertura do dia: R$ 155,00',
        '• Mínima / Máxima: R$ 151,10 - R$ 155,40',
        '• Volume negociado: R$ 12,4M',
        '• Preço Teto Bazin calibrado: R$ 178,00'
      ],
      footerNote: 'Alerta disparado pela regra de degrau'
    },
    {
      id: 'report-xpml',
      category: 'report',
      label: 'Fato Relevante',
      badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      title: '📣 Fato Relevante CVM FNet',
      time: '19:15',
      content: [
        'O fundo XPML11 publicou novo comunicado ao mercado.',
        '• Protocolo CVM: #1343560',
        '• Tipo: Relatório Gerencial / Aquisição',
        '• Assunto: Conclusão de aquisição de 25% do Shopping Cidade Jardim.',
        '• Impacto estimado no resultado: +R$ 0,07/cota'
      ],
      footerNote: 'Documento original disponível na CVM'
    },
    {
      id: 'bazin-btlg',
      category: 'bazin',
      label: 'Preço Teto',
      badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      title: '🎯 Oportunidade Décio Bazin',
      time: '11:40',
      content: [
        'O ativo BTLG11 entrou em faixa de oportunidade Bazin.',
        '• Preço Atual: R$ 100,73',
        '• Preço Teto Calculado (6%): R$ 110,50',
        '• Margem de Segurança: +9,70%',
        '• Dividendo acumulado 12M: R$ 6,63/cota',
        '• Status do algoritmo: COMPRA RECOMENDADA'
      ],
      footerNote: 'Critério Bazin com margem de segurança positiva'
    },
    {
      id: 'treasury-ipca',
      category: 'treasury',
      label: 'Tesouro Direto',
      badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
      title: '🏛️ Oscilação de Taxa do Tesouro',
      time: '10:10',
      content: [
        'Abertura oficial do Tesouro Direto com nova taxa.',
        '• Título: Tesouro IPCA+ 2035',
        '• Taxa anterior: IPCA + 6,25% a.a.',
        '• Nova taxa oficial: IPCA + 6,65% a.a.',
        '• Preço Unitário: R$ 2.980,20',
        '• Meta de rendimento real alcançada!'
      ],
      footerNote: 'Dados oficiais Secretaria do Tesouro Nacional'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTyping(true);
      setTimeout(() => {
        setSelectedAlertIndex((prev) => (prev + 1) % alertExamples.length);
        setIsTyping(false);
      }, 1200);
    }, 6000);
    return () => clearInterval(timer);
  }, [alertExamples.length]);

  const handleSelectAlert = (index: number): void => {
    if (index === selectedAlertIndex) return;
    setIsTyping(true);
    setTimeout(() => {
      setSelectedAlertIndex(index);
      setIsTyping(false);
    }, 800);
  };

  const currentAlert = alertExamples[selectedAlertIndex];

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] select-none">
      <div className="relative rounded-[48px] border-[5px] border-slate-700/80 bg-slate-950 p-3 shadow-2xl shadow-emerald-500/10 ring-1 ring-slate-800">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-28 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-between px-3 z-30">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-950 border border-slate-800" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/30" />
        </div>

        <div className="relative h-[560px] rounded-[38px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-850 overflow-hidden flex flex-col justify-between">
          <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-20">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <Battery className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
                  YQ
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white leading-none">YieldIQ Oficial</span>
                  <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  {isTyping ? (
                    <span className="animate-pulse font-medium">digitando...</span>
                  ) : (
                    <span className="text-slate-400">online</span>
                  )}
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              B3 • CVM
            </div>
          </div>

          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto flex flex-col justify-end">
            <div className="mx-auto rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[10px] text-slate-400">
              Hoje &bull; Alertas Instantâneos WhatsApp
            </div>

            <div className="rounded-2xl border-l-4 border-l-emerald-500 border border-slate-800 bg-slate-900/90 p-3.5 shadow-lg space-y-2 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {currentAlert.title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${currentAlert.badgeColor}`}>
                  {currentAlert.label}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300 leading-relaxed font-mono">
                {currentAlert.content.map((line, idx) => (
                  <p key={idx} className={idx === 0 ? 'text-slate-200 font-sans font-semibold mb-1' : ''}>
                    {line}
                  </p>
                ))}
              </div>

              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>{currentAlert.footerNote}</span>
                <div className="flex items-center gap-1 text-emerald-400">
                  <span>{currentAlert.time}</span>
                  <CheckCheck className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {isTyping && (
              <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-emerald-400 w-fit animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-slate-400 ml-1 font-sans">YieldIQ digitando alerta...</span>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md space-y-2">
            <span className="text-[10px] text-slate-400 font-semibold block text-center">
              Alternar Exemplo de Alerta:
            </span>
            <div className="flex items-center justify-between gap-1">
              {alertExamples.map((alert, idx) => (
                <button
                  key={alert.id}
                  onClick={() => handleSelectAlert(idx)}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-semibold transition-all duration-200 truncate ${
                    selectedAlertIndex === idx
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {alert.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
