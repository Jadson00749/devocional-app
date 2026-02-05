import React, { useState, useEffect, useMemo } from 'react';
import { X, Camera, ImageIcon, Calendar as CalendarIcon, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { User } from '@/types';
import { supabase } from '../integrations/supabase/client';
import { cn } from '../lib/utils';

interface ProfileEditProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  isMandatory?: boolean;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ user, onClose, onSave, isMandatory = false }) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [congregationOptions, setCongregationOptions] = useState<Array<{ name: string; region: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  // Opções para estado civil
  const civilStatusOptions = [
    'Solteiro(a)',
    'Casado(a)',
    'Divorciado(a)',
    'Viúvo(a)',
    'União Estável'
  ];

  // Filtrar congregações baseado na busca
  const filteredCongregations = useMemo(() => {
    if (!searchTerm.trim()) {
      return congregationOptions;
    }
    const term = searchTerm.toLowerCase().trim();
    return congregationOptions.filter(
      (option) =>
        option.name.toLowerCase().includes(term) ||
        option.region.toLowerCase().includes(term)
    );
  }, [congregationOptions, searchTerm]);

  // Aplicar máscara ao telefone inicial e debugar dados
  useEffect(() => { 
    // Aplicar máscara ao telefone se existir
    if (user.phone && !user.phone.includes('(')) {
      setFormData(prev => ({
        ...prev,
        phone: applyPhoneMask(user.phone || '')
      }));
    }
  }, [user]);

  // Buscar congregações do banco de dados
  useEffect(() => {
    const fetchCongregations = async () => {
      try {
        const { data, error } = await supabase
          .from('congregations')
          .select('name, region')
          .order('name', { ascending: true });
        
        if (error) {
          console.error('Erro ao buscar congregações:', error);
          return;
        }
        
        if (data) {
          setCongregationOptions(data.map(item => ({ name: item.name, region: item.region })));
        }
      } catch (error) {
        console.error('Erro ao buscar congregações:', error);
      }
    };

    fetchCongregations();
  }, []);

  // Função para aplicar máscara de telefone brasileiro
  const applyPhoneMask = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    // Limita a 11 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (field: keyof User, value: any) => {
    // Aplicar máscara de telefone se o campo for 'phone'
    if (field === 'phone' && typeof value === 'string') {
      value = applyPhoneMask(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida (JPG ou PNG)');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erro ao fazer upload:', error);
        alert('Erro ao fazer upload da imagem. Tente novamente.');
        return;
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar formData com a nova URL
      handleChange('avatar', publicUrl);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      // Limpar o input para permitir selecionar a mesma imagem novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = () => {
    // Validação de campos obrigatórios
    if (!formData.name?.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    if (!formData.birthday) {
      toast.error('A data de nascimento é obrigatória');
      return;
    }
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      toast.error('O telefone é obrigatório e deve ser válido');
      return;
    }
    if (!formData.civilStatus) {
      toast.error('O estado civil é obrigatório');
      return;
    }
    if (!formData.congregation) {
      toast.error('A congregação é obrigatória');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-white px-6 py-5 flex items-center justify-between border-b border-slate-100 z-[9999] shadow-sm">
        <div className="flex-1"></div>
        <div className="flex-col items-center text-center flex-[2]">
          <h2 className="text-lg font-bold text-slate-900">Editar Perfil</h2>
          <p className="text-xs text-slate-500 mt-0.5">Atualize suas informações pessoais</p>
        </div>
        <button onClick={onClose} className={cn("flex-1 flex justify-end", isMandatory && "invisible pointer-events-none")}>
          <X size={24} className="text-slate-500" />
        </button>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 py-6 space-y-4 pb-32">
        {/* Foto de Perfil */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1">
            Foto de Perfil
          </label>
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
              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              {/* Input file para câmera */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ImageIcon size={16} /> Galeria
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera size={16} /> Câmera
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">Máximo 5MB. Formatos: JPG, PNG</p>
            </div>
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1">
            Nome <span className="text-red-500">*</span>
          </label>
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
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1">
            Data de Nascimento <span className="text-red-500">*</span>
          </label>
          <input 
            type="date"
            value={formData.birthday || ''}
            onChange={(e) => handleChange('birthday', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 transition-colors"
          />
          <p className="text-xs text-slate-500">Sua data de nascimento será usada apenas para análises demográficas</p>
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1">
            Telefone <span className="text-red-500">*</span>
          </label>
          <input 
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(16) 99724-2367"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 outline-none focus:border-slate-300 transition-colors"
          />
          
          {/* Checkbox Tornar Público */}
          <label className="flex items-start gap-3 mt-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox"
                checked={formData.isPhonePublic || false}
                onChange={(e) => handleChange('isPhonePublic', e.target.checked)}
                className="sr-only"
              />
              <div 
                className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                  formData.isPhonePublic 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-slate-300 group-hover:border-blue-400'
                }`}
              >
                {formData.isPhonePublic && (
                  <svg 
                    className="w-3 h-3 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-slate-600 leading-tight flex-1">
              Tornar meu número público (permitir contato via WhatsApp)
            </span>
          </label>
        </div>

        {/* Estado Civil */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1">
            Estado Civil <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.civilStatus || ''}
            onValueChange={(value) => handleChange('civilStatus', value)}
          >
            <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 focus:border-slate-300">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="z-[10000]">
              {civilStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Congregação */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1">
            Congregação <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.congregation || ''}
            onValueChange={(value) => {
              handleChange('congregation', value);
              setSearchTerm(''); // Limpar busca ao selecionar
            }}
            onOpenChange={(open) => {
              if (!open) {
                setSearchTerm(''); // Limpar busca ao fechar
              }
            }}
          >
            <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-medium text-slate-900 focus:border-slate-300">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent className="z-[10000]">
              {/* Campo de busca */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  />
                </div>
              </div>
              
              {/* Lista de opções filtradas */}
              {filteredCongregations.length > 0 ? (
                filteredCongregations.map((option) => (
                  <SelectItem key={option.name} value={option.name}>
                    <div className="flex flex-col">
                      <span>{option.name}</span>
                      <span className="region-info text-xs text-slate-500 data-[state=checked]:text-white/90">{option.region}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-sm text-slate-500 text-center">
                  Nenhuma congregação encontrada
                </div>
              )}
            </SelectContent>
          </Select>
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
        <div className="flex gap-3 justify-end">
          {!isMandatory && (
            <button 
              onClick={onClose}
              className="bg-white border border-slate-200 text-slate-700 py-1 px-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={handleSave}
            className="bg-slate-900 text-white py-2.5 px-5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
