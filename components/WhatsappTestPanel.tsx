import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, Phone, Globe, ShieldCheck } from 'lucide-react';
// Fix: Import sendWhatsappDirect instead of non-existent sendWhatsappMessage
import { sendWhatsappDirect } from '../whatsappService';

const WhatsappTestPanel: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = value;
    if (value.length > 10) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    else if (value.length > 6) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    else if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    setPhone(formatted);
  };

  const handleTest = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      alert("Digite um número real com DDD!");
      return;
    }

    setLoading(true);
    setStatus('idle');
    
    try {
      const msg = `✅ TESTE DE CONEXÃO: O sistema Vumbora agora está enviando mensagens automaticamente via Whapi.cloud!`;
      // Fix: Use sendWhatsappDirect as sendWhatsappMessage doesn't exist in whatsappService
      const result = await sendWhatsappDirect(phone, msg);
      if (result) setStatus('success');
      else setStatus('error');
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Validador de API</h2>
              <p className="text-blue-100 text-xs">Canal Autorizado: +55 85 8950-3004</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Número do Destinatário (Quem vai receber)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
              <input
                type="text"
                placeholder="(85) 99955-7567"
                className="w-full border-2 border-gray-200 rounded-xl p-4 pl-14 bg-gray-50 text-black font-black text-2xl focus:border-blue-500 focus:ring-0 outline-none transition-all"
                value={phone}
                onChange={handlePhoneChange}
              />
            </div>
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className={`w-full py-5 rounded-xl font-black text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <>
                <Send size={24} />
                ENVIAR AGORA
              </>
            )}
          </button>

          {status === 'success' && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} />
                <p className="font-bold">Mensagem enviada para {phone}!</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <p className="font-bold">Falha no Gateway. Verifique se o celular 3004 está online na Whapi.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
        <Globe className="text-blue-500 shrink-0" size={20} />
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Como funciona:</strong> Ao clicar no botão, o seu site faz um pedido para a Whapi usando o seu Token único. A Whapi recebe o pedido e instrui o seu WhatsApp (+55 85 8950-3004) a enviar a mensagem para o número digitado.
        </p>
      </div>
    </div>
  );
};

export default WhatsappTestPanel;