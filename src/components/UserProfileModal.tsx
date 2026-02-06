
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../integrations/supabase/client';
import { User, DevotionalPost, UserRole } from '../types';
import { databaseService } from '../services/databaseService';
import { X, MessageCircle, MapPin, Calendar, Heart, MessageSquare, BookOpen, ArrowLeft, User as UserIcon, Edit3 } from 'lucide-react';
import DevotionalDetailModal from './DevotionalDetailModal';
import UserManagementModal from './UserManagementModal';
import ProfilePhotoDetailModal from './ProfilePhotoDetailModal';
import Toast, { ToastType } from './Toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (userId: string, updates: { role?: UserRole }) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, isOpen, onClose, onUserUpdated }) => {
  const { user: currentUser } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [devotionals, setDevotionals] = useState<DevotionalPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevotional, setSelectedDevotional] = useState<DevotionalPost | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    } else {
      setUser(null);
      setDevotionals([]);
    }
  }, [isOpen, userId]);

  // Fetch current user profile to get role
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (currentUser?.id) {
        const profile = await databaseService.fetchUserProfile(currentUser.id);
        setCurrentUserProfile(profile);
      }
    };
    fetchCurrentUserProfile();
  }, [currentUser]);

  // Fetch user email when modal opens
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!userId || !showManagementModal) return;
      
      try {
        // Try to get email from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        
        if (!profileError && profileData?.email) {
          setUserEmail(profileData.email);
          return;
        }

        // If viewing own profile, get from current session
        if (currentUser?.id === userId) {
          const { data: { user: authUser }, error } = await supabase.auth.getUser();
          if (!error && authUser?.email) {
            setUserEmail(authUser.email);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar email do usuário:', error);
      }
    };
    fetchUserEmail();
  }, [userId, showManagementModal, currentUser]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user profile
      const userProfile = await databaseService.fetchUserProfile(userId);
      setUser(userProfile);

      // Fetch user devotionals
      const userDevotionals = await databaseService.fetchUserDevotionals(userId);
      setDevotionals(userDevotionals);
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManagementSave = async (userId: string, updates: { password?: string; role?: UserRole }) => {
    try {
      if (updates.password) {
        // Reset password
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: updates.password
        });
        if (error) throw error;
      }

      if (updates.role) {
        // Update role
        const { error } = await supabase
          .from('profiles')
          .update({ role: updates.role })
          .eq('id', userId);
        if (error) throw error;
        
        // Notify parent
        onUserUpdated?.(userId, { role: updates.role });

        // Refresh user data
        await fetchUserData();
        
        // If updating current user's own profile, refresh current user profile too
        if (currentUser?.id === userId) {
          const updatedProfile = await databaseService.fetchUserProfile(userId);
          setCurrentUserProfile(updatedProfile);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const getCardColor = (index: number): string => {
    const colors = ['bg-orange-500', 'bg-purple-500', 'bg-slate-700'];
    return colors[index % colors.length];
  };

  const formatScriptureForCard = (scripture: string): string => {
    // Extrair apenas "Jó 30-32" do texto completo
    const match = scripture.match(/(Jó|Job)\s*(\d+)[-\s]*(\d+)/i);
    if (match) {
      return `${match[1]} ${match[2]}-${match[3]}`;
    }
    // Se não encontrar, retornar os primeiros 15 caracteres
    return scripture.substring(0, 15);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-in slide-in-from-right duration-300">
        {loading ? (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : user ? (
            <>
                {/* Header */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-white">
                    <button 
                        onClick={onClose}
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Perfil</h1>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="p-4 space-y-6">
                        {/* User Profile Card */}
                        <div className="bg-[#0f172a] rounded-3xl p-6 relative overflow-hidden shadow-xl">
                            {/* Decorative background circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 blur-2xl"></div>

                            <div className="relative z-10 flex items-center gap-4">
                                 <button 
                                     onClick={() => setShowPhotoModal(true)}
                                     className="w-20 h-20 rounded-full border-2 border-white/20 overflow-hidden bg-slate-800 shrink-0 shadow-lg active:scale-95 transition-transform"
                                 >
                                     <img 
                                         src={user.avatar} 
                                         alt={user.name} 
                                         className="w-full h-full object-cover"
                                     />
                                 </button>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2 break-words">
                                        {user.name}
                                        {currentUserProfile?.role === 'admin_master' && (
                                            <button
                                                onClick={() => setShowManagementModal(true)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                                            >
                                                <Edit3 size={16} className="text-orange-400" />
                                            </button>
                                        )}
                                    </h2>
                                    
                                    <div className="space-y-1 mt-2">
                                        {user.congregation && (
                                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                                                <div className="w-6 flex justify-center shrink-0">
                                                    <MapPin size={16} className="text-orange-500" />
                                                </div>
                                                <span className="truncate">{user.congregation}</span>
                                            </div>
                                        )}
                                        {user.civilStatus && (
                                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                                                <div className="w-6 flex justify-center shrink-0">
                                                    <Heart size={16} className="text-orange-500" />
                                                </div>
                                                <span className="truncate">{user.civilStatus}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Button */}
                        {user.isPhonePublic && user.phone && (
                            <a 
                                href={`https://wa.me/55${user.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-3.5 px-4 rounded-2xl text-center shadow-md transition-all flex items-center justify-center gap-2.5"
                            >
                                <MessageCircle size={22} />
                                <span>Falar no WhatsApp</span>
                            </a>
                        )}

                        {/* Bio */}
                        {user.bio && (
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span>Bio</span>
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                </h3>
                                <p className="text-[15px] text-slate-700 font-medium leading-relaxed italic">
                                    "{user.bio}"
                                </p>
                            </div>
                        )}

                        {/* Feed / Devotionals */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 ml-1">FEED</h3>
                            
                            {devotionals.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 border-dashed">
                                    <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm text-slate-500 font-medium">Nenhum devocional postado ainda.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {devotionals.map((devotional, index) => (
                                        <button
                                            key={devotional.id}
                                            onClick={() => setSelectedDevotional(devotional)}
                                            className={`${getCardColor(index)} rounded-2xl aspect-square flex items-center justify-center relative overflow-hidden group active:scale-95 transition-all shadow-sm`}
                                        >
                                            {devotional.photo ? (
                                                <>
                                                    <img
                                                        src={devotional.photo}
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                                                    <p className="text-white font-bold text-xs sm:text-sm relative z-10 px-2 text-center drop-shadow-md">
                                                        {formatScriptureForCard(devotional.scripture)}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-white font-bold text-xs sm:text-sm px-2 text-center drop-shadow-sm">
                                                    {formatScriptureForCard(devotional.scripture)}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Espaço extra para scroll */}
                        <div className="h-8"></div>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <UserIcon size={32} className="opacity-50" />
                </div>
                <p className="font-medium">Usuário não encontrado.</p>
                <button 
                    onClick={onClose} 
                    className="text-orange-500 font-bold hover:underline"
                >
                    Voltar
                </button>
            </div>
        )}

        {/* Modal de Detalhes do Devocional */}
        {selectedDevotional && (
            <DevotionalDetailModal
                devotional={selectedDevotional}
                isOpen={!!selectedDevotional}
                onClose={() => setSelectedDevotional(null)}
            />
        )}
 
        {/* Modal de Detalhes da Foto do Perfil */}
        <ProfilePhotoDetailModal
            isOpen={showPhotoModal}
            onClose={() => setShowPhotoModal(false)}
            photoUrl={user?.avatar || null}
            userName={user?.name || ''}
        />

        {/* Modal de Gerenciamento de Usuário */}
        {user && (
            <UserManagementModal
                isOpen={showManagementModal}
                onClose={() => setShowManagementModal(false)}
                user={{
                    id: user.id,
                    name: user.name,
                    email: userEmail,
                    role: user.role
                }}
                onSave={handleManagementSave}
                onShowToast={(message, type) => setToast({ message, type })}
            />
        )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>,
    document.body
  );
};

export default UserProfileModal;
