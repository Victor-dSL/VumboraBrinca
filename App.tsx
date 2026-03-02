
import React, { useEffect, useState, useRef } from 'react';
import EntryForm from './components/EntryForm';
import StatusCards from './components/StatusCards';
import ActiveList from './components/ActiveList';
import Sidebar from './components/Sidebar';
import RegistrationPanel from './components/RegistrationPanel';
import HistoryPanel from './components/HistoryPanel';
import ReportsPanel from './components/ReportsPanel';
import ConnectionsPanel from './components/ConnectionsPanel';
import Login from './components/Login';
import { subscribeToActiveEntries, fetchHistory, getApiConfigOnce, subscribeToRegistrations, getLastSweepDate, setLastSweepDate, subscribeToApiConfig } from './firebase';
import { KidEntry, ChildRegistration, User, ApiConfig } from './types';
import { AlertTriangle, User as UserIcon } from 'lucide-react';
import { sendWhatsappDirect, getRenewalMessageTemplate } from './whatsappService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vumbora_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'extras' | 'history' | 'reports' | 'connections'>('dashboard');
  const [activeEntries, setActiveEntries] = useState<KidEntry[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<ChildRegistration[]>([]);
  const [stats, setStats] = useState({ active: 0, warning: 0, expired: 0 });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasLoyaltyNotification, setHasLoyaltyNotification] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const sweepInterval = useRef<any>(null);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('vumbora_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vumbora_user');
    setActiveTab('dashboard');
  };

  useEffect(() => {
    if (!user) return;

    const unsubscribeActive = subscribeToActiveEntries(
      (entries) => {
        setActiveEntries(entries);
        setConnectionError(null); 
      },
      (error: any) => setConnectionError("Erro de conexão.")
    );

    const unsubscribeReg = subscribeToRegistrations(
      (data) => setAllRegistrations(data),
      (err) => console.error(err)
    );

    const unsubscribeConfig = subscribeToApiConfig((data) => {
      if (data) setApiConfig(data);
    });

    return () => {
      unsubscribeActive();
      unsubscribeReg();
      unsubscribeConfig();
    };
  }, [user]);

  // Lógica de Varredura às 19:00 (Brasília)
  useEffect(() => {
    if (!user) return;

    const checkRenewalSweep = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const dateStr = now.toISOString().split('T')[0];

      if (currentHour >= 19) {
        const lastSweep = await getLastSweepDate();
        if (lastSweep !== dateStr) {
          console.log("[Sweeper] Iniciando varredura de renovação às 19h...");
          await performRenewalSweep();
          await setLastSweepDate(dateStr);
        }
      }
    };

    const performRenewalSweep = async () => {
      const config = await getApiConfigOnce();
      if (!config) return;

      const warningDays = config.renewalWarningDays || 5;
      const today = new Date();
      
      const gymPlans = allRegistrations.filter(r => r.isGymPlan);
      
      for (const reg of gymPlans) {
        const year = today.getFullYear();
        const month = today.getMonth();
        const nextDue = new Date(year, month, reg.registrationDay);
        
        if (today > nextDue) {
          nextDue.setMonth(nextDue.getMonth() + 1);
        }

        const diffTime = nextDue.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays <= warningDays) {
          const msg = await getRenewalMessageTemplate(reg.childName, diffDays, nextDue.toLocaleDateString('pt-BR'));
          await sendWhatsappDirect(reg.contactNumber1, msg, false);
        }
      }
    };

    sweepInterval.current = setInterval(checkRenewalSweep, 60000);
    checkRenewalSweep();

    return () => clearInterval(sweepInterval.current);
  }, [allRegistrations, user]);

  useEffect(() => {
    if (!user) return;
    const checkFidelidade = async () => {
      try {
        const history = await fetchHistory(5000); 
        const counts: Record<string, number> = {};
        let anyoneReached10 = false;
        history.forEach(rec => {
          const phone = rec.contactNumber.replace(/\D/g, '');
          if (!phone) return;
          counts[phone] = (counts[phone] || 0) + 1;
          if (counts[phone] >= 10) anyoneReached10 = true;
        });
        setHasLoyaltyNotification(anyoneReached10);
      } catch (e) {
        console.error(e);
      }
    };
    checkFidelidade();
  }, [activeTab, user]);

  useEffect(() => {
    if (!user) return;
    const updateStats = () => {
      const now = Date.now();
      let expired = 0;
      let warning = 0;
      activeEntries.forEach(entry => {
        const endTime = entry.entryTime + (entry.packageDuration * 60 * 1000) + (entry.totalPausedTime || 0);
        const remainingMin = (endTime - now) / 1000 / 60;
        if (remainingMin <= 0) expired++;
        else if (remainingMin <= 5) warning++;
      });
      setStats({ active: activeEntries.length, warning, expired });
    };
    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [activeEntries, user]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Redireciona usuários sem permissão se tentarem forçar a aba de conexões
  if (activeTab === 'connections' && user.role !== 'admin') {
    setActiveTab('dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        hasNotification={hasLoyaltyNotification}
        user={user}
        onLogout={handleLogout}
        logoBase64={apiConfig?.logoBase64}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">
              {activeTab === 'dashboard' && 'Monitoramento'}
              {activeTab === 'extras' && 'Cadastros'}
              {activeTab === 'history' && 'Histórico'}
              {activeTab === 'reports' && 'Fidelidade'}
              {activeTab === 'connections' && 'Ajustes'}
            </h1>
            
            <div className="flex items-center gap-4">
              {connectionError && (
                <div className="flex items-center text-red-500 text-xs font-black animate-pulse bg-red-50 px-3 py-1.5 rounded-full border border-red-100 uppercase">
                  <AlertTriangle size={14} className="mr-1.5" />
                  Sem Conexão
                </div>
              )}
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <UserIcon size={16} className="text-blue-600" />
                <span className="text-[11px] font-black text-blue-800 uppercase">{user.name}</span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1"><EntryForm /></div>
                <div className="lg:col-span-2 flex flex-col h-full">
                  <StatusCards totalActive={stats.active} expiringSoon={stats.warning} expired={stats.expired} />
                  <div className="flex-grow">
                    <ActiveList entries={activeEntries} onOpenHistory={() => setActiveTab('history')} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'extras' && <RegistrationPanel />}
          {activeTab === 'history' && <HistoryPanel />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'connections' && user.role === 'admin' && <ConnectionsPanel />}
        </main>

        <footer className="bg-white border-t border-gray-200 shrink-0">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Vumbora Brincá.</p>
            <span>v24 (Oficial)</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
