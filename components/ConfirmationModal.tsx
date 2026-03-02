
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = "Confirmar Cancelamento" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8">
          <p className="text-gray-600 font-medium text-center">{message}</p>
        </div>
        
        <div className="p-6 bg-gray-50 grid grid-cols-2 gap-4">
           <button 
            onClick={onClose} 
            className="py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-500 font-black uppercase text-xs hover:bg-gray-100 transition-all"
           >
             Não, Voltar
           </button>
           <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="py-3 px-4 rounded-xl bg-red-600 text-white font-black uppercase text-xs shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all"
           >
             {confirmLabel}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
