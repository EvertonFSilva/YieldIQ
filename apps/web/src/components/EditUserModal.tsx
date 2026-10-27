import React, { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { AdminUserItem } from '../types';
import { adminService } from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import { CustomSelect } from './common/CustomSelect';

interface EditUserModalProperties {
  isOpen: boolean;
  user: AdminUserItem | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const EditUserModal: React.FC<EditUserModalProperties> = ({
  isOpen,
  user,
  onClose,
  onUserUpdated
}) => {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMINISTRATOR'>('USER');
  const [alertQuota, setAlertQuota] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phone_number || '');
      setRole((user.role === 'ADMINISTRATOR' ? 'ADMINISTRATOR' : 'USER') as any);
      setAlertQuota(user.alert_quota || 50);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await adminService.updateUserPrivileges(user.id, {
        username: username.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim() || null,
        role,
        alertQuota: Number(alertQuota)
      });

      toast.success(`Usuário ${username} atualizado com sucesso!`);
      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || error.message || 'Falha ao atualizar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar Usuário</h2>
              <p className="text-xs text-slate-400">Atualize dados cadastrais, cargo e cota de alertas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nome de Usuário *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: investidor_pro"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500/60 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              E-mail *
            </label>
            <input
              type="email"
              required
              maxLength={100}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500/60 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              minLength={10}
              maxLength={15}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: 11999998888"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500/60 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nível de Privilégio
              </label>
              <CustomSelect
                value={role}
                onChange={(val) => setRole(val as any)}
                options={[
                  { value: 'USER', label: 'USER (Investidor)' },
                  { value: 'ADMINISTRATOR', label: 'ADMINISTRATOR (Gestor)' }
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cota de Alertas
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={alertQuota}
                onChange={(e) => setAlertQuota(Number(e.target.value))}
                placeholder="Ex: 50"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500/60 outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
