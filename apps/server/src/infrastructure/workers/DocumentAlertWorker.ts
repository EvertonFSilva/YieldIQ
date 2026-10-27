import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { fnetDocumentProvider } from '../scrapers/FnetDocumentProvider';
import { LoggerUtils } from '../utils/Logger';

interface ActiveDocumentRule {
  id: string;
  userId?: string;
  destination: string;
  ticker: string;
}

export class DocumentAlertWorker {
  private isExecutionInProgress: boolean = false;
  private alertedDocumentIdentifiers = new Set<string>();

  private getSaoPauloDateString(): string {
    const saoPauloDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    );
    const calendarYear = saoPauloDate.getFullYear();
    const calendarMonth = String(saoPauloDate.getMonth() + 1).padStart(2, '0');
    const calendarDay = String(saoPauloDate.getDate()).padStart(2, '0');
    return `${calendarYear}-${calendarMonth}-${calendarDay}`;
  }

  public async executeCycle(): Promise<void> {
    if (this.isExecutionInProgress) {
      return;
    }

    if (!whatsAppService.isConnected()) {
      return;
    }

    this.isExecutionInProgress = true;

    try {
      const { data: records, error } = await supabaseAdmin
        .from('alert_rules')
        .select('*')
        .eq('is_active', true)
        .eq('target_type', 'ASSET');

      if (error || !records || records.length === 0) {
        return;
      }

      const activeRules: ActiveDocumentRule[] = records
        .filter((r) => {
          const settings = r.settings || {};
          return Boolean(r.destination && r.target_symbol && settings.notify_documents !== false);
        })
        .map((r) => ({
          id: r.id,
          userId: r.user_id || undefined,
          destination: r.destination,
          ticker: r.target_symbol
        }));

      if (activeRules.length === 0) {
        return;
      }

      const uniqueTickers = Array.from(new Set(activeRules.map((rule) => rule.ticker)));
      const todayDateString = this.getSaoPauloDateString();

      for (const tickerSymbol of uniqueTickers) {
        try {
          const recentDocuments = await fnetDocumentProvider.fetchAssetDocuments(tickerSymbol, 3);
          if (!recentDocuments || recentDocuments.length === 0) {
            continue;
          }

          for (const documentItem of recentDocuments) {
            const documentIdentifierString = String(documentItem.documentIdentifier);
            const trackingKey = `${tickerSymbol}:${documentIdentifierString}`;

            if (this.alertedDocumentIdentifiers.has(trackingKey)) {
              continue;
            }

            const rawDocumentDate = documentItem.referenceDate || '';
            const isToday =
              rawDocumentDate.includes(todayDateString) ||
              rawDocumentDate.split('/').reverse().join('-') === todayDateString;

            if (!isToday) {
              continue;
            }

            this.alertedDocumentIdentifiers.add(trackingKey);

            const documentCategoryLower = (documentItem.documentCategoryName || '').toLowerCase();
            const documentDescriptionLower = (documentItem.documentDescription || '').toLowerCase();

            const isMaterialFact =
              documentCategoryLower.includes('fato relevante') ||
              documentDescriptionLower.includes('fato relevante');

            const isReport =
              documentCategoryLower.includes('relat') ||
              documentDescriptionLower.includes('relatório');

            const isOffering =
              documentCategoryLower.includes('oferta') ||
              documentDescriptionLower.includes('oferta') ||
              documentDescriptionLower.includes('emissão') ||
              documentDescriptionLower.includes('subscrição');

            const isStatement =
              documentCategoryLower.includes('demonstraç') ||
              documentCategoryLower.includes('informe') ||
              documentDescriptionLower.includes('demonstrações');

            let alertEventType = 'MARKET_ANNOUNCEMENT';
            if (isMaterialFact) {
              alertEventType = 'MATERIAL_FACT';
            } else if (isReport) {
              alertEventType = 'MANAGEMENT_REPORT';
            } else if (isOffering) {
              alertEventType = 'PUBLIC_OFFERING';
            } else if (isStatement) {
              alertEventType = 'FINANCIAL_STATEMENT';
            }

            const headerIcon = isMaterialFact ? '🚨' : isReport ? '📑' : isOffering ? '📢' : '📄';
            const categoryTitle = isMaterialFact
              ? 'FATO RELEVANTE'
              : isReport
              ? 'RELATÓRIO GERENCIAL'
              : isOffering
              ? 'OFERTA PÚBLICA'
              : isStatement
              ? 'DEMONSTRAÇÃO FINANCEIRA'
              : 'COMUNICADO AO MERCADO';

            const documentMessage =
              `${headerIcon} *NOVO DOCUMENTO PUBLICADO - ${tickerSymbol}*\n\n` +
              `📌 Tipo: *${categoryTitle}*\n` +
              `📄 Título: *${documentItem.documentDescription}*\n` +
              `📅 Data de Referência: ${documentItem.referenceDate}\n` +
              `🔗 Visualizar: ${documentItem.documentDownloadUrl}`;

            const matchingRules = activeRules.filter((rule) => rule.ticker === tickerSymbol);

            for (const rule of matchingRules) {
              const destination = rule.destination;
              if (!destination) {
                continue;
              }

              let wasSent = false;
              if (documentItem.documentDownloadUrl) {
                wasSent = await whatsAppService.sendDocument(
                  destination,
                  documentItem.documentDownloadUrl,
                  `${tickerSymbol}_${documentIdentifierString}.pdf`,
                  documentMessage,
                  rule.userId
                );
              }

              if (!wasSent) {
                wasSent = await whatsAppService.sendMessage(destination, documentMessage, rule.userId);
              }

              if (wasSent) {
                supabaseAdmin
                  .from('alert_logs')
                  .insert({
                    rule_id: rule.id,
                    user_id: rule.userId,
                    destination: destination,
                    target_symbol: tickerSymbol,
                    alert_type: alertEventType,
                    message: documentMessage,
                    payload: {
                      document_url: documentItem.documentDownloadUrl,
                      document_category: categoryTitle,
                      document_identifier: documentIdentifierString
                    },
                    sent_at: new Date().toISOString()
                  })
                  .then(undefined, () => {});
              }
            }
          }
        } catch (error) {
          LoggerUtils.error(`Failed to process document cycle for ${tickerSymbol}`, error, 'DocumentAlertWorker');
        }
      }
    } catch (error) {
      LoggerUtils.error('DocumentAlertWorker cycle execution failed', error, 'DocumentAlertWorker');
    } finally {
      this.isExecutionInProgress = false;
    }
  }
}

export const documentAlertWorker = new DocumentAlertWorker();
