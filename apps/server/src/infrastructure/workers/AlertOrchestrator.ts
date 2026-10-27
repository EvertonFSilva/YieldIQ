import { priceAlertWorker } from './PriceAlertWorker';
import { dividendAlertWorker } from './DividendAlertWorker';
import { documentAlertWorker } from './DocumentAlertWorker';
import { treasuryAlertWorker } from './TreasuryAlertWorker';
import { marketCloseSummaryWorker } from './MarketCloseSummaryWorker';
import { LoggerUtils } from '../utils/Logger';

export class AlertOrchestrator {
  private isOrchestratorRunning: boolean = false;
  private priceMonitoringInterval: NodeJS.Timeout | null = null;
  private documentMonitoringInterval: NodeJS.Timeout | null = null;
  private dividendMonitoringInterval: NodeJS.Timeout | null = null;
  private treasuryMonitoringInterval: NodeJS.Timeout | null = null;
  private marketCloseInterval: NodeJS.Timeout | null = null;

  public start(): void {
    if (this.isOrchestratorRunning) {
      return;
    }

    this.isOrchestratorRunning = true;
    LoggerUtils.info('AlertOrchestrator started');

    this.priceMonitoringInterval = setInterval(() => {
      priceAlertWorker.executeCycle().catch((error) => {
        LoggerUtils.error('Error during scheduled PriceAlertWorker execution', error, 'AlertOrchestrator');
      });
    }, 60 * 1000);

    this.documentMonitoringInterval = setInterval(() => {
      documentAlertWorker.executeCycle().catch((error) => {
        LoggerUtils.error('Error during scheduled DocumentAlertWorker execution', error, 'AlertOrchestrator');
      });
    }, 180 * 1000);

    this.dividendMonitoringInterval = setInterval(() => {
      dividendAlertWorker.executeCycle().catch((error) => {
        LoggerUtils.error('Error during scheduled DividendAlertWorker execution', error, 'AlertOrchestrator');
      });
    }, 300 * 1000);

    this.treasuryMonitoringInterval = setInterval(() => {
      treasuryAlertWorker.executeCycle().catch((error) => {
        LoggerUtils.error('Error during scheduled TreasuryAlertWorker execution', error, 'AlertOrchestrator');
      });
    }, 300 * 1000);

    this.marketCloseInterval = setInterval(() => {
      marketCloseSummaryWorker.executeCycle().catch((error) => {
        LoggerUtils.error('Error during scheduled MarketCloseSummaryWorker execution', error, 'AlertOrchestrator');
      });
    }, 60 * 1000);
  }

  public stop(): void {
    if (!this.isOrchestratorRunning) {
      return;
    }

    if (this.priceMonitoringInterval) {
      clearInterval(this.priceMonitoringInterval);
      this.priceMonitoringInterval = null;
    }

    if (this.documentMonitoringInterval) {
      clearInterval(this.documentMonitoringInterval);
      this.documentMonitoringInterval = null;
    }

    if (this.dividendMonitoringInterval) {
      clearInterval(this.dividendMonitoringInterval);
      this.dividendMonitoringInterval = null;
    }

    if (this.treasuryMonitoringInterval) {
      clearInterval(this.treasuryMonitoringInterval);
      this.treasuryMonitoringInterval = null;
    }

    if (this.marketCloseInterval) {
      clearInterval(this.marketCloseInterval);
      this.marketCloseInterval = null;
    }

    this.isOrchestratorRunning = false;
    LoggerUtils.info('AlertOrchestrator stopped');
  }
}

export const alertOrchestrator = new AlertOrchestrator();
