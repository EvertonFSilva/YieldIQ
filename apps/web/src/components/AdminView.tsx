import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Smartphone,
  RefreshCw,
  PowerOff,
  Trash2,
  Plus,
  CheckCircle2,
  Database
} from 'lucide-react';
import { adminService } from '../services/apiClient';
import { WhatsAppStatusData, WhatsAppGroupItem, GroupAlertItem, AdminUserItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminView: React.FC = () => {
  const { currentUser } = useAuth();
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatusData | null>(null);
  const [groups, setGroups] = useState<WhatsAppGroupItem[]>([]);
  const [groupAlerts, setGroupAlerts] = useState<GroupAlertItem[]>([]);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingAssets, setIsSyncingAssets] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [isCreateGroupAlertOpen, setIsCreateGroupAlertOpen] = useState<boolean>(false);
  const [newAlertTicker, setNewAlertTicker] = useState<string>('');
  const [newAlertGroupName, setNewAlertGroupName] = useState<string>('');
  const [newAlertNotifyDividend, setNewAlertNotifyDividend] = useState<boolean>(true);
  const [newAlertNotifyDocument, setNewAlertNotifyDocument] = useState<boolean>(true);
  const [newAlertVariationPct, setNewAlertVariationPct] = useState<string>('2.0');
  const [isSubmittingAlert, setIsSubmittingAlert] = useState<boolean>(false);

  const loadAllAdminData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [statusRes, groupsRes, alertsRes, usersRes] = await Promise.allSettled([
        adminService.retrieveWhatsAppStatus(),
        adminService.retrieveWhatsAppGroups(),
        adminService.retrieveGroupAlerts(),
        adminService.listUsers()
      ]);

      if (statusRes.status === 'fulfilled') {
        setWhatsAppStatus(statusRes.value);
      }
      if (groupsRes.status === 'fulfilled') {
        setGroups(groupsRes.value);
      }
      if (alertsRes.status === 'fulfilled') {
        setGroupAlerts(alertsRes.value);
      }
      if (usersRes.status === 'fulfilled') {
        setUsersList(usersRes.value);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleInitializeWhatsApp = async (): Promise<void> => {
    await adminService.initializeWhatsApp();
    setTimeout(loadAllAdminData, 2000);
  };

  const handleDisconnectWhatsApp = async (): Promise<void> => {
    if (window.confirm('Deseja realmente desconectar a sessão do WhatsApp?')) {
      await adminService.disconnectWhatsApp();
      setTimeout(loadAllAdminData, 1500);
    }
  };

  const handleSyncAssets = async (): Promise<void> => {
    setIsSyncingAssets(true);
    setSyncFeedback(null);
    try {
      const result = await adminService.syncAssets();
      setSyncFeedback(
        `Sincronização concluída! ${result.totalSynced} ativos processados (FII: ${result.countsByType.FII}, FIAGRO: ${result.countsByType.FIAGRO}, FI-INFRA: ${result.countsByType.FI_INFRA}).`
      );
    } catch {
      setSyncFeedback('Erro ao sincronizar ativos da B3. Tente novamente.');
    } finally {
      setIsSyncingAssets(false);
    }
  };

  const handleCreateGroupAlert = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newAlertTicker.trim() || !newAlertGroupName.trim()) {
      return;
    }

    setIsSubmittingAlert(true);
    try {
      await adminService.createGroupAlert({
        ticker: newAlertTicker.trim().toUpperCase(),
        group_name: newAlertGroupName.trim(),
        alert_variation_pct: newAlertVariationPct ? parseFloat(newAlertVariationPct) : null,
        is_notify_dividend: newAlertNotifyDividend,
        is_notify_material_fact: newAlertNotifyDocument,
        is_notify_report: newAlertNotifyDocument
      });

      setNewAlertTicker('');
      setIsCreateGroupAlertOpen(false);
      const updatedAlerts = await adminService.retrieveGroupAlerts();
      setGroupAlerts(updatedAlerts);
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  const handleDeleteGroupAlert = async (alertId: string): Promise<void> => {
    if (window.confirm('Excluir este alerta de grupo?')) {
      await adminService.deleteGroupAlert(alertId);
      const updatedAlerts = await adminService.retrieveGroupAlerts();
      setGroupAlerts(updatedAlerts);
    }
  };

  const handleToggleUserRole = async (user: AdminUserItem): Promise<void> => {
    const targetRole = user.role === 'ADMINISTRATOR' ? 'USER' : 'ADMINISTRATOR';
    if (window.confirm(`Alterar permissão de ${user.username} para ${targetRole}?`)) {
      await adminService.updateUserPrivileges(user.id, { role: targetRole });
      const updatedUsers = await adminService.listUsers();
      setUsersList(updatedUsers);
    }
  };

  if (currentUser?.role !== 'ADMINISTRATOR' && (currentUser as any)?.privilege !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Acesso Restrito ao Administrador</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md">
          Esta área é destinada exclusivamente a administradores do YieldIQ para gestão de conexões WhatsApp, regras de grupo e usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>YieldIQ Control Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Painel do Administrador</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerenciamento de infraestrutura WhatsApp, sincronizações da B3 e controle de usuários
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sessão WhatsApp (Baileys)</h3>
                <p className="text-xs text-slate-400">Armazenamento persistente PostgreSQL</p>
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 ${
                whatsAppStatus?.isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  whatsAppStatus?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{whatsAppStatus?.isConnected ? 'Conectado' : 'Desconectado'}</span>
            </span>
          </div>

          {whatsAppStatus?.isConnected && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Número Conectado:</span>
                <span className="font-mono text-white font-semibold">{whatsAppStatus.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nome da Conta:</span>
                <span className="text-slate-200">{whatsAppStatus.pushName || 'YieldIQ Bot'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grupos Participantes:</span>
                <span className="text-emerald-400 font-semibold">{groups.length} grupos</span>
              </div>
            </div>
          )}

          {whatsAppStatus?.qrCodeDataUrl && !whatsAppStatus.isConnected && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-slate-950 p-6 text-center">
              <span className="text-xs font-semibold text-emerald-400 mb-3">
                Escaneie o QR Code abaixo com seu WhatsApp:
              </span>
              <img
                src={whatsAppStatus.qrCodeDataUrl}
                alt="QR Code WhatsApp"
                className="h-48 w-48 rounded-xl bg-white p-2 shadow-lg"
              />
              <span className="text-[11px] text-slate-500 mt-3">
                Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {!whatsAppStatus?.isConnected ? (
              <button
                onClick={handleInitializeWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-semibold text-slate-950 transition"
              >
                <Smartphone className="h-4 w-4" />
                <span>Inicializar WhatsApp</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnectWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 py-2.5 text-xs font-semibold text-rose-400 transition"
              >
                <PowerOff className="h-4 w-4" />
                <span>Desconectar Sessão</span>
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sincronização de Ativos B3</h3>
              <p className="text-xs text-slate-400">Importação em lote de todos os fundos</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Consulte a API pública da B3 para atualizar a base de dados do YieldIQ com todos os FIIs, FIAGROs e FI-INFRAs listados, incluindo nomes oficiais, segmentos e identificadores.
          </p>

          {syncFeedback && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{syncFeedback}</span>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={handleSyncAssets}
              disabled={isSyncingAssets}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-xs font-semibold text-slate-950 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isSyncingAssets ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sincronizando com a B3...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Sincronizar Ativos da B3 Agora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Alertas de Grupos do WhatsApp</h2>
            <p className="text-xs text-slate-400">Transmissão de proventos e cotações para canais comunitários</p>
          </div>

          <button
            onClick={() => setIsCreateGroupAlertOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-slate-950 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Alerta de Grupo</span>
          </button>
        </div>

        {isCreateGroupAlertOpen && (
          <form
            onSubmit={handleCreateGroupAlert}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 animate-fadeIn"
          >
            <h3 className="text-sm font-bold text-white">Adicionar Monitoramento a Grupo</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ticker do Ativo</label>
                <input
                  type="text"
                  placeholder="ex: MXRF11"
                  value={newAlertTicker}
                  onChange={(e) => setNewAlertTicker(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white uppercase font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Grupo</label>
                {groups.length > 0 ? (
                  <select
                    value={newAlertGroupName}
                    onChange={(e) => setNewAlertGroupName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  >
                    <option value="">Selecione um grupo...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nome do grupo no WhatsApp"
                    value={newAlertGroupName}
                    onChange={(e) => setNewAlertGroupName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Variação % Disparo</label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlertVariationPct}
                  onChange={(e) => setNewAlertVariationPct(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAlertNotifyDividend}
                  onChange={(e) => setNewAlertNotifyDividend(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span>Notificar Proventos</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAlertNotifyDocument}
                  onChange={(e) => setNewAlertNotifyDocument(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span>Notificar Fatos Relevantes / CVM</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCreateGroupAlertOpen(false)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingAlert}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                {isSubmittingAlert ? 'Salvando...' : 'Salvar Alerta de Grupo'}
              </button>
            </div>
          </form>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="p-4">Ticker</th>
                  <th className="p-4">Grupo WhatsApp</th>
                  <th className="p-4">Degrau Variação</th>
                  <th className="p-4">Proventos</th>
                  <th className="p-4">Fatos Relevantes</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {groupAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Nenhum alerta de grupo configurado.
                    </td>
                  </tr>
                ) : (
                  groupAlerts.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-mono font-bold text-white">{rule.ticker}</td>
                      <td className="p-4 text-slate-300">{rule.group_name}</td>
                      <td className="p-4 text-slate-300">
                        {rule.alert_variation_pct ? `±${rule.alert_variation_pct}%` : '-'}
                      </td>
                      <td className="p-4">
                        {rule.is_notify_dividend ? (
                          <span className="text-emerald-400 font-semibold">Sim</span>
                        ) : (
                          <span className="text-slate-500">Não</span>
                        )}
                      </td>
                      <td className="p-4">
                        {rule.is_notify_material_fact ? (
                          <span className="text-emerald-400 font-semibold">Sim</span>
                        ) : (
                          <span className="text-slate-500">Não</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteGroupAlert(rule.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Usuários da Plataforma</h2>
          <p className="text-xs text-slate-400">Lista de contas registradas e controle de privilégios</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="p-4">Usuário</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Nível de Acesso</th>
                  <th className="p-4">Cota de Alertas</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-white">{user.username}</td>
                    <td className="p-4 text-slate-400">{user.email}</td>
                    <td className="p-4 font-mono text-slate-400">{user.phone_number || '-'}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          user.role === 'ADMINISTRATOR'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{user.alert_quota} regras</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleUserRole(user)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        {user.role === 'ADMINISTRATOR' ? 'Tornar Usuário' : 'Tornar Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};