
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Link2, Key, Send, Globe, Loader2, CheckCircle, AlertCircle, Save, MessageSquare, Clock, Dumbbell, UserCheck, Eye, EyeOff, CreditCard, CalendarDays, HeartHandshake, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { saveApiConfig, subscribeToApiConfig } from '../firebase';
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
          </div>

          {/* NOVO CAMPO DE LOGO (ÚLTIMA LINHA) */}
          <div className="space-y-6 pt-8 border-t border-gray-100">
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
      </div>
    </div>
  );
};

export default ConnectionsPanel;
