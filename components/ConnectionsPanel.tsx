
import React, { useState, useEffect, useRef } from 'react';
<<<<<<< HEAD
import { ShieldCheck, Link2, Key, Send, Globe, Loader2, CheckCircle, AlertCircle, Save, MessageSquare, Clock, Dumbbell, UserCheck, Eye, EyeOff, CreditCard, CalendarDays, HeartHandshake, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { saveApiConfig, subscribeToApiConfig } from '../firebase';
=======
import { ShieldCheck, Link2, Key, Send, Globe, Loader2, CheckCircle, AlertCircle, Save, MessageSquare, Clock, Dumbbell, UserCheck, Eye, EyeOff, CreditCard, CalendarDays, HeartHandshake, Image as ImageIcon, Upload, Trash2, Pause, Play, XCircle } from 'lucide-react';
import { saveApiConfig, subscribeToApiConfig, fetchHistory, fetchAllRegistrations } from '../firebase';
import { sendWhatsappDirect } from '../whatsappService';
>>>>>>> babe606 (Implementação de Envio em Massa, Agenda Academia e Formulário Público de Agendamento)
import { ApiConfig } from '../types';

const ConnectionsPanel: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>({
    baseUrl: 'https://www.wasenderapi.com/api',
    token: '',
    instanceId: '52457',
    endpoint: '/send-message',
    useProxy: false,
    proxyUrl: 'https://corsproxy.io/?',
    logoBase64: '',
    entryMessage: '🚀 *BEM-VINDO:* A diversão do(a) *[CRIANCA]* no Vumbora Brincá começou! Avisaremos quando estiver perto do fim.',
    warningMessage: '⚠️ *AVISO VUMBORA:* Olá! Em [MINUTOS] minutos o tempo do(a) *[CRIANCA]* acabará. Favor se dirigir ao espaço para o checkout! ❤️',
    academyMessage: '🏋️ *NOVO PLANO:* Cadastro de *[CRIANCA]* realizado com sucesso no Plano Academia! Matrícula: *[MATRICULA]*. Seja bem-vindo!',
    renewalMessage: '🔔 *AVISO DE RENOVAÇÃO:* Olá! O Plano Academia do(a) *[CRIANCA]* vence em *[DIAS]* dias (Data: [DATA_VENCIMENTO]). Garanta a renovação para não perder a diversão! 🚀',
    renewalThanksMessage: '✅ *OBRIGADO:* A renovação do Plano Academia do(a) *[CRIANCA]* ([PLANO]) foi confirmada! Diversão garantida por mais um ciclo. 🚀',
    warningMinutes: 5,
    renewalWarningDays: 5,
    gymMonthlyPrice: 150,
    gymQuarterlyPrice: 400
  });

  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

<<<<<<< HEAD
=======
  // Estados para Envio em Massa
  const [bulkMessages, setBulkMessages] = useState({ gym: '', standard: '', last: '' });
  const [lastVisitorsQty, setLastVisitorsQty] = useState(10);
  const [sendingBulk, setSendingBulk] = useState<string | null>(null);

  // Estados do Modal de Progresso
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState<{
    total: number,
    current: number,
    success: number,
    failed: number,
    lastSent: { name: string, phone: string }[],
    isPaused: boolean,
    isCancelled: boolean
  }>({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    lastSent: [],
    isPaused: false,
    isCancelled: false
  });

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  const handleSendBulk = async (type: 'gym' | 'standard' | 'last') => {
    const message = bulkMessages[type];
    if (!message.trim()) {
      alert("Por favor, digite uma mensagem.");
      return;
    }

    const typeLabel = type === 'gym' ? 'PLANO ACADEMIA' : type === 'standard' ? 'CONVENCIONAIS' : `ÚLTIMOS ${lastVisitorsQty} VISITANTES`;
    if (!window.confirm(`Deseja enviar esta mensagem para todos os contatos do tipo ${typeLabel}?`)) return;

    setSendingBulk(type);
    isPausedRef.current = false;
    isCancelledRef.current = false;

    try {
      let contacts: { name: string, phone: string }[] = [];

      if (type === 'gym' || type === 'standard') {
        const regs = await fetchAllRegistrations();
        contacts = regs
          .filter(r => type === 'gym' ? r.isGymPlan : !r.isGymPlan)
          .map(r => ({ name: r.childName, phone: r.contactNumber1 }))
          .filter(c => !!c.phone);
      } else if (type === 'last') {
        const history = await fetchHistory(5000);
        const seen = new Set();
        const recentContacts: { name: string, phone: string }[] = [];

        for (const record of history) {
          const rawPhone = record.contactNumber.replace(/\D/g, '');
          if (rawPhone && !seen.has(rawPhone)) {
            seen.add(rawPhone);
            recentContacts.push({ name: record.childName, phone: record.contactNumber });
            if (recentContacts.length >= lastVisitorsQty) break;
          }
        }
        contacts = recentContacts;
      }

      // Remove duplicidades por telefone
      const uniqueContacts: { name: string, phone: string }[] = [];
      const seenPhones = new Set();
      for (const c of contacts) {
        const clean = c.phone.replace(/\D/g, '');
        if (!seenPhones.has(clean)) {
          seenPhones.add(clean);
          uniqueContacts.push(c);
        }
      }

      if (uniqueContacts.length === 0) {
        alert("Nenhum contato encontrado para este grupo.");
        setSendingBulk(null);
        return;
      }

      // Inicia Modal
      setProgressData({
        total: uniqueContacts.length,
        current: 0,
        success: 0,
        failed: 0,
        lastSent: [],
        isPaused: false,
        isCancelled: false
      });
      setShowProgressModal(true);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < uniqueContacts.length; i++) {
        // Verifica Pausa (Loop de espera)
        while (isPausedRef.current && !isCancelledRef.current) {
          await new Promise(r => setTimeout(r, 500));
        }

        // Verifica Cancelamento
        if (isCancelledRef.current) break;

        const contact = uniqueContacts[i];

        // Atualiza UI antes de enviar
        setProgressData(prev => ({ ...prev, current: i + 1 }));

        const result = await sendWhatsappDirect(contact.phone, message, false);

        if (result) successCount++;
        else failCount++;

        // Atualiza UI com sucesso/falha e últimos 10
        setProgressData(prev => ({
          ...prev,
          success: successCount,
          failed: failCount,
          lastSent: [{ name: contact.name, phone: contact.phone }, ...prev.lastSent].slice(0, 10)
        }));

        // Delay de segurança (ignore se for o último ou se cancelou)
        if (i < uniqueContacts.length - 1 && !isCancelledRef.current) {
          await new Promise(r => setTimeout(r, 5500));
        }
      }

      if (!isCancelledRef.current) {
        alert(`✅ Concluído! Mensagens enviadas para ${successCount} de ${uniqueContacts.length} contatos.`);
      } else {
        alert(`⏹️ Envio interrompido. Enviadas com sucesso: ${successCount}`);
      }

      setBulkMessages(prev => ({ ...prev, [type]: '' }));
    } catch (error) {
      console.error(error);
      alert("Erro ao realizar envio em massa.");
    } finally {
      setSendingBulk(null);
    }
  };

>>>>>>> babe606 (Implementação de Envio em Massa, Agenda Academia e Formulário Público de Agendamento)
  useEffect(() => {
    const unsubscribe = subscribeToApiConfig((data) => {
      if (data) setConfig(prev => ({ ...prev, ...data }));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({});
    try {
      await saveApiConfig(config);
      setStatus({ success: true, message: 'Configurações e Logo salvas com sucesso!' });
    } catch (error) {
      setStatus({ success: false, message: 'Erro ao salvar no banco.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('png')) {
        alert("Por favor, selecione apenas arquivos .PNG");
        return;
      }
<<<<<<< HEAD
      
=======

>>>>>>> babe606 (Implementação de Envio em Massa, Agenda Academia e Formulário Público de Agendamento)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setConfig({ ...config, logoBase64: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTokenVisibility = () => {
    if (showToken) setShowToken(false);
    else {
      const password = window.prompt("Senha:");
      if (password === '5468') setShowToken(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">CONFIGURAÇÕES DE CONEXÃO</h2>
              <p className="text-blue-100 text-xs opacity-80">Gerencie sua integração e identidade visual</p>
            </div>
          </div>
          <Globe className="text-white/20" size={48} />
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">URL BASE DA API</label>
              <div className="relative group">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:scale-110 transition-transform" size={20} />
                <input
                  type="text"
                  className="w-full border-2 border-gray-100 rounded-xl p-4 pl-12 bg-gray-50 text-black font-bold focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                  value={config.baseUrl}
                  onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">ACCESS TOKEN (BEARER)</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                <input
                  type={showToken ? "text" : "password"}
                  className="w-full border-2 border-gray-100 rounded-xl p-4 pl-12 pr-12 bg-gray-50 text-black font-bold focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                  value={config.token}
                  onChange={e => setConfig({ ...config, token: e.target.value })}
                />
                <button
                  type="button"
                  onClick={toggleTokenVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showToken ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">ENDPOINT DE ENVIO</label>
              <div className="relative">
                <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input
                  type="text"
                  className="w-full border-2 border-gray-100 rounded-xl p-4 pl-12 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                  value={config.endpoint}
                  onChange={e => setConfig({ ...config, endpoint: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest">INSTANCE ID</label>
              <input
                type="text"
                className="w-full border-2 border-gray-100 rounded-xl p-4 bg-gray-50 text-black font-bold focus:border-blue-500 outline-none"
                value={config.instanceId}
                onChange={e => setConfig({ ...config, instanceId: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-gray-100">
<<<<<<< HEAD
             <div className="flex items-center gap-3 text-gray-800">
               <div className="bg-green-100 p-2 rounded-lg"><CreditCard className="text-green-600" size={20} /></div>
               <h3 className="font-black uppercase text-sm tracking-widest">Ajuste de Valores (Academia)</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <label className="block text-[10px] font-black text-green-700 mb-2 uppercase tracking-widest">Valor Mensalidade (Mensal)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-600">R$</span>
                    <input 
                      type="number" 
                      className="w-full border-2 border-green-100 rounded-xl p-3 pl-12 bg-white text-black font-black text-xl"
                      value={config.gymMonthlyPrice}
                      onChange={e => setConfig({...config, gymMonthlyPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-[10px] font-black text-blue-700 mb-2 uppercase tracking-widest">Valor Mensalidade (Trimestral)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-blue-600">R$</span>
                    <input 
                      type="number" 
                      className="w-full border-2 border-blue-100 rounded-xl p-3 pl-12 bg-white text-black font-black text-xl"
                      value={config.gymQuarterlyPrice}
                      onChange={e => setConfig({...config, gymQuarterlyPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-gray-100">
             <div className="flex items-center gap-3 text-gray-800">
               <MessageSquare className="text-blue-600" size={24} />
               <h3 className="font-black uppercase text-sm tracking-widest">MENSAGENS E GATILHOS</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-yellow-50/30 p-6 rounded-2xl border border-yellow-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-orange-500" />
                      <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest">MINUTOS ANTECEDÊNCIA (SAÍDA)</label>
                    </div>
                    <input 
                      type="number" 
                      className="w-16 border-2 border-orange-200 rounded-lg p-2 text-center font-black bg-white text-black"
                      value={config.warningMinutes}
                      onChange={e => setConfig({...config, warningMinutes: Number(e.target.value)})}
                    />
                  </div>
                  <textarea 
                    className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                    rows={3}
                    value={config.warningMessage}
                    onChange={e => setConfig({...config, warningMessage: e.target.value})}
                  />
               </div>

               <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CalendarDays size={20} className="text-blue-500" />
                      <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest">DIAS ANTECEDÊNCIA (RENOVAÇÃO)</label>
                    </div>
                    <input 
                      type="number" 
                      className="w-16 border-2 border-blue-200 rounded-lg p-2 text-center font-black bg-white text-black"
                      value={config.renewalWarningDays}
                      onChange={e => setConfig({...config, renewalWarningDays: Number(e.target.value)})}
                    />
                  </div>
                  <textarea 
                    className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                    rows={3}
                    value={config.renewalMessage}
                    onChange={e => setConfig({...config, renewalMessage: e.target.value})}
                  />
                  <p className="text-[10px] text-gray-400 mt-2 italic font-bold">Tags: [CRIANCA], [DIAS], [DATA_VENCIMENTO]</p>
               </div>
             </div>

             <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <HeartHandshake size={20} className="text-green-600" />
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest">AGRADECIMENTO DE RENOVAÇÃO</label>
                </div>
                <textarea 
                  className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                  rows={3}
                  value={config.renewalThanksMessage}
                  onChange={e => setConfig({...config, renewalThanksMessage: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-2 italic font-bold">Tags: [CRIANCA], [PLANO]</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck size={16} className="text-green-500" />
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TEMPLATE BOAS-VINDAS</label>
                  </div>
                  <textarea 
                    className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                    rows={4}
                    value={config.entryMessage}
                    onChange={e => setConfig({...config, entryMessage: e.target.value})}
                  />
                </div>
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Dumbbell size={16} className="text-blue-500" />
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TEMPLATE PLANO ACADEMIA</label>
                  </div>
                  <textarea 
                    className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                    rows={4}
                    value={config.academyMessage}
                    onChange={e => setConfig({...config, academyMessage: e.target.value})}
                  />
                </div>
             </div>
=======
            <div className="flex items-center gap-3 text-gray-800">
              <div className="bg-green-100 p-2 rounded-lg"><CreditCard className="text-green-600" size={20} /></div>
              <h3 className="font-black uppercase text-sm tracking-widest">Ajuste de Valores (Academia)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                <label className="block text-[10px] font-black text-green-700 mb-2 uppercase tracking-widest">Valor Mensalidade (Mensal)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-600">R$</span>
                  <input
                    type="number"
                    className="w-full border-2 border-green-100 rounded-xl p-3 pl-12 bg-white text-black font-black text-xl"
                    value={config.gymMonthlyPrice}
                    onChange={e => setConfig({ ...config, gymMonthlyPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-[10px] font-black text-blue-700 mb-2 uppercase tracking-widest">Valor Mensalidade (Trimestral)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-blue-600">R$</span>
                  <input
                    type="number"
                    className="w-full border-2 border-blue-100 rounded-xl p-3 pl-12 bg-white text-black font-black text-xl"
                    value={config.gymQuarterlyPrice}
                    onChange={e => setConfig({ ...config, gymQuarterlyPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-3 text-gray-800">
              <MessageSquare className="text-blue-600" size={24} />
              <h3 className="font-black uppercase text-sm tracking-widest">MENSAGENS E GATILHOS</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-yellow-50/30 p-6 rounded-2xl border border-yellow-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-orange-500" />
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest">MINUTOS ANTECEDÊNCIA (SAÍDA)</label>
                  </div>
                  <input
                    type="number"
                    className="w-16 border-2 border-orange-200 rounded-lg p-2 text-center font-black bg-white text-black"
                    value={config.warningMinutes}
                    onChange={e => setConfig({ ...config, warningMinutes: Number(e.target.value) })}
                  />
                </div>
                <textarea
                  className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                  rows={3}
                  value={config.warningMessage}
                  onChange={e => setConfig({ ...config, warningMessage: e.target.value })}
                />
              </div>

              <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={20} className="text-blue-500" />
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest">DIAS ANTECEDÊNCIA (RENOVAÇÃO)</label>
                  </div>
                  <input
                    type="number"
                    className="w-16 border-2 border-blue-200 rounded-lg p-2 text-center font-black bg-white text-black"
                    value={config.renewalWarningDays}
                    onChange={e => setConfig({ ...config, renewalWarningDays: Number(e.target.value) })}
                  />
                </div>
                <textarea
                  className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                  rows={3}
                  value={config.renewalMessage}
                  onChange={e => setConfig({ ...config, renewalMessage: e.target.value })}
                />
                <p className="text-[10px] text-gray-400 mt-2 italic font-bold">Tags: [CRIANCA], [DIAS], [DATA_VENCIMENTO]</p>
              </div>
            </div>

            <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <HeartHandshake size={20} className="text-green-600" />
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest">AGRADECIMENTO DE RENOVAÇÃO</label>
              </div>
              <textarea
                className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                rows={3}
                value={config.renewalThanksMessage}
                onChange={e => setConfig({ ...config, renewalThanksMessage: e.target.value })}
              />
              <p className="text-[10px] text-gray-400 mt-2 italic font-bold">Tags: [CRIANCA], [PLANO]</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck size={16} className="text-green-500" />
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TEMPLATE BOAS-VINDAS</label>
                </div>
                <textarea
                  className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                  rows={4}
                  value={config.entryMessage}
                  onChange={e => setConfig({ ...config, entryMessage: e.target.value })}
                />
              </div>
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell size={16} className="text-blue-500" />
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TEMPLATE PLANO ACADEMIA</label>
                </div>
                <textarea
                  className="w-full border-2 border-gray-100 rounded-xl p-4 bg-white text-black text-sm font-bold focus:border-blue-500 outline-none"
                  rows={4}
                  value={config.academyMessage}
                  onChange={e => setConfig({ ...config, academyMessage: e.target.value })}
                />
              </div>
            </div>
>>>>>>> babe606 (Implementação de Envio em Massa, Agenda Academia e Formulário Público de Agendamento)
          </div>

          {/* NOVO CAMPO DE LOGO (ÚLTIMA LINHA) */}
          <div className="space-y-6 pt-8 border-t border-gray-100">
<<<<<<< HEAD
             <div className="flex items-center gap-3 text-gray-800">
               <div className="bg-blue-100 p-2 rounded-lg"><ImageIcon className="text-blue-600" size={20} /></div>
               <h3 className="font-black uppercase text-sm tracking-widest">IMAGEM REFERÊNCIA (LOGO PNG)</h3>
             </div>
             
             <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                {config.logoBase64 ? (
                  <div className="relative group mb-4">
                    <img src={config.logoBase64} alt="Preview Logo" className="h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                    <button 
                      type="button"
                      onClick={() => setConfig({...config, logoBase64: ''})}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                    <Upload size={48} strokeWidth={1.5} />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma logo personalizada salva</p>
                  </div>
                )}

                <input 
                  type="file" 
                  accept="image/png"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-2 border-blue-500 text-blue-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
                >
                  {config.logoBase64 ? 'Alterar Logo (.PNG)' : 'Anexar Logo (.PNG)'}
                </button>
                <p className="text-[9px] text-gray-400 mt-3 font-bold uppercase">Recomendado: Fundo Transparente | PNG | Máx 500kb</p>
             </div>
=======
            <div className="flex items-center gap-3 text-gray-800">
              <div className="bg-blue-100 p-2 rounded-lg"><ImageIcon className="text-blue-600" size={20} /></div>
              <h3 className="font-black uppercase text-sm tracking-widest">IMAGEM REFERÊNCIA (LOGO PNG)</h3>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
              {config.logoBase64 ? (
                <div className="relative group mb-4">
                  <img src={config.logoBase64} alt="Preview Logo" className="h-32 object-contain rounded-lg shadow-md bg-white p-2" />
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, logoBase64: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                  <Upload size={48} strokeWidth={1.5} />
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhuma logo personalizada salva</p>
                </div>
              )}

              <input
                type="file"
                accept="image/png"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-blue-500 text-blue-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
              >
                {config.logoBase64 ? 'Alterar Logo (.PNG)' : 'Anexar Logo (.PNG)'}
              </button>
              <p className="text-[9px] text-gray-400 mt-3 font-bold uppercase">Recomendado: Fundo Transparente | PNG | Máx 500kb</p>
            </div>
          </div>

          {/* ENVIO EM MASSA (MARKETING) */}
          <div className="space-y-6 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-3 text-gray-800">
              <div className="bg-purple-100 p-2 rounded-lg"><Send className="text-purple-600" size={20} /></div>
              <h3 className="font-black uppercase text-sm tracking-widest text-purple-600">Envio em Massa (Marketing)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Acadêmicos */}
              <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 flex flex-col h-full ring-2 ring-purple-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell size={16} className="text-purple-600" />
                  <label className="text-[11px] font-black text-purple-700 uppercase tracking-widest">Plano Academia</label>
                </div>
                <textarea
                  className="w-full border-2 border-purple-100 rounded-xl p-3 bg-white text-black text-sm font-bold min-h-[120px] mb-4 flex-grow outline-none focus:border-purple-500 transition-colors"
                  placeholder="Sua mensagem personalizada aqui (aceita emojis e PT-BR) 🚀"
                  value={bulkMessages.gym}
                  onChange={e => setBulkMessages({ ...bulkMessages, gym: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => handleSendBulk('gym')}
                  disabled={!!sendingBulk || !bulkMessages.gym.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-800 text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase text-xs shadow-lg shadow-purple-200 disabled:opacity-50 disabled:active:scale-100"
                >
                  {sendingBulk === 'gym' ? (
                    <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> ENVIANDO...</div>
                  ) : 'ENVIAR ACADEMIA'}
                </button>
              </div>

              {/* Convencionais */}
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col h-full ring-2 ring-blue-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck size={16} className="text-blue-600" />
                  <label className="text-[11px] font-black text-blue-700 uppercase tracking-widest">Convencionais</label>
                </div>
                <textarea
                  className="w-full border-2 border-blue-100 rounded-xl p-3 bg-white text-black text-sm font-bold min-h-[120px] mb-4 flex-grow outline-none focus:border-blue-500 transition-colors"
                  placeholder="Sua mensagem para clientes convencionais 🎈"
                  value={bulkMessages.standard}
                  onChange={e => setBulkMessages({ ...bulkMessages, standard: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => handleSendBulk('standard')}
                  disabled={!!sendingBulk || !bulkMessages.standard.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-800 text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase text-xs shadow-lg shadow-blue-200 disabled:opacity-50 disabled:active:scale-100"
                >
                  {sendingBulk === 'standard' ? (
                    <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> ENVIANDO...</div>
                  ) : 'ENVIAR CONVENCIONAIS'}
                </button>
              </div>

              {/* Últimos Visitantes */}
              <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 flex flex-col h-full ring-2 ring-orange-100/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-orange-600" />
                    <label className="text-[11px] font-black text-orange-700 uppercase tracking-widest">Últimos Visitantes</label>
                  </div>
                  <input
                    type="number"
                    className="w-14 border-2 border-orange-200 rounded-lg p-1 text-center font-black bg-white text-black text-sm"
                    value={lastVisitorsQty}
                    onChange={e => setLastVisitorsQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <textarea
                  className="w-full border-2 border-orange-100 rounded-xl p-3 bg-white text-black text-sm font-bold min-h-[120px] mb-4 flex-grow outline-none focus:border-orange-500 transition-colors"
                  placeholder="Sua mensagem para os visitantes recentes... 🏠"
                  value={bulkMessages.last}
                  onChange={e => setBulkMessages({ ...bulkMessages, last: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => handleSendBulk('last')}
                  disabled={!!sendingBulk || !bulkMessages.last.trim()}
                  className="w-full bg-orange-600 hover:bg-orange-800 text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase text-xs shadow-lg shadow-orange-200 disabled:opacity-50 disabled:active:scale-100"
                >
                  {sendingBulk === 'last' ? (
                    <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> ENVIANDO...</div>
                  ) : 'ENVIAR ÚLTIMOS'}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">
              ⚠️ O envio em massa pode levar alguns segundos dependendo da quantidade de contatos. Duplicatas são removidas automaticamente.
            </p>
>>>>>>> babe606 (Implementação de Envio em Massa, Agenda Academia e Formulário Público de Agendamento)
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-900 hover:bg-black text-white font-black py-5 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-lg uppercase tracking-tighter"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
              SALVAR CONFIGURAÇÕES
            </button>
          </div>

          {status.message && (
            <div className={`p-4 rounded-xl border-2 flex items-center gap-3 animate-in slide-in-from-top-4 ${status.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {status.success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <span className="font-bold">{status.message}</span>
            </div>
          )}
        </form>
<<<<<<< HEAD
=======

        {/* MODAL DE PROGRESSO DE ENVIO EM MASSA */}
        {showProgressModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="bg-purple-600 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Progresso do Envio</h3>
                  <p className="text-purple-100 text-[10px] font-bold uppercase opacity-80">
                    {progressData.total > 0 ? `Enviando ${progressData.current} de ${progressData.total}` : 'Carregando contatos...'}
                  </p>
                </div>
                <Send className="opacity-20" size={40} />
              </div>

              <div className="p-8 space-y-8">
                {/* Barra de Progresso */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Geral</span>
                    <span className="text-2xl font-black text-purple-600">
                      {Math.round((progressData.current / progressData.total) * 100) || 0}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500 ease-out"
                      style={{ width: `${(progressData.current / progressData.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats Rápidos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <p className="text-[9px] font-black text-green-600 uppercase mb-1">Sucessos</p>
                    <p className="text-2xl font-black text-green-700">{progressData.success}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-[9px] font-black text-red-600 uppercase mb-1">Falhas</p>
                    <p className="text-2xl font-black text-red-700">{progressData.failed}</p>
                  </div>
                </div>

                {/* Lista dos Últimos 10 */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Últimos Envios (Histórico)</p>
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 max-h-48 overflow-y-auto p-4 space-y-2">
                    {progressData.lastSent.length === 0 ? (
                      <p className="text-[10px] text-gray-400 text-center py-4 font-bold italic uppercase">Aguardando primeiro envio...</p>
                    ) : (
                      progressData.lastSent.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 animate-in slide-in-from-left-2 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-800 uppercase">{c.name}</span>
                            <span className="text-[9px] text-gray-400 font-bold">{c.phone}</span>
                          </div>
                          <CheckCircle size={14} className="text-green-500" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Controles de Pausa/Cancelamento */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      isPausedRef.current = !isPausedRef.current;
                      setProgressData(prev => ({ ...prev, isPaused: isPausedRef.current }));
                    }}
                    className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-all active:scale-95 ${progressData.isPaused ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}
                  >
                    {progressData.isPaused ? (
                      <><Play size={18} /> Continuar</>
                    ) : (
                      <><Pause size={18} /> Pausar</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Deseja realmente cancelar o envio?")) {
                        isCancelledRef.current = true;
                        if (!sendingBulk) setShowProgressModal(false);
                      }
                    }}
                    className="flex-1 bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase transition-all active:scale-95"
                  >
                    <XCircle size={18} /> Cancelar
                  </button>
                </div>

                {/* Botão de Fechar (Só aparece quando terminar ou cancelar) */}
                {(progressData.current === progressData.total || isCancelledRef.current) && (
                  <button
                    onClick={() => setShowProgressModal(false)}
                    className="w-full bg-gray-900 text-white p-4 rounded-xl font-black text-xs uppercase transition-all hover:bg-black"
                  >
                    Fechar Modal
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
>>>>>>> babe606 (Implementação de Envio em Massa, Agenda Academia e Formulário Público de Agendamento)
      </div>
    </div>
  );
};

export default ConnectionsPanel;
