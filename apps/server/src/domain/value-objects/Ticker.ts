import { ValidationError } from '../errors/AppError';

export class Ticker {
  private readonly symbol: string;

  constructor(rawSymbol: string) {
    if (!rawSymbol || typeof rawSymbol !== 'string') {
      throw new ValidationError('Asset ticker symbol is required');
    }

    const cleanSymbol = rawSymbol.trim().toUpperCase();

    if (!/^[A-Z]{4}(11|12|13|14|B)$/.test(cleanSymbol) && !/^[A-Z0-9]{4,6}$/.test(cleanSymbol)) {
      throw new ValidationError(`Invalid ticker symbol format: "${cleanSymbol}"`);
    }

    this.symbol = cleanSymbol;
  }

  public getSymbol(): string {
    return this.symbol;
  }

  public toYahooFinanceSymbol(): string {
    return `${this.symbol}.SA`;
  }

  public equals(otherTicker: Ticker): boolean {
    return this.symbol === otherTicker.symbol;
  }

  public toString(): string {
    return this.symbol;
  }
}
