import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { ValidationError, NotFoundError, ForbiddenError, ExternalServiceError } from '../../domain/errors/AppError';

export interface UpsertAlertRuleInput {
  ticker: string;
  minimumTargetPrice?: number | null;
  maximumTargetPrice?: number | null;
  variationPercentageThreshold?: number | null;
  targetDividendYield?: number | null;
  isPriceAlertEnabled?: boolean;
  isDividendAlertEnabled?: boolean;
  isMaterialFactAlertEnabled?: boolean;
  isReportAlertEnabled?: boolean;
  isPublicOfferingAlertEnabled?: boolean;
  isGordonPriceAlertEnabled?: boolean;
  isActive?: boolean;
}

export interface TreasuryRuleInput {
  name: string;
  enabled?: boolean;
  variation?: number | null;
}

export class ManageAlertRulesUseCase {
  public async retrieveRules(userId: string): Promise<any[]> {
    const { data: records, error } = await supabaseAdmin
      .from('asset_alert_rules')
      .select('id, asset_id, alert_price_min, alert_price_max, is_notify_price, alert_variation_pct, is_notify_dividend, is_notify_material_fact, is_notify_report, is_notify_public_offering, is_alert_gordon_price, alert_target_yield, is_alert_enabled, created_at, assets!inner(ticker)')
      .eq('user_id', userId);

    if (error) {
      throw new ExternalServiceError('Failed to retrieve user alert rules');
    }

    const mappedRules = (records || []).map((record) => {
      const assetRelationship = record.assets as any;
      return {
        id: record.id,
        ticker: assetRelationship?.ticker,
        alertPriceMin: record.alert_price_min,
        alertPriceMax: record.alert_price_max,
        alertPriceChangePct: record.alert_variation_pct,
        notifyPrice: Boolean(record.is_notify_price),
        notifyDividend: Boolean(record.is_notify_dividend),
        notifyMaterialFact: Boolean(record.is_notify_material_fact),
        notifyReport: Boolean(record.is_notify_report),
        notifyPublicOffering: Boolean(record.is_notify_public_offering),
        alertGordonPrice: Boolean(record.is_alert_gordon_price),
        alertTargetYield: record.alert_target_yield,
        enabled: Boolean(record.is_alert_enabled),
        createdAt: record.created_at
      };
    });

    return mappedRules.sort((firstRule, secondRule) =>
      firstRule.ticker.localeCompare(secondRule.ticker)
    );
  }

  public async upsertRule(userId: string, input: UpsertAlertRuleInput): Promise<{ ticker: string; id?: string }> {
    const trimmedTicker = input.ticker?.trim().toUpperCase();
    if (!trimmedTicker) {
      throw new ValidationError('Ticker symbol is required');
    }

    const { data: assetRecord } = await supabaseAdmin
      .from('assets')
      .select('id')
      .eq('ticker', trimmedTicker)
      .maybeSingle();

    if (!assetRecord) {
      throw new NotFoundError(`Asset with ticker ${trimmedTicker} was not found`);
    }

    const variationThreshold = input.variationPercentageThreshold;
    if (variationThreshold != null && variationThreshold < 0.1) {
      throw new ValidationError('Minimum allowed price variation threshold is 0.10%');
    }

    const { data: existingRuleRecord } = await supabaseAdmin
      .from('asset_alert_rules')
      .select('id')
      .eq('user_id', userId)
      .eq('asset_id', assetRecord.id)
      .maybeSingle();

    const payload = {
      alert_price_min: input.minimumTargetPrice ?? null,
      alert_price_max: input.maximumTargetPrice ?? null,
      alert_variation_pct: variationThreshold ?? null,
      alert_target_yield: input.targetDividendYield ?? null,
      is_notify_price: Boolean(input.isPriceAlertEnabled),
      is_notify_dividend: Boolean(input.isDividendAlertEnabled),
      is_notify_material_fact: Boolean(input.isMaterialFactAlertEnabled),
      is_notify_report: Boolean(input.isReportAlertEnabled),
      is_notify_public_offering: Boolean(input.isPublicOfferingAlertEnabled),
      is_alert_gordon_price: Boolean(input.isGordonPriceAlertEnabled),
      is_alert_enabled: input.isActive !== undefined ? Boolean(input.isActive) : true
    };

    if (existingRuleRecord) {
      const { error: updateError } = await supabaseAdmin
        .from('asset_alert_rules')
        .update(payload)
        .eq('id', existingRuleRecord.id);

      if (updateError) {
        throw new ExternalServiceError('Failed to update alert rule');
      }

      return { id: existingRuleRecord.id, ticker: trimmedTicker };
    }

    const [userRecordResult, countRecordResult] = await Promise.all([
      supabaseAdmin.from('users').select('privilege, rule_limit').eq('id', userId).maybeSingle(),
      supabaseAdmin.from('asset_alert_rules').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    const userPrivilege = userRecordResult.data?.privilege || 'user';
    const maximumAllowedRules = userRecordResult.data?.rule_limit ?? 20;
    const currentRuleCount = countRecordResult.count || 0;

    if (userPrivilege !== 'admin' && currentRuleCount >= maximumAllowedRules) {
      throw new ForbiddenError(
        `Account alert limit of ${maximumAllowedRules} rules reached. Remove an existing rule to add a new one.`
      );
    }

    const { data: insertedRecord, error: insertionError } = await supabaseAdmin
      .from('asset_alert_rules')
      .insert({
        user_id: userId,
        asset_id: assetRecord.id,
        ...payload,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertionError) {
      throw new ExternalServiceError('Failed to create alert rule');
    }

    return { id: insertedRecord.id, ticker: trimmedTicker };
  }

  public async deleteRule(userId: string, ruleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('asset_alert_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) {
      throw new ExternalServiceError('Failed to remove alert rule');
    }
  }

  public async toggleRule(userId: string, ruleId: string, isActive: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('asset_alert_rules')
      .update({ is_alert_enabled: Boolean(isActive) })
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) {
      throw new ExternalServiceError('Failed to toggle alert rule status');
    }
  }

  public async retrieveHistory(userId: string, maximumItems: number = 30): Promise<any[]> {
    const [assetAlertHistoryResult, treasuryAlertHistoryResult] = await Promise.all([
      supabaseAdmin
        .from('asset_alert_history')
        .select('id, asset_id, alert_type, message, sent_at, assets!left(ticker)')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(maximumItems),
      supabaseAdmin
        .from('treasury_alert_history')
        .select('id, alert_type, message, sent_at')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false, nullsFirst: false })
        .limit(maximumItems)
    ]);

    const combinedHistory: any[] = [];

    for (const record of assetAlertHistoryResult.data || []) {
      const assetRelationship = record.assets as any;
      combinedHistory.push({
        id: record.id,
        assetId: record.asset_id,
        alertType: record.alert_type,
        message: record.message,
        sentAt: record.sent_at,
        ticker: assetRelationship?.ticker || 'UNKNOWN'
      });
    }

    for (const record of treasuryAlertHistoryResult.data || []) {
      combinedHistory.push({
        id: 'treasury:' + String(record.id),
        assetId: null,
        alertType: record.alert_type || 'TREASURY',
        message: record.message || '',
        sentAt: record.sent_at,
        ticker: 'Tesouro Direto'
      });
    }

    combinedHistory.sort((firstItem, secondItem) => {
      const firstTimestamp = firstItem.sentAt || '9999';
      const secondTimestamp = secondItem.sentAt || '9999';
      return secondTimestamp.localeCompare(firstTimestamp);
    });

    return combinedHistory.slice(0, maximumItems);
  }

  public async retrieveTreasuryRules(userId: string): Promise<{ rules: any[]; bonds: string[] }> {
    const { data: records, error } = await supabaseAdmin
      .from('treasury_alert_rules')
      .select('id, treasury(name), is_alert_enabled, alert_variation_pct')
      .eq('user_id', userId);

    if (error) {
      throw new ExternalServiceError('Failed to retrieve Treasury alert rules');
    }

    const mappedRules = (records || [])
      .map((record: any) => ({
        id: String(record.id),
        name: String(record.treasury?.name || '').trim(),
        enabled: Boolean(record.is_alert_enabled),
        variation: record.alert_variation_pct != null ? Number(record.alert_variation_pct) : null
      }))
      .filter((rule) => rule.name.length > 0)
      .sort((firstRule, secondRule) => firstRule.name.localeCompare(secondRule.name));

    const enabledBondNames = mappedRules.filter((rule) => rule.enabled).map((rule) => rule.name);

    return {
      rules: mappedRules,
      bonds: enabledBondNames
    };
  }

  public async updateTreasuryRules(userId: string, rawBondsInput: any[]): Promise<any> {
    if (!Array.isArray(rawBondsInput)) {
      throw new ValidationError('bonds field must be an array of Treasury bonds');
    }

    const sanitizedRules: Array<{ name: string; enabled: boolean; variation: number | null }> = [];

    for (const item of rawBondsInput) {
      if (typeof item === 'string' && item.trim().length > 0) {
        sanitizedRules.push({ name: item.trim(), enabled: true, variation: null });
      } else if (item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim().length > 0) {
        const rawVariation = item.variation != null ? parseFloat(String(item.variation).replace(',', '.')) : null;
        sanitizedRules.push({
          name: item.name.trim(),
          enabled: item.enabled !== false,
          variation: isNaN(rawVariation as number) ? null : rawVariation
        });
      }
    }

    for (const rule of sanitizedRules) {
      if (rule.variation != null && rule.variation < 0.1) {
        throw new ValidationError('Minimum allowed Treasury variation threshold is 0.10%');
      }
    }

    const uniqueRulesByName = Array.from(
      new Map(sanitizedRules.map((rule) => [rule.name, rule])).values()
    );

    const targetNames = uniqueRulesByName.map((rule) => rule.name);
    const { data: existingBonds } = await supabaseAdmin
      .from('treasury')
      .select('id, name')
      .in('name', targetNames);

    const bondIdentifierByName = new Map<string, string>();
    for (const bondRecord of existingBonds || []) {
      bondIdentifierByName.set(String(bondRecord.name), String(bondRecord.id));
    }

    const missingBondNames = uniqueRulesByName.filter((rule) => !bondIdentifierByName.has(rule.name));
    if (missingBondNames.length > 0) {
      const { data: insertedBonds } = await supabaseAdmin
        .from('treasury')
        .insert(missingBondNames.map((rule) => ({ name: rule.name })))
        .select('id, name');

      for (const insertedRecord of insertedBonds || []) {
        bondIdentifierByName.set(String(insertedRecord.name), String(insertedRecord.id));
      }
    }

    await supabaseAdmin.from('treasury_alert_rules').delete().eq('user_id', userId);

    if (uniqueRulesByName.length > 0) {
      const insertionPayload = uniqueRulesByName
        .map((rule) => ({
          user_id: userId,
          treasury_id: bondIdentifierByName.get(rule.name),
          is_alert_enabled: rule.enabled,
          alert_variation_pct: rule.variation
        }))
        .filter((rule) => Boolean(rule.treasury_id));

      if (insertionPayload.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('treasury_alert_rules')
          .insert(insertionPayload);

        if (insertError) {
          throw new ExternalServiceError('Failed to save Treasury alert rules');
        }
      }
    }

    return {
      rules: uniqueRulesByName,
      bonds: uniqueRulesByName.filter((rule) => rule.enabled).map((rule) => rule.name)
    };
  }
}
