import axios, { AxiosInstance } from 'axios';
import {
  AssetItem,
  PriceQuoteData,
  DividendItem,
  DocumentItem,
  AssetSummaryData,
  TreasuryBondItem,
  AlertRuleItem,
  UserAccountProfile,
  WhatsAppStatusData,
  WhatsAppGroupItem,
  GroupAlertItem,
  AdminUserItem
} from '../types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((configuration) => {
  const storedAccessToken = localStorage.getItem('yieldiq_access_token');
  const storedApiKey = localStorage.getItem('yieldiq_api_key');

  if (storedAccessToken) {
    configuration.headers.Authorization = `Bearer ${storedAccessToken}`;
  } else if (storedApiKey) {
    configuration.headers['X-API-TOKEN'] = storedApiKey;
  }

  return configuration;
});

export const assetService = {
  async listAssets(assetTypeFilter?: string): Promise<AssetItem[]> {
    const response = await apiClient.get<{ success: boolean; data: AssetItem[] }>('/assets', {
      params: { type: assetTypeFilter }
    });
    return response.data.data;
  },

  async retrievePrice(tickerSymbol: string): Promise<PriceQuoteData> {
    const response = await apiClient.get<{ success: boolean; data: PriceQuoteData }>(
      `/assets/price/${tickerSymbol}`
    );
    return response.data.data;
  },

  async retrieveDividends(tickerSymbol: string, maximumRecords: number = 12): Promise<DividendItem[]> {
    const response = await apiClient.get<{ success: boolean; data: DividendItem[] }>(
      `/assets/dividends/${tickerSymbol}`,
      { params: { limit: maximumRecords } }
    );
    return response.data.data;
  },

  async retrieveDocuments(tickerSymbol: string, category: string = 'all'): Promise<DocumentItem[]> {
    const response = await apiClient.get<{ success: boolean; data: DocumentItem[] }>(
      `/assets/documents/${tickerSymbol}`,
      { params: { category } }
    );
    return response.data.data;
  },

  async retrieveSummary(tickerSymbol: string): Promise<AssetSummaryData> {
    const response = await apiClient.get<{ success: boolean; data: AssetSummaryData }>(
      `/assets/summary/${tickerSymbol}`
    );
    return response.data.data;
  }
};

export const treasuryService = {
  async retrieveBonds(): Promise<TreasuryBondItem[]> {
    const response = await apiClient.get<{ success: boolean; data: TreasuryBondItem[] }>(
      '/treasury/bonds'
    );
    return response.data.data;
  }
};

export const alertService = {
  async retrieveRules(): Promise<AlertRuleItem[]> {
    const response = await apiClient.get<{ success: boolean; data: AlertRuleItem[] }>('/alerts/rules');
    return response.data.data;
  },

  async createOrUpdateRule(payload: Partial<AlertRuleItem> & { ticker: string }): Promise<void> {
    await apiClient.post('/alerts/rules', payload);
  },

  async deleteRule(ruleIdentifier: string): Promise<void> {
    await apiClient.delete(`/alerts/rules/${ruleIdentifier}`);
  },

  async toggleRule(ruleIdentifier: string, isEnabled: boolean): Promise<void> {
    await apiClient.patch(`/alerts/rules/${ruleIdentifier}/toggle`, { is_alert_enabled: isEnabled });
  },

  async sendTestAlert(): Promise<void> {
    await apiClient.post('/alerts/test');
  }
};

export const userService = {
  async retrieveProfile(): Promise<UserAccountProfile> {
    const response = await apiClient.get<{ success: boolean; data: UserAccountProfile }>('/auth/profile');
    return response.data.data;
  },

  async updatePhone(phoneNumber: string): Promise<void> {
    await apiClient.put('/auth/profile/phone', { phoneNumber });
  },

  async updateWhatsApp(isEnabled: boolean): Promise<void> {
    await apiClient.put('/auth/profile/whatsapp', { enabled: isEnabled });
  },

  async regenerateApiKey(): Promise<string> {
    const response = await apiClient.post<{ success: boolean; data: { apiKey: string } }>(
      '/auth/profile/apikey'
    );
    return response.data.data.apiKey;
  }
};

export const authService = {
  async login(payload: { identifier: string; password: string }): Promise<{
    accessToken: string;
    refreshToken?: string;
    userId: string;
    username: string;
    apiKey: string | null;
    role: string;
    privilege: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken?: string;
        userId: string;
        username: string;
        apiKey: string | null;
        role: string;
        privilege: string;
      };
    }>('/auth/login', payload);

    if (response.data.data.accessToken) {
      localStorage.setItem('yieldiq_access_token', response.data.data.accessToken);
    }
    if (response.data.data.apiKey) {
      localStorage.setItem('yieldiq_api_key', response.data.data.apiKey);
    }

    return response.data.data;
  },

  async register(payload: { username: string; email: string; password: string }): Promise<{
    id: string;
    username: string;
    email: string;
    apiKey: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        id: string;
        username: string;
        email: string;
        apiKey: string;
      };
    }>('/auth/register', payload);

    return response.data.data;
  },

  logout(): void {
    localStorage.removeItem('yieldiq_access_token');
    localStorage.removeItem('yieldiq_api_key');
  }
};

export const adminService = {
  async retrieveWhatsAppStatus(): Promise<WhatsAppStatusData> {
    const response = await apiClient.get<{ success: boolean; data: WhatsAppStatusData }>(
      '/admin/whatsapp/status'
    );
    return response.data.data;
  },

  async initializeWhatsApp(): Promise<void> {
    await apiClient.post('/admin/whatsapp/initialize');
  },

  async disconnectWhatsApp(): Promise<void> {
    await apiClient.post('/admin/whatsapp/disconnect');
  },

  async retrieveWhatsAppGroups(): Promise<WhatsAppGroupItem[]> {
    const response = await apiClient.get<{ success: boolean; data: WhatsAppGroupItem[] }>(
      '/admin/whatsapp/groups'
    );
    return response.data.data;
  },

  async retrieveGroupAlerts(): Promise<GroupAlertItem[]> {
    const response = await apiClient.get<{ success: boolean; data: GroupAlertItem[] }>(
      '/admin/group-alerts'
    );
    return response.data.data;
  },

  async createGroupAlert(payload: {
    ticker: string;
    group_name: string;
    alert_variation_pct?: number | null;
    is_notify_dividend?: boolean;
    is_notify_material_fact?: boolean;
    is_notify_report?: boolean;
  }): Promise<void> {
    await apiClient.post('/admin/group-alerts', payload);
  },

  async deleteGroupAlert(id: string): Promise<void> {
    await apiClient.delete(`/admin/group-alerts/${id}`);
  },

  async listUsers(): Promise<AdminUserItem[]> {
    const response = await apiClient.get<{ success: boolean; data: AdminUserItem[] }>('/admin/users');
    return response.data.data;
  },

  async updateUserPrivileges(
    id: string,
    payload: { role?: string; alertQuota?: number }
  ): Promise<void> {
    await apiClient.patch(`/admin/users/${id}`, payload);
  },

  async syncAssets(): Promise<{ totalSynced: number; countsByType: Record<string, number> }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { totalSynced: number; countsByType: Record<string, number> };
    }>('/admin/sync-assets');
    return response.data.data;
  }
};
