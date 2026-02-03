import React, { useState, useEffect } from 'react';
import { X, Mail, Key, Shield, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../integrations/supabase/client';
import Toast, { ToastType } from './Toast';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  onSave: (userId: string, updates: { password?: string; role?: UserRole }) => Promise<void>;
  onShowToast: (message: string, type: ToastType) => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  onShowToast
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string>(user.email);

  // Fetch user email from auth.users
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (user.email) {
        setUserEmail(user.email);
        return;
      }
      
      try {
        // Try to get email from profiles table first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();
        
        if (!profileError && profileData?.email) {
          setUserEmail(profileData.email);
          return;
        }

        // If not in profiles, try to get from auth metadata
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (!error && authUser?.id === user.id && authUser?.email) {
          setUserEmail(authUser.email);
        }
      } catch (error) {
        console.error('Erro ao buscar email do usuário:', error);
      }
    };
    fetchUserEmail();
  }, [user.id, user.email]);

  if (!isOpen) return null;

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      onShowToast('A senha deve ter no mínimo 8 caracteres', 'warning');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await onSave(user.id, { password: newPassword });
      setNewPassword('');
      onShowToast('Senha atualizada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      onShowToast('Erro ao atualizar senha', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(user.id, { role: selectedRole });
      onShowToast('Alterações salvas com sucesso!', 'success');
      onClose(); // Close immediately
    } catch (error) {
      console.error('Erro ao salvar:', error);
      onShowToast('Erro ao salvar alterações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'user': return 'Usuário';
      case 'admin': return 'Administrador';
      case 'admin_master': return 'Administrador Master';
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'user': return 'Acesso padrão';
      case 'admin': return 'Acesso às páginas admin, Analytics apenas da própria congregação';
      case 'admin_master': return 'Acesso completo, Analytics de todas as congregações';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-6 flex items-start justify-between bg-white shrink-0">
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Gerenciar Usuário</h2>
          <p className="text-sm text-slate-500">Gerencie o role e informações de</p>
          <p className="text-sm text-slate-900 font-semibold">{user.name}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors absolute right-6 top-4"
        >
          <X size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Content - Centered vertically */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 pb-6 pt-2 space-y-6">
          {/* Email (readonly) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Mail size={16} />
              Email
            </label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-mono">
              {userEmail || 'Email não disponível'}
            </div>
          </div>

          {/* Password Reset */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Key size={16} />
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha (mín. 8 caracteres)"
                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-slate-400" />
                ) : (
                  <Eye size={18} className="text-slate-400" />
                )}
              </button>
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={newPassword.length < 8 || isUpdatingPassword}
              className="mt-3 w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all active:scale-[0.98]"
            >
              {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
            <p className="text-xs text-slate-400 mt-2">
              Defina uma nova senha para o usuário. Ele poderá fazer login com esta senha.
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
              <Shield size={16} />
              Permissão (Role)
            </label>
            <div className="space-y-2">
              {/* User */}
              <button
                onClick={() => setSelectedRole('user')}
                className={`w-full px-4 py-3 rounded-xl text-left transition-all border-2 flex items-start gap-3 ${
                  selectedRole === 'user'
                    ? 'bg-orange-50 border-orange-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                  selectedRole === 'user' ? 'border-orange-500' : 'border-slate-300'
                }`}>
                  {selectedRole === 'user' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <UserIcon size={16} className="text-slate-600" />
                    <span className="text-sm font-bold text-slate-900">Usuário</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{getRoleDescription('user')}</p>
                </div>
              </button>

              {/* Admin */}
              <button
                onClick={() => setSelectedRole('admin')}
                className={`w-full px-4 py-3 rounded-xl text-left transition-all border-2 flex items-start gap-3 ${
                  selectedRole === 'admin'
                    ? 'bg-orange-50 border-orange-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                  selectedRole === 'admin' ? 'border-orange-500' : 'border-slate-300'
                }`}>
                  {selectedRole === 'admin' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-slate-600" />
                    <span className="text-sm font-bold text-slate-900">Administrador</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{getRoleDescription('admin')}</p>
                </div>
              </button>

              {/* Admin Master */}
              <button
                onClick={() => setSelectedRole('admin_master')}
                className={`w-full px-4 py-3 rounded-xl text-left transition-all border-2 flex items-start gap-3 ${
                  selectedRole === 'admin_master'
                    ? 'bg-orange-50 border-orange-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                  selectedRole === 'admin_master' ? 'border-orange-500' : 'border-slate-300'
                }`}>
                  {selectedRole === 'admin_master' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-orange-500 fill-orange-500" />
                    <span className="text-sm font-bold text-slate-900">Administrador Master</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{getRoleDescription('admin_master')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4 flex gap-3 bg-white shrink-0">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all active:scale-[0.98]"
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};

export default UserManagementModal;
