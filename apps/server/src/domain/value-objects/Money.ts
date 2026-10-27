export class Money {
  private readonly centsAmount: number;

  constructor(amountInCurrency: number) {
    this.centsAmount = Math.round((amountInCurrency || 0) * 100);
  }

  public static fromCents(centsAmount: number): Money {
    const moneyInstance = new Money(0);
    (moneyInstance as any).centsAmount = Math.round(centsAmount);
    return moneyInstance;
  }

  public getAmount(): number {
    return this.centsAmount / 100;
  }

  public getCentsAmount(): number {
    return this.centsAmount;
  }

  public add(otherMoney: Money): Money {
    return Money.fromCents(this.centsAmount + otherMoney.centsAmount);
  }

  public subtract(otherMoney: Money): Money {
    return Money.fromCents(this.centsAmount - otherMoney.centsAmount);
  }

  public multiply(factor: number): Money {
    return Money.fromCents(Math.round(this.centsAmount * factor));
  }

  public divide(divisor: number): Money {
    if (divisor === 0) {
      return new Money(0);
    }
    return Money.fromCents(Math.round(this.centsAmount / divisor));
  }

  public formatBrazilianReal(): string {
    return 'R$ ' + this.getAmount().toFixed(2).replace('.', ',');
  }

  public toJSON(): number {
    return this.getAmount();
  }
}
