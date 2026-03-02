
import React from 'react';
import { Banknote, QrCode, CreditCard, Wallet, X } from 'lucide-react';
import { PaymentMethod } from '../types';

interface PaymentMethodModalProps {
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
  title?: string;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ onSelect, onClose, title = "Selecione o Método de Pagamento" }) => {
  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={24} />, color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
    { id: 'pix', label: 'PIX', icon: <QrCode size={24} />, color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200' },
    { id: 'debito', label: 'Débito', icon: <CreditCard size={24} />, color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
    { id: 'credito', label: 'Crédito', icon: <Wallet size={24} />, color: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all active:scale-95 space-y-3 ${method.color}`}
            >
              {method.icon}
              <span className="font-black text-xs uppercase tracking-widest">{method.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 text-center">
           <button onClick={onClose} className="text-gray-400 text-[10px] font-black uppercase hover:underline">Cancelar Operação</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;