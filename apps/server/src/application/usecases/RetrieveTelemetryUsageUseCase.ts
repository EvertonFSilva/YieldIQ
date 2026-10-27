import { supabaseAdmin } from '../../infrastructure/database/SupabaseClient';

export interface TelemetryUsageSummary {
  period: string;
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  requestsByMethod: Record<string, number>;
}

export class RetrieveTelemetryUsageUseCase {
  public async execute(userId: string, periodString: string = 'month'): Promise<TelemetryUsageSummary> {
    const currentTimestamp = new Date();
    let calculatedSinceDate: Date;

    switch (periodString) {
      case 'day':
        calculatedSinceDate = new Date(currentTimestamp.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        calculatedSinceDate = new Date(currentTimestamp.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        calculatedSinceDate = new Date(currentTimestamp.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data: usageRecords } = await supabaseAdmin
      .from('api_telemetry')
      .select('endpoint, method')
      .eq('user_id', userId)
      .gte('created_at', calculatedSinceDate.toISOString());

    const records = usageRecords || [];
    const requestsByEndpoint: Record<string, number> = {};
    const requestsByMethod: Record<string, number> = {};

    for (const record of records) {
      const endpoint = record.endpoint || 'unknown';
      const method = record.method || 'GET';

      requestsByEndpoint[endpoint] = (requestsByEndpoint[endpoint] || 0) + 1;
      requestsByMethod[method] = (requestsByMethod[method] || 0) + 1;
    }

    return {
      period: periodString,
      totalRequests: records.length,
      requestsByEndpoint,
      requestsByMethod
    };
  }
}
