
import React, { useEffect, useState, useRef } from 'react';
import { Clock, Pause, Play, CheckSquare, MessageCircle, Dumbbell, Activity, Check, CheckCircle, CreditCard, Trash2, Heart } from 'lucide-react';
import { KidEntry, PaymentMethod } from '../types';
import { checkoutEntry, togglePause, updatePaymentStatus, updateNotificationStatus, getApiConfigOnce, deleteActiveEntry } from '../firebase';
import { sendWhatsappDirect, getWarningMessageTemplate, formatPhone } from '../whatsappService';
import PaymentMethodModal from './PaymentMethodModal';
import ConfirmationModal from './ConfirmationModal';

interface ActiveListProps {
  entries: KidEntry[];
  onOpenHistory: () => void;
}

const ActiveList: React.FC<ActiveListProps> = ({ entries, onOpenHistory }) => {
  const [now, setNow] = useState(Date.now());
  const [paymentTarget, setPaymentTarget] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<KidEntry | null>(null);
  const [warningMin, setWarningMin] = useState(5);
  const [shakingEntryId, setShakingEntryId] = useState<string | null>(null);
  
  // Ref para evitar disparos duplicados enquanto a API do WhatsApp processa
  const processingNotification = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    
    const loadConfig = async () => {
      const config = await getApiConfigOnce();
      if (config?.warningMinutes) setWarningMin(config.warningMinutes);
    };
    loadConfig();

    return () => clearInterval(interval);
  }, []);

  // MOTOR DE NOTIFICAÇÕES AUTOMÁTICAS: Funciona para todos, incluindo Plano Academia
  useEffect(() => {
    const checkNotifications = async () => {
      const config = await getApiConfigOnce();
      const thresholdMs = (config?.warningMinutes || 5) * 60 * 1000;

      for (const entry of entries) {
        if (!entry.id) continue;

        // Se já foi enviado ou está processando, pula
        if (entry.notificationStatus?.warningSent || processingNotification.current.has(entry.id)) {
          continue;
        }

        const endTime = getEffectiveEndTime(entry);
        const remaining = endTime - now;

        // Dispara quando o tempo restante entra na zona de alerta (ex: faltam 5 min)
        if (remaining <= thresholdMs && remaining > 0) {
          processingNotification.current.add(entry.id);
          
          try {
            const msg = await getWarningMessageTemplate(entry.childName);
            const success = await sendWhatsappDirect(entry.contactNumber, msg, false);
            
            if (success) {
              await updateNotificationStatus(entry.id, { warningSent: true });
            }
          } catch (error) {
            console.error("Erro ao enviar notificação automática:", error);
          } finally {
            // Limpa o estado de processamento após um tempo para permitir retry se necessário
            setTimeout(() => {
              if (entry.id) processingNotification.current.delete(entry.id);
            }, 30000);
          }
        }
      }
    };

    checkNotifications();
  }, [now, entries]);

  const getEffectiveEndTime = (entry: KidEntry) => {
    let endTime = entry.entryTime + (entry.packageDuration * 60 * 1000);
    if (entry.totalPausedTime) endTime += entry.totalPausedTime;
    if (entry.isPaused && entry.pausedAt) endTime += (now - entry.pausedAt);
    return endTime;
  };

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    const totalSec = Math.floor(Math.abs(ms) / 1000);
    return `${isNegative ? '-' : ''}${Math.floor(totalSec / 60).toString().padStart(2, '0')}:${(totalSec % 60).toString().padStart(2, '0')}`;
  };

  const openWhatsApp = (phone: string) => {
    const formatted = formatPhone(phone);
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full relative">
      {paymentTarget && <PaymentMethodModal onSelect={async (m) => { await updatePaymentStatus(paymentTarget, true, m); setPaymentTarget(null); }} onClose={() => setPaymentTarget(null)} />}
      <ConfirmationModal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={async () => { if (cancelTarget?.id) await deleteActiveEntry(cancelTarget.id); setCancelTarget(null); }} title="Cancelar Entrada" message={`Deseja remover permanentemente ${cancelTarget?.childName} do monitoramento?`} />

      <div className="p-6 border-b border-gray-100 flex justify-between items-center text-gray-800">
        <h2 className="text-xl font-bold">Crianças Ativas ({entries.length})</h2>
        <button onClick={onOpenHistory} className="text-sm font-bold text-blue-600 uppercase hover:underline transition-all">Ver Histórico</button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300 font-bold uppercase text-[10px] tracking-widest">Nenhuma criança no espaço.</div>
        ) : (
          <div className="border rounded-xl overflow-hidden shadow-sm">
             <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-4">Criança / Responsável</th>
                  <th className="px-4 py-4 text-center">Pagamento</th>
                  <th className="px-4 py-4 text-center">Tempo</th>
                  <th className="px-4 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => {
                  const remaining = getEffectiveEndTime(entry) - now;
                  const isPaid = entry.isPaid || false;

                  return (
                    <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${entry.isGymPlan ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                             <div className="font-bold text-gray-900 text-base leading-tight uppercase tracking-tighter">{entry.childName}</div>
                             
                             {entry.isPcd && (
                                <span className="bg-pink-100 text-pink-600 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-pink-200">
                                  <Heart size={10} fill="currentColor" /> PCD / TEA
                                </span>
                             )}

                             {entry.isGymPlan && (
                                <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Dumbbell size={10} /> {entry.enrollmentId}
                                </span>
                             )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 font-medium">{entry.parentName} <span className="text-gray-200 mx-1">|</span> {entry.contactNumber}</div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-center">
                         <button onClick={() => isPaid ? updatePaymentStatus(entry.id!, false) : setPaymentTarget(entry.id!)} className={`flex flex-col items-center justify-center p-2 w-20 mx-auto border-2 rounded-lg transition-all active:scale-95 ${isPaid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-100 text-red-400'}`}>
                            {isPaid ? <CheckCircle size={14} /> : <CreditCard size={14} />}
                            <span className="text-[9px] font-black mt-1 uppercase">{isPaid ? (entry.paymentMethod || 'PAGO') : 'PENDENTE'}</span>
                         </button>
                      </td>

                      <td className="px-4 py-4 text-center tabular-nums">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-lg w-28 justify-center font-black ${remaining <= 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-50 text-gray-800'}`}>
                          {formatTime(remaining)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                             onClick={() => openWhatsApp(entry.contactNumber)} 
                             className="p-2.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-90"
                             title="Contato WhatsApp"
                          >
                             <MessageCircle size={20} />
                          </button>

                          <button 
                            onClick={() => togglePause(entry)} 
                            className={`p-2 rounded-lg transition-all active:scale-90 shadow-sm ${entry.isPaused ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                            title={entry.isPaused ? "Retomar Tempo" : "Pausar Tempo"}
                          >
                             {entry.isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                          </button>

                          <button 
                            onClick={() => setCancelTarget(entry)} 
                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
                            title="Excluir Entrada"
                          >
                             <Trash2 size={18} />
                          </button>

                          <button 
                            onClick={() => isPaid ? checkoutEntry(entry) : setShakingEntryId(entry.id!)} 
                            className={`p-2 rounded-lg transition-all active:scale-90 ${isPaid ? 'text-green-600 hover:bg-green-100 border-2 border-green-50' : 'text-gray-300 border-2 border-gray-50 cursor-not-allowed'}`}
                            title="Finalizar (Checkout)"
                          >
                             <CheckSquare size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveList;
