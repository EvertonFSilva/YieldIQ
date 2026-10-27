import axios from 'axios';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';
import { environment } from '../../config/env';
import { AssetType } from '../../domain/enums/AssetType';

interface B3AssetItem {
  acronym?: string;
  companyName?: string;
  segment?: string;
  [key: string]: any;
}

interface B3SearchResponse {
  results?: B3AssetItem[];
  page?: {
    totalRecords?: number;
    pageSize?: number;
  };
}

export interface SyncAssetsResult {
  totalSynced: number;
  countsByType: Record<string, number>;
}

export class SyncAssetsUseCase {
  private readonly targetTypes: Array<{ b3Type: string; assetType: AssetType }> = [
    { b3Type: '7', assetType: AssetType.FII },
    { b3Type: 'FIAGRO', assetType: AssetType.FIAGRO },
    { b3Type: 'FI-INFRA', assetType: AssetType.FI_INFRA }
  ];

  public async execute(): Promise<SyncAssetsResult> {
    let totalSynced = 0;
    const countsByType: Record<string, number> = {
      [AssetType.FII]: 0,
      [AssetType.FIAGRO]: 0,
      [AssetType.FI_INFRA]: 0
    };

    for (const mapping of this.targetTypes) {
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const payloadObject = {
          language: 'pt-br',
          pageNumber: currentPage,
          pageSize: 120,
          typeFund: mapping.b3Type
        };

        const base64EncodedPayload = Buffer.from(JSON.stringify(payloadObject)).toString('base64');
        const targetUrl = `${environment.B3_BASE_URL}/fundsListedProxy/Search/GetListFunds/${base64EncodedPayload}`;

        try {
          const fetchResponse = await axios.get<B3SearchResponse>(targetUrl, {
            headers: {
              'User-Agent': environment.USER_AGENT,
              Referer: environment.B3_REFERER_URL,
              Accept: 'application/json, text/plain, */*'
            },
            timeout: environment.HTTP_DEFAULT_TIMEOUT_MS
          });

          const items = fetchResponse.data?.results || [];
          if (items.length === 0) {
            hasMorePages = false;
            break;
          }

          for (const item of items) {
            const rawTicker = (item.acronym || '').trim().toUpperCase();
            if (!rawTicker || rawTicker.length < 4) {
              continue;
            }

            const rawName = item.fundName || item.companyName || rawTicker;
            const assetName = String(rawName).trim();
            const metadataJson = JSON.stringify({
              segment: item.segment || null,
              b3Acronym: item.acronym,
              b3AssetType: mapping.assetType
            });

            await postgresDatabase.query(
              `INSERT INTO public.assets (ticker, name, type, metadata, is_active, updated_at)
               VALUES ($1, $2, $3, $4::jsonb, true, NOW())
               ON CONFLICT (ticker) DO UPDATE SET
                 name = EXCLUDED.name,
                 type = EXCLUDED.type,
                 metadata = EXCLUDED.metadata,
                 updated_at = NOW()`,
              [rawTicker, assetName, mapping.assetType, metadataJson]
            );

            totalSynced++;
            countsByType[mapping.assetType]++;
          }

          const totalRecords = fetchResponse.data?.page?.totalRecords || 0;
          if (currentPage * 120 >= totalRecords) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } catch {
          hasMorePages = false;
        }
      }
    }

    return {
      totalSynced,
      countsByType
    };
  }
}