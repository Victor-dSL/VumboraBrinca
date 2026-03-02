
import React from 'react';
import { Clock, PlusSquare, Settings, FileText, BarChart3, LogOut, Image as ImageIcon } from 'lucide-react';
import { User, ApiConfig } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'extras' | 'history' | 'reports' | 'connections';
  onTabChange: (tab: 'dashboard' | 'extras' | 'history' | 'reports' | 'connections') => void;
  hasNotification?: boolean;
  user: User | null;
  onLogout: () => void;
  logoBase64?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, hasNotification, user, onLogout, logoBase64 }) => {
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-24 bg-blue-900 flex flex-col items-center py-6 text-white shadow-xl h-screen sticky top-0">
      <div className="mb-8 p-1 bg-white rounded-2xl shadow-lg border-2 border-blue-400 overflow-hidden w-16 h-16 flex items-center justify-center">
        {logoBase64 ? (
          <img 
            src={logoBase64} 
            alt="Vumbora" 
            className="w-full h-full object-contain" 
          />
        ) : (
          <div className="text-blue-600 flex flex-col items-center">
            <ImageIcon size={24} />
            <span className="text-[8px] font-black uppercase">Brincá</span>
          </div>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full px-2">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-lg translate-x-1 scale-105' 
              : 'text-blue-200 hover:bg-blue-800 hover:text-white'
          }`}
          title="Monitoramento"
        >
          <Clock size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-black text-center uppercase tracking-tighter leading-none">Painel</span>
        </button>

        <button
          onClick={() => onTabChange('extras')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group ${
            activeTab === 'extras' 
              ? 'bg-blue-600 text-white shadow-lg translate-x-1 scale-105' 
              : 'text-blue-200 hover:bg-blue-800 hover:text-white'
          }`}
          title="Novo Cadastro"
        >
          <PlusSquare size={24} strokeWidth={activeTab === 'extras' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-black text-center uppercase tracking-tighter leading-none">Cadastro</span>
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group ${
            activeTab === 'history' 
              ? 'bg-blue-600 text-white shadow-lg translate-x-1 scale-105' 
              : 'text-blue-200 hover:bg-blue-800 hover:text-white'
          }`}
          title="Histórico de Visitas"
        >
          <FileText size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-black text-center uppercase tracking-tighter leading-none">Histórico</span>
        </button>

        <button
          onClick={() => onTabChange('reports')}
          className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group ${
            activeTab === 'reports' 
              ? 'bg-blue-600 text-white shadow-lg translate-x-1 scale-105' 
              : 'text-blue-200 hover:bg-blue-800 hover:text-white'
          }`}
          title="Relatórios e Fidelidade"
        >
          {hasNotification && (
            <span className="absolute top-2 right-2 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          )}
          <BarChart3 size={24} strokeWidth={activeTab === 'reports' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-black text-center uppercase tracking-tighter leading-none">Relatórios</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onTabChange('connections')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group ${
              activeTab === 'connections' 
                ? 'bg-blue-600 text-white shadow-lg translate-x-1 scale-105' 
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
          }`}
            title="Ajustes de API e Sistema"
          >
            <Settings size={24} strokeWidth={activeTab === 'connections' ? 2.5 : 2} />
            <span className="text-[9px] mt-1 font-black text-center uppercase tracking-tighter leading-none">Ajustes</span>
          </button>
        )}
      </nav>

      <button
        onClick={onLogout}
        className="mt-auto flex flex-col items-center justify-center p-3 rounded-xl text-blue-300 hover:bg-red-500 hover:text-white transition-all duration-200"
        title="Sair do Sistema"
      >
        <LogOut size={24} />
        <span className="text-[9px] mt-1 font-black uppercase">Sair</span>
      </button>
    </aside>
  );
};

export default Sidebar;
