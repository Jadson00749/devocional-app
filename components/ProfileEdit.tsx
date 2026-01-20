
import React, { useState } from 'react';
import { X, Camera, Image as ImageIcon, Calendar, ChevronDown, Check, AlignLeft } from 'lucide-react';
import { User } from '../types';

interface ProfileEditProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<User>({ ...user });

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
      <div className="sticky top-0 bg-white px-6 py-6 flex items-center justify-between border-b border-slate-50 z-10">
        <div className="flex-1"></div>
        <div className="flex-col items-center text-center flex-[2]">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Editar Perfil</h2>
          <p className="text-xs text-slate-400 font-medium">Atualize suas informações</p>
        </div>
        <button onClick={onClose} className="flex-1 flex justify-end">
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-8 pb-32">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-800">Foto de Perfil</label>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img src={formData.avatar} className="w-24 h-24 rounded-full object-cover border border-slate-100 shadow-sm" alt="" />
              <button className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700">
                  <ImageIcon size={16} /> Galeria
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700">
                  <Camera size={16} /> Câmera
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-800">Nome</label>
          <input 
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-900 outline-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800">Bio</label>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Recado</span>
          </div>
          <textarea 
            value={formData.bio || ''}
            placeholder="Escreva algo sobre você ou um versículo..."
            onChange={(e) => handleChange('bio', e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-medium text-slate-800 outline-none h-24 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-800">Telefone (DDD)</label>
          <input 
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-900 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-800">Congregação</label>
          <div className="relative">
            <select 
              value={formData.congregation || ''}
              onChange={(e) => handleChange('congregation', e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-900 appearance-none outline-none"
            >
              <option value="SEDE">ADBA SEDE</option>
              <option value="JARDIM PAULISTA">ADBA JARDIM PAULISTA</option>
              <option value="VILA NOVA">ADBA VILA NOVA</option>
            </select>
            <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <button 
          onClick={() => onSave(formData)}
          className="w-full bg-[#12192b] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default ProfileEdit;
