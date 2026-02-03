import React, { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Flame, X, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import InstallBanner from './InstallBanner';

// Registrar locale português
registerLocale('ptBR', ptBR);

interface AuthProps {
  onAuthSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupOptions, setShowSignupOptions] = useState(false);
  const [signupMethod, setSignupMethod] = useState<'google' | 'email' | null>(null);
  
  // Campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [civilStatus, setCivilStatus] = useState('');
  const [congregation, setCongregation] = useState('');
  
  // Estados de erro
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
    confirmPassword?: string;
    birthday?: string;
    civilStatus?: string;
    congregation?: string;
    general?: string;
  }>({});
  
  // Opções para dropdowns
  const civilStatusOptions = [
    'Solteiro(a)',
    'Casado(a)',
    'Divorciado(a)',
    'Viúvo(a)',
    'União Estável'
  ];
  
  const [congregationOptions, setCongregationOptions] = useState<Array<{ name: string; region: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { signIn, signUp, signInWithGoogle } = useAuth();

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

  // Verificar se há callback do Google OAuth
  useEffect(() => {
    const checkAuthCallback = async () => {
      // Verificar se há hash na URL (callback do Supabase OAuth)
      const hash = window.location.hash;
      const hasAuthHash = hash.includes('access_token') || hash.includes('code');
      
      // Verificar query params também
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (error) {
        setErrors({ general: 'Erro ao entrar com Google. Tente novamente.' });
        // Limpar URL
        window.history.replaceState({}, document.title, '/');
        return;
      }

      // Se há hash de autenticação ou código, aguardar o Supabase processar
      if (hasAuthHash || code) {
        // Aguardar um pouco para o Supabase processar
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && onAuthSuccess) {
            // Limpar hash/query params da URL
            window.history.replaceState({}, document.title, '/');
            onAuthSuccess();
          }
        }, 1000);
      } else {
        // Verificar sessão existente
        const { data: { session } } = await supabase.auth.getSession();
        if (session && onAuthSuccess) {
          onAuthSuccess();
        }
      }
    };
    checkAuthCallback();
  }, [onAuthSuccess]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Este campo é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password.trim()) {
      newErrors.password = 'Este campo é obrigatório';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter no mínimo 6 caracteres';
    }

    if (!isLogin && signupMethod === 'email') {
      if (!fullName.trim()) {
        newErrors.fullName = 'Este campo é obrigatório';
      } else if (fullName.trim().length < 2) {
        newErrors.fullName = 'O nome deve ter no mínimo 2 caracteres';
      }

      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Este campo é obrigatório';
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = 'As senhas não conferem';
      }

      if (!birthday) {
        newErrors.birthday = 'Este campo é obrigatório';
      }

      if (!civilStatus.trim()) {
        newErrors.civilStatus = 'Este campo é obrigatório';
      }

      if (!congregation.trim()) {
        newErrors.congregation = 'Este campo é obrigatório';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validar primeiro
    const isValid = validateForm();
    
    if (!isValid) {
      // Mostrar notificação inline de erro se houver campos não preenchidos
      setErrors({ general: 'Preencha todos os campos obrigatórios' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setErrors({
            general: error.message === 'Invalid login credentials' 
              ? 'Email ou senha inválidos' 
              : error.message,
          });
          toast.error('Erro ao entrar', {
            description: error.message === 'Invalid login credentials' 
              ? 'Email ou senha inválidos' 
              : error.message,
          });
        } else if (onAuthSuccess) {
          toast.success('Login realizado com sucesso!');
          onAuthSuccess();
        }
      } else if (signupMethod === 'email') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ general: 'Este email já está cadastrado' });
            toast.error('Erro ao cadastrar', {
              description: 'Este email já está cadastrado',
            });
          } else {
            setErrors({ general: error.message });
            toast.error('Erro ao cadastrar', {
              description: error.message,
            });
          }
        } else {
          // Atualizar perfil com dados adicionais
          if (birthday || civilStatus || congregation) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('profiles')
                .update({
                  birthday: birthday ? birthday.toISOString().split('T')[0] : null,
                  civil_status: civilStatus || null,
                  congregation: congregation || null,
                })
                .eq('id', user.id);
            }
          }
          
          toast.success('Conta criada com sucesso!', {
            description: 'Verifique seu email para confirmar.',
          });
          setTimeout(() => {
            setIsLogin(true);
            setShowSignupOptions(false);
            setSignupMethod(null);
            setErrors({});
          }, 3000);
        }
      }
    } catch (err) {
      setErrors({ general: 'Ocorreu um erro inesperado. Tente novamente.' });
      toast.error('Erro inesperado', {
        description: 'Ocorreu um erro inesperado. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrors({ general: 'Erro ao entrar com Google. Tente novamente.' });
      setIsLoading(false);
    }
    // Se não houver erro, o usuário será redirecionado automaticamente
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setShowSignupOptions(false);
    setSignupMethod(null);
    setErrors({});
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setBirthday(undefined);
    setCivilStatus('');
    setCongregation('');
  };

  const handleSignupOptionSelect = (method: 'google' | 'email') => {
    setSignupMethod(method);
    setShowSignupOptions(false);
    if (method === 'google') {
      handleGoogleSignIn();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center px-4 py-8 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Mensagem de Erro Geral - Fixada no topo, sobreposta */}
      {errors.general && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-red-500 rounded-2xl px-4 py-3.5 shadow-2xl">
            <h3 className="text-[15px] font-bold text-white leading-tight mb-1">
              {errors.general.includes('Preencha') ? 'Erro ao entrar' : 'Erro ao entrar'}
            </h3>
            {errors.general.includes('Preencha') && (
              <p className="text-[14px] text-white/95 leading-tight">
                Preencha os campos obrigatórios e tente novamente.
              </p>
            )}
            {!errors.general.includes('Preencha') && (
              <p className="text-[13px] text-white/95 leading-tight">
                {errors.general}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-md py-4 pt-20">

        {/* Logo e Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2d2a1f] mb-4 shadow-lg border border-[#3a3628]/50">
            <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1 flex items-center justify-center gap-2">
            Geração Life
            <span className="text-orange-500">🔥</span>
          </h1>
          <p className="text-slate-500 text-base -mt-0.5">Bora crescer juntos na fé</p>
        </div>

        {/* Card de Autenticação */}
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50">
          {/* Toggle Login/Signup */}
          <div className="flex gap-2 mb-6 bg-slate-700/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={handleToggleMode}
              className={`flex-1 py-2 px-3.5 rounded-xl text-sm font-semibold transition-all ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLogin) {
                  setIsLogin(false);
                  setShowSignupOptions(true);
                } else {
                  handleToggleMode();
                }
              }}
              className={`flex-1 py-2 px-3.5 rounded-xl text-sm font-semibold transition-all ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Opções de Signup (Google ou Email) */}
          {!isLogin && showSignupOptions && !signupMethod && (
            <div className="space-y-3 mb-4 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => handleSignupOptionSelect('google')}
                disabled={isLoading}
                className="w-full py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl border-2 border-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Criar conta com Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-800 text-slate-400">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSignupOptionSelect('email')}
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Criar conta com Email</span>
                <Flame size={14} className="fill-current" />
              </button>
            </div>
          )}

          {/* Formulário */}
          {(isLogin || signupMethod === 'email') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome Completo (apenas no signup com email) */}
              {!isLogin && signupMethod === 'email' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 ml-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                    }}
                    className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                      errors.fullName ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-red-500 text-xs font-medium ml-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                    errors.email ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-red-500 text-xs font-medium ml-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 ml-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={`w-full px-3 py-2.5 pr-10 bg-white border-2 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                      errors.password ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-red-500 text-xs font-medium ml-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirmar Senha (apenas no signup com email) */}
              {!isLogin && signupMethod === 'email' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 ml-1">
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                      errors.confirmPassword ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-red-500 text-xs font-medium ml-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Data de Nascimento (apenas no signup com email) */}
              {!isLogin && signupMethod === 'email' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 ml-1">
                    Data de nascimento
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      type="date"
                      value={birthday ? birthday.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          const date = new Date(dateValue);
                          setBirthday(date);
                          if (errors.birthday) setErrors({ ...errors, birthday: undefined });
                        } else {
                          setBirthday(undefined);
                        }
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className={cn(
                        'w-full pl-10 pr-3 py-2.5 bg-white border-2 rounded-xl text-sm text-slate-900',
                        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
                        !birthday && 'text-slate-400',
                        errors.birthday ? 'border-red-500' : 'border-slate-200'
                      )}
                    />
                  </div>
                  {errors.birthday && (
                    <p className="mt-1 text-red-500 text-xs font-medium ml-1">
                      {errors.birthday}
                    </p>
                  )}
                </div>
              )}

              {/* Estado Civil (apenas no signup com email) */}
              {!isLogin && signupMethod === 'email' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 ml-1">
                    Estado civil
                  </label>
                  <Select
                    value={civilStatus}
                    onValueChange={(value) => {
                      setCivilStatus(value);
                      if (errors.civilStatus) setErrors({ ...errors, civilStatus: undefined });
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        errors.civilStatus ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                      )}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {civilStatusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.civilStatus && (
                    <p className="mt-1 text-red-500 text-xs font-medium ml-1">
                      {errors.civilStatus}
                    </p>
                  )}
                </div>
              )}

              {/* Congregação (apenas no signup com email) */}
              {!isLogin && signupMethod === 'email' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 ml-1">
                    Congregação
                  </label>
                  <Select
                    value={congregation}
                    onValueChange={(value) => {
                      setCongregation(value);
                      setSearchTerm(''); // Limpar busca ao selecionar
                      if (errors.congregation) setErrors({ ...errors, congregation: undefined });
                    }}
                    onOpenChange={(open) => {
                      if (!open) {
                        setSearchTerm(''); // Limpar busca ao fechar
                      }
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        errors.congregation ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                      )}
                    >
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Campo de busca */}
                      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSearchTerm(e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              // Prevenir que Enter feche o select
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            onKeyUp={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onBlur={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            autoFocus={false}
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
                  {errors.congregation && (
                    <p className="mt-1 text-red-500 text-xs font-medium ml-1">
                      {errors.congregation}
                    </p>
                  )}
                </div>
              )}

              {/* Botão de Submit */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? 'Entrar' : 'Criar conta'}</span>
                      <Flame size={14} className="text-orange-500 fill-orange-500" />
                    </>
                  )}
                </button>

                {/* Botão Voltar (apenas no signup com email) */}
                {!isLogin && signupMethod === 'email' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSignupMethod(null);
                      setShowSignupOptions(true);
                      setErrors({});
                    }}
                    className="w-full text-center text-white text-sm font-medium hover:text-orange-400 transition-colors"
                  >
                    Voltar
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Botão Google (apenas no login) */}
          {isLogin && (
            <>
              {/* Divisor */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-800 text-slate-400">ou</span>
                </div>
              </div>

              {/* Botão Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 bg-white text-slate-900 font-bold rounded-2xl border-2 border-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </button>
            </>
          )}

          {/* Esqueci minha senha (apenas no login) */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
        </div>
      </div>
      <InstallBanner />
    </div>
  );
};

export default Auth;

