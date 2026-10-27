import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';
import { ValidationError, NotFoundError, ForbiddenError, ExternalServiceError } from '../../domain/errors/AppError';

export interface UpsertAlertRuleInput {
  ticker: string;
  minimumTargetPrice?: number | null;
  maximumTargetPrice?: number | null;
  variationPercentageThreshold?: number | null;
  isPriceAlertEnabled?: boolean;
  isDividendAlertEnabled?: boolean;
  isMaterialFactAlertEnabled?: boolean;
  isReportAlertEnabled?: boolean;
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
      .from('alert_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('target_type', 'ASSET');

    if (error) {
      throw new ExternalServiceError('Failed to retrieve user alert rules');
    }

    const mappedRules = (records || []).map((record) => {
      return {
        id: record.id,
        ticker: record.target_symbol,
        alertPriceMin: record.price_target_min,
        alertPriceMax: record.price_target_max,
        alertPriceChangePct: record.variation_step_percent,
        notifyPrice: Boolean(record.notify_price),
        notifyDividend: Boolean(record.notify_dividend),
        notifyMaterialFact: Boolean(record.notify_document),
        notifyReport: Boolean(record.notify_document),
        enabled: Boolean(record.is_active),
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
      .select('id, ticker')
      .eq('ticker', trimmedTicker)
      .maybeSingle();

    if (!assetRecord) {
      throw new NotFoundError(`Asset with ticker ${trimmedTicker} was not found`);
    }

    const variationThreshold = input.variationPercentageThreshold;
    if (variationThreshold != null && variationThreshold < 0.1) {
      throw new ValidationError('Minimum allowed price variation threshold is 0.10%');
    }

    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('phone, privilege, rule_limit')
      .eq('id', userId)
      .maybeSingle();

    const destinationPhone = userProfile?.phone || '';

    const { data: existingRuleRecord } = await supabaseAdmin
      .from('alert_rules')
      .select('id')
      .eq('user_id', userId)
      .eq('target_symbol', trimmedTicker)
      .eq('target_type', 'ASSET')
      .maybeSingle();

    const payload = {
      user_id: userId,
      channel_type: 'USER',
      channel_destination: destinationPhone,
      target_type: 'ASSET',
      target_symbol: trimmedTicker,
      price_target_min: input.minimumTargetPrice ?? null,
      price_target_max: input.maximumTargetPrice ?? null,
      variation_step_percent: variationThreshold ?? null,
      notify_price: Boolean(input.isPriceAlertEnabled),
      notify_dividend: Boolean(input.isDividendAlertEnabled),
      notify_document: Boolean(input.isMaterialFactAlertEnabled || input.isReportAlertEnabled),
      is_active: input.isActive !== undefined ? Boolean(input.isActive) : true,
      updated_at: new Date().toISOString()
    };

    if (existingRuleRecord) {
      const { error: updateError } = await supabaseAdmin
        .from('alert_rules')
        .update(payload)
        .eq('id', existingRuleRecord.id);

      if (updateError) {
        throw new ExternalServiceError('Failed to update alert rule');
      }

      return { id: existingRuleRecord.id, ticker: trimmedTicker };
    }

    const maximumAllowedRules = userProfile?.rule_limit ?? 20;
    const { count: currentRuleCount } = await supabaseAdmin
      .from('alert_rules')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (userProfile?.privilege !== 'admin' && (currentRuleCount || 0) >= maximumAllowedRules) {
      throw new ForbiddenError(
        `Account alert limit of ${maximumAllowedRules} rules reached. Remove an existing rule to add a new one.`
      );
    }

    const { data: insertedRecord, error: insertionError } = await supabaseAdmin
      .from('alert_rules')
      .insert({
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
      .from('alert_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) {
      throw new ExternalServiceError('Failed to remove alert rule');
    }
  }

  public async toggleRule(userId: string, ruleId: string, isActive: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('alert_rules')
      .update({ is_active: Boolean(isActive), updated_at: new Date().toISOString() })
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) {
      throw new ExternalServiceError('Failed to toggle alert rule status');
    }
  }

  public async retrieveHistory(userId: string, maximumItems: number = 30): Promise<any[]> {
    const { data: records, error } = await supabaseAdmin
      .from('alert_logs')
      .select('id, target_symbol, alert_type, message, sent_at')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(maximumItems);

    if (error) {
      throw new ExternalServiceError('Failed to retrieve alert history');
    }

    return (records || []).map((record) => ({
      id: record.id,
      ticker: record.target_symbol,
      alertType: record.alert_type,
      message: record.message,
      sentAt: record.sent_at
    }));
  }

  public async retrieveTreasuryRules(userId: string): Promise<{ rules: any[]; bonds: string[] }> {
    const { data: records, error } = await supabaseAdmin
      .from('alert_rules')
      .select('id, target_symbol, is_active, variation_step_percent')
      .eq('user_id', userId)
      .eq('target_type', 'TREASURY');

    if (error) {
      throw new ExternalServiceError('Failed to retrieve Treasury alert rules');
    }

    const mappedRules = (records || [])
      .map((record) => ({
        id: String(record.id),
        name: record.target_symbol,
        enabled: Boolean(record.is_active),
        variation: record.variation_step_percent != null ? Number(record.variation_step_percent) : null
      }))
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

    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', userId)
      .maybeSingle();

    const destinationPhone = userProfile?.phone || '';

    await supabaseAdmin
      .from('alert_rules')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', 'TREASURY');

    if (uniqueRulesByName.length > 0) {
      const insertionPayload = uniqueRulesByName.map((rule) => ({
        user_id: userId,
        channel_type: 'USER',
        channel_destination: destinationPhone,
        target_type: 'TREASURY',
        target_symbol: rule.name,
        variation_step_percent: rule.variation,
        is_active: rule.enabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('alert_rules')
        .insert(insertionPayload);

      if (insertError) {
        throw new ExternalServiceError('Failed to save Treasury alert rules');
      }
    }

    return {
      rules: uniqueRulesByName,
      bonds: uniqueRulesByName.filter((rule) => rule.enabled).map((rule) => rule.name)
    };
  }
}
