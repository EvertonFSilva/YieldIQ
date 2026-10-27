import React, { useState } from 'react';
import { Copy, Check, Shield, Key, BookOpen, FileSpreadsheet, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('list-assets');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'typescript' | 'python' | 'sheets' | 'xml'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const activeApiKey = currentUser?.apiKey || 'sua_chave_api_aqui';
  const apiBaseUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:8000/api'
    : `${window.location.origin}/api`;

  const endpoints: ApiEndpointDefinition[] = [
    {
      id: 'list-assets',
      method: 'GET',
      path: '/assets',
      title: 'Listar Ativos da Bolsa',
      description: 'Retorna a lista completa de ativos listados na B3 (FIIs, FIAGROs e FI-INFRAs). Permite consulta pública sem autenticação obrigatória.',
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
      title: 'Cotação do Ativo',
      description: 'Retorna a cotação em tempo real de um ativo da B3, incluindo fechamento anterior, abertura, máxima, mínima e volume.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo na B3 (ex: HGLG11, MXRF11)' }
      ],
      responseSample: {
        success: true,
        data: {
          ticker: 'HGLG11',
          currentPrice: 151.7,
          previousClose: 151.2,
          openingPrice: 151.4,
          dayHighPrice: 152.3,
          dayLowPrice: 150.9,
          tradingVolume: 245000,
          dailyVariationPercentage: 0.33,
          lastUpdatedAt: new Date().toISOString()
        }
      }
    },
    {
      id: 'get-dividends',
      method: 'GET',
      path: '/assets/dividends/:ticker',
      title: 'Histórico de Proventos',
      description: 'Retorna as distribuições de rendimentos registradas na B3 com valor por cota, data com e data de pagamento.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo (ex: KNIP11)' },
        { name: 'limit', type: 'integer', required: false, description: 'Quantidade máxima de proventos (padrão: 12)' }
      ],
      responseSample: {
        success: true,
        data: [
          {
            rate: 1.1,
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
      description: 'Consulta comunicados oficiais, relatórios gerenciais e fatos relevantes protocolados na Comissão de Valores Mobiliários.',
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
      title: 'Resumo Completo com Valuation',
      description: 'Agrega cotação em tempo real, proventos dos últimos 12 meses, Preço Teto Bazin (6%) e Modelo de Desconto de Dividendos de Gordon.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo' }
      ],
      responseSample: {
        success: true,
        data: {
          ticker: 'MXRF11',
          name: 'MAXI RENDA FII',
          assetType: 'FII',
          priceQuote: {
            currentPrice: 9.11,
            previousClose: 9.12,
            dayHighPrice: 9.15,
            dayLowPrice: 9.09,
            tradingVolume: 8425000,
            dailyVariationPercentage: -0.11,
            lastUpdatedAt: new Date().toISOString()
          },
          annualDividendSum: 1.18,
          trailingDividendYieldPercentage: 12.95,
          bazinCeilingPriceSixPercent: 19.67,
          gordonCeilingPrice: 11.8,
          recentDividends: [
            {
              rate: 0.09,
              formattedValue: 'R$ 0,09',
              baseRecordDate: '15/10/2026',
              paymentDistributionDate: '24/10/2026'
            }
          ]
        }
      }
    },
    {
      id: 'get-treasury',
      method: 'GET',
      path: '/treasury',
      title: 'Títulos do Tesouro Direto',
      description: 'Retorna a grade completa de títulos públicos federais (Selic, Prefixado, IPCA+, RendA+, Educa+) com taxas anuais de compra e preços unitários.',
      isProtected: false,
      responseSample: {
        success: true,
        data: [
          {
            bondName: 'Tesouro Selic 2029',
            indexType: 'SELIC',
            maturityDate: '01/03/2029',
            annualInterestRatePercentage: 11.75,
            unitPrice: 14850.2,
            minimumInvestmentAmount: 148.5
          },
          {
            bondName: 'Tesouro IPCA+ 2035',
            indexType: 'IPCA',
            maturityDate: '15/05/2035',
            annualInterestRatePercentage: 6.42,
            unitPrice: 2210.8,
            minimumInvestmentAmount: 44.21
          }
        ]
      }
    },
    {
      id: 'get-alert-rules',
      method: 'GET',
      path: '/alerts/rules',
      title: 'Minhas Regras de Alerta',
      description: 'Retorna a lista de regras de alertas no WhatsApp configuradas pelo usuário autenticado.',
      isProtected: true,
      responseSample: {
        success: true,
        data: [
          {
            id: 'rule_827361a9',
            ticker: 'HGLG11',
            alertPriceMin: 145.0,
            alertPriceMax: 160.0,
            alertPriceChangePct: 2.0,
            notifyDividend: true,
            notifyMaterialFact: true,
            enabled: true
          }
        ]
      }
    },
    {
      id: 'post-alert-rules',
      method: 'POST',
      path: '/alerts/rules',
      title: 'Criar / Atualizar Regra de Alerta',
      description: 'Cadastra ou edita uma regra de monitoramento no WhatsApp para um determinado ativo.',
      isProtected: true,
      bodySample: {
        ticker: 'MXRF11',
        minimumTargetPrice: 8.8,
        maximumTargetPrice: 10.2,
        variationPercentageThreshold: 1.5,
        isPriceAlertEnabled: true,
        isDividendAlertEnabled: true,
        isMaterialFactAlertEnabled: true
      },
      responseSample: {
        success: true,
        data: {
          ticker: 'MXRF11',
          id: 'rule_938472bb'
        }
      }
    },
    {
      id: 'get-profile',
      method: 'GET',
      path: '/auth/profile',
      title: 'Perfil & Cota da Conta',
      description: 'Retorna os dados cadastrais da conta, status do WhatsApp, cota de alertas e chave X-API-TOKEN ativa.',
      isProtected: true,
      responseSample: {
        success: true,
        data: {
          id: '83427eb7-7daf-49c9-8bde-c4ee94ac1981',
          username: 'investidor',
          email: 'investidor@yieldiq.com.br',
          apiKey: 'yieldiq_7bc3a617cf5d8fdb1386f430709b97221e56dc15ae7c5a8b',
          role: 'USER',
          alertQuota: 20,
          isWhatsAppEnabled: true
        }
      }
    }
  ];

  const activeEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  const generateSnippet = (): string => {
    const rawPath = activeEndpoint.path.replace(':ticker', 'MXRF11');
    const fullUrl = `${apiBaseUrl}${rawPath}`;
    const headersList: Record<string, string> = {
      'Content-Type': 'application/json'
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

    if (selectedLanguage === 'python') {
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
    }

    if (selectedLanguage === 'sheets') {
      return `=== GOOGLE SHEETS ===
1. Fórmula direta na célula (Retorna JSON ou dados tabulares):
=IMPORTDATA("${fullUrl}")

2. Função Customizada via Google Apps Script (Extensões > Apps Script):
function YIELDIQ_DATA(endpoint) {
  const url = "${apiBaseUrl}" + endpoint;
  const options = {
    headers: {
      "X-API-TOKEN": "${activeApiKey}"
    }
  };
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.data.priceQuote ? json.data.priceQuote.currentPrice : json.data.currentPrice;
}
Uso na planilha: =YIELDIQ_DATA("/assets/price/MXRF11")

=== MICROSOFT EXCEL (Power Query / M) ===
1. Guia Dados > Obter Dados > De Outras Fontes > Consulta em Branco > Editor Avançado:
let
    Fonte = Json.Document(Web.Contents("${fullUrl}", [
        Headers = [
            #"Content-Type" = "application/json"${activeEndpoint.isProtected ? `,\n            #"X-API-TOKEN" = "${activeApiKey}"` : ''}
        ]
    ])),
    Dados = Fonte[data]
in
    Dados`;
    }

    return `<!-- Requisição com cabeçalho de negociação XML -->
curl -X ${activeEndpoint.method} "${fullUrl}" \\
  -H "Accept: application/xml" \\
  -H "Content-Type: application/xml"${activeEndpoint.isProtected ? ` \\\n  -H "X-API-TOKEN: ${activeApiKey}"` : ''}

<!-- Exemplo de Resposta XML Estruturada (200 OK) -->
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <success>true</success>
  <data>
    <asset>MXRF11</asset>
    <name>MAXI RENDA FII</name>
    <currentPrice>9.11</currentPrice>
    <previousClose>9.12</previousClose>
    <dayHighPrice>9.15</dayHighPrice>
    <dayLowPrice>9.09</dayLowPrice>
    <dailyVariationPercentage>-0.11</dailyVariationPercentage>
    <tradingVolume>8425000</tradingVolume>
    <lastUpdatedAt>${new Date().toISOString()}</lastUpdatedAt>
  </data>
</response>`;
  };

  const handleCopyCode = (): void => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <BookOpen className="h-4 w-4" />
            <span>YieldIQ Developer Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Documentação da API REST</h1>
          <p className="text-xs text-slate-400 mt-1">
            Endpoints de alta velocidade para cotações, proventos, FNET CVM, Tesouro Direto, Planilhas e automações
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
          <Key className="h-4 w-4 text-emerald-400" />
          <div className="font-mono text-slate-300">
            {currentUser ? (
              <span>Chave: <span className="text-emerald-400">{currentUser.apiKey?.substring(0, 16)}...</span></span>
            ) : (
              <span>Faça login para obter sua chave</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 block mb-2">
            Endpoints Disponíveis
          </span>

          <div className="space-y-1">
            {endpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                onClick={() => setSelectedEndpointId(endpoint.id)}
                className={`w-full text-left rounded-xl p-3 text-xs transition flex items-center justify-between ${
                  selectedEndpointId === endpoint.id
                    ? 'bg-slate-800 text-white font-semibold border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 ${
                      endpoint.method === 'GET'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : endpoint.method === 'POST'
                        ? 'bg-blue-500/20 text-blue-400'
                        : endpoint.method === 'PATCH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="truncate">{endpoint.title}</span>
                </div>

                {endpoint.isProtected && (
                  <span title="Requer autenticação">
                    <Shield className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-2" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs space-y-2 text-slate-400">
              <span className="font-semibold text-slate-200 block">Autenticação</span>
              <p className="text-[11px] leading-relaxed">
                Passe sua chave no header <code className="text-emerald-400 font-mono">X-API-TOKEN</code> ou envie um token JWT no formato <code className="text-emerald-400 font-mono">Authorization: Bearer &lt;token&gt;</code>.
              </p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold ${
                    activeEndpoint.method === 'GET'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : activeEndpoint.method === 'POST'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : activeEndpoint.method === 'PATCH'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {activeEndpoint.method}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-white">
                  {activeEndpoint.path}
                </span>
              </div>

              <h2 className="text-lg font-bold text-white">{activeEndpoint.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{activeEndpoint.description}</p>
            </div>

            {activeEndpoint.queryParams && activeEndpoint.queryParams.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Parâmetros da Consulta
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="pb-2 font-semibold">Parâmetro</th>
                        <th className="pb-2 font-semibold">Tipo</th>
                        <th className="pb-2 font-semibold">Obrigatório</th>
                        <th className="pb-2 font-semibold">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {activeEndpoint.queryParams.map((param) => (
                        <tr key={param.name}>
                          <td className="py-2.5 text-emerald-400 font-semibold">{param.name}</td>
                          <td className="py-2.5 text-slate-400">{param.type}</td>
                          <td className="py-2.5">
                            {param.required ? (
                              <span className="text-rose-400">Sim</span>
                            ) : (
                              <span className="text-slate-500">Não</span>
                            )}
                          </td>
                          <td className="py-2.5 font-sans text-slate-300">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => setSelectedLanguage('curl')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'curl' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('typescript')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'typescript' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TypeScript
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('python')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'python' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('sheets')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'sheets' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Planilhas (Sheets / Excel)</span>
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('xml')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'xml' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>XML</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                <pre>{generateSnippet()}</pre>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Exemplo de Resposta (200 OK)
              </span>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-80">
                <pre>{JSON.stringify(activeEndpoint.responseSample, null, 2)}</pre>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
