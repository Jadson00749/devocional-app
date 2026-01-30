import React from 'react';
import { Home, Users, User, Plus, Zap, BarChart3, Flame, Search, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'group' | 'profile';
  setActiveTab: (tab: 'home' | 'group' | 'profile') => void;
  showSearch?: boolean;
  onSearchToggle?: () => void;
  onNewCheckIn?: () => void;
  isCheckInOpen?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onSearchToggle, onNewCheckIn, isCheckInOpen }) => {
  const getTitle = () => {
    switch(activeTab) {
      case 'home':
        return 'Geração Life';
      case 'group':
        return 'Feed da Comunidade';
      case 'profile':
        return 'Meu Perfil';
      default:
        return 'Geração Life';
    }
  };

  return (
    <div className="h-screen max-w-md mx-auto bg-white relative overflow-hidden flex flex-col">
      <header className="px-4 pt-6 pb-2 bg-white flex justify-between items-start border-b border-slate-200 mb-2 min-h-[62px] flex-shrink-0">
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
        ) : activeTab === 'profile' ? (
          <div className="flex items-center gap-6">
            <Flame size={22} className="text-orange-500" />
            <Settings size={22} className="opacity-70" />
          </div>
        ) : (
          <Flame size={22} className="text-orange-500" />
        )}
      </header>
      
      <main className="flex-1 overflow-y-auto pb-32">
        {children}
      </main>

      {/* Navigation Estilo Pílula */}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 w-[85%] max-w-xs z-[100]">
        <nav className="bg-white border border-slate-100 rounded-[2.2rem] h-[75px] px-4 flex justify-between items-center shadow-2xl ring-1 ring-black/5">
          <button 
            onClick={() => setActiveTab('home')}
            className={`px-4 py-3 rounded-[1.3rem] flex flex-col justify-center items-center transition-all gap-1 ${!isCheckInOpen && activeTab === 'home' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Home size={20} />
            {!isCheckInOpen && activeTab === 'home' && (
              <span className="text-[8px] font-black  uppercase tracking-wide leading-none text-white">Início</span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('group')}
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
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-3 rounded-[1.2rem] flex flex-col justify-center items-center transition-all gap-1 ${!isCheckInOpen && activeTab === 'profile' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <User size={20} />
            {!isCheckInOpen && activeTab === 'profile' && (
              <span className="text-[9px] font-black uppercase tracking-wide leading-none">Perfil</span>
            )}
          </button>

          <button
            className="w-12 h-12 rounded-xl flex justify-center items-center transition-all text-slate-400"
          >
            <BarChart3 size={22} />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Layout;


