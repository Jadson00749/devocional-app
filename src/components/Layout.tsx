import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Home, Users, User, Plus, Zap, BarChart3, Flame, Search, Settings, Edit2, Grid, Filter } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'group' | 'profile' | 'analytics';
  setActiveTab: (tab: 'home' | 'group' | 'profile' | 'analytics') => void;
  userRole?: UserRole;
  showSearch?: boolean;
  onSearchToggle?: () => void;
  onNewCheckIn?: () => void;
  isCheckInOpen?: boolean;
  onEditProfile?: () => void;
  onMyDevotionals?: () => void;
  onJourneyClick?: () => void;
  onAnalyticsFilterClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onSearchToggle, onNewCheckIn, isCheckInOpen, onEditProfile, onMyDevotionals, onJourneyClick, onAnalyticsFilterClick, userRole }) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const handleTabClick = (tab: 'home' | 'group' | 'profile' | 'analytics') => {
    if (activeTab === tab) {
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveTab(tab);
    }
  };

  // Fechar o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);
  const getTitle = () => {
    switch(activeTab) {
      case 'home':
        return 'Geração Life';
      case 'group':
        return 'Feed da Comunidade';
      case 'profile':
        return 'Meu Perfil';
      case 'analytics':
        return 'Analytics';
      default:
        return 'Geração Life';
    }
  };

  return (
    <div className="h-screen max-w-md mx-auto bg-white relative overflow-hidden flex flex-col">
      <header className={`px-4 pt-6 pb-2 bg-white flex justify-between items-start mb-2 min-h-[62px] flex-shrink-0 z-30 ${activeTab === 'group' ? '' : 'border-b border-slate-200'}`}>
        <div className="flex flex-col flex-1">
          {activeTab === 'profile' ? (
            <h1 className="text-[20px] font-bold text-slate-900 tracking-tighter flex items-center justify-start gap-0.5 leading-none">
              {getTitle()}
            </h1>
          ) : (
            <>
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tighter flex items-center gap-0.5 leading-none">
                {getTitle()} {activeTab === 'home' && <span className="text-amber-500"><Flame size={16} className="text-orange-500 opacity-80" /></span>}
              </h1>
              {activeTab === 'home' ? (
                <span className="text-[13px] font-semibold text-slate-400 uppercase mt-1">
                  BORA CRESCER JUNTOS!
                </span>
              ) : (
                <span className="text-[13px] font-semibold text-slate-400 uppercase mt-1 opacity-0 pointer-events-none">
                  BORA CRESCER JUNTOS!
                </span>
              )}
            </>
          )}
        </div>
        {activeTab === 'group' ? (
          <button 
            onClick={onSearchToggle}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Search size={20} className="text-slate-600" />
          </button>
        ) : activeTab === 'home' ? (
          <button 
            onClick={onJourneyClick}
            className="p-1 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <Flame size={22} className="text-orange-500" />
          </button>
        ) : activeTab === 'profile' ? (
          <div className="flex items-center gap-6">
            <button 
              onClick={onJourneyClick}
              className="p-1 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Flame size={22} className="text-orange-500" />
            </button>
            <div className="relative" ref={settingsMenuRef}>
              <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Settings size={22} className="opacity-70" />
              </button>
              
              {/* Dropdown Menu Portal */}
              {showSettingsMenu && createPortal(
                <div 
                  ref={settingsMenuRef}
                  className="fixed bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 w-56"
                  style={{
                    top: settingsMenuRef.current ? settingsMenuRef.current.getBoundingClientRect().bottom + 8 : 0,
                    left: settingsMenuRef.current ? settingsMenuRef.current.getBoundingClientRect().right - 224 : 0, // 224 = w-56 (224px)
                  }}
                >
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onEditProfile?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <Edit2 size={18} className="text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Editar Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onMyDevotionals?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <Grid size={18} className="text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Meus Devocionais</span>
                  </button>
                </div>,
                document.body
              )}
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          <button 
            onClick={onAnalyticsFilterClick}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-orange-500"><Filter size={22} className="text-orange-500" /></span>
          </button>
        ) : (
          <Flame size={22} className="text-orange-500" />
        )}
      </header>
      
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-32 relative z-50">
        {children}
      </main>

      {/* Navigation Estilo Pílula */}
      <div className={`fixed bottom-7 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        (userRole === 'admin' || userRole === 'admin_master') ? 'w-[85%] max-w-xs' : 'w-[72%] max-w-[280px]'
      }`}>
        <nav className="bg-white border border-slate-100 rounded-[2.2rem] h-[75px] px-4 flex justify-between items-center shadow-2xl ring-1 ring-black/5">
          <button 
            onClick={() => handleTabClick('home')}
            className={`px-4 py-3 rounded-[1.3rem] flex flex-col justify-center items-center transition-all gap-1 ${!isCheckInOpen && activeTab === 'home' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Home size={20} />
            {!isCheckInOpen && activeTab === 'home' && (
              <span className="text-[8px] font-black  uppercase tracking-wide leading-none text-white">Início</span>
            )}
          </button>
          
          <button 
            onClick={() => handleTabClick('group')}
            className={`px-4 py-3 rounded-[1.2rem] flex flex-col justify-center items-center transition-all gap-1 ${!isCheckInOpen && activeTab === 'group' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Users size={20} />
            {!isCheckInOpen && activeTab === 'group' && (
              <span className="text-[9px] font-black uppercase tracking-wide leading-none">Feed</span>
            )}
          </button>

          <button 
            onClick={onNewCheckIn}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex justify-center items-center shadow-xl active:scale-95 transition-transform"
          >
            <Plus size={26} strokeWidth={2} />
          </button>
          
          <button
            onClick={() => handleTabClick('profile')}
            className={`px-3.5 py-3 rounded-[1.2rem] flex flex-col justify-center items-center transition-all gap-1 ${!isCheckInOpen && activeTab === 'profile' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <User size={20} />
            {!isCheckInOpen && activeTab === 'profile' && (
              <span className="text-[9px] font-black uppercase tracking-wide leading-none">Perfil</span>
            )}
          </button>


          {(userRole === 'admin' || userRole === 'admin_master') && (
            <button
              onClick={() => handleTabClick('analytics')}
              className={`px-3.5 py-3 rounded-[1.2rem] flex flex-col justify-center items-center transition-all gap-1 ${!isCheckInOpen && activeTab === 'analytics' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
            >
              <BarChart3 size={20} />
              {!isCheckInOpen && activeTab === 'analytics' && (
                <span className="text-[9px] font-black uppercase tracking-wide leading-none">Analytics</span>
              )}
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Layout;


