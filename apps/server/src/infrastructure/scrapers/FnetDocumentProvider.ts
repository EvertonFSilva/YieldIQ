import { XMLParser } from 'fast-xml-parser';
import { IDocumentProvider } from '../../domain/ports/IDocumentProvider';
import { AssetDocument } from '../../domain/entities/AssetDocument';
import { Ticker } from '../../domain/value-objects/Ticker';
import { environment, FNET_DOCUMENT_CATEGORIES } from '../../config/env';
import { postgresDatabase } from '../database/PostgresDatabaseClient';
import { LoggerUtils } from '../utils/Logger';

interface B3FundListItem {
  id?: number;
  acronym?: string;
  fundName?: string;
  tradingName?: string;
  fundType?: string;
  [key: string]: any;
}

export interface ResolvedAssetDetails {
  cnpj: string | null;
  fundName: string | null;
  tradingName: string | null;
  classification: string | null;
  webSite: string | null;
  positionManager: string | null;
  quotaCount: string | null;
  segment: string | null;
}

export class FnetDocumentProvider implements IDocumentProvider {
  private readonly baseUrl: string;
  private readonly refererUrl: string;
  private readonly b3BaseUrl: string;
  private readonly b3RefererUrl: string;
  private readonly requestTimeoutMilliseconds: number;
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false });

  private fundListCache: B3FundListItem[] | null = null;
  private fundListCacheTimestamp: number = 0;

  constructor() {
    this.baseUrl = environment.FNET_BASE_URL;
    this.refererUrl = environment.FNET_REFERER_URL;
    this.b3BaseUrl = environment.B3_BASE_URL;
    this.b3RefererUrl = environment.B3_REFERER_URL;
    this.requestTimeoutMilliseconds = environment.HTTP_DEFAULT_TIMEOUT_MS;
  }

  private async getCachedFundList(): Promise<B3FundListItem[]> {
    const now = Date.now();
    if (this.fundListCache && now - this.fundListCacheTimestamp < 3600000) {
      return this.fundListCache;
    }

    const aggregatedList: B3FundListItem[] = [];
    for (const fundType of ['FII', 'FIAGRO', 'FI-INFRA']) {
      for (let page = 1; page <= 6; page++) {
        const payload = Buffer.from(
          JSON.stringify({
            language: 'pt-br',
            typeFund: fundType,
            pageNumber: page,
            pageSize: 120
          })
        ).toString('base64');

        const requestUrl = `${this.b3BaseUrl}/fundsListedProxy/Search/GetListFunds/${payload}`;

        try {
          const response = await fetch(requestUrl, {
            headers: {
              Referer: this.b3RefererUrl,
              'User-Agent': environment.USER_AGENT,
              Accept: 'application/json, text/plain, */*'
            },
            signal: AbortSignal.timeout(10000)
          });

          if (!response.ok) break;

          const data = await response.json().catch(() => null);
          const results = data?.results || [];
          if (results.length === 0) break;

          for (const item of results) {
            aggregatedList.push({ ...item, fundType });
          }

          const totalPages = data?.page?.totalPages || 1;
          if (page >= totalPages) break;
        } catch {
          break;
        }
      }
    }

    if (aggregatedList.length > 0) {
      this.fundListCache = aggregatedList;
      this.fundListCacheTimestamp = now;
    }

    return this.fundListCache || [];
  }

  public async resolveAssetDetails(tickerSymbol: string): Promise<ResolvedAssetDetails | null> {
    const cleanTicker = tickerSymbol.toUpperCase().trim();
    const acronym = cleanTicker.replace(/\d+$/, '');

    try {
      const dbResult = await postgresDatabase.query(
        'SELECT metadata FROM public.assets WHERE ticker = $1',
        [cleanTicker]
      );

      const dbMetadata = dbResult.rows[0]?.metadata;
      if (dbMetadata?.cnpj) {
        return {
          cnpj: dbMetadata.cnpj,
          fundName: dbMetadata.fundName || null,
          tradingName: dbMetadata.tradingName || null,
          classification: dbMetadata.classification || null,
          webSite: dbMetadata.webSite || null,
          positionManager: dbMetadata.positionManager || null,
          quotaCount: dbMetadata.quotaCount || null,
          segment: dbMetadata.segment || null
        };
      }
    } catch {}

    const funds = await this.getCachedFundList();
    const matchedFund = funds.find(
      (f) => f.acronym === acronym || f.acronym === cleanTicker
    );

    if (!matchedFund) {
      return null;
    }

    const payload = Buffer.from(
      JSON.stringify({
        language: 'pt-br',
        idFNET: matchedFund.id ? String(matchedFund.id) : null,
        idCEM: matchedFund.acronym,
        typeFund: matchedFund.fundType || 'FII'
      })
    ).toString('base64');

    const detailUrl = `${this.b3BaseUrl}/fundsListedProxy/Search/GetDetailFund/${payload}`;

    try {
      const response = await fetch(detailUrl, {
        headers: {
          Referer: this.b3RefererUrl,
          'User-Agent': environment.USER_AGENT,
          Accept: 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) return null;

      const detail = await response.json().catch(() => null);
      if (!detail?.cnpj) return null;

      const raw = String(detail.cnpj).replace(/\D/g, '');
      const formattedCnpj =
        raw.length === 14
          ? `${raw.substring(0, 2)}.${raw.substring(2, 5)}.${raw.substring(5, 8)}/${raw.substring(8, 12)}-${raw.substring(12, 14)}`
          : null;

      if (!formattedCnpj) return null;

      const resolved: ResolvedAssetDetails = {
        cnpj: formattedCnpj,
        fundName: detail.fundName || null,
        tradingName: detail.tradingName || null,
        classification: detail.classification || null,
        webSite: detail.webSite || null,
        positionManager: detail.positionManager || null,
        quotaCount: detail.quotaCount || null,
        segment: detail.segment || null
      };

      postgresDatabase
        .query(
          `UPDATE public.assets 
           SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb 
           WHERE ticker = $1`,
          [cleanTicker, JSON.stringify(resolved)]
        )
        .catch(() => {});

      return resolved;
    } catch {
      return null;
    }
  }

  public async fetchAssetDocuments(
    tickerInput: Ticker | string,
    documentCategoryName: string = 'all',
    maximumRecords: number = 10
  ): Promise<AssetDocument[]> {
    const assetTicker = tickerInput instanceof Ticker ? tickerInput : new Ticker(tickerInput);
    const cleanTicker = assetTicker.getSymbol().toUpperCase().trim();
    const categoryIdentifier = (FNET_DOCUMENT_CATEGORIES as any)[documentCategoryName] || 0;

    const details = await this.resolveAssetDetails(cleanTicker);
    if (!details?.cnpj) {
      return [];
    }

    const requestUrl = new URL(
      'fnet/publico/pesquisarGerenciadorDocumentosDados',
      this.baseUrl
    );

    requestUrl.searchParams.append('s', '0');
    requestUrl.searchParams.append('l', String(maximumRecords));
    requestUrl.searchParams.append('o[0][dataReferencia]', 'desc');
    requestUrl.searchParams.append('cnpj', details.cnpj);
    requestUrl.searchParams.append('cnpjFundo', details.cnpj);
    requestUrl.searchParams.append('idCategoriaDocumento', String(categoryIdentifier));
    requestUrl.searchParams.append('idTipoDocumento', '0');
    requestUrl.searchParams.append('idEspecieDocumento', '0');
    requestUrl.searchParams.append('situacao', 'A');
    requestUrl.searchParams.append('isSession', 'false');
    requestUrl.searchParams.append('d', '11');
    requestUrl.searchParams.append('_', String(Date.now()));

    try {
      const response = await fetch(requestUrl.toString(), {
        headers: {
          Referer: `${this.baseUrl}/fnet/publico/abrirGerenciadorDocumentosCVM`,
          'User-Agent': environment.USER_AGENT,
          Accept: 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(this.requestTimeoutMilliseconds)
      });

      if (!response.ok) {
        return [];
      }

      const responseData = await response.json().catch(() => null);
      const documentItems = responseData?.data;
      if (!Array.isArray(documentItems)) {
        return [];
      }

      return documentItems.map((doc: any) => {
        const docDescription =
          doc.tipoDocumento ||
          doc.descricaoTipoDocumento ||
          doc.categoriaDocumento ||
          doc.especieDocumento ||
          'Comunicado CVM FNet';

        return new AssetDocument({
          documentIdentifier: doc.id,
          referenceDate: doc.dataReferencia || doc.dataEntrega || '',
          documentDownloadUrl: `${this.baseUrl}/fnet/publico/downloadDocumento?id=${doc.id}&cvm=true`,
          documentDescription: docDescription,
          documentCategoryName: doc.categoriaDocumento || documentCategoryName,
          documentCategoryId: categoryIdentifier
        });
      });
    } catch (error: any) {
      LoggerUtils.error(`FnetDocumentProvider error for ${cleanTicker}: ${error?.message || error}`);
      return [];
    }
  }

  public async parseDividendAnnouncementXml(
    documentIdentifier: number,
    targetTickerSymbol?: string
  ): Promise<{ dividendAmount: string; baseRecordDate: string; paymentDistributionDate: string } | null> {
    try {
      const requestUrl = `${this.baseUrl}/fnet/publico/downloadDocumento?id=${documentIdentifier}`;
      const response = await fetch(requestUrl, {
        headers: {
          'User-Agent': environment.USER_AGENT
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) return null;

      const responseText = await response.text();
      if (!responseText.trim().startsWith('<')) {
        return null;
      }

      const parsedXmlData = this.xmlParser.parse(responseText);
      const paymentEvents = parsedXmlData.DadosEconomicoFinanceiros?.InformeRendimentos?.Provento;
      if (!paymentEvents) {
        return null;
      }

      const eventList = Array.isArray(paymentEvents) ? paymentEvents : [paymentEvents];
      const normalizedTargetTicker = targetTickerSymbol?.toUpperCase();

      for (const event of eventList) {
        const tradingCode = event.CodNegociacao?.toString().toUpperCase();
        if (normalizedTargetTicker && tradingCode !== normalizedTargetTicker) {
          continue;
        }

        const incomeData = event.Rendimento;
        if (!incomeData || !incomeData.ValorProvento) {
          continue;
        }

        return {
          dividendAmount: incomeData.ValorProvento.toString().trim(),
          baseRecordDate: incomeData.DataBase?.toString().trim() ?? '-',
          paymentDistributionDate: incomeData.DataPagamento?.toString().trim() ?? '-'
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const fnetDocumentProvider = new FnetDocumentProvider();
