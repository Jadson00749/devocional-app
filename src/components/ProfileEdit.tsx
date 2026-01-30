import React, { useState } from 'react';
import { X, Camera, Image as ImageIcon, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { User } from '@/types';

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

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100 z-10">
        <div className="flex-1"></div>
        <div className="flex-col items-center text-center flex-[2]">
          <h2 className="text-lg font-bold text-slate-900">Editar Perfil</h2>
          <p className="text-xs text-slate-500 mt-0.5">Atualize suas informações pessoais</p>
        </div>
        <button onClick={onClose} className="flex-1 flex justify-end">
          <X size={24} className="text-slate-500" />
        </button>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 py-6 space-y-6 pb-32">
        {/* Foto de Perfil */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-900">Foto de Perfil</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {formData.avatar ? (
                <>
                  <img 
                    src={formData.avatar} 
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-100" 
                    alt="Avatar" 
                  />
                  <button 
                    onClick={() => handleChange('avatar', '')}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="w-20 h-20 rounded-full bg-orange-400 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {formData.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <ImageIcon size={16} /> Galeria
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <Camera size={16} /> Câmera
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">Máximo 5MB. Formatos: JPG, PNG</p>
            </div>
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900">Nome</label>
          <input 
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 transition-colors"
            placeholder="Seu nome completo"
          />
        </div>

        {/* Data de Nascimento */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900">Data de Nascimento</label>
          <input 
            type="date"
            value={formData.birthday || ''}
            onChange={(e) => handleChange('birthday', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 transition-colors"
          />
          <p className="text-[10px] text-slate-400 mt-1">Sua data de nascimento será usada apenas para análises demográficas</p>
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900">Telefone (com DDD)</label>
          <input 
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(16) 99724-2367"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 transition-colors"
          />
          
          {/* Checkbox Tornar Público */}
          <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
            <input 
              type="checkbox"
              checked={formData.isPhonePublic || false}
              onChange={(e) => handleChange('isPhonePublic', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 leading-tight">
              Tornar meu número público (permitir contato via WhatsApp)
            </span>
          </label>
        </div>

        {/* Estado Civil */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900">Estado Civil</label>
          <div className="relative">
            <select 
              value={formData.civilStatus || ''}
              onChange={(e) => handleChange('civilStatus', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 appearance-none outline-none focus:border-slate-300 transition-colors"
            >
              <option value="">Selecione...</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Congregação */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900">Congregação</label>
          <div className="relative">
            <select 
              value={formData.congregation || ''}
              onChange={(e) => handleChange('congregation', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 appearance-none outline-none focus:border-slate-300 transition-colors"
            >
              <option value="">Selecione...</option>
              <option value="ADBA SEDE">ADBA SEDE</option>
              <option value="ADBA JD PAULISTA">ADBA JARDIM PAULISTA</option>
              <option value="ADBA VILA NOVA">ADBA VILA NOVA</option>
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900">Bio</label>
          <textarea 
            value={formData.bio || ''}
            placeholder="Conte um pouco sobre você..."
            onChange={(e) => handleChange('bio', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 transition-colors h-24 resize-none"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
