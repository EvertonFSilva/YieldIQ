import { TreasuryBond } from '../entities/TreasuryBond';

export interface ITreasuryProvider {
  fetchTreasuryBonds(): Promise<TreasuryBond[]>;
}
