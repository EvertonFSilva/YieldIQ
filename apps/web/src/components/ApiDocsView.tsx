import React, { useState } from 'react';
import {
  Copy,
  Check,
  Shield,
  FileSpreadsheet,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  Table,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type DocsMode = 'rest' | 'sheets' | 'xml';

interface ApiEndpointDefinition {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  isProtected: boolean;
  queryParams?: Array<{ name: string; type: string; required: boolean; description: string }>;
  bodySample?: Record<string, any>;
  responseSample: Record<string, any>;
}

export const ApiDocsView: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [docsMode, setDocsMode] = useState<DocsMode>('rest');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('list-assets');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'typescript' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const activeApiKey = currentUser?.apiKey || 'yieldiq_demo_key_7bc3a617cf5d8fdb1386f430709b';
  const apiBaseUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:8000/api'
    : `${window.location.origin}/api`;

  const endpoints: ApiEndpointDefinition[] = [
    {
      id: 'list-assets',
      method: 'GET',
      path: '/assets',
      title: 'Listar Ativos da B3',
      description: 'Retorna a lista completa de ativos negociados na bolsa brasileira (FIIs, FIAGROs e FI-INFRAs), com metadados de segmento e status de negociação.',
      isProtected: false,
      queryParams: [
        { name: 'type', type: 'string', required: false, description: 'Filtra por tipo: FII, FIAGRO ou FI_INFRA' }
      ],
      responseSample: {
        success: true,
        data: [
          {
            id: 'd0b8f6aa-7512-4e4b-bb21-39e1a1234567',
            ticker: 'MXRF11',
            name: 'MAXI RENDA FII',
            type: 'FII',
            metadata: { segment: 'Papel / CRI' },
            isActive: true
          },
          {
            id: 'e1c9a7bb-8623-5f5c-cc32-40f2b2345678',
            ticker: 'HGLG11',
            name: 'CSHG LOGÍSTICA FII',
            type: 'FII',
            metadata: { segment: 'Logística' },
            isActive: true
          }
        ]
      }
    },
    {
      id: 'get-price',
      method: 'GET',
      path: '/assets/price/:ticker',
      title: 'Cotação em Tempo Real',
      description: 'Retorna a cotação oficial do ativo da B3 com fechamento anterior, abertura, máxima, mínima do dia e volume financeiro.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo na B3 (ex: HGLG11, MXRF11)' }
      ],
      responseSample: {
        success: true,
        data: {
          ticker: 'HGLG11',
          currentPrice: 152.0,
          previousClose: 151.2,
          openingPrice: 151.4,
          dayHighPrice: 152.5,
          dayLowPrice: 150.9,
          tradingVolume: 245000,
          dailyVariationPercentage: 0.53,
          lastUpdatedAt: new Date().toISOString()
        }
      }
    },
    {
      id: 'get-dividends',
      method: 'GET',
      path: '/assets/dividends/:ticker',
      title: 'Distribuição de Rendimentos',
      description: 'Histórico de proventos registrados na B3 com valor por cota, data com (base) e data prevista de pagamento em conta.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo (ex: KNIP11)' },
        { name: 'limit', type: 'integer', required: false, description: 'Quantidade máxima de proventos (padrão: 12)' }
      ],
      responseSample: {
        success: true,
        data: [
          {
            dividendValue: 1.1,
            formattedValue: 'R$ 1,10',
            baseRecordDate: '15/10/2026',
            paymentDistributionDate: '22/10/2026',
            documentSourceUrl: 'https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=123'
          }
        ]
      }
    },
    {
      id: 'get-documents',
      method: 'GET',
      path: '/assets/documents/:ticker',
      title: 'Fatos Relevantes CVM (FNET)',
      description: 'Consulta comunicados oficiais, relatórios gerenciais e fatos relevantes protocolados no sistema FNET da CVM.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo' },
        { name: 'category', type: 'string', required: false, description: 'Filtro por categoria do documento' }
      ],
      responseSample: {
        success: true,
        data: [
          {
            documentIdentifier: 894123,
            documentCategoryName: 'Fato Relevante',
            documentDescription: 'Aquisição de Imóvel Logístico em Extrema/MG',
            referenceDate: '10/10/2026',
            documentDownloadUrl: 'https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=894123'
          }
        ]
      }
    },
    {
      id: 'get-summary',
      method: 'GET',
      path: '/assets/summary/:ticker',
      title: 'Visão Geral & Valuation Consolidado',
      description: 'Retorna a análise unificada do ativo com cotação atual, soma de 12 meses de dividendos, yield anualizado, Preço Teto Décio Bazin (6%) e Modelo de Gordon.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo na B3' }
      ],
      responseSample: {
        success: true,
        data: {
          ticker: 'MXRF11',
          currentPrice: 9.85,
          previousClosePrice: 9.82,
          dailyVariationPercentage: 0.31,
          annualDividendSum: 1.26,
          trailingDividendYieldPercentage: 12.79,
          averageMonthlyDividendAmount: 0.105,
          bazinCeilingPriceSixPercent: 21.0,
          bazinCeilingPrice: 21.0,
          gordonCeilingPrice: 15.75,
          lastUpdatedAt: new Date().toISOString()
        }
      }
    },
    {
      id: 'get-treasury',
      method: 'GET',
      path: '/treasury/bonds',
      title: 'Taxas Oficiais do Tesouro Direto',
      description: 'Lista completa dos títulos públicos negociados no Tesouro Nacional (Selic, IPCA+, Prefixados, Renda+, Educa+), com rentabilidade anual e preço unitário.',
      isProtected: false,
      queryParams: [
        { name: 'type', type: 'string', required: false, description: 'Filtra por indexador: SELIC, IPCA ou PREFIXADO' }
      ],
      responseSample: {
        success: true,
        data: [
          {
            bondKey: 'tesouro-ipca-2035',
            bondName: 'Tesouro IPCA+ 2035',
            indexerName: 'IPCA',
            profitabilityRate: 6.65,
            profitabilityRateRaw: 'IPCA + 6,65%',
            unitPrice: 2980.20,
            minimumInvestmentAmount: 29.80,
            maturityFormattedDate: '15/05/2035'
          }
        ]
      }
    }
  ];

  const activeEndpoint =
    endpoints.find((ep) => ep.id === selectedEndpointId) || endpoints[0];

  const generateSnippet = (): string => {
    let fullUrl = `${apiBaseUrl}${activeEndpoint.path.replace(':ticker', 'MXRF11')}`;
    const headersList: Record<string, string> = {
      Accept: 'application/json'
    };

    if (activeEndpoint.isProtected) {
      headersList['X-API-TOKEN'] = activeApiKey;
    }

    if (selectedLanguage === 'curl') {
      let snippet = `curl -X ${activeEndpoint.method} "${fullUrl}" \\\n`;
      Object.entries(headersList).forEach(([headerKey, headerVal]) => {
        snippet += `  -H "${headerKey}: ${headerVal}" \\\n`;
      });
      if (activeEndpoint.bodySample) {
        snippet += `  -d '${JSON.stringify(activeEndpoint.bodySample, null, 2)}'`;
      } else {
        snippet = snippet.replace(/ \\\n$/, '');
      }
      return snippet;
    }

    if (selectedLanguage === 'typescript') {
      return `const response = await fetch("${fullUrl}", {
  method: "${activeEndpoint.method}",
  headers: {
${Object.entries(headersList)
  .map(([k, v]) => `    "${k}": "${v}"`)
  .join(',\n')}
  }${activeEndpoint.bodySample ? `,\n  body: JSON.stringify(${JSON.stringify(activeEndpoint.bodySample, null, 2)})` : ''}
});

const result = await response.json();
console.log(result.data);`;
    }

    return `import requests

url = "${fullUrl}"
headers = {
${Object.entries(headersList)
  .map(([k, v]) => `    "${k}": "${v}"`)
  .join(',\n')}
}
${
  activeEndpoint.bodySample
    ? `payload = ${JSON.stringify(activeEndpoint.bodySample, null, 4)}
response = requests.${activeEndpoint.method.toLowerCase()}(url, headers=headers, json=payload)`
    : `response = requests.${activeEndpoint.method.toLowerCase()}(url, headers=headers)`
}

print(response.json())`;
  };

  const handleCopyCode = (): void => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedCode(true);
    toast.success('Exemplo de código copiado!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyBaseUrl = (): void => {
    navigator.clipboard.writeText(apiBaseUrl);
    setCopiedBaseUrl(true);
    toast.success('URL Base da API copiada!');
    setTimeout(() => setCopiedBaseUrl(false), 2000);
  };

  const handleCopyFormula = (formulaText: string, formulaId: string): void => {
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(formulaId);
    toast.success('Fórmula copiada para a área de transferência!');
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto transition-all duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>YieldIQ API v1.0.0 Oficial</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>Latência Média: 24ms (Cache B3 Ativo)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span>Formatos Nativos: JSON • CSV • XML</span>
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Developer Hub & Central de Integrações
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              Acesse dados oficiais da B3, CVM FNet e Tesouro Direto em formato REST JSON, fórmulas para Google Sheets e Microsoft Excel, ou feeds XML estruturados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <div className="flex-1 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 font-mono text-xs sm:text-sm text-slate-300">
              <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-slate-500 select-none">Base URL:</span>
              <span className="font-semibold text-white select-all">{apiBaseUrl}</span>
            </div>

            <button
              onClick={handleCopyBaseUrl}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition border border-slate-700 shadow-md"
            >
              {copiedBaseUrl ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedBaseUrl ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setDocsMode('rest')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
            docsMode === 'rest'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>API REST Tradicional (JSON)</span>
        </button>

        <button
          onClick={() => setDocsMode('sheets')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
            docsMode === 'sheets'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Planilhas (Google Sheets & Excel)</span>
        </button>

        <button
          onClick={() => setDocsMode('xml')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
            docsMode === 'xml'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Feed XML / RSS B3 & CVM</span>
        </button>
      </div>

      {docsMode === 'sheets' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>Integração Direta em Planilhas Financeiras</span>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Sem Programação
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atualize sua planilha de controle patrimonial automaticamente utilizando fórmulas nativas do Google Sheets ou Power Query do Excel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 shadow-lg hover:border-slate-700 transition">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-sm font-bold text-white">Google Sheets (=IMPORTDATA)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">Formato CSV Nativo</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Cole a fórmula abaixo em qualquer célula para importar a cotação e indicadores consolidados:
                </p>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-emerald-400 relative overflow-x-auto">
                  <code>{`=IMPORTDATA("${apiBaseUrl}/assets/summary/MXRF11?format=csv&token=${activeApiKey}")`}</code>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Atualização automática pelo Google Sheets</span>
                  <button
                    onClick={() =>
                      handleCopyFormula(
                        `=IMPORTDATA("${apiBaseUrl}/assets/summary/MXRF11?format=csv&token=${activeApiKey}")`,
                        'sheets-cota'
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition border border-emerald-500/20"
                  >
                    {copiedFormula === 'sheets-cota' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedFormula === 'sheets-cota' ? 'Copiada!' : 'Copiar Fórmula'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-slate-200 block">Buscar último dividendo anunciado:</span>
                  <code className="text-teal-400 block font-mono text-[10px]">
                    {`=IMPORTDATA("${apiBaseUrl}/assets/dividends/MXRF11?limit=1&format=csv&token=${activeApiKey}")`}
                  </code>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 shadow-lg hover:border-slate-700 transition">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-teal-400" />
                    <span className="text-sm font-bold text-white">Microsoft Excel (Power Query M)</span>
                  </div>
                  <span className="text-[11px] text-teal-400 font-mono font-semibold">JSON / REST</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  No Excel: <strong>Dados &gt; Obter Dados &gt; De Outras Fontes &gt; Consulta em Branco &gt; Editor Avançado</strong>:
                </p>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-teal-300 overflow-x-auto max-h-28">
                  <pre>{`let
    Fonte = Json.Document(Web.Contents("${apiBaseUrl}/assets/summary/MXRF11", [
        Headers = [#"X-API-TOKEN" = "${activeApiKey}"]
    ])),
    Dados = Fonte[data]
in
    Dados`}</pre>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Conexão nativa e segura no Excel</span>
                  <button
                    onClick={() =>
                      handleCopyFormula(
                        `let\n    Fonte = Json.Document(Web.Contents("${apiBaseUrl}/assets/summary/MXRF11", [\n        Headers = [#"X-API-TOKEN" = "${activeApiKey}"]\n    ])),\n    Dados = Fonte[data]\nin\n    Dados`,
                        'excel-m'
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 text-xs font-semibold text-teal-400 transition border border-teal-500/20"
                  >
                    {copiedFormula === 'excel-m' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedFormula === 'excel-m' ? 'Copiado!' : 'Copiar M-Code'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-slate-200 block">Opção direta com WEBSERVICE no Excel:</span>
                  <code className="text-emerald-400 block font-mono text-[10px]">
                    {`=WEBSERVICE("${apiBaseUrl}/assets/price/MXRF11")`}
                  </code>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Simulação Visual das Células Importadas
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Planilha em Tempo Real</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th className="p-2.5 text-slate-600 bg-slate-950 text-center w-10 border-r border-slate-800">#</th>
                      <th className="p-2.5 font-bold text-emerald-400">A (Ativo)</th>
                      <th className="p-2.5 font-bold text-white">B (Preço Atual)</th>
                      <th className="p-2.5 font-bold text-teal-400">C (DY 12M)</th>
                      <th className="p-2.5 font-bold text-cyan-400">D (Preço Teto Bazin)</th>
                      <th className="p-2.5 font-bold text-slate-300">E (Data Com)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-[11px]">
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 text-slate-600 bg-slate-950 text-center font-bold border-r border-slate-800">1</td>
                      <td className="p-2.5 font-bold text-white">MXRF11</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">R$ 9,85</td>
                      <td className="p-2.5 text-teal-400">12,79%</td>
                      <td className="p-2.5 text-cyan-400">R$ 21,00</td>
                      <td className="p-2.5 text-slate-400">31/10/2026</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 text-slate-600 bg-slate-950 text-center font-bold border-r border-slate-800">2</td>
                      <td className="p-2.5 font-bold text-white">HGLG11</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">R$ 151,70</td>
                      <td className="p-2.5 text-teal-400">8,85%</td>
                      <td className="p-2.5 text-cyan-400">R$ 178,00</td>
                      <td className="p-2.5 text-slate-400">31/10/2026</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 text-slate-600 bg-slate-950 text-center font-bold border-r border-slate-800">3</td>
                      <td className="p-2.5 font-bold text-white">XPML11</td>
                      <td className="p-2.5 text-emerald-400 font-semibold">R$ 102,40</td>
                      <td className="p-2.5 text-teal-400">9,20%</td>
                      <td className="p-2.5 text-cyan-400">R$ 124,50</td>
                      <td className="p-2.5 text-slate-400">15/10/2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {docsMode === 'xml' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-400 border border-cyan-500/20">
                <FileCode className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>Feed XML Estruturado (B3 & CVM)</span>
                  <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                    Suporte XPath
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consuma saídas XML oficiais anexando o parâmetro <code className="text-cyan-400 font-mono">?format=xml</code> ou o cabeçalho <code className="text-cyan-400 font-mono">Accept: application/xml</code>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Requisição com Cabeçalho XML</h3>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-cyan-300 overflow-x-auto">
                  <pre>{`curl -X GET "${apiBaseUrl}/assets/summary/MXRF11?format=xml" \\
  -H "Accept: application/xml" \\
  -H "X-API-TOKEN: ${activeApiKey}"`}</pre>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block">Fórmula Google Sheets com XPath (=IMPORTXML):</span>
                  <div className="rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-400 border border-slate-800">
                    <code>{`=IMPORTXML("${apiBaseUrl}/assets/summary/MXRF11?format=xml&token=${activeApiKey}"; "//currentPrice")`}</code>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Estrutura da Resposta XML (200 OK)</h3>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56">
                  <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<response>
  <success>true</success>
  <data>
    <ticker>MXRF11</ticker>
    <currentPrice>9.85</currentPrice>
    <previousClosePrice>9.82</previousClosePrice>
    <dailyVariationPercentage>0.31</dailyVariationPercentage>
    <annualDividendSum>1.26</annualDividendSum>
    <trailingDividendYieldPercentage>12.79</trailingDividendYieldPercentage>
    <bazinCeilingPriceSixPercent>21.00</bazinCeilingPriceSixPercent>
    <bazinCeilingPrice>21.00</bazinCeilingPrice>
    <lastUpdatedAt>${new Date().toISOString()}</lastUpdatedAt>
  </data>
</response>`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {docsMode === 'rest' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          <aside className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 block mb-2">
              Catálogo de Endpoints REST
            </span>

            <div className="space-y-1">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  onClick={() => setSelectedEndpointId(endpoint.id)}
                  className={`w-full text-left rounded-2xl p-3.5 text-xs transition-all duration-200 flex items-center justify-between ${
                    selectedEndpointId === endpoint.id
                      ? 'bg-slate-800 text-white font-bold border border-emerald-500/40 shadow-lg'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 ${
                        endpoint.method === 'GET'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="truncate">{endpoint.title}</span>
                  </div>

                  {endpoint.isProtected && (
                    <span title="Requer autenticação com X-API-TOKEN">
                      <Shield className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-2" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs space-y-2 text-slate-400">
                <span className="font-semibold text-slate-200 block flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Autenticação Flexível</span>
                </span>
                <p className="text-[11px] leading-relaxed">
                  Envie o cabeçalho <code className="text-emerald-400 font-mono">X-API-TOKEN: sua_chave</code> ou anexe o parâmetro <code className="text-emerald-400 font-mono">?token=sua_chave</code> na URL.
                </p>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 shadow-xl transition-all duration-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold ${
                      activeEndpoint.method === 'GET'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {activeEndpoint.method}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-white break-all">
                    {activeEndpoint.path}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{activeEndpoint.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{activeEndpoint.description}</p>
              </div>

              {activeEndpoint.queryParams && activeEndpoint.queryParams.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Parâmetros da Requisição
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                          <th className="p-3">Parâmetro</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Obrigatório</th>
                          <th className="p-3">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-[11px]">
                        {activeEndpoint.queryParams.map((param) => (
                          <tr key={param.name}>
                            <td className="p-3 font-mono font-bold text-white">{param.name}</td>
                            <td className="p-3 font-mono text-slate-400">{param.type}</td>
                            <td className="p-3">
                              {param.required ? (
                                <span className="text-rose-400 font-bold">Sim</span>
                              ) : (
                                <span className="text-slate-500">Opcional</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-300">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                    {(['curl', 'typescript', 'python'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition ${
                          selectedLanguage === lang
                            ? 'bg-slate-800 text-emerald-400 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <pre>{generateSnippet()}</pre>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Exemplo de Resposta (200 OK)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Content-Type: application/json
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-80">
                  <pre>{JSON.stringify(activeEndpoint.responseSample, null, 2)}</pre>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
