import axios from 'axios';
import { IDividendProvider } from '../../domain/ports/IDividendProvider';
import { Dividend } from '../../domain/entities/Dividend';
import { Ticker } from '../../domain/value-objects/Ticker';
import { ExternalProvider } from '../../domain/enums/ExternalProvider';
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
    const tickerSymbol = assetTicker.getSymbol();
    const seriesSuffix = tickerSymbol.replace(/^[A-Z]+/, '') || '11';

    const payload = {
      language: 'pt-br',
      idCEM: tickerSymbol
    };

    const requestUrl = `${this.baseUrl}/fundsListedProxy/Search/GetEventsCorporateActions/${this.encodePayload(payload)}`;

    try {
      const response = await axios.get(requestUrl, {
        timeout: this.requestTimeoutMilliseconds,
        headers: {
          'Referer': this.refererUrl,
          'User-Agent': environment.USER_AGENT,
          'Accept': 'application/json'
        }
      });

      const cashDividends = response.data?.cashDividends;
      if (!Array.isArray(cashDividends)) {
        return [];
      }

      const dividendList: Dividend[] = [];
      for (const dividendItem of cashDividends) {
        if (dividendList.length >= maximumRecords) {
          break;
        }

        const isMatchingSeries = !dividendItem.assetIssued || 
          dividendItem.assetIssued.endsWith(seriesSuffix) || 
          dividendItem.assetIssued === seriesSuffix;

        if (!isMatchingSeries) {
          continue;
        }

        const dividendAmount = dividendItem.rate || dividendItem.paymentAmount || 0;
        const baseRecordDate = dividendItem.lastDatePrior || dividendItem.approvedOn || '';
        const paymentDistributionDate = dividendItem.paymentDate || '';

        if (dividendAmount > 0) {
          dividendList.push(new Dividend({
            dividendValue: dividendAmount,
            baseRecordDate,
            paymentDistributionDate,
            ratePerShare: dividendAmount
          }));
        }
      }

      return dividendList;
    } catch (error: any) {
      LoggerUtils.error(`B3DividendProvider error for ${tickerSymbol}: ${error.message}`);
      return [];
    }
  }
}

export const b3DividendProvider = new B3DividendProvider();
