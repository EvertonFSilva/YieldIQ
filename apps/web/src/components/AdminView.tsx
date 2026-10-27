import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Smartphone,
  RefreshCw,
  PowerOff,
  Trash2,
  Plus,
  Activity,
  Server,
  PieChart,
  Users
} from 'lucide-react';
import { adminService } from '../services/apiClient';
import { WhatsAppStatusData, WhatsAppGroupItem, GroupAlertItem, AdminUserItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

export const AdminView: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatusData | null>(null);
  const [groups, setGroups] = useState<WhatsAppGroupItem[]>([]);
  const [groupAlerts, setGroupAlerts] = useState<GroupAlertItem[]>([]);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

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
    toast.info('Inicialização do WhatsApp disparada');
    setTimeout(loadAllAdminData, 2000);
  };

  const handlePromptDisconnectWhatsApp = (): void => {
    setConfirmationModal({
      isOpen: true,
      title: 'Desconectar WhatsApp',
      description:
        'Deseja realmente desconectar a sessão do WhatsApp? O bot deixará de disparar mensagens até que um novo QR Code seja autenticado.',
      confirmLabel: 'Desconectar Sessão',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
        await adminService.disconnectWhatsApp();
        toast.info('Sessão do WhatsApp desconectada');
        setTimeout(loadAllAdminData, 1500);
      }
    });
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
      toast.success('Alerta de grupo criado com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Erro ao criar alerta de grupo');
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  const handlePromptDeleteGroupAlert = (alertId: string, ticker: string, groupName: string): void => {
    setConfirmationModal({
      isOpen: true,
      title: 'Excluir Alerta de Grupo',
      description: `Tem certeza que deseja remover o monitoramento do ativo ${ticker} para o grupo "${groupName}"?`,
      confirmLabel: 'Excluir Alerta',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
        await adminService.deleteGroupAlert(alertId);
        const updatedAlerts = await adminService.retrieveGroupAlerts();
        setGroupAlerts(updatedAlerts);
        toast.success('Alerta de grupo excluído');
      }
    });
  };

  const handlePromptToggleUserRole = (user: AdminUserItem): void => {
    const targetRole = user.role === 'ADMINISTRATOR' ? 'USER' : 'ADMINISTRATOR';
    setConfirmationModal({
      isOpen: true,
      title: 'Alterar Nível de Permissão',
      description: `Deseja alterar o cargo de "${user.username}" para ${
        targetRole === 'ADMINISTRATOR' ? 'Administrador' : 'Usuário Padrão'
      }?`,
      confirmLabel: 'Confirmar Alteração',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
        await adminService.updateUserPrivileges(user.id, { role: targetRole });
        const updatedUsers = await adminService.listUsers();
        setUsersList(updatedUsers);
        toast.success(`Permissão de ${user.username} alterada para ${targetRole}`);
      }
    });
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
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        description={confirmationModal.description}
        confirmLabel={confirmationModal.confirmLabel}
        isDestructive={confirmationModal.isDestructive}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>YieldIQ Governance & Infrastructure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Painel do Administrador</h1>
          <p className="text-xs text-slate-400 mt-1">
            Métricas operacionais da plataforma, monitoramento de conexões WhatsApp e gestão de usuários
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Usuários Registrados</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{usersList.length}</p>
          <div className="mt-1 text-xs text-slate-500">
            {usersList.filter((u) => u.role === 'ADMINISTRATOR').length} Administradores
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Grupos WhatsApp</span>
            <Smartphone className="h-4 w-4 text-teal-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-teal-400">{groups.length}</p>
          <div className="mt-1 text-xs text-slate-500">{groupAlerts.length} Alertas de Grupo Ativos</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Disponibilidade do Sistema</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">99.98%</p>
          <div className="mt-1 text-xs text-slate-500">PostgreSQL Pooler Ativo</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Latência de Cache</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-cyan-400">&lt; 10 ms</p>
          <div className="mt-1 text-xs text-slate-500">Cache em Memória Ativo</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sessão WhatsApp (Baileys)</h3>
                <p className="text-xs text-slate-400">Armazenamento em banco PostgreSQL</p>
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

          <div className="pt-2">
            {!whatsAppStatus?.isConnected ? (
              <button
                onClick={handleInitializeWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-semibold text-slate-950 transition"
              >
                <Smartphone className="h-4 w-4" />
                <span>Inicializar Conexão WhatsApp</span>
              </button>
            ) : (
              <button
                onClick={handlePromptDisconnectWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 py-2.5 text-xs font-semibold text-rose-400 transition"
              >
                <PowerOff className="h-4 w-4" />
                <span>Desconectar Sessão</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Composição da Base de Ativos</h3>
              <p className="text-xs text-slate-400">Total de 622 ativos cadastrados e rastreados</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">FIIs (Fundos Imobiliários)</span>
                <span className="text-emerald-400 font-mono font-bold">531 ativos (85.4%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '85.4%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">FIAGROs (Cadeia Agro)</span>
                <span className="text-amber-400 font-mono font-bold">50 ativos (8.0%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '8.0%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold">FI-INFRAs (Infraestrutura Isenta)</span>
                <span className="text-cyan-400 font-mono font-bold">41 ativos (6.6%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '6.6%' }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Sincronização B3 executada</span>
              <span className="text-slate-400">Base completa</span>
            </div>
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Código do Ativo</label>
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
                  <th className="p-4">Ativo</th>
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
                          onClick={() => handlePromptDeleteGroupAlert(rule.id, rule.ticker, rule.group_name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                          title="Excluir Alerta de Grupo"
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
                        onClick={() => handlePromptToggleUserRole(user)}
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