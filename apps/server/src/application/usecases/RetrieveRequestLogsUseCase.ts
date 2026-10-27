import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';

export interface RequestLogsSummary {
  period: string;
  totalRequests: number;
  averageDurationMs: number;
  requestsByEndpoint: Record<string, number>;
  requestsByMethod: Record<string, number>;
}

export class RetrieveRequestLogsUseCase {
  public async execute(userId: string, periodString: string = 'month'): Promise<RequestLogsSummary> {
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

    const logRecordsResult = await postgresDatabase.query(
      `SELECT endpoint, method, duration_ms
       FROM public.request_logs
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, calculatedSinceDate.toISOString()]
    );

    const records = logRecordsResult.rows || [];
    const requestsByEndpoint: Record<string, number> = {};
    const requestsByMethod: Record<string, number> = {};
    let totalDuration = 0;

    for (const record of records) {
      const endpoint = record.endpoint || 'unknown';
      const method = record.method || 'GET';
      const duration = Number(record.duration_ms) || 0;

      requestsByEndpoint[endpoint] = (requestsByEndpoint[endpoint] || 0) + 1;
      requestsByMethod[method] = (requestsByMethod[method] || 0) + 1;
      totalDuration += duration;
    }

    const averageDurationMs = records.length > 0 ? Math.round(totalDuration / records.length) : 0;

    return {
      period: periodString,
      totalRequests: records.length,
      averageDurationMs,
      requestsByEndpoint,
      requestsByMethod
    };
  }
}
