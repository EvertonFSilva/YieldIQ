import React, { useState } from 'react';
import { Copy, Check, Shield, Key, BookOpen } from 'lucide-react';
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
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'typescript' | 'python'>('curl');
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
          currentPrice: 162.5,
          previousClose: 161.8,
          openingPrice: 162.0,
          dayHighPrice: 163.2,
          dayLowPrice: 161.5,
          tradingVolume: 245000,
          dailyVariationPercentage: 0.43,
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
            dividendValue: 0.95,
            formattedValue: 'R$ 0,95',
            baseRecordDate: '2026-10-15',
            paymentDistributionDate: '2026-10-22',
            documentSourceUrl: 'https://fnet.bmfbovespa.com.br/...'
          }
        ]
      }
    },
    {
      id: 'get-documents',
      method: 'GET',
      path: '/assets/documents/:ticker',
      title: 'Fatos Relevantes & Informes CVM',
      description: 'Consulta comunicados oficiais, relatórios gerenciais e fatos relevantes protocolados no FNET da B3/CVM.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo' },
        { name: 'category', type: 'string', required: false, description: 'Categoria de documentos (all, material_fact, report)' }
      ],
      responseSample: {
        success: true,
        data: [
          {
            documentIdentifier: 1245890,
            referenceDate: '2026-10-20',
            documentDescription: 'Relatório Gerencial Mensal - Setembro 2026',
            documentCategoryName: 'Relatório Gerencial',
            documentDownloadUrl: 'https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=1245890'
          }
        ]
      }
    },
    {
      id: 'get-summary',
      method: 'GET',
      path: '/assets/summary/:ticker',
      title: 'Sumário & Métricas de Valuation',
      description: 'Calcula o somatório de proventos de 12 meses, Dividend Yield trailing e preços-teto segundo os modelos de Décio Bazin e Gordon.',
      isProtected: false,
      queryParams: [
        { name: 'ticker', type: 'path', required: true, description: 'Código do ativo' }
      ],
      responseSample: {
        success: true,
        data: {
          ticker: 'MXRF11',
          annualDividendSum: 1.25,
          trailingDividendYieldPercentage: 12.2,
          bazinCeilingPriceSixPercent: 20.83,
          gordonCeilingPrice: 15.62,
          priceQuote: {
            currentPrice: 10.24,
            dailyVariationPercentage: 0.2
          }
        }
      }
    },
    {
      id: 'get-treasury',
      method: 'GET',
      path: '/treasury/bonds',
      title: 'Taxas do Tesouro Direto',
      description: 'Obtém a tabela completa de títulos públicos federais com rentabilidade anual, preço unitário, aporte mínimo e vencimento.',
      isProtected: false,
      responseSample: {
        success: true,
        data: [
          {
            bondKey: 'Tesouro IPCA+ 2029',
            bondName: 'Tesouro IPCA+ 2029',
            indexerName: 'IPCA',
            profitabilityRate: 6.35,
            profitabilityRateRaw: 'IPCA + 6,35%',
            unitPrice: 3240.5,
            minimumInvestmentAmount: 32.4,
            maturityFormattedDate: '15/05/2029'
          }
        ]
      }
    },
    {
      id: 'get-alert-rules',
      method: 'GET',
      path: '/alerts/rules',
      title: 'Listar Regras de Alertas',
      description: 'Retorna todas as regras de monitoramento configuradas pelo usuário logado.',
      isProtected: true,
      responseSample: {
        success: true,
        data: [
          {
            id: 'rule_827361a9',
            ticker: 'HGLG11',
            alertPriceMin: 155.0,
            alertPriceMax: 170.0,
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
      description: 'Cadastra ou edita uma regra de monitoramento no WhatsApp para um determinado ticker.',
      isProtected: true,
      bodySample: {
        ticker: 'MXRF11',
        minimumTargetPrice: 9.8,
        maximumTargetPrice: 10.5,
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
          username: 'admin',
          email: 'admin.yieldiq@gmail.com',
          apiKey: 'yieldiq_7bc3a617cf5d8fdb1386f430709b97221e56dc15ae7c5a8b',
          role: 'ADMINISTRATOR',
          alertQuota: 100,
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
      const optionsObject: Record<string, any> = {
        method: activeEndpoint.method,
        headers: headersList
      };
      if (activeEndpoint.bodySample) {
        optionsObject.body = 'JSON.stringify(bodyPayload)';
      }

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
            Endpoints de alta velocidade para consulta de cotações, proventos, comunicados e regras de alertas
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
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
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
                  Parâmetros
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => setSelectedLanguage('curl')}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'curl' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('typescript')}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'typescript' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TypeScript
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('python')}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                      selectedLanguage === 'python' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
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

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
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