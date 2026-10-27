import axios from 'axios';
import { ITreasuryProvider } from '../../domain/ports/ITreasuryProvider';
import { TreasuryBond } from '../../domain/entities/TreasuryBond';
import { environment } from '../../config/env';
import { LoggerUtils } from '../utils/Logger';

const TREASURY_INVESTMENT_ENDPOINT = '/o/rentabilidade/investir';

export class TreasuryDirectProvider implements ITreasuryProvider {
  private readonly baseUrl: string;
  private readonly requestTimeoutMilliseconds: number;

  constructor() {
    this.baseUrl = environment.TREASURY_BASE_URL;
    this.requestTimeoutMilliseconds = environment.HTTP_DEFAULT_TIMEOUT_MS;
  }

  public async fetchTreasuryBonds(): Promise<TreasuryBond[]> {
    try {
      const requestUrl = `${this.baseUrl}${TREASURY_INVESTMENT_ENDPOINT}`;
      const response = await axios.get(requestUrl, {
        timeout: this.requestTimeoutMilliseconds,
        headers: {
          'Accept': 'application/json',
          'User-Agent': environment.USER_AGENT
        }
      });

      const responseData = response.data;
      const bondCategories = [responseData?.TesouroLegado, responseData?.Tesouro24x7];
      const processedBondKeys = new Set<string>();
      const treasuryBonds: TreasuryBond[] = [];

      for (const categoryList of bondCategories) {
        if (!Array.isArray(categoryList)) {
          continue;
        }

        for (const bondItem of categoryList) {
          const bondName = String(bondItem?.treasuryBondName || '').trim();
          const bondKey = String(bondItem?.treasuryBondCode || bondItem?.isinCode || '').trim() || bondName;

          if (!bondKey || !bondName || processedBondKeys.has(bondKey)) {
            continue;
          }

          if (bondName.includes('Selic 2031') || 
              bondName.includes('Reserva 2036') || 
              bondName.includes('Reserva 2026') || 
              bondName.includes('Educa+')) {
            continue;
          }

          processedBondKeys.add(bondKey);

          const profitabilityRawText = String(bondItem?.investmentProfitabilityIndexerName || '').trim();
          const percentageMatch = profitabilityRawText.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
          let profitabilityRate = 0;
          let indexerName = '';

          if (percentageMatch) {
            const numericString = percentageMatch[1].replace(/\./g, '').replace(',', '.');
            profitabilityRate = parseFloat(numericString) || 0;
            indexerName = profitabilityRawText.slice(0, percentageMatch.index).replace(/\s*\+\s*$/, '').trim();
          }

          const unitPrice = typeof bondItem?.unitaryInvestmentValue === 'number' && bondItem.unitaryInvestmentValue > 0
            ? bondItem.unitaryInvestmentValue
            : null;

          treasuryBonds.push(new TreasuryBond({
            bondKey,
            bondName,
            indexerName,
            profitabilityRateRaw: profitabilityRawText,
            profitabilityRate: Math.round(profitabilityRate * 10000) / 10000,
            unitPrice,
            maturityFormattedDate: this.formatMaturityDate(bondItem?.maturityDate)
          }));
        }
      }

      return treasuryBonds;
    } catch (error: any) {
      LoggerUtils.error(`TreasuryDirectProvider error: ${error.message}`);
      return [];
    }
  }

  private formatMaturityDate(rawDate?: string | null): string | null {
    if (!rawDate) {
      return null;
    }
    const isoMatch = String(rawDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    return String(rawDate);
  }
}

export const treasuryDirectProvider = new TreasuryDirectProvider();
