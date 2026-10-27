import { Pool, QueryResult, QueryResultRow } from 'pg';
import { environment } from '../../config/env';
import { LoggerUtils } from '../utils/Logger';

export class PostgresDatabaseClient {
  private static instance: PostgresDatabaseClient;
  private readonly connectionPool: Pool;

  private constructor() {
    this.connectionPool = new Pool({
      connectionString: environment.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    this.connectionPool.on('error', (unexpectedError) => {
      LoggerUtils.error('Unexpected error on idle PostgreSQL client', unexpectedError, 'DatabasePool');
    });
  }

  public static getInstance(): PostgresDatabaseClient {
    if (!PostgresDatabaseClient.instance) {
      PostgresDatabaseClient.instance = new PostgresDatabaseClient();
    }
    return PostgresDatabaseClient.instance;
  }

  public async query<T extends QueryResultRow = any>(
    queryText: string,
    queryParameters?: any[]
  ): Promise<QueryResult<T>> {
    return this.connectionPool.query<T>(queryText, queryParameters);
  }

  public async getClient() {
    return this.connectionPool.connect();
  }

  public async closePool(): Promise<void> {
    await this.connectionPool.end();
  }
}

export const postgresDatabase = PostgresDatabaseClient.getInstance();
