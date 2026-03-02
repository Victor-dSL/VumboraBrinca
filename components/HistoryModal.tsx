
import React, { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { fetchHistory } from '../firebase';
import { HistoryRecord } from '../types';

interface HistoryModalProps {
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ onClose }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchHistory();
        setHistory(data);
      } catch (error) {
        console.error("Error loading history", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fallback se o dado antigo não tiver string formatada
  const formatDate = (ts: number) => new Date(ts).toLocaleString('pt-BR');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Histórico de Atendimentos</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Carregando...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Nenhum registro encontrado no histórico (nova coleção).</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-3">Criança</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Entrada</th>
                  <th className="px-4 py-3">Saída</th>
                  <th className="px-4 py-3">Permanência</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-700">{record.childName}</td>
                    <td className="px-4 py-3">{record.parentName}</td>
                    
                    {/* Exibe formatado do banco ou calcula na hora se for antigo */}
                    <td className="px-4 py-3">
                      {record.formattedEntryTime || formatDate(record.entryTime)}
                    </td>
                    <td className="px-4 py-3">
                      {record.formattedExitTime || formatDate(record.actualExitTime)}
                    </td>
                    
                    <td className="px-4 py-3">
                      {record.formattedTimeSpent || `${Math.floor(record.timeSpent / 60)} min`}
                    </td>

                    <td className="px-4 py-3">
                      {record.finalStatus ? (
                         <span className={record.overstayDuration > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                           {record.finalStatus}
                         </span>
                      ) : (
                         record.overstayDuration > 0 ? `${record.overstayDuration} min` : 'Ok'
                      )}
                    </td>

                    <td className="px-4 py-3 text-green-600 font-bold">R$ {record.price},00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
