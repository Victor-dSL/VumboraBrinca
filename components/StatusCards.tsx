import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface StatusCardsProps {
  totalActive: number;
  expiringSoon: number;
  expired: number;
}

const StatusCards: React.FC<StatusCardsProps> = ({ totalActive, expiringSoon, expired }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Blue Card */}
      <div className="bg-white border-2 border-blue-500 rounded-lg p-4 flex items-start space-x-3 shadow-sm">
        <CheckCircle className="text-blue-500 w-6 h-6 mt-1" />
        <div>
          <h3 className="text-blue-600 font-bold text-lg">Crianças Ativas: {totalActive}</h3>
          <p className="text-gray-500 text-sm">Monitoramento em tempo real.</p>
        </div>
      </div>

      {/* Yellow Card */}
      <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 flex items-start space-x-3 shadow-sm">
        <Clock className="text-yellow-500 w-6 h-6 mt-1" />
        <div>
          <h3 className="text-yellow-600 font-bold text-lg">Horários Próximos: {expiringSoon}</h3>
          <p className="text-gray-500 text-sm">Faltam menos de 5 min.</p>
        </div>
      </div>

      {/* Red Card */}
      <div className="bg-white border-2 border-red-500 rounded-lg p-4 flex items-start space-x-3 shadow-sm">
        <AlertTriangle className="text-red-500 w-6 h-6 mt-1" />
        <div>
          <h3 className="text-red-600 font-bold text-lg">Tempo Acabou: {expired}</h3>
          <p className="text-gray-500 text-sm">Tempo esgotado.</p>
        </div>
      </div>
    </div>
  );
};

export default StatusCards;