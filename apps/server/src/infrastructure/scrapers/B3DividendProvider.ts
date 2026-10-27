import { IDividendProvider } from '../../domain/ports/IDividendProvider';
import { Dividend } from '../../domain/entities/Dividend';
import { Ticker } from '../../domain/value-objects/Ticker';
import { environment } from '../../config/env';
import { LoggerUtils } from '../utils/Logger';

export class B3DividendProvider implements IDividendProvider {
  private readonly baseUrl: string;
  private readonly refererUrl: string;
  private readonly requestTimeoutMilliseconds: number;

  constructor() {
    this.baseUrl = environment.B3_BASE_URL;
    this.refererUrl = environment.B3_REFERER_URL;
    this.requestTimeoutMilliseconds = environment.HTTP_DEFAULT_TIMEOUT_MS;
  }

  private encodePayload(payload: Record<string, any>): string {
    return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
  }

  public async fetchAssetDividends(
    tickerInput: Ticker | string,
    maximumRecords: number = 12
  ): Promise<Dividend[]> {
    const assetTicker = tickerInput instanceof Ticker ? tickerInput : new Ticker(tickerInput);
    const cleanTicker = assetTicker.getSymbol().toUpperCase().trim();
    const acronym = cleanTicker.replace(/\d+$/, '');
    const seriesSuffix = cleanTicker.replace(/^[A-Z]+/, '') || '11';

    let rawList: any[] = [];

    for (const idCEM of [cleanTicker, acronym]) {
      const payload = {
        language: 'pt-br',
        idCEM
      };

      const requestUrl = `${this.baseUrl}/fundsListedProxy/Search/GetEventsCorporateActions/${this.encodePayload(payload)}`;

      try {
        const response = await fetch(requestUrl, {
          headers: {
            Referer: this.refererUrl,
            'User-Agent': environment.USER_AGENT,
            Accept: 'application/json'
          },
          signal: AbortSignal.timeout(this.requestTimeoutMilliseconds)
        });

        if (!response.ok) continue;

        const data = await response.json().catch(() => null);
        if (Array.isArray(data?.cashDividends) && data.cashDividends.length > 0) {
          rawList = data.cashDividends;
          break;
        }
      } catch (error: any) {
        LoggerUtils.warn(`B3 event search failed for idCEM ${idCEM}: ${error?.message || error}`);
      }
    }

    if (rawList.length === 0) {
      return [];
    }

    const dividendList: Dividend[] = [];
    for (const dividendItem of rawList) {
      if (dividendList.length >= maximumRecords) {
        break;
      }

      const isin = (dividendItem.isinCode || dividendItem.assetIssued || '').toUpperCase();
      const isMatchingSeries =
        !dividendItem.assetIssued ||
        dividendItem.assetIssued.endsWith(seriesSuffix) ||
        dividendItem.assetIssued === seriesSuffix ||
        isin.includes('CT') ||
        isin.includes('CI') ||
        seriesSuffix === '11';

      if (!isMatchingSeries) {
        continue;
      }

      let dividendAmount = 0;
      if (typeof dividendItem.rate === 'number') {
        dividendAmount = dividendItem.rate;
      } else if (typeof dividendItem.rate === 'string') {
        dividendAmount = parseFloat(dividendItem.rate.replace(/\./g, '').replace(',', '.'));
      } else if (dividendItem.paymentAmount) {
        dividendAmount =
          typeof dividendItem.paymentAmount === 'number'
            ? dividendItem.paymentAmount
            : parseFloat(String(dividendItem.paymentAmount).replace(/\./g, '').replace(',', '.'));
      }

      const baseRecordDate = dividendItem.lastDatePrior || dividendItem.approvedOn || '-';
      const paymentDistributionDate = dividendItem.paymentDate || '-';

      if (dividendAmount > 0 && !isNaN(dividendAmount)) {
        dividendList.push(
          new Dividend({
            dividendValue: dividendAmount,
            baseRecordDate,
            paymentDistributionDate,
            ratePerShare: dividendAmount
          })
        );
      }
    }

    return dividendList;
  }
}

export const b3DividendProvider = new B3DividendProvider();
