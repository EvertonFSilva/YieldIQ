import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { IDocumentProvider } from '../../domain/ports/IDocumentProvider';
import { AssetDocument } from '../../domain/entities/AssetDocument';
import { Ticker } from '../../domain/value-objects/Ticker';
import { environment, FNET_DOCUMENT_CATEGORIES } from '../../config/env';
import { LoggerUtils } from '../utils/Logger';

export class FnetDocumentProvider implements IDocumentProvider {
  private readonly baseUrl: string;
  private readonly refererUrl: string;
  private readonly requestTimeoutMilliseconds: number;
  private readonly xmlParser = new XMLParser({ ignoreAttributes: false });

  constructor() {
    this.baseUrl = environment.FNET_BASE_URL;
    this.refererUrl = environment.FNET_REFERER_URL;
    this.requestTimeoutMilliseconds = environment.HTTP_DEFAULT_TIMEOUT_MS;
  }

  public async fetchAssetDocuments(
    tickerInput: Ticker | string,
    documentCategoryName: string = 'all',
    maximumRecords: number = 10
  ): Promise<AssetDocument[]> {
    const assetTicker = tickerInput instanceof Ticker ? tickerInput : new Ticker(tickerInput);
    const categoryIdentifier = (FNET_DOCUMENT_CATEGORIES as any)[documentCategoryName] || 0;
    const requestUrl = `${this.baseUrl}/fnet/publico/pesquisarGerenciadorDocumentosDados`;

    try {
      const response = await axios.get(requestUrl, {
        params: {
          s: 0,
          l: maximumRecords,
          'o[0][dataReferencia]': 'desc',
          idCategoriaDocumento: categoryIdentifier,
          situacao: 'A',
          isSession: 'false',
          _: Date.now()
        },
        timeout: this.requestTimeoutMilliseconds,
        headers: {
          'Referer': this.refererUrl,
          'User-Agent': environment.USER_AGENT
        }
      });

      const documentItems = response.data?.data;
      if (!Array.isArray(documentItems)) {
        return [];
      }

      return documentItems.map((documentData: any) => new AssetDocument({
        documentIdentifier: documentData.id,
        referenceDate: documentData.dataReferencia || documentData.dataHoraEnvio || '',
        documentDownloadUrl: `${this.baseUrl}/fnet/publico/downloadDocumento?id=${documentData.id}&cvm=true`,
        documentDescription: documentData.descricaoTipoDocumento || documentData.especieDocumento || 'Document',
        documentCategoryName,
        documentCategoryId: categoryIdentifier
      }));
    } catch (error: any) {
      LoggerUtils.error(`FnetDocumentProvider error for ${assetTicker.getSymbol()}: ${error.message}`);
      return [];
    }
  }

  public async parseDividendAnnouncementXml(
    documentIdentifier: number,
    targetTickerSymbol?: string
  ): Promise<{ dividendAmount: string; baseRecordDate: string; paymentDistributionDate: string } | null> {
    try {
      const requestUrl = `${this.baseUrl}/fnet/publico/downloadDocumento?id=${documentIdentifier}`;
      const response = await axios.get(requestUrl, {
        timeout: 30000,
        headers: { 'User-Agent': environment.USER_AGENT }
      });

      const responseText = typeof response.data === 'string' ? response.data : String(response.data);
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

  public async parseSubscriptionXml(documentIdentifier: number): Promise<{
    subscriptionPrice: number | null;
    subscriptionPercentage: number | null;
    issueNumber: number | null;
    totalAmount: number | null;
    periodStart: string | null;
    periodEnd: string | null;
    settlementDate: string | null;
    cutoffDate: string | null;
    canSellRights: boolean | null;
    hasLeftovers: boolean | null;
  } | null> {
    try {
      const requestUrl = `${this.baseUrl}/fnet/publico/downloadDocumento?id=${documentIdentifier}`;
      const response = await axios.get(requestUrl, {
        timeout: 30000,
        headers: { 'User-Agent': environment.USER_AGENT }
      });

      const responseText = typeof response.data === 'string' ? response.data : String(response.data);
      if (!responseText.trim().startsWith('<')) {
        return null;
      }

      const parsedXmlData = this.xmlParser.parse(responseText);
      const subscriptionRoot = parsedXmlData.DireitoPreferenciaSubscricaoCotas;
      if (!subscriptionRoot) {
        return null;
      }

      const parseNumber = (rawValue: any): number | null => {
        if (rawValue == null || rawValue === '') return null;
        const parsedFloat = parseFloat(String(rawValue).replace(',', '.'));
        return isNaN(parsedFloat) ? null : parsedFloat;
      };

      const generalData = subscriptionRoot.DadosGerais || {};
      const preferenceData = subscriptionRoot.DireitoPreferencia || {};
      const exerciseWindow = preferenceData.ExercicioDireitoPreferenciaB3 || preferenceData.ExercicioDireitoPreferenciaEscriturador || {};

      return {
        subscriptionPrice: parseNumber(generalData.PrecoSubscricao),
        subscriptionPercentage: parseNumber(generalData.PercentualSubscricao),
        issueNumber: parseNumber(generalData.NumeroEmissao),
        totalAmount: parseNumber(generalData.MontanteTotal),
        cutoffDate: generalData.DataCorte ? String(generalData.DataCorte).trim().slice(0, 10) : null,
        periodStart: exerciseWindow.DtInicioPrazo ? String(exerciseWindow.DtInicioPrazo).trim().slice(0, 10) : null,
        periodEnd: exerciseWindow.DtFimPrazo ? String(exerciseWindow.DtFimPrazo).trim().slice(0, 10) : null,
        settlementDate: preferenceData.DtLiquidacao ? String(preferenceData.DtLiquidacao).trim().slice(0, 10) : null,
        canSellRights: subscriptionRoot.PossuiNegociacaoDireitoPreferencia != null 
          ? String(subscriptionRoot.PossuiNegociacaoDireitoPreferencia).toLowerCase() === 'true' 
          : null,
        hasLeftovers: subscriptionRoot.PossuiSobrasSubscricao != null 
          ? String(subscriptionRoot.PossuiSobrasSubscricao).toLowerCase() === 'true' 
          : null
      };
    } catch {
      return null;
    }
  }
}

export const fnetDocumentProvider = new FnetDocumentProvider();
