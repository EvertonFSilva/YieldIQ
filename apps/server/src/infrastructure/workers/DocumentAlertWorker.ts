import { supabaseAdmin } from '../database/SupabaseClient';
import { whatsAppService } from '../notifications/WhatsAppNotificationService';
import { fnetDocumentProvider } from '../scrapers/FnetDocumentProvider';
import { LoggerUtils } from '../utils/Logger';

interface ActiveDocumentRule {
  id: string;
  userId?: string;
  phoneNumber?: string;
  groupName?: string;
  ticker: string;
  isMaterialFactAlertEnabled?: boolean;
  isReportAlertEnabled?: boolean;
  isPublicOfferingAlertEnabled?: boolean;
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
      const [userRulesResult, groupRulesResult] = await Promise.all([
        supabaseAdmin
          .from('asset_alert_rules')
          .select('id, user_id, is_notify_material_fact, is_notify_report, is_notify_public_offering, is_alert_enabled, assets!inner(ticker), users!inner(phone, is_whatsapp_enabled)')
          .eq('is_alert_enabled', true),
        supabaseAdmin
          .from('admin_group_alerts')
          .select('id, group_name, is_notify_material_fact, is_notify_report, is_notify_public_offering, assets!inner(ticker)')
      ]);

      const activeRules: ActiveDocumentRule[] = [];

      for (const record of userRulesResult.data || []) {
        const userRelationship = record.users as any;
        const assetRelationship = record.assets as any;

        if (
          userRelationship?.is_whatsapp_enabled &&
          userRelationship?.phone &&
          assetRelationship?.ticker &&
          (record.is_notify_material_fact || record.is_notify_report || record.is_notify_public_offering)
        ) {
          activeRules.push({
            id: `user:${record.id}`,
            userId: record.user_id,
            phoneNumber: userRelationship.phone,
            ticker: assetRelationship.ticker,
            isMaterialFactAlertEnabled: Boolean(record.is_notify_material_fact),
            isReportAlertEnabled: Boolean(record.is_notify_report),
            isPublicOfferingAlertEnabled: Boolean(record.is_notify_public_offering)
          });
        }
      }

      for (const record of groupRulesResult.data || []) {
        const assetRelationship = record.assets as any;
        if (
          record.group_name &&
          assetRelationship?.ticker &&
          (record.is_notify_material_fact || record.is_notify_report || record.is_notify_public_offering)
        ) {
          activeRules.push({
            id: `group:${record.id}`,
            groupName: record.group_name,
            ticker: assetRelationship.ticker,
            isMaterialFactAlertEnabled: Boolean(record.is_notify_material_fact),
            isReportAlertEnabled: Boolean(record.is_notify_report),
            isPublicOfferingAlertEnabled: Boolean(record.is_notify_public_offering)
          });
        }
      }

      if (activeRules.length === 0) {
        return;
      }

      const uniqueTickers = Array.from(new Set(activeRules.map((rule) => rule.ticker)));
      const todayDateString = this.getSaoPauloDateString();

      for (const tickerSymbol of uniqueTickers) {
        try {
          const recentDocuments = await fnetDocumentProvider.fetchAssetDocuments(tickerSymbol, 'all', 5);
          if (!recentDocuments || recentDocuments.length === 0) {
            continue;
          }

          for (const documentItem of recentDocuments) {
            const documentIdentifierString = String(documentItem.documentIdentifier);
            const documentPublishedDate = documentItem.referenceDate || '';
            const isToday = documentPublishedDate >= todayDateString;

            if (!isToday) {
              continue;
            }

            if (this.alertedDocumentIdentifiers.has(documentIdentifierString)) {
              continue;
            }

            this.alertedDocumentIdentifiers.add(documentIdentifierString);

            const documentCategoryLower = (documentItem.documentCategoryName || '').toLowerCase();
            const documentDescriptionLower = documentItem.documentDescription.toLowerCase();

            const isMaterialFact =
              documentCategoryLower.includes('fato relevante') ||
              documentDescriptionLower.includes('fato relevante') ||
              documentCategoryLower.includes('comunicado');

            const isReport =
              documentCategoryLower.includes('relat') ||
              documentDescriptionLower.includes('relatório');

            const isOffering =
              documentCategoryLower.includes('oferta') ||
              documentDescriptionLower.includes('subscrição');

            const matchingRules = activeRules.filter((rule) => {
              if (rule.ticker !== tickerSymbol) return false;
              if (isMaterialFact && rule.isMaterialFactAlertEnabled) return true;
              if (isReport && rule.isReportAlertEnabled) return true;
              if (isOffering && rule.isPublicOfferingAlertEnabled) return true;
              return false;
            });

            if (matchingRules.length === 0) {
              continue;
            }

            const headerIcon = isMaterialFact ? '🚨' : isReport ? '📑' : '📢';
            const categoryTitle = isMaterialFact
              ? 'FATO RELEVANTE'
              : isReport
              ? 'RELATÓRIO GERENCIAL'
              : 'OFERTA PÚBLICA / SUBSCRIÇÃO';

            const documentMessage =
              `${headerIcon} *NOVO DOCUMENTO PUBLICADO - ${tickerSymbol}*\n\n` +
              `📌 Tipo: *${categoryTitle}*\n` +
              `📄 Título: *${documentItem.documentDescription}*\n` +
              `📅 Data de Referência: ${documentItem.referenceDate}\n` +
              `🔗 Visualizar: ${documentItem.documentDownloadUrl}`;

            for (const rule of matchingRules) {
              const destination = rule.phoneNumber || rule.groupName;
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

              if (wasSent && rule.userId) {
                supabaseAdmin
                  .from('asset_alert_history')
                  .insert({
                    user_id: rule.userId,
                    alert_type: isMaterialFact ? 'MATERIAL_FACT' : isReport ? 'REPORT' : 'PUBLIC_OFFERING',
                    message: documentMessage,
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
