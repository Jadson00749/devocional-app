
import React from 'react';
import { Home, Users, User, Plus, Zap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'group' | 'profile';
  setActiveTab: (tab: 'home' | 'group' | 'profile') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen max-w-md mx-auto bg-white relative pb-32">
      {/* Header Estilo Imagem - Foco na Tipografia */}
      <header className="px-6 pt-10 pb-4 bg-white flex justify-between items-start">
        <div className="flex flex-col">
          <h1 className="text-[22px] font-black text-slate-900 tracking-tighter flex items-center gap-1.5 leading-none">
            Geração Life <span className="text-amber-500">🔥</span>
          </h1>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1.5">
            BORA CRESCER JUNTOS!
          </span>
        </div>
        <button className="p-2">
          <Zap size={22} className="text-orange-500" />
        </button>
      </header>
      
      <main>
        {children}
      </main>

      {/* Navigation Estilo Pílula */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-xs z-[100]">
        <nav className="bg-white border border-slate-100 rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl ring-1 ring-black/5">
          <button 
            onClick={() => setActiveTab('home')}
            className={`w-14 h-14 rounded-full flex flex-col justify-center items-center transition-all ${activeTab === 'home' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Home size={20} />
            <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Início</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('group')}
            className={`w-14 h-14 rounded-full flex justify-center items-center transition-all ${activeTab === 'group' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Users size={22} />
          </button>

          <button 
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex justify-center items-center shadow-xl active:scale-95 transition-transform"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-14 h-14 rounded-full flex justify-center items-center transition-all ${activeTab === 'profile' ? 'bg-[#12192b] text-white shadow-lg' : 'text-slate-400'}`}
          >
            <User size={22} />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
