import { IAssetRepository } from '../../domain/ports/IAssetRepository';
import { Asset } from '../../domain/entities/Asset';
import { AssetType } from '../../domain/enums/AssetType';
import { Ticker } from '../../domain/value-objects/Ticker';
import { supabaseAdmin } from '../database/SupabaseClient';

export class SupabaseAssetRepository implements IAssetRepository {
  public async findAssetByTicker(ticker: Ticker | string): Promise<Asset | null> {
    const symbol = ticker instanceof Ticker ? ticker.getSymbol() : ticker.trim().toUpperCase();
    const { data: record, error } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('ticker', symbol)
      .maybeSingle();

    if (error || !record) {
      return null;
    }

    return new Asset({
      id: record.id,
      ticker: record.ticker,
      name: record.name,
      type: record.type as AssetType,
      metadata: record.metadata || {},
      isActive: record.is_active,
      createdAt: record.created_at ? new Date(record.created_at) : undefined,
      updatedAt: record.updated_at ? new Date(record.updated_at) : undefined
    });
  }

  public async listAssetsByType(assetType?: AssetType): Promise<Asset[]> {
    let query = supabaseAdmin.from('assets').select('*').order('ticker', { ascending: true });

    if (assetType) {
      query = query.eq('type', assetType);
    }

    const { data: records, error } = await query;
    if (error || !records) {
      return [];
    }

    return records.map(
      (record) =>
        new Asset({
          id: record.id,
          ticker: record.ticker,
          name: record.name,
          type: record.type as AssetType,
          metadata: record.metadata || {},
          isActive: record.is_active,
          createdAt: record.created_at ? new Date(record.created_at) : undefined,
          updatedAt: record.updated_at ? new Date(record.updated_at) : undefined
        })
    );
  }

  public async saveAsset(asset: Asset): Promise<void> {
    await supabaseAdmin.from('assets').upsert(
      {
        id: asset.id,
        ticker: asset.ticker.getSymbol(),
        type: asset.type,
        name: asset.name,
        metadata: asset.metadata,
        is_active: asset.isActive,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'ticker' }
    );
  }

  public async saveAssetBatch(assets: Asset[]): Promise<void> {
    if (assets.length === 0) {
      return;
    }

    const payload = assets.map((asset) => ({
      id: asset.id,
      ticker: asset.ticker.getSymbol(),
      type: asset.type,
      name: asset.name,
      metadata: asset.metadata,
      is_active: asset.isActive,
      updated_at: new Date().toISOString()
    }));

    await supabaseAdmin.from('assets').upsert(payload, { onConflict: 'ticker' });
  }
}

export const assetRepository = new SupabaseAssetRepository();
